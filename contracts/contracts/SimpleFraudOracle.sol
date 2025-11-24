// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IFraudOracle.sol";

/**
 * @title SimpleFraudOracle
 * @dev Lightweight fraud detection oracle for SecuredTransfer escrow system
 * Performs basic checks: blacklist, amount limits, and manual flagging
 */
contract SimpleFraudOracle is IFraudOracle, Ownable {
    
    // Simple fraud rules
    uint256 public maxTransactionAmount = 5000 * 10**6; // 5000 PYUSD (6 decimals)
    uint256 public disputeWindowSeconds = 7 days;
    
    // Blacklisted addresses
    mapping(address => bool) public blacklistedAddresses;
    
    // Manually flagged escrows
    mapping(uint256 => bool) public flaggedEscrows;
    mapping(uint256 => string) public flagReasons;
    
    // Escrow creation timestamps for dispute window
    mapping(uint256 => uint256) public escrowCreationTime;
    
    // Events
    event EscrowFlagged(uint256 indexed escrowId, address indexed flaggedAddress, string reason);
    event EscrowCleared(uint256 indexed escrowId);
    event AddressBlacklisted(address indexed addr, string reason);
    event AddressWhitelisted(address indexed addr);
    event MaxAmountUpdated(uint256 newMaxAmount);
    event DisputeWindowUpdated(uint256 newWindowSeconds);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Check if an escrow should be flagged for fraud
     * @return isFlagged Whether the escrow is flagged
     * @return reason Reason for flagging (empty if not flagged)
     */
    function checkEscrow(
        uint256 escrowId,
        address buyer,
        address seller,
        uint256 amount
    ) external returns (bool isFlagged, string memory reason) {
        // Record creation time
        if (escrowCreationTime[escrowId] == 0) {
            escrowCreationTime[escrowId] = block.timestamp;
        }
        
        // Check 1: Blacklist
        if (blacklistedAddresses[buyer]) {
            flaggedEscrows[escrowId] = true;
            flagReasons[escrowId] = "Buyer address is blacklisted";
            emit EscrowFlagged(escrowId, buyer, flagReasons[escrowId]);
            return (true, flagReasons[escrowId]);
        }
        
        if (blacklistedAddresses[seller]) {
            flaggedEscrows[escrowId] = true;
            flagReasons[escrowId] = "Seller address is blacklisted";
            emit EscrowFlagged(escrowId, seller, flagReasons[escrowId]);
            return (true, flagReasons[escrowId]);
        }
        
        // Check 2: Amount limit
        if (amount > maxTransactionAmount) {
            flaggedEscrows[escrowId] = true;
            flagReasons[escrowId] = "Transaction amount exceeds maximum limit";
            emit EscrowFlagged(escrowId, buyer, flagReasons[escrowId]);
            return (true, flagReasons[escrowId]);
        }
        
        // Check 3: Same address
        if (buyer == seller) {
            flaggedEscrows[escrowId] = true;
            flagReasons[escrowId] = "Buyer and seller cannot be the same address";
            emit EscrowFlagged(escrowId, buyer, flagReasons[escrowId]);
            return (true, flagReasons[escrowId]);
        }
        
        // Check 4: Manual flag
        if (flaggedEscrows[escrowId]) {
            return (true, flagReasons[escrowId]);
        }
        
        return (false, "");
    }
    
    /**
     * @dev Check if an escrow is flagged
     */
    function isEscrowFlagged(uint256 escrowId) external view returns (bool, string memory) {
        return (flaggedEscrows[escrowId], flagReasons[escrowId]);
    }
    
    /**
     * @dev Check if still within dispute window
     */
    function isWithinDisputeWindow(uint256 escrowId) external view returns (bool) {
        uint256 creationTime = escrowCreationTime[escrowId];
        if (creationTime == 0) return false;
        return block.timestamp <= creationTime + disputeWindowSeconds;
    }
    
    /**
     * @dev Manually flag an escrow (owner only)
     */
    function flagEscrow(
        uint256 escrowId,
        address flaggedAddress,
        string memory reason
    ) external onlyOwner {
        flaggedEscrows[escrowId] = true;
        flagReasons[escrowId] = reason;
        emit EscrowFlagged(escrowId, flaggedAddress, reason);
    }
    
    /**
     * @dev Clear a fraud flag (owner only)
     */
    function clearFlag(uint256 escrowId) external onlyOwner {
        flaggedEscrows[escrowId] = false;
        delete flagReasons[escrowId];
        emit EscrowCleared(escrowId);
    }
    
    /**
     * @dev Blacklist an address (owner only)
     */
    function blacklistAddress(address addr, string memory reason) external onlyOwner {
        blacklistedAddresses[addr] = true;
        emit AddressBlacklisted(addr, reason);
    }
    
    /**
     * @dev Remove address from blacklist (owner only)
     */
    function whitelistAddress(address addr) external onlyOwner {
        blacklistedAddresses[addr] = false;
        emit AddressWhitelisted(addr);
    }
    
    /**
     * @dev Update max transaction amount (owner only)
     */
    function setMaxTransactionAmount(uint256 newMaxAmount) external onlyOwner {
        maxTransactionAmount = newMaxAmount;
        emit MaxAmountUpdated(newMaxAmount);
    }
    
    /**
     * @dev Update dispute window (owner only)
     */
    function setDisputeWindow(uint256 newWindowSeconds) external onlyOwner {
        disputeWindowSeconds = newWindowSeconds;
        emit DisputeWindowUpdated(newWindowSeconds);
    }
}
