// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IMETHProtocol
 * @dev Interface for Mantle's cmETH (Composable mETH) on L2
 * @notice Using cmETH instead of L1 mETH to avoid bridge complexity
 * cmETH is 1:1 with mETH and includes restaking rewards
 * Documentation: https://docs.mantle.xyz/meth
 * cmETH Address: 0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA
 */
interface IMETHProtocol {
    // Note: For production, we use cmETH as ERC20 token
    // cmETH is already deployed on Mantle L2 and accrues value like mETH
    // No staking/unstaking functions needed - we just hold cmETH
    
    /**
     * @dev Get current cmETH to ETH exchange rate (inherited from mETH)
     * @notice cmETH accumulates value over time from staking + restaking rewards
     * @return rate Exchange rate (1e18 = 1:1 initially, increases over time)
     */
    function mETHToETH() external view returns (uint256 rate);
}

/**
 * @title ICMETHToken
 * @dev Interface for cmETH ERC20 token on Mantle L2
 * @notice cmETH is 1:1 with mETH and includes additional restaking rewards
 * Address: 0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA
 */
interface ICMETHToken {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * @title IAgniRouter
 * @dev Interface for Agni Finance DEX on Mantle Network (Uniswap V3 fork)
 * @notice Used for USDT <-> ETH <-> cmETH swaps
 * Router Address: 0x319b69888b0d11cec22caa5034e25fffbdc88421
 */
interface IAgniRouter {
    /**
     * @dev Swap exact tokens for ETH
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum amount of ETH to receive (slippage protection)
     * @param path Array of token addresses for swap path
     * @param to Recipient address
     * @param deadline Transaction deadline timestamp
     * @return amounts Array of amounts for each step in the path
     */
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
    
    /**
     * @dev Swap exact ETH for tokens
     * @param amountOutMin Minimum amount of tokens to receive
     * @param path Array of token addresses for swap path
     * @param to Recipient address
     * @param deadline Transaction deadline timestamp
     * @return amounts Array of amounts for each step in the path
     */
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);
    
    /**
     * @dev Swap exact tokens for tokens
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum amount of output tokens
     * @param path Array of token addresses for swap path
     * @param to Recipient address
     * @param deadline Transaction deadline timestamp
     * @return amounts Array of amounts for each step in the path
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
    
    /**
     * @dev Get amounts out for a given input amount and path
     * @param amountIn Input amount
     * @param path Swap path
     * @return amounts Expected output amounts
     */
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);
    
    /**
     * @dev Get WETH address used by the router
     * @return WETH contract address
     */
    function WETH() external view returns (address);
}
