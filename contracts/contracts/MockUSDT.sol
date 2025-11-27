// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @dev Mock USDT token for testing on Mantle Sepolia Testnet
 * Anyone can mint tokens for testing purposes
 */
contract MockUSDT is ERC20, Ownable {

    uint8 private _decimals = 6; // USDT has 6 decimals

    constructor() ERC20("Mock USDT", "USDT") Ownable(msg.sender) {
        // Mint initial supply to deployer for distribution
        _mint(msg.sender, 1000000 * 10**6); // 1M USDT
    }

    /**
     * @dev Returns the number of decimals (6 for USDT)
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mint tokens - anyone can call this for testing
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in smallest unit, 6 decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Faucet function - gives 1000 USDT to caller
     * Anyone can call this to get test tokens
     */
    function faucet() external {
        _mint(msg.sender, 1000 * 10**6); // 1000 USDT
    }
}
