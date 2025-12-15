// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title InvoiceNFT
 * @dev ERC721 NFT representing tokenized invoices for RWA (Real World Assets)
 * Enables invoice factoring and trading on secondary markets
 * Features atomic purchases via purchaseInvoice() for trustless trading
 */
contract InvoiceNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {

    enum InvoiceStatus {
        Active,      // Invoice is active and tradable
        Released,    // Payment completed, invoice fulfilled
        Refunded,    // Escrow refunded, invoice cancelled
        Listed       // Listed for sale on marketplace
    }

    struct Invoice {
        uint256 escrowId;          // Reference to escrow in SecuredTransferContract
        uint256 amount;            // Invoice amount in stablecoin (USDT/PYUSD)
        uint256 dueDate;           // Payment due date timestamp
        address issuer;            // Original seller (invoice issuer)
        address payer;             // Original buyer (invoice payer)
        address currentOwner;      // Current invoice owner (can be different from issuer)
        InvoiceStatus status;      // Current invoice status
        uint256 listedPrice;       // Price if listed for sale (0 if not listed)
        uint256 createdAt;         // Invoice creation timestamp
    }

    // Marketplace statistics
    struct MarketStats {
        uint256 totalVolume;       // Total USDT volume traded
        uint256 totalSales;        // Total number of sales
        uint256 totalListings;     // Current active listings
        uint256 highestSale;       // Highest sale price
    }

    // State variables
    mapping(uint256 => Invoice) public invoices;  // tokenId => Invoice
    mapping(uint256 => uint256) public escrowToToken;  // escrowId => tokenId

    uint256 private _nextTokenId = 1;
    address public securedTransferContract;
    string private _baseTokenURI;

    // Marketplace state
    IERC20 public stablecoin;              // USDT token for payments
    MarketStats public marketStats;         // Marketplace statistics
    uint256 public platformFeeBps = 100;    // 1% platform fee (100 basis points)
    address public platformWallet;          // Platform fee recipient
    
    // Events
    event InvoiceMinted(
        uint256 indexed tokenId,
        uint256 indexed escrowId,
        address indexed issuer,
        address payer,
        uint256 amount,
        uint256 dueDate
    );

    event InvoiceListedForSale(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 listedPrice,
        uint256 discount
    );

    event InvoiceUnlisted(
        uint256 indexed tokenId,
        address indexed seller
    );

    event InvoicePurchased(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 salePrice,
        uint256 platformFee,
        uint256 sellerProceeds
    );

    event InvoiceSold(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 price
    );

    event InvoiceBurned(
        uint256 indexed tokenId,
        uint256 indexed escrowId,
        InvoiceStatus finalStatus
    );

    event PriceUpdated(
        uint256 indexed tokenId,
        uint256 oldPrice,
        uint256 newPrice
    );

    event StablecoinUpdated(address indexed newStablecoin);
    event PlatformFeeUpdated(uint256 newFeeBps);
    event PlatformWalletUpdated(address indexed newWallet);
    
    modifier onlySecuredTransferContract() {
        require(
            msg.sender == securedTransferContract,
            "Only SecuredTransferContract can call this"
        );
        _;
    }
    
    constructor(
        string memory baseTokenURI,
        address _stablecoin,
        address _platformWallet
    ) ERC721("Invoice Token", "INVOICE") Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin address");
        require(_platformWallet != address(0), "Invalid platform wallet");
        _baseTokenURI = baseTokenURI;
        stablecoin = IERC20(_stablecoin);
        platformWallet = _platformWallet;
    }
    
    /**
     * @dev Set the SecuredTransferContract address
     */
    function setSecuredTransferContract(address _contract) external onlyOwner {
        require(_contract != address(0), "Invalid contract address");
        securedTransferContract = _contract;
    }
    
    /**
     * @dev Mint a new invoice NFT (called by SecuredTransferContract)
     */
    function mintInvoice(
        uint256 escrowId,
        address issuer,
        address payer,
        uint256 amount,
        uint256 dueDate
    ) external onlySecuredTransferContract returns (uint256) {
        require(escrowToToken[escrowId] == 0, "Invoice already exists for this escrow");
        
        uint256 tokenId = _nextTokenId++;
        
        // Create invoice struct
        invoices[tokenId] = Invoice({
            escrowId: escrowId,
            amount: amount,
            dueDate: dueDate,
            issuer: issuer,
            payer: payer,
            currentOwner: issuer,
            status: InvoiceStatus.Active,
            listedPrice: 0,
            createdAt: block.timestamp
        });
        
        // Map escrow to token
        escrowToToken[escrowId] = tokenId;
        
        // Mint NFT to issuer (seller)
        _safeMint(issuer, tokenId);
        
        // Set token URI
        string memory uri = string(abi.encodePacked(_baseTokenURI, "/", _toString(tokenId)));
        _setTokenURI(tokenId, uri);
        
        emit InvoiceMinted(tokenId, escrowId, issuer, payer, amount, dueDate);
        
        return tokenId;
    }
    
    /**
     * @dev List invoice for sale on marketplace
     * @param tokenId The token ID to list
     * @param price The listing price (must be less than invoice amount for factoring)
     */
    function listInvoiceForSale(uint256 tokenId, uint256 price) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not invoice owner");
        require(invoices[tokenId].status == InvoiceStatus.Active, "Invoice not active");
        require(price > 0, "Price must be greater than 0");
        require(price < invoices[tokenId].amount, "Listed price must be less than invoice amount");

        invoices[tokenId].listedPrice = price;
        invoices[tokenId].status = InvoiceStatus.Listed;
        marketStats.totalListings++;

        uint256 discount = ((invoices[tokenId].amount - price) * 10000) / invoices[tokenId].amount;
        emit InvoiceListedForSale(tokenId, msg.sender, price, discount);
    }

    /**
     * @dev Update listing price
     * @param tokenId The token ID to update
     * @param newPrice The new listing price
     */
    function updateListingPrice(uint256 tokenId, uint256 newPrice) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not invoice owner");
        require(invoices[tokenId].status == InvoiceStatus.Listed, "Invoice not listed");
        require(newPrice > 0, "Price must be greater than 0");
        require(newPrice < invoices[tokenId].amount, "Price must be less than invoice amount");

        uint256 oldPrice = invoices[tokenId].listedPrice;
        invoices[tokenId].listedPrice = newPrice;

        emit PriceUpdated(tokenId, oldPrice, newPrice);
    }

    /**
     * @dev Unlist invoice from marketplace
     */
    function unlistInvoice(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not invoice owner");
        require(invoices[tokenId].status == InvoiceStatus.Listed, "Invoice not listed");

        invoices[tokenId].listedPrice = 0;
        invoices[tokenId].status = InvoiceStatus.Active;
        marketStats.totalListings--;

        emit InvoiceUnlisted(tokenId, msg.sender);
    }

    /**
     * @dev Purchase a listed invoice - atomic swap of USDT for NFT
     * @param tokenId The token ID to purchase
     * @notice Buyer must approve this contract to spend stablecoin first
     */
    function purchaseInvoice(uint256 tokenId) external nonReentrant {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.Listed, "Invoice not listed for sale");

        address seller = ownerOf(tokenId);
        require(seller != msg.sender, "Cannot buy your own invoice");
        require(seller != address(0), "Invalid seller");

        uint256 salePrice = invoice.listedPrice;
        require(salePrice > 0, "Invalid sale price");

        // Calculate platform fee
        uint256 platformFee = (salePrice * platformFeeBps) / 10000;
        uint256 sellerProceeds = salePrice - platformFee;

        // Transfer payment from buyer
        require(
            stablecoin.transferFrom(msg.sender, seller, sellerProceeds),
            "Payment to seller failed"
        );

        // Transfer platform fee
        if (platformFee > 0 && platformWallet != address(0)) {
            require(
                stablecoin.transferFrom(msg.sender, platformWallet, platformFee),
                "Platform fee transfer failed"
            );
        }

        // Transfer NFT to buyer (this will trigger _update which updates currentOwner)
        _transfer(seller, msg.sender, tokenId);

        // Update invoice status
        invoice.status = InvoiceStatus.Active;
        invoice.listedPrice = 0;

        // Update market statistics
        marketStats.totalVolume += salePrice;
        marketStats.totalSales++;
        marketStats.totalListings--;
        if (salePrice > marketStats.highestSale) {
            marketStats.highestSale = salePrice;
        }

        emit InvoicePurchased(tokenId, seller, msg.sender, salePrice, platformFee, sellerProceeds);
        emit InvoiceSold(tokenId, seller, msg.sender, salePrice);
    }
    
    /**
     * @dev Update invoice status (called by SecuredTransferContract)
     */
    function updateInvoiceStatus(
        uint256 escrowId,
        InvoiceStatus newStatus
    ) external onlySecuredTransferContract {
        uint256 tokenId = escrowToToken[escrowId];
        require(tokenId != 0, "Invoice does not exist");
        
        invoices[tokenId].status = newStatus;
    }
    
    /**
     * @dev Burn invoice NFT when escrow is completed or refunded
     */
    function burnInvoice(uint256 escrowId) external onlySecuredTransferContract {
        uint256 tokenId = escrowToToken[escrowId];
        require(tokenId != 0, "Invoice does not exist");
        
        InvoiceStatus finalStatus = invoices[tokenId].status;
        
        emit InvoiceBurned(tokenId, escrowId, finalStatus);
        
        // Clean up mappings
        delete escrowToToken[escrowId];
        delete invoices[tokenId];
        
        // Burn the NFT
        _burn(tokenId);
    }
    
    /**
     * @dev Get invoice details by token ID
     */
    function getInvoice(uint256 tokenId) external view returns (Invoice memory) {
        require(_ownerOf(tokenId) != address(0), "Invoice does not exist");
        return invoices[tokenId];
    }
    
    /**
     * @dev Get token ID by escrow ID
     */
    function getTokenByEscrow(uint256 escrowId) external view returns (uint256) {
        return escrowToToken[escrowId];
    }
    
    /**
     * @dev Get all listed invoices
     */
    function getListedInvoices() external view returns (uint256[] memory) {
        uint256 totalSupply = _nextTokenId - 1;
        uint256 listedCount = 0;
        
        // Count listed invoices
        for (uint256 i = 1; i <= totalSupply; i++) {
            if (_ownerOf(i) != address(0) && invoices[i].status == InvoiceStatus.Listed) {
                listedCount++;
            }
        }
        
        // Create array of listed token IDs
        uint256[] memory listedTokens = new uint256[](listedCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalSupply; i++) {
            if (_ownerOf(i) != address(0) && invoices[i].status == InvoiceStatus.Listed) {
                listedTokens[index] = i;
                index++;
            }
        }
        
        return listedTokens;
    }
    
    /**
     * @dev Get all invoices owned by an address
     */
    function getInvoicesByOwner(address owner) external view returns (uint256[] memory) {
        uint256 totalSupply = _nextTokenId - 1;
        uint256 ownedCount = 0;
        
        // Count owned invoices
        for (uint256 i = 1; i <= totalSupply; i++) {
            if (_ownerOf(i) == owner) {
                ownedCount++;
            }
        }
        
        // Create array of owned token IDs
        uint256[] memory ownedTokens = new uint256[](ownedCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalSupply; i++) {
            if (_ownerOf(i) == owner) {
                ownedTokens[index] = i;
                index++;
            }
        }
        
        return ownedTokens;
    }
    
    /**
     * @dev Calculate discount percentage for factoring
     */
    function calculateDiscount(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Invoice does not exist");
        Invoice memory invoice = invoices[tokenId];

        if (invoice.listedPrice == 0 || invoice.status != InvoiceStatus.Listed) {
            return 0;
        }

        // Calculate discount as percentage (with 2 decimal precision)
        uint256 discount = ((invoice.amount - invoice.listedPrice) * 10000) / invoice.amount;
        return discount; // Returns basis points (e.g., 500 = 5.00%)
    }

    /**
     * @dev Calculate potential profit and APR for buyers
     * @param tokenId The token ID to calculate for
     * @return profit The potential profit in stablecoin
     * @return aprBps The annualized return in basis points
     */
    function calculatePotentialReturn(uint256 tokenId) external view returns (uint256 profit, uint256 aprBps) {
        require(_ownerOf(tokenId) != address(0), "Invoice does not exist");
        Invoice memory invoice = invoices[tokenId];

        if (invoice.listedPrice == 0 || invoice.status != InvoiceStatus.Listed) {
            return (0, 0);
        }

        profit = invoice.amount - invoice.listedPrice;

        // Calculate days until due
        uint256 daysUntilDue = 1; // Minimum 1 day to avoid division by zero
        if (invoice.dueDate > block.timestamp) {
            daysUntilDue = (invoice.dueDate - block.timestamp) / 1 days;
            if (daysUntilDue == 0) daysUntilDue = 1;
        }

        // APR = (profit / price) * (365 / days) * 10000 (for basis points)
        aprBps = (profit * 365 * 10000) / (invoice.listedPrice * daysUntilDue);

        return (profit, aprBps);
    }

    /**
     * @dev Get all active (non-listed) invoices
     */
    function getActiveInvoices() external view returns (uint256[] memory) {
        uint256 totalSupply = _nextTokenId - 1;
        uint256 activeCount = 0;

        for (uint256 i = 1; i <= totalSupply; i++) {
            if (_ownerOf(i) != address(0) && invoices[i].status == InvoiceStatus.Active) {
                activeCount++;
            }
        }

        uint256[] memory activeTokens = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= totalSupply; i++) {
            if (_ownerOf(i) != address(0) && invoices[i].status == InvoiceStatus.Active) {
                activeTokens[index] = i;
                index++;
            }
        }

        return activeTokens;
    }

    /**
     * @dev Get market statistics
     */
    function getMarketStats() external view returns (MarketStats memory) {
        return marketStats;
    }

    /**
     * @dev Get total supply of invoices
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ============ Admin Functions ============

    /**
     * @dev Update stablecoin address (owner only)
     */
    function setStablecoin(address _stablecoin) external onlyOwner {
        require(_stablecoin != address(0), "Invalid stablecoin address");
        stablecoin = IERC20(_stablecoin);
        emit StablecoinUpdated(_stablecoin);
    }

    /**
     * @dev Update platform fee (owner only)
     * @param _feeBps Fee in basis points (max 500 = 5%)
     */
    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 500, "Fee too high (max 5%)");
        platformFeeBps = _feeBps;
        emit PlatformFeeUpdated(_feeBps);
    }

    /**
     * @dev Update platform wallet (owner only)
     */
    function setPlatformWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet address");
        platformWallet = _wallet;
        emit PlatformWalletUpdated(_wallet);
    }
    
    /**
     * @dev Override transfer to update currentOwner
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override(ERC721) 
        returns (address) 
    {
        address from = super._update(to, tokenId, auth);
        
        // Update current owner in invoice struct
        if (to != address(0) && invoices[tokenId].escrowId != 0) {
            invoices[tokenId].currentOwner = to;
            
            // If transferred, unlist it
            if (invoices[tokenId].status == InvoiceStatus.Listed) {
                invoices[tokenId].listedPrice = 0;
                invoices[tokenId].status = InvoiceStatus.Active;
            }
        }
        
        return from;
    }
    
    /**
     * @dev Override tokenURI to support both ERC721 and ERC721URIStorage
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Override supportsInterface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Helper function to convert uint to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
