// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IFraudOracle
 * @dev Interface for fraud detection oracles used by SecuredTransferContract
 */
interface IFraudOracle {
    /**
     * @dev Check if an escrow transaction should be flagged for fraud
     * @param escrowId Unique identifier for the escrow
     * @param buyer Address of the buyer
     * @param seller Address of the seller
     * @param amount Amount being escrowed (in token's smallest unit)
     * @return isFlagged Whether the escrow is flagged as fraudulent
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
}
