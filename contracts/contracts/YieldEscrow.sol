// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMETHProtocol.sol";
import "./IComplianceOracle.sol";
import "./IInvoiceNFT.sol";

/**
 * @title YieldEscrow
 * @dev Escrow contract with optional cmETH yield generation
 * Integrates Mantle's cmETH (Composable mETH) on L2 for 7%+ APY
 * @notice Users can opt-in to hold escrowed funds in cmETH for passive yield
 * cmETH accrues value automatically without staking/unstaking
 */
contract YieldEscrow is Ownable, ReentrancyGuard {
    
    // ERC20 tokens
    IERC20 public immutable stablecoin;        // USDT
    ICMETHToken public immutable cmETH;        // cmETH token (Composable mETH)
    
    // Protocol contracts
    IMETHProtocol public immutable cmETHProtocol; // For exchange rate queries
    IAgniRouter public immutable agniRouter;
    IComplianceOracle public complianceOracle;
    IInvoiceNFT public invoiceNFT;
    
    // Escrow state
    enum EscrowStatus { Active, Released, Refunded, Disputed }
    
    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;              // Amount in USDT (6 decimals)
        string description;
        EscrowStatus status;
        uint256 createdAt;
        bool yieldEnabled;           // Whether yield is enabled for this escrow
    }
    
    struct YieldData {
        uint256 usdtAmount;          // Original USDT amount
        uint256 cmETHReceived;       // Amount of cmETH received from swap
        uint256 depositTimestamp;    // When yield started
        uint256 initialValue;        // Initial value when deposited
    }
    
    // State mappings
    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => YieldData) public yieldData;
    uint256 public escrowCounter;
    
    // Yield distribution (basis points, 10000 = 100%)
    uint256 public constant BUYER_SHARE = 8000;      // 80%
    uint256 public constant SELLER_SHARE = 1500;     // 15%
    uint256 public constant PLATFORM_SHARE = 500;    // 5%
    
    address public platformWallet;
    
    // Protocol fee for mETH staking (4 basis points = 0.04%)
    uint256 public constant METH_STAKE_FEE = 4;
    
    // Events
    event Deposited(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        bool yieldEnabled
    );
    
    event YieldStaked(
        uint256 indexed escrowId,
        uint256 ethAmount,
        uint256 mETHAmount
    );
    
    event Released(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 yieldGenerated
    );
    
    event YieldDistributed(
        uint256 indexed escrowId,
        uint256 totalYield,
        uint256 buyerYield,
        uint256 sellerYield,
        uint256 platformYield
    );
    
    event Refunded(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );
    
    event UnstakeRequested(
        uint256 indexed escrowId,
        uint256 mETHAmount,
        uint256 requestId
    );
    
    /**
     * @dev Constructor
     * @param _stablecoin USDT token address
     * @param _cmETH cmETH token address
     * @param _cmETHProtocol cmETH Protocol contract address (can be same as token)
     * @param _agniRouter Agni Finance router address
     * @param _platformWallet Platform fee recipient
     */
    constructor(
        address _stablecoin,
        address _cmETH,
        address _cmETHProtocol,
        address _agniRouter,
        address _platformWallet
    ) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin address");
        require(_cmETH != address(0), "Invalid cmETH address");
        require(_cmETHProtocol != address(0), "Invalid cmETH protocol address");
        require(_agniRouter != address(0), "Invalid router address");
        require(_platformWallet != address(0), "Invalid platform wallet");
        
        stablecoin = IERC20(_stablecoin);
        cmETH = ICMETHToken(_cmETH);
        cmETHProtocol = IMETHProtocol(_cmETHProtocol);
        agniRouter = IAgniRouter(_agniRouter);
        platformWallet = _platformWallet;
        
        escrowCounter = 10000; // Start at 10000 for better UX
    }
    
    /**
     * @dev Create escrow with optional yield generation
     * @param seller Seller address
     * @param amount Amount in USDT (6 decimals)
     * @param description Escrow description
     * @param enableYield Whether to enable mETH yield generation
     * @return escrowId The created escrow ID
     */
    function deposit(
        address seller,
        uint256 amount,
        string memory description,
        bool enableYield
    ) external nonReentrant returns (uint256) {
        require(seller != address(0), "Invalid seller address");
        require(seller != msg.sender, "Buyer and seller cannot be the same");
        require(amount > 0, "Amount must be greater than 0");
        
        // Check compliance if oracle is set
        if (address(complianceOracle) != address(0)) {
            try complianceOracle.checkEscrow(
                escrowCounter,
                msg.sender,
                seller,
                amount
            ) returns (bool approved, string memory reason) {
                require(approved, reason);
            } catch {
                // If oracle fails, allow escrow to proceed
            }
        }
        
        // Transfer USDT from buyer
        require(
            stablecoin.transferFrom(msg.sender, address(this), amount),
            "USDT transfer failed"
        );
        
        // Create escrow
        escrowCounter++;
        uint256 escrowId = escrowCounter;
        
        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            description: description,
            status: EscrowStatus.Active,
            createdAt: block.timestamp,
            yieldEnabled: enableYield
        });
        
        emit Deposited(escrowId, msg.sender, seller, amount, enableYield);
        
        // Mint invoice NFT if configured
        if (address(invoiceNFT) != address(0)) {
            try invoiceNFT.mintInvoice(
                escrowId,
                seller,
                msg.sender,
                amount,
                block.timestamp + 30 days
            ) {
                // Invoice minted successfully
            } catch {
                // Continue even if invoice minting fails
            }
        }
        
        // Swap to cmETH if yield enabled
        if (enableYield) {
            _swapToCMETH(escrowId, amount);
        }
        
        return escrowId;
    }
    
    /**
     * @dev Internal function to swap USDT to cmETH and hold for yield
     * @param escrowId Escrow ID
     * @param usdtAmount Amount in USDT to swap
     */
    function _swapToCMETH(uint256 escrowId, uint256 usdtAmount) internal {
        // Swap USDT -> cmETH via Agni Finance
        uint256 cmETHReceived = _swapUSDTToCMETH(usdtAmount);
        
        // Store yield data (cmETH accrues value automatically)
        yieldData[escrowId] = YieldData({
            usdtAmount: usdtAmount,
            cmETHReceived: cmETHReceived,
            depositTimestamp: block.timestamp,
            initialValue: usdtAmount // Track initial value for yield calculation
        });
        
        emit YieldStaked(escrowId, usdtAmount, cmETHReceived);
    }
    
    /**
     * @dev Release escrow and distribute yield
     * @param escrowId Escrow ID to release
     */
    function release(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        
        // Check authorization
        bool authorized = false;
        if (msg.sender == escrow.buyer) {
            authorized = true;
        } else if (address(invoiceNFT) != address(0)) {
            // Check if sender is current invoice owner
            try invoiceNFT.getTokenByEscrow(escrowId) returns (uint256 tokenId) {
                if (tokenId != 0) {
                    try invoiceNFT.ownerOf(tokenId) returns (address invoiceOwner) {
                        if (msg.sender == invoiceOwner) {
                            authorized = true;
                        }
                    } catch {}
                }
            } catch {}
        }
        require(authorized, "Not authorized");
        
        uint256 totalYield = 0;
        address recipient = escrow.seller;
        
        // Get current invoice owner if invoice exists
        if (address(invoiceNFT) != address(0)) {
            try invoiceNFT.getTokenByEscrow(escrowId) returns (uint256 tokenId) {
                if (tokenId != 0) {
                    try invoiceNFT.ownerOf(tokenId) returns (address invoiceOwner) {
                        recipient = invoiceOwner;
                    } catch {}
                }
            } catch {}
        }
        
        // Handle yield if enabled
        if (escrow.yieldEnabled) {
            YieldData storage yd = yieldData[escrowId];
            uint256 totalYield = 0;
            
            // Swap cmETH back to USDT (instant, no unstaking period)
            uint256 totalUSDT = _swapCMETHToUSDT(yd.cmETHReceived);
            
            // Calculate yield (cmETH appreciation)
            if (totalUSDT > escrow.amount) {
                totalYield = totalUSDT - escrow.amount;
                
                // Distribute yield according to split (80/15/5)
                uint256 buyerYield = (totalYield * BUYER_SHARE) / 10000;
                uint256 sellerYield = (totalYield * SELLER_SHARE) / 10000;
                uint256 platformYield = (totalYield * PLATFORM_SHARE) / 10000;
                
                // Transfer funds with yield distribution
                require(stablecoin.transfer(escrow.buyer, buyerYield), "Buyer yield transfer failed");
                require(stablecoin.transfer(recipient, escrow.amount + sellerYield), "Seller payment failed");
                require(stablecoin.transfer(platformWallet, platformYield), "Platform fee failed");
                
                emit YieldDistributed(escrowId, totalYield, buyerYield, sellerYield, platformYield);
            } else {
                // No yield or slight loss (rare with cmETH)
                require(stablecoin.transfer(recipient, totalUSDT), "Transfer failed");
            }
        } else {
            // Standard release without yield
            require(stablecoin.transfer(recipient, escrow.amount), "Transfer failed");
        }
        
        escrow.status = EscrowStatus.Released;
        
        // Burn invoice NFT if exists
        if (address(invoiceNFT) != address(0)) {
            try invoiceNFT.getTokenByEscrow(escrowId) returns (uint256 tokenId) {
                if (tokenId != 0) {
                    invoiceNFT.updateInvoiceStatus(escrowId, IInvoiceNFT.InvoiceStatus.Released);
                    invoiceNFT.burnInvoice(escrowId);
                }
            } catch {}
        }
        
        emit Released(escrowId, escrow.buyer, recipient, escrow.amount, totalYield);
    }
    
    /**
     * @dev Refund escrow to buyer
     * @param escrowId Escrow ID to refund
     */
    function refund(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(msg.sender == escrow.buyer, "Only buyer can refund");
        
        // Handle yield unstaking if enabled
        if (escrow.yieldEnabled) {
            YieldData storage yd = yieldData[escrowId];
            
            // Swap cmETH back to USDT (no unstaking needed - instant swap)
            uint256 usdtReceived = _swapCMETHToUSDT(yd.cmETHReceived);
            
            // Refund to buyer (they get any yield from cmETH appreciation)
            require(stablecoin.transfer(escrow.buyer, usdtReceived), "Refund failed");
        } else {
            // Standard refund
            require(stablecoin.transfer(escrow.buyer, escrow.amount), "Refund failed");
        }
        
        escrow.status = EscrowStatus.Refunded;
        
        // Burn invoice NFT if exists
        if (address(invoiceNFT) != address(0)) {
            try invoiceNFT.getTokenByEscrow(escrowId) returns (uint256 tokenId) {
                if (tokenId != 0) {
                    invoiceNFT.updateInvoiceStatus(escrowId, IInvoiceNFT.InvoiceStatus.Refunded);
                    invoiceNFT.burnInvoice(escrowId);
                }
            } catch {}
        }
        
        emit Refunded(escrowId, escrow.buyer, escrow.amount);
    }
    
    /**
     * @dev Get estimated current yield for an escrow
     * @param escrowId Escrow ID
     * @return estimatedYield Estimated yield in USDT
     */
    function getEstimatedYield(uint256 escrowId) external view returns (uint256 estimatedYield) {
        Escrow storage escrow = escrows[escrowId];
        if (!escrow.yieldEnabled || escrow.status != EscrowStatus.Active) {
            return 0;
        }
        
        YieldData storage yd = yieldData[escrowId];
        
        // Get current cmETH to ETH exchange rate
        uint256 currentRate = cmETHProtocol.mETHToETH();
        uint256 currentETHValue = (yd.cmETHReceived * currentRate) / 1e18;
        
        // Calculate yield: current value - initial value
        // Note: This is simplified - for exact USDT value, query Agni router
        if (currentETHValue > yd.initialValue) {
            estimatedYield = currentETHValue - yd.initialValue;
        }
        
        return estimatedYield;
    }
    
    /**
     * @dev Swap USDT to cmETH via Agni Finance
     * @param usdtAmount Amount of USDT to swap
     * @return cmETHAmount Amount of cmETH received
     */
    function _swapUSDTToCMETH(uint256 usdtAmount) internal returns (uint256 cmETHAmount) {
        // Approve Agni Router to spend USDT
        require(stablecoin.approve(address(agniRouter), usdtAmount), "USDT approval failed");
        
        // Get WMNT address from router
        address WMNT = agniRouter.WETH(); // WETH() returns WMNT on Mantle
        
        // Build swap path: USDT -> WMNT -> cmETH
        address[] memory path = new address[](3);
        path[0] = address(stablecoin);  // USDT
        path[1] = WMNT;                  // WMNT
        path[2] = address(cmETH);        // cmETH
        
        // Get expected output for slippage calculation
        uint256[] memory amountsOut = agniRouter.getAmountsOut(usdtAmount, path);
        uint256 minOut = (amountsOut[amountsOut.length - 1] * 99) / 100; // 1% slippage
        
        // Execute swap
        uint256[] memory amounts = agniRouter.swapExactTokensForTokens(
            usdtAmount,
            minOut,
            path,
            address(this),
            block.timestamp + 300 // 5 minute deadline
        );
        
        return amounts[amounts.length - 1];
    }
    
    /**
     * @dev Swap cmETH to USDT via Agni Finance
     * @param cmETHAmount Amount of cmETH to swap
     * @return usdtAmount Amount of USDT received
     */
    function _swapCMETHToUSDT(uint256 cmETHAmount) internal returns (uint256 usdtAmount) {
        // Approve Agni Router to spend cmETH
        require(cmETH.approve(address(agniRouter), cmETHAmount), "cmETH approval failed");
        
        // Get WMNT address from router
        address WMNT = agniRouter.WETH();
        
        // Build swap path: cmETH -> WMNT -> USDT
        address[] memory path = new address[](3);
        path[0] = address(cmETH);        // cmETH
        path[1] = WMNT;                  // WMNT
        path[2] = address(stablecoin);   // USDT
        
        // Get expected output for slippage calculation
        uint256[] memory amountsOut = agniRouter.getAmountsOut(cmETHAmount, path);
        uint256 minOut = (amountsOut[amountsOut.length - 1] * 99) / 100; // 1% slippage
        
        // Execute swap
        uint256[] memory amounts = agniRouter.swapExactTokensForTokens(
            cmETHAmount,
            minOut,
            path,
            address(this),
            block.timestamp + 300 // 5 minute deadline
        );
        
        return amounts[amounts.length - 1];
    }
    
    /**
     * @dev Update compliance oracle address (owner only)
     */
    function updateComplianceOracle(address newOracle) external onlyOwner {
        complianceOracle = IComplianceOracle(newOracle);
    }
    
    /**
     * @dev Update invoice NFT address (owner only)
     */
    function updateInvoiceNFT(address newInvoiceNFT) external onlyOwner {
        invoiceNFT = IInvoiceNFT(newInvoiceNFT);
    }
    
    /**
     * @dev Update platform wallet (owner only)
     */
    function updatePlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid wallet");
        platformWallet = newWallet;
    }
    
    /**
     * @dev Get escrow details
     */
    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }
    
    /**
     * @dev Get yield data for escrow
     */
    function getYieldData(uint256 escrowId) external view returns (YieldData memory) {
        return yieldData[escrowId];
    }
    
    /**
     * @dev Receive ETH
     */
    receive() external payable {}
}
