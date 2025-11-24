// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IInvoiceNFT
 * @dev Interface for InvoiceNFT contract
 */
interface IInvoiceNFT {
    enum InvoiceStatus {
        Active,
        Released,
        Refunded,
        Listed
    }
    
    function mintInvoice(
        uint256 escrowId,
        address issuer,
        address payer,
        uint256 amount,
        uint256 dueDate
    ) external returns (uint256);
    
    function updateInvoiceStatus(
        uint256 escrowId,
        InvoiceStatus newStatus
    ) external;
    
    function burnInvoice(uint256 escrowId) external;
    
    function getTokenByEscrow(uint256 escrowId) external view returns (uint256);
    
    function ownerOf(uint256 tokenId) external view returns (address);
}
