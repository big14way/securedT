# YieldEscrow Contract Updates - cmETH Integration

## Key Changes Made:

### 1. Using cmETH Instead of L1 mETH Staking

**Problem**: Original implementation tried to stake on Ethereum L1 which requires bridging from Mantle L2.

**Solution**: Use cmETH (Composable mETH) which is available on Mantle L2.
- Address: `0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA`
- cmETH is 1:1 pegged with mETH
- Accrues value automatically (staking + restaking rewards)
- No staking/unstaking needed - just hold cmETH
- No L1 bridge required

### 2. Simplified Flow:

```
Original (Complex):
USDT → ETH → Bridge to L1 → Stake for mETH → Bridge back to L2 → Hold → Reverse

New (Simple):
USDT → cmETH → Hold (accrues value) → cmETH → USDT
```

### 3. Real Agni Finance Swap Paths:

**USDT → cmETH:**
```solidity
// Path: USDT → WMNT → cmETH (or direct if pool exists)
path[0] = USDT_ADDRESS;
path[1] = WMNT_ADDRESS;  // 0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8
path[2] = cmETH_ADDRESS; // 0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA
```

**cmETH → USDT:**
```solidity
// Reverse path
path[0] = cmETH_ADDRESS;
path[1] = WMNT_ADDRESS;
path[2] = USDT_ADDRESS;
```

### 4. Contract Constructor Parameters:

```solidity
constructor(
    address _stablecoin,    // 0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE (USDT)
    address _cmETH,         // 0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA (cmETH token)
    address _cmETHProtocol, // 0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA (same, no separate protocol)
    address _agniRouter,    // 0x319b69888b0d11cec22caa5034e25fffbdc88421 (Agni Router)
    address _platformWallet // Platform fee recipient
)
```

### 5. Updated Swap Functions:

**_swapUSDTToCMETH:**
```solidity
function _swapUSDTToCMETH(uint256 usdtAmount) internal returns (uint256 cmETHAmount) {
    // Approve Agni Router
    require(stablecoin.approve(address(agniRouter), usdtAmount), "Approval failed");
    
    // Build swap path
    address[] memory path = new address[](3);
    path[0] = address(stablecoin);  // USDT
    path[1] = agniRouter.WETH();     // WMNT
    path[2] = address(cmETH);        // cmETH
    
    // Get expected output with 1% slippage
    uint256[] memory amountsOut = agniRouter.getAmountsOut(usdtAmount, path);
    uint256 minOut = (amountsOut[amountsOut.length - 1] * 99) / 100;
    
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
```

**_swapCMETHToUSDT:**
```solidity
function _swapCMETHToUSDT(uint256 cmETHAmount) internal returns (uint256 usdtAmount) {
    // Approve Agni Router
    require(cmETH.approve(address(agniRouter), cmETHAmount), "Approval failed");
    
    // Build swap path (reverse)
    address[] memory path = new address[](3);
    path[0] = address(cmETH);        // cmETH
    path[1] = agniRouter.WETH();     // WMNT
    path[2] = address(stablecoin);   // USDT
    
    // Get expected output with 1% slippage
    uint256[] memory amountsOut = agniRouter.getAmountsOut(cmETHAmount, path);
    uint256 minOut = (amountsOut[amountsOut.length - 1] * 99) / 100;
    
    // Execute swap
    uint256[] memory amounts = agniRouter.swapExactTokensForTokens(
        cmETHAmount,
        minOut,
        path,
        address(this),
        block.timestamp + 300
    );
    
    return amounts[amounts.length - 1];
}
```

### 6. Yield Tracking:

Since cmETH accrues value automatically, we track yield by:
1. Record initial cmETH amount when deposited
2. When releasing, check current value of cmETH (it will be higher)
3. Calculate yield = (current value - initial value)
4. Distribute yield according to split (80/15/5)

### 7. No Unstaking Period:

Unlike L1 mETH which requires 12-hour unstaking:
- cmETH can be swapped immediately on Agni Finance
- No waiting period
- Just swap cmETH → USDT and distribute

## Testing Notes:

1. Test on Mantle Sepolia first with small amounts
2. Verify Agni Finance pools exist for USDT/WMNT and WMNT/cmETH
3. Check slippage tolerance (1% may need adjustment)
4. Monitor gas costs for swaps
5. Verify cmETH value accumulation over time

## Deployment Checklist:

- [x] cmETH address configured (0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA)
- [x] Agni Router configured (0x319b69888b0d11cec22caa5034e25fffbdc88421)
- [x] WMNT address configured (0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8)
- [ ] Test USDT → cmETH swap on testnet
- [ ] Test cmETH → USDT swap on testnet
- [ ] Verify yield accumulation calculation
- [ ] Deploy with real addresses
- [ ] Update frontend with NEXT_PUBLIC_YIELD_ESCROW_ADDRESS
