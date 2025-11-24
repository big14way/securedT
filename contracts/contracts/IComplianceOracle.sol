// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IComplianceOracle
 * @dev Interface for RWA compliance oracle with KYC verification and AML screening
 * Used by SecuredTransferContract for regulatory compliance checks
 */
interface IComplianceOracle {
    /**
     * @dev Check if a user has completed KYC verification
     * @param user Address to check
     * @return verified True if user has completed at least basic KYC
     */
    function isKYCVerified(address user) external view returns (bool verified);
    
    /**
     * @dev Get KYC level for a user
     * @param user Address to check
     * @return level KYC tier (0=none, 1=basic, 2=advanced, 3=institutional)
     */
    function getKYCLevel(address user) external view returns (uint8 level);
    
    /**
     * @dev Get transaction limit for a user based on their KYC level
     * @param user Address to check
     * @return limit Maximum transaction amount allowed
     */
    function getTransactionLimit(address user) external view returns (uint256 limit);
    
    /**
     * @dev Set KYC status for a user (owner only)
     * @param user Address to update
     * @param level KYC tier to assign (0-3)
     */
    function setKYCStatus(address user, uint8 level) external;
    
    /**
     * @dev Get AML risk score for a user
     * @param user Address to check
     * @return score Risk score (0-100, where 0=low risk, 100=high risk)
     */
    function getAMLRiskScore(address user) external view returns (uint8 score);
    
    /**
     * @dev Set AML risk score for a user (owner only)
     * @param user Address to update
     * @param score Risk score (0-100)
     */
    function setAMLRiskScore(address user, uint8 score) external;
    
    /**
     * @dev Check if an escrow transaction should be flagged for fraud or compliance issues
     * @param escrowId Unique identifier for the escrow
     * @param buyer Address of the buyer
     * @param seller Address of the seller
     * @param amount Amount being escrowed (in token's smallest unit)
     * @return isFlagged Whether the escrow is flagged
     * @return reason Reason for flagging (empty string if not flagged)
     */
    function checkEscrow(
        uint256 escrowId,
        address buyer,
        address seller,
        uint256 amount
    ) external returns (bool isFlagged, string memory reason);
    
    /**
     * @dev Check if an escrow is currently flagged (view function)
     * @param escrowId Unique identifier for the escrow
     * @return isFlagged Whether the escrow is flagged
     * @return reason Reason for flagging
     */
    function isEscrowFlagged(uint256 escrowId) 
        external 
        view 
        returns (bool isFlagged, string memory reason);
    
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
    );
}
