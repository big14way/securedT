// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IINITCapital.sol";

/**
 * @title MockINITCapital
 * @dev Mock implementation of INIT Capital for testing
 */
contract MockINITCapital is IINITCapital {
    IERC20 public immutable token;
    
    struct UserPosition {
        uint256 supplied;
        uint256 borrowed;
    }
    
    mapping(address => mapping(address => UserPosition)) public positions;
    
    constructor(address _token) {
        token = IERC20(_token);
    }
    
    // Supply tokens as collateral
    function supply(address _token, uint256 amount) external returns (uint256) {
        require(_token == address(token), "Unsupported token");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from user to this contract
        token.transferFrom(msg.sender, address(this), amount);
        
        // Update position
        positions[msg.sender][_token].supplied += amount;
        
        return amount;
    }
    
    // Withdraw supplied tokens
    function withdraw(address _token, uint256 amount) external returns (uint256) {
        require(_token == address(token), "Unsupported token");
        require(amount > 0, "Amount must be greater than 0");
        require(positions[msg.sender][_token].supplied >= amount, "Insufficient supply");
        require(positions[msg.sender][_token].borrowed == 0, "Cannot withdraw with outstanding debt");
        
        // Update position
        positions[msg.sender][_token].supplied -= amount;
        
        // Transfer tokens back to user
        token.transfer(msg.sender, amount);
        
        return amount;
    }
    
    // Borrow against collateral
    function borrow(address _token, uint256 amount) external returns (uint256) {
        require(_token == address(token), "Unsupported token");
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 supplied = positions[msg.sender][_token].supplied;
        uint256 borrowed = positions[msg.sender][_token].borrowed;
        uint256 maxBorrow = (supplied * 80) / 100; // 80% LTV
        
        require(borrowed + amount <= maxBorrow, "Exceeds borrow limit");
        require(token.balanceOf(address(this)) >= amount, "Insufficient liquidity");
        
        // Update position
        positions[msg.sender][_token].borrowed += amount;
        
        // Transfer borrowed tokens to user
        token.transfer(msg.sender, amount);
        
        return amount;
    }
    
    // Repay borrowed amount
    function repay(address _token, uint256 amount) external returns (uint256) {
        require(_token == address(token), "Unsupported token");
        require(amount > 0, "Amount must be greater than 0");
        require(positions[msg.sender][_token].borrowed >= amount, "Amount exceeds debt");
        
        // Transfer tokens from user to this contract
        token.transferFrom(msg.sender, address(this), amount);
        
        // Update position
        positions[msg.sender][_token].borrowed -= amount;
        
        return amount;
    }
    
    // Get borrow limit for user
    function getBorrowLimit(address user) external view returns (uint256) {
        uint256 supplied = positions[user][address(token)].supplied;
        return (supplied * 80) / 100; // 80% LTV
    }
    
    // Get health factor (>1 = safe, <1 = liquidation risk)
    function getHealthFactor(address user) external view returns (uint256) {
        uint256 supplied = positions[user][address(token)].supplied;
        uint256 borrowed = positions[user][address(token)].borrowed;
        
        if (borrowed == 0) {
            return type(uint256).max; // No debt = infinite health factor
        }
        
        // Health factor = (collateral * LTV) / debt
        // Return as basis points (10000 = 1.0)
        uint256 collateralValue = (supplied * 80) / 100;
        return (collateralValue * 10000) / borrowed;
    }
    
    // Helper function to get user position
    function getPosition(address user, address _token) external view returns (uint256 supplied, uint256 borrowed) {
        UserPosition memory position = positions[user][_token];
        return (position.supplied, position.borrowed);
    }
}
