# Contract Addresses for mETH Integration

## Mantle Network

### mETH Protocol
- **mETH Token (Ethereum L1)**: `0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa`
- **mETH Token (Mantle L2)**: `0xcDA86A272531e8640cD7F1a92c01839911B90bb0`
- **cmETH Token**: `0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA` (Available on Ethereum and Mantle)

### Staking
- **Minimum Stake**: 0.02 ETH
- **Minimum Unstake**: 0.01 ETH
- **Unstaking Time**: ~4 days (minimum 12 hours)
- **APY**: ~7.2% (varies)

**Important**: mETH Protocol staking occurs on Ethereum L1. To use on Mantle L2, you need to:
1. Stake ETH on L1 to receive mETH
2. Bridge mETH from L1 to Mantle L2 using canonical bridge

### Agni Finance (DEX on Mantle)
- **Swap Router**: `0x319b69888b0d11cec22caa5034e25fffbdc88421`
- **Network**: Mantle Mainnet (Chain ID: 5000)
- **DEX Type**: Uniswap V3 fork with concentrated liquidity

### USDT on Mantle
- **Mainnet**: `0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE`
- **Decimals**: 6

### Wrapped MNT (WMNT)
- **Mantle Sepolia**: `0x19f5557E23e9914A18239990f6C70D68FDF0deD5`

## Integration Notes

### For YieldEscrow Contract:

```solidity
// Constructor parameters for Mantle Mainnet:
constructor(
    address _stablecoin,    // 0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE (USDT)
    address _mETH,          // 0xcDA86A272531e8640cD7F1a92c01839911B90bb0 (mETH L2)
    address _mETHProtocol,  // 0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa (Staking L1)
    address _agniRouter,    // 0x319b69888b0d11cec22caa5034e25fffbdc88421 (Agni Router)
    address _platformWallet // Your platform fee recipient
)
```

### Cross-Chain Considerations:

**Challenge**: mETH Protocol staking happens on Ethereum L1, but we're on Mantle L2.

**Solution Options**:

1. **Option A: Direct mETH Trading** (Simplest)
   - Skip the staking step
   - Swap USDT → ETH → mETH on Mantle L2
   - Hold mETH during escrow (it still accrues value)
   - Swap mETH → ETH → USDT on release

2. **Option B: L1 Bridge Integration** (Full staking)
   - Bridge funds from L2 to L1
   - Stake on L1 mETH Protocol
   - Bridge mETH back to L2
   - Requires bridging costs and time

3. **Option C: cmETH on Mantle** (Recommended)
   - Use cmETH which is available on Mantle L2
   - Address: `0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA`
   - Includes mETH rewards + restaking rewards
   - No L1 bridge needed

### Agni Finance Swap Integration:

```solidity
// Swap USDT → ETH
IAgniRouter(agniRouter).swapExactTokensForETH(
    usdtAmount,
    amountOutMin,
    [USDT_ADDRESS, WETH_ADDRESS],
    address(this),
    deadline
);

// Swap ETH → USDT
IAgniRouter(agniRouter).swapExactETHForTokens{value: ethAmount}(
    amountOutMin,
    [WETH_ADDRESS, USDT_ADDRESS],
    address(this),
    deadline
);
```

### Resources:

- **mETH Protocol**: https://www.methprotocol.xyz/
- **mETH Docs**: https://docs.mantle.xyz/meth
- **Agni Finance**: https://agni.finance/
- **Mantle Bridge**: https://bridge.mantle.xyz/
- **Mantle Explorer**: https://mantlescan.xyz/

## Deployment Checklist:

- [ ] Get WMNT address for network
- [ ] Test Agni Router swaps with small amounts
- [ ] Decide: Direct mETH holding vs full L1 staking vs cmETH
- [ ] Update YieldEscrow.sol swap functions with real implementation
- [ ] Test full flow: USDT → mETH → hold → mETH → USDT
- [ ] Deploy ComplianceOracle and InvoiceNFT first
- [ ] Deploy YieldEscrow with correct addresses
- [ ] Verify contracts on Mantlescan
- [ ] Update frontend with NEXT_PUBLIC_YIELD_ESCROW_ADDRESS
