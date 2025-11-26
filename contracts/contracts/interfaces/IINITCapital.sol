// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IINITCapital {
    // Supply tokens as collateral
    function supply(address token, uint256 amount) external returns (uint256);
    
    // Withdraw supplied tokens
    function withdraw(address token, uint256 amount) external returns (uint256);
    
    // Borrow against collateral
    function borrow(address token, uint256 amount) external returns (uint256);
    
    // Repay borrowed amount
    function repay(address token, uint256 amount) external returns (uint256);
    
    // Get borrow limit for user
    function getBorrowLimit(address user) external view returns (uint256);
    
    // Get health factor (>1 = safe, <1 = liquidation risk)
    function getHealthFactor(address user) external view returns (uint256);
}
