// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IComplianceOracle.sol";

/**
 * @title ComplianceOracle
 * @dev Fraud protection oracle for SecuredTransfer escrow system (Web3-native design)
 *
 * Core Functions:
 * - Blacklist management (fraud/security risks)
 * - AML risk scoring (suspicious behavior detection)
 * - Wash trading prevention (same address check)
 * - Manual flagging (admin override)
 *
 * KYC is OPTIONAL:
 * - Protocol is permissionless by default (Web3 best practice)
 * - Users can transact without KYC
 * - KYC provides compliance badges/verification for users who want it
 * - No transaction limits enforced (all users have unlimited access)
 */
contract ComplianceOracle is IComplianceOracle, Ownable {
    
    // KYC Level tiers
    uint8 public constant KYC_LEVEL_NONE = 0;
    uint8 public constant KYC_LEVEL_BASIC = 1;
    uint8 public constant KYC_LEVEL_ADVANCED = 2;
    uint8 public constant KYC_LEVEL_INSTITUTIONAL = 3;
    
    // Transaction limits based on KYC level (in token's smallest unit - USDT has 6 decimals)
    // KYC is OPTIONAL - users without KYC can still use the protocol (Web3 best practice)
    // KYC only provides higher limits for compliance-conscious users
    uint256 public constant LIMIT_LEVEL_0 = type(uint256).max; // Unlimited (permissionless by default)
    uint256 public constant LIMIT_LEVEL_1 = type(uint256).max; // Unlimited
    uint256 public constant LIMIT_LEVEL_2 = type(uint256).max; // Unlimited
    uint256 public constant LIMIT_LEVEL_3 = type(uint256).max; // Unlimited
    
    uint256 public disputeWindowSeconds = 7 days;
    
    // KYC status mapping
    mapping(address => uint8) public kycLevel;
    mapping(address => uint256) public kycVerifiedAt;
    
    // AML risk scores (0-100, where 0=low risk, 100=high risk)
    mapping(address => uint8) public amlRiskScore;
    uint8 public constant AML_HIGH_RISK_THRESHOLD = 80;
    
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
    event DisputeWindowUpdated(uint256 newWindowSeconds);
    event KYCStatusUpdated(address indexed user, uint8 level, uint256 timestamp);
    event AMLRiskScoreUpdated(address indexed user, uint8 score);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Check if a user has completed KYC verification (at least basic level)
     * @param user Address to check
     * @return verified True if user has KYC level >= 1
     */
    function isKYCVerified(address user) external view returns (bool verified) {
        return kycLevel[user] >= KYC_LEVEL_BASIC;
    }
    
    /**
     * @dev Get KYC level for a user
     * @param user Address to check
     * @return level KYC tier (0=none, 1=basic, 2=advanced, 3=institutional)
     */
    function getKYCLevel(address user) external view returns (uint8 level) {
        return kycLevel[user];
    }
    
    /**
     * @dev Get transaction limit for a user based on their KYC level
     * @param user Address to check
     * @return limit Maximum transaction amount allowed
     */
    function getTransactionLimit(address user) public view returns (uint256 limit) {
        uint8 level = kycLevel[user];
        
        if (level == KYC_LEVEL_NONE) {
            return LIMIT_LEVEL_0;
        } else if (level == KYC_LEVEL_BASIC) {
            return LIMIT_LEVEL_1;
        } else if (level == KYC_LEVEL_ADVANCED) {
            return LIMIT_LEVEL_2;
        } else {
            return LIMIT_LEVEL_3; // Institutional
        }
    }
    
    /**
     * @dev Set KYC status for a user (owner only)
     * @param user Address to update
     * @param level KYC tier to assign (0-3)
     */
    function setKYCStatus(address user, uint8 level) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(level <= KYC_LEVEL_INSTITUTIONAL, "Invalid KYC level");
        
        kycLevel[user] = level;
        kycVerifiedAt[user] = block.timestamp;
        
        emit KYCStatusUpdated(user, level, block.timestamp);
    }
    
    /**
     * @dev Batch set KYC status for multiple users (gas efficient)
     * @param users Array of addresses to update
     * @param levels Array of KYC tiers to assign
     */
    function batchSetKYCStatus(address[] calldata users, uint8[] calldata levels) external onlyOwner {
        require(users.length == levels.length, "Arrays must have same length");
        
        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "Invalid user address");
            require(levels[i] <= KYC_LEVEL_INSTITUTIONAL, "Invalid KYC level");
            
            kycLevel[users[i]] = levels[i];
            kycVerifiedAt[users[i]] = block.timestamp;
            
            emit KYCStatusUpdated(users[i], levels[i], block.timestamp);
        }
    }
    
    /**
     * @dev Get AML risk score for a user
     * @param user Address to check
     * @return score Risk score (0-100, where 0=low risk, 100=high risk)
     */
    function getAMLRiskScore(address user) external view returns (uint8 score) {
        return amlRiskScore[user];
    }
    
    /**
     * @dev Set AML risk score for a user (owner only)
     * @param user Address to update
     * @param score Risk score (0-100)
     */
    function setAMLRiskScore(address user, uint8 score) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(score <= 100, "Risk score must be between 0 and 100");
        
        amlRiskScore[user] = score;
        
        emit AMLRiskScoreUpdated(user, score);
        
        // Auto-blacklist if high risk
        if (score > AML_HIGH_RISK_THRESHOLD && !blacklistedAddresses[user]) {
            blacklistedAddresses[user] = true;
            emit AddressBlacklisted(user, "AML risk score exceeds threshold");
        }
    }
    
    /**
     * @dev Check if an escrow should be flagged for fraud or compliance issues
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
        
        // Check 1: Blacklist (fraud protection - actual risk mitigation)
        if (blacklistedAddresses[buyer]) {
            flaggedEscrows[escrowId] = true;
            flagReasons[escrowId] = "Buyer address is blacklisted for fraud/security reasons";
            emit EscrowFlagged(escrowId, buyer, flagReasons[escrowId]);
            return (true, flagReasons[escrowId]);
        }

        if (blacklistedAddresses[seller]) {
            flaggedEscrows[escrowId] = true;
            flagReasons[escrowId] = "Seller address is blacklisted for fraud/security reasons";
            emit EscrowFlagged(escrowId, seller, flagReasons[escrowId]);
            return (true, flagReasons[escrowId]);
        }

        // Check 2: AML risk score (fraud detection - high-risk behavior patterns)
        if (amlRiskScore[buyer] > AML_HIGH_RISK_THRESHOLD) {
            flaggedEscrows[escrowId] = true;
            flagReasons[escrowId] = "Buyer has high AML risk score - suspicious activity detected";
            emit EscrowFlagged(escrowId, buyer, flagReasons[escrowId]);
            return (true, flagReasons[escrowId]);
        }

        if (amlRiskScore[seller] > AML_HIGH_RISK_THRESHOLD) {
            flaggedEscrows[escrowId] = true;
            flagReasons[escrowId] = "Seller has high AML risk score - suspicious activity detected";
            emit EscrowFlagged(escrowId, seller, flagReasons[escrowId]);
            return (true, flagReasons[escrowId]);
        }

        // Check 3: Same address (prevents wash trading / self-dealing)
        if (buyer == seller) {
            flaggedEscrows[escrowId] = true;
            flagReasons[escrowId] = "Buyer and seller cannot be the same address - prevents wash trading";
            emit EscrowFlagged(escrowId, buyer, flagReasons[escrowId]);
            return (true, flagReasons[escrowId]);
        }

        // Check 4: Manual flag (admin override for specific fraud cases)
        if (flaggedEscrows[escrowId]) {
            return (true, flagReasons[escrowId]);
        }

        // All checks passed - escrow is NOT flagged
        // Note: Escrow can proceed even without KYC (permissionless Web3 design)
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
     * @dev Update dispute window (owner only)
     */
    function setDisputeWindow(uint256 newWindowSeconds) external onlyOwner {
        disputeWindowSeconds = newWindowSeconds;
        emit DisputeWindowUpdated(newWindowSeconds);
    }
    
    /**
     * @dev Get comprehensive compliance info for a user
     * @param user Address to check
     * @return level KYC level
     * @return limit Transaction limit
     * @return riskScore AML risk score
     * @return isBlacklisted Whether user is blacklisted
     * @return verifiedAt Timestamp of KYC verification
     */
    function getComplianceInfo(address user) external view returns (
        uint8 level,
        uint256 limit,
        uint8 riskScore,
        bool isBlacklisted,
        uint256 verifiedAt
    ) {
        return (
            kycLevel[user],
            getTransactionLimit(user),
            amlRiskScore[user],
            blacklistedAddresses[user],
            kycVerifiedAt[user]
        );
    }
}
