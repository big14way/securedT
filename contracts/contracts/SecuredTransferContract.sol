// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IComplianceOracle.sol";
import "./IInvoiceNFT.sol";

/**
 * @title SecuredTransferContract
 * @dev PYUSD Escrow contract with RWA compliance, KYC verification, and AML screening
 * Brings PayPal-like consumer protection with regulatory compliance to on-chain stablecoin payments
 */
contract SecuredTransferContract is Ownable, ReentrancyGuard {
    IERC20 public immutable pyusdToken;
    address public fraudOracle; // Now points to ComplianceOracle
    address public invoiceNFT; // Invoice tokenization contract
    
    uint256 public escrowCounter = 10000; // Start IDs at 10000 for better UX.
    
    enum EscrowStatus {
        Active,
        Released,
        Refunded,
        FraudFlagged
    }
    
    struct Escrow {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;
        string description;
        EscrowStatus status;
        uint256 createdAt;
        bool fraudFlagged;
    }
    
    mapping(uint256 => Escrow) public escrows;
    mapping(address => uint256[]) public buyerEscrows;
    mapping(address => uint256[]) public sellerEscrows;
    
    // Events for transparency and auditability
    event Deposited(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        string description
    );
    
    event Released(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );
    
    event Refunded(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );
    
    event FraudFlagged(
        uint256 indexed escrowId,
        address indexed flaggedBy
    );
    
    event OracleUpdated(
        address indexed oldOracle,
        address indexed newOracle
    );
    
    event InvoiceNFTUpdated(
        address indexed oldInvoiceNFT,
        address indexed newInvoiceNFT
    );
    
    event InvoiceMinted(
        uint256 indexed escrowId,
        uint256 indexed tokenId,
        address indexed seller
    );
    
    modifier onlyFraudOracle() {
        require(fraudOracle != address(0), "No fraud oracle configured");
        require(msg.sender == fraudOracle, "Only fraud oracle can call this");
        _;
    }
    
    modifier escrowExists(uint256 escrowId) {
        require(escrows[escrowId].buyer != address(0), "Escrow does not exist");
        _;
    }
    
    modifier onlyBuyer(uint256 escrowId) {
        require(msg.sender == escrows[escrowId].buyer, "Only buyer can call this");
        _;
    }
    
    modifier onlySeller(uint256 escrowId) {
        require(msg.sender == escrows[escrowId].seller, "Only seller can call this");
        _;
    }
    
    constructor(address _pyusdToken, address _fraudOracle) Ownable(msg.sender) {
        require(_pyusdToken != address(0), "Invalid PYUSD token address");
        require(_fraudOracle != address(0), "Fraud oracle address required");
        
        pyusdToken = IERC20(_pyusdToken);
        fraudOracle = _fraudOracle;
    }
    
    /**
     * @dev Deposit PYUSD into escrow for a specific seller
     * @param seller Address of the seller
     * @param amount Amount of PYUSD to escrow
     * @param description Description of the transaction
     */
    function deposit(
        address seller,
        uint256 amount,
        string memory description
    ) external nonReentrant returns (uint256) {
        require(seller != address(0), "Invalid seller address");
        require(seller != msg.sender, "Buyer cannot be seller");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        // Transfer PYUSD from buyer to contract
        require(
            pyusdToken.transferFrom(msg.sender, address(this), amount),
            "PYUSD transfer failed"
        );
        
        escrowCounter++;
        uint256 escrowId = escrowCounter;
        
        // Create escrow
        escrows[escrowId] = Escrow({
            id: escrowId,
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            description: description,
            status: EscrowStatus.Active,
            createdAt: block.timestamp,
            fraudFlagged: false
        });
        
        buyerEscrows[msg.sender].push(escrowId);
        sellerEscrows[seller].push(escrowId);
        
        emit Deposited(escrowId, msg.sender, seller, amount, description);
        
        // Mint invoice NFT if InvoiceNFT contract is configured
        if (invoiceNFT != address(0)) {
            try IInvoiceNFT(invoiceNFT).mintInvoice(
                escrowId,
                seller,      // issuer (seller)
                msg.sender,  // payer (buyer)
                amount,
                block.timestamp + 30 days  // Default 30 day due date
            ) returns (uint256 tokenId) {
                emit InvoiceMinted(escrowId, tokenId, seller);
            } catch {
                // Invoice minting failed but escrow continues
            }
        }
        
        // Check compliance oracle if configured
        if (fraudOracle != address(0)) {
            try IComplianceOracle(fraudOracle).checkEscrow(
                escrowId,
                msg.sender,
                seller,
                amount
            ) returns (bool isFlagged, string memory reason) {
                if (isFlagged) {
                    // Mark escrow as fraud flagged
                    escrows[escrowId].fraudFlagged = true;
                    escrows[escrowId].status = EscrowStatus.FraudFlagged;
                    
                    emit FraudFlagged(escrowId, fraudOracle);
                    
                    // Automatically refund the buyer
                    require(
                        pyusdToken.transfer(msg.sender, amount),
                        "PYUSD refund transfer failed"
                    );
                    
                    escrows[escrowId].status = EscrowStatus.Refunded;
                    emit Refunded(escrowId, msg.sender, amount);
                    
                    // Revert with compliance reason
                    revert(string(abi.encodePacked("Compliance check failed: ", reason)));
                }
            } catch {
                // Oracle call failed - continue with escrow creation
                // This ensures the contract doesn't break if oracle is down
            }
        }
        
        return escrowId;
    }
    
    /**
     * @dev Release funds to seller (normal transaction completion)
     * @param escrowId ID of the escrow to release
     */
    function release(uint256 escrowId) 
        external 
        escrowExists(escrowId) 
        nonReentrant 
    {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow is not active");
        require(!escrow.fraudFlagged, "Cannot release flagged escrow");
        
        // Only buyer or current invoice owner can release
        if (invoiceNFT != address(0)) {
            uint256 tokenId = IInvoiceNFT(invoiceNFT).getTokenByEscrow(escrowId);
            if (tokenId != 0) {
                address invoiceOwner = IInvoiceNFT(invoiceNFT).ownerOf(tokenId);
                require(
                    msg.sender == escrow.buyer || msg.sender == invoiceOwner,
                    "Only buyer or invoice owner can release"
                );
                
                // Transfer funds to current invoice owner (factoring)
                escrow.status = EscrowStatus.Released;
                
                require(
                    pyusdToken.transfer(invoiceOwner, escrow.amount),
                    "PYUSD transfer to invoice owner failed"
                );
                
                // Update invoice status and burn NFT
                IInvoiceNFT(invoiceNFT).updateInvoiceStatus(
                    escrowId,
                    IInvoiceNFT.InvoiceStatus.Released
                );
                IInvoiceNFT(invoiceNFT).burnInvoice(escrowId);
                
                emit Released(escrowId, escrow.buyer, invoiceOwner, escrow.amount);
                return;
            }
        }
        
        // Fallback to original logic if no invoice NFT
        require(msg.sender == escrow.buyer, "Only buyer can call this");
        escrow.status = EscrowStatus.Released;
        
        require(
            pyusdToken.transfer(escrow.seller, escrow.amount),
            "PYUSD transfer to seller failed"
        );
        
        emit Released(escrowId, escrow.buyer, escrow.seller, escrow.amount);
    }
    
    /**
     * @dev Refund funds to buyer (can be called by buyer or automatically via fraud detection)
     * @param escrowId ID of the escrow to refund
     */
    function refund(uint256 escrowId) 
        external 
        escrowExists(escrowId) 
        nonReentrant 
    {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow is not active");
        
        // Only buyer or fraud oracle can initiate refund (if oracle is configured)
        require(
            msg.sender == escrow.buyer || 
            (fraudOracle != address(0) && msg.sender == fraudOracle),
            "Only buyer or fraud oracle can refund"
        );
        
        escrow.status = EscrowStatus.Refunded;
        
        require(
            pyusdToken.transfer(escrow.buyer, escrow.amount),
            "PYUSD transfer to buyer failed"
        );
        
        // Burn invoice NFT if it exists
        if (invoiceNFT != address(0)) {
            try IInvoiceNFT(invoiceNFT).getTokenByEscrow(escrowId) returns (uint256 tokenId) {
                if (tokenId != 0) {
                    IInvoiceNFT(invoiceNFT).updateInvoiceStatus(
                        escrowId,
                        IInvoiceNFT.InvoiceStatus.Refunded
                    );
                    IInvoiceNFT(invoiceNFT).burnInvoice(escrowId);
                }
            } catch {
                // Invoice burning failed but refund continues
            }
        }
        
        emit Refunded(escrowId, escrow.buyer, escrow.amount);
    }
    
    /**
     * @dev Mark escrow as fraudulent (oracle attestation)
     * @param escrowId ID of the escrow to flag
     */
    function markFraud(uint256 escrowId) 
        external 
        escrowExists(escrowId) 
        onlyFraudOracle 
    {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow is not active");
        
        escrow.fraudFlagged = true;
        escrow.status = EscrowStatus.FraudFlagged;
        
        emit FraudFlagged(escrowId, msg.sender);
        
        // Automatically refund buyer when fraud is flagged
        require(
            pyusdToken.transfer(escrow.buyer, escrow.amount),
            "PYUSD refund transfer failed"
        );
        
        escrow.status = EscrowStatus.Refunded;
        emit Refunded(escrowId, escrow.buyer, escrow.amount);
    }
    
    /**
     * @dev Update fraud oracle address (only owner)
     * @param newOracle New fraud oracle address
     */
    function updateFraudOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        
        address oldOracle = fraudOracle;
        fraudOracle = newOracle;
        
        emit OracleUpdated(oldOracle, newOracle);
    }
    
    /**
     * @dev Update invoice NFT contract address (only owner)
     * @param newInvoiceNFT New InvoiceNFT contract address
     */
    function updateInvoiceNFT(address newInvoiceNFT) external onlyOwner {
        require(newInvoiceNFT != address(0), "Invalid InvoiceNFT address");
        
        address oldInvoiceNFT = invoiceNFT;
        invoiceNFT = newInvoiceNFT;
        
        emit InvoiceNFTUpdated(oldInvoiceNFT, newInvoiceNFT);
    }
    
    /**
     * @dev Get escrow details
     * @param escrowId ID of the escrow
     */
    function getEscrow(uint256 escrowId) 
        external 
        view 
        escrowExists(escrowId) 
        returns (Escrow memory) 
    {
        return escrows[escrowId];
    }
    
    /**
     * @dev Get buyer's escrow IDs
     * @param buyer Address of the buyer
     */
    function getBuyerEscrows(address buyer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return buyerEscrows[buyer];
    }
    
    /**
     * @dev Get seller's escrow IDs
     * @param seller Address of the seller
     */
    function getSellerEscrows(address seller) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return sellerEscrows[seller];
    }
    
    /**
     * @dev Check if fraud oracle is configured
     */
    function isFraudOracleConfigured() external view returns (bool) {
        return fraudOracle != address(0);
    }
    
    /**
     * @dev Query oracle for escrow fraud status (view function)
     * @param escrowId ID of the escrow to check
     */
    function queryOracleStatus(uint256 escrowId)
        external
        view
        escrowExists(escrowId)
        returns (bool isFlagged, string memory reason)
    {
        if (fraudOracle == address(0)) {
            return (false, "No oracle configured");
        }
        
        return IComplianceOracle(fraudOracle).isEscrowFlagged(escrowId);
    }
    
    /**
     * @dev Get compliance info for a user from the oracle
     * @param user Address to check
     */
    function getComplianceInfo(address user) external view returns (
        uint8 level,
        uint256 limit,
        uint8 riskScore,
        bool isBlacklisted,
        uint256 verifiedAt
    ) {
        require(fraudOracle != address(0), "No compliance oracle configured");
        return IComplianceOracle(fraudOracle).getComplianceInfo(user);
    }
    
    /**
     * @dev Check KYC status for a user
     * @param user Address to check
     */
    function isKYCVerified(address user) external view returns (bool) {
        if (fraudOracle == address(0)) return false;
        return IComplianceOracle(fraudOracle).isKYCVerified(user);
    }
    
    /**
     * @dev Get KYC level for a user
     * @param user Address to check
     */
    function getKYCLevel(address user) external view returns (uint8) {
        if (fraudOracle == address(0)) return 0;
        return IComplianceOracle(fraudOracle).getKYCLevel(user);
    }
    
    /**
     * @dev Get transaction limit for a user
     * @param user Address to check
     */
    function getTransactionLimit(address user) external view returns (uint256) {
        if (fraudOracle == address(0)) return type(uint256).max;
        return IComplianceOracle(fraudOracle).getTransactionLimit(user);
    }
    
    /**
     * @dev Get AML risk score for a user
     * @param user Address to check
     */
    function getAMLRiskScore(address user) external view returns (uint8) {
        if (fraudOracle == address(0)) return 0;
        return IComplianceOracle(fraudOracle).getAMLRiskScore(user);
    }
}

