# SecuredTransfer – RWA Invoice Factoring on Mantle Network

> Tokenizing real-world invoices as tradable NFTs with instant liquidity through blockchain-based escrow and compliance on **Mantle Network's ultra-low-cost Layer 2**.

## 🚀 Live Demo

**Production:** [https://online25-main-num51dbzs-big14ways-projects.vercel.app](https://online25-main-num51dbzs-big14ways-projects.vercel.app)

**GitHub Repository:** [https://github.com/big14way/securedT](https://github.com/big14way/securedT)

**Network:** Mantle Sepolia Testnet (Chain ID: 5003)

### Quick Start
1. Visit the live demo
2. Connect your wallet (MetaMask, Coinbase, or 300+ via WalletConnect)
3. Get testnet MNT from [Mantle Faucet](https://faucet.sepolia.mantle.xyz/)
4. Get testnet USDT from our built-in faucet
5. Create your first escrow or explore the marketplace!

## The Problem

**Traditional Invoice Factoring** has high fees (2-5%), centralized approval, slow processing (days to weeks), and high minimums ($100k+). **Crypto Payments** lack buyer protection and compliance integration.

**SecuredTransfer** is a decentralized invoice factoring platform on **Mantle Network** that tokenizes invoices as ERC-721 NFTs for instant liquidity. Using **USDT** stablecoin and compliance oracles, SecuredTransfer enables:

**💰 Invoice Tokenization & Factoring (RWA)**
- Automatic ERC-721 NFT minting for every escrow
- Trade invoices on marketplace at discounted prices
- Instant liquidity for sellers (sell $1000 invoice for $950)
- ROI opportunities for buyers (earn from discounts)

**🛡️ Compliance & Security**
- KYC/AML integration with 4-level verification system
- Transaction limits based on KYC level ($1k to $1M)
- Automatic fraud detection and blacklist management
- Buyer protection with escrow and refund capabilities

**💵 Ultra-Low Cost on Mantle Network**
- Escrow creation: ~$0.10 (vs $10-20 on Ethereum L1)
- 99% cost reduction compared to Ethereum Layer 1
- 0.1-0.5% platform costs vs 2-5% traditional factoring fees
- Gas fees: ~0.02 gwei on Mantle vs 20-50 gwei on Ethereum

**📈 Real-World Asset Benefits**
- Any invoice size (no $100k minimums)
- Instant settlement (seconds vs weeks)
- Transparent on-chain trading
- OpenSea compatible NFTs

## How Invoice Factoring Works

**Traditional Flow (30-day wait):**
Seller delivers → Buyer pays in 30 days → Seller waits for payment

**With SecuredTransfer:**
1. Buyer creates escrow with USDT → Invoice NFT auto-minted to seller
2. Seller lists invoice on marketplace at discount (e.g., $950 for $1000 invoice)
3. Factoring buyer purchases invoice → Seller receives $950 immediately  
4. Original buyer releases escrow → Factoring buyer receives $1000
5. **Everyone wins**: Seller gets instant liquidity, factoring buyer earns 5% ROI

**Key Components:**
- **SecuredTransferContract** - USDT escrow with compliance checks
- **InvoiceNFT** - ERC-721 tokens representing invoices
- **ComplianceOracle** - KYC/AML verification and risk scoring
- **Marketplace** - Trade invoices with transparent pricing

## System Architecture & User Flow

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       SECUREDTRANSFER COMPLETE ARCHITECTURE                      │
│                           (Mantle Network Layer 2)                               │
└──────────────────────────────────────────────────────────────────────────────────┘

                            ┌─────────────────────┐
                            │       USER          │
                            │  (Buyer / Seller)   │
                            └──────────┬──────────┘
                                       │
                                       │ WalletConnect v2
                                       │ MetaMask / Coinbase / 300+ Wallets
                                       ▼
                   ┌─────────────────────────────────────────────┐
                   │       NEXT.JS 14 WEB APPLICATION            │
                   │  ┌───────────────────────────────────────┐  │
                   │  │  PAGES & FEATURES                     │  │
                   │  │  • /escrow - Create & Manage Escrows  │  │
                   │  │  • /my-escrows - User Dashboard       │  │
                   │  │  • /marketplace - Invoice Trading     │  │
                   │  │  • /yield - cmETH Yield Escrows       │  │
                   │  │  • /collateral - INIT Capital Loans   │  │
                   │  │  • /compliance - KYC Verification     │  │
                   │  │  • /tutorials - Working Capital Guide │  │
                   │  └───────────────────────────────────────┘  │
                   │  ┌───────────────────────────────────────┐  │
                   │  │  INTEGRATIONS                         │  │
                   │  │  • Viem + Wagmi (Web3 Layer)          │  │
                   │  │  • Dynamic SDK (Wallet Management)    │  │
                   │  │  • Ant Design (UI Components)         │  │
                   │  └───────────────────────────────────────┘  │
                   └──────────────────┬──────────────────────────┘
                                      │
                                      │ Contract Calls via Viem
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      MANTLE NETWORK (Layer 2) - Chain ID 5003                    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        CORE ESCROW SYSTEM                               │    │
│  │                                                                         │    │
│  │  ┌──────────────────┐      ┌─────────────────────────────────────┐     │    │
│  │  │  USDT TOKEN      │─────▶│   SecuredTransferContract.sol       │     │    │
│  │  │  (ERC-20)        │approve│   0xb8a1446e1a9feb78c0e83196...     │     │    │
│  │  │  0x201EBa5C...   │      │                                     │     │    │
│  │  └──────────────────┘      │  • deposit() - Create Escrow        │     │    │
│  │                             │  • release() - Complete Payment     │     │    │
│  │  ┌──────────────────┐      │  • refund() - Cancel & Return       │     │    │
│  │  │  InvoiceNFT      │◀─────│  • markFraud() - Flag Fraud         │     │    │
│  │  │  (ERC-721)       │mints │  • Compliance Checks                │     │    │
│  │  │  0x71f43c6c...   │      │  • NFT Integration                  │     │    │
│  │  └──────────────────┘      └────────┬───────────────────┬────────┘     │    │
│  │         │                            │                   │              │    │
│  │         │ OpenSea Compatible         │ Compliance        │ Fraud Check  │    │
│  │         │ Tradable on Marketplaces   │ Verification      │              │    │
│  │         ▼                            ▼                   ▼              │    │
│  │  ┌──────────────────┐      ┌─────────────────┐  ┌────────────────┐     │    │
│  │  │  Invoice         │      │ ComplianceOracle│  │ SimpleFraud    │     │    │
│  │  │  Marketplace     │      │  0x45e774cbd... │  │ Oracle         │     │    │
│  │  │                  │      │                 │  │                │     │    │
│  │  │  • List Invoices │      │  • KYC (4 lvls) │  │  • Blacklist   │     │    │
│  │  │  • Buy Discounted│      │  • AML Scoring  │  │  • Flagging    │     │    │
│  │  │  • Instant $     │      │  • Tx Limits    │  │  • Manual      │     │    │
│  │  └──────────────────┘      └─────────────────┘  └────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        YIELD GENERATION SYSTEM                          │    │
│  │                                                                         │    │
│  │  ┌──────────────────┐      ┌─────────────────────────────────────┐     │    │
│  │  │  cmETH           │◀─────│   YieldEscrow.sol                   │     │    │
│  │  │  (Liquid Staking)│ swap │   (Extends SecuredTransferContract) │     │    │
│  │  │  0xE6829d9a...   │      │                                     │     │    │
│  │  │  ~7.2% APY       │      │  • depositWithYield() - Auto Swap   │     │    │
│  │  └─────────┬────────┘      │  • releaseWithYield() - Split Yield │     │    │
│  │            │                │  • claimYield() - Claim Earnings    │     │    │
│  │            │ Agni Finance   └─────────────────────────────────────┘     │    │
│  │            │ DEX Swaps                                                  │    │
│  │            ▼                                                             │    │
│  │  ┌──────────────────┐      Yield Distribution:                          │    │
│  │  │  Agni Finance    │      • Buyer: 80%                                 │    │
│  │  │  Router          │      • Seller: 15%                                │    │
│  │  │  0x319b6988...   │      • Platform: 5%                               │    │
│  │  │                  │                                                   │    │
│  │  │  USDT ↔ cmETH    │      Path: USDT → WMNT → cmETH                   │    │
│  │  └──────────────────┘                                                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    COLLATERAL & LENDING SYSTEM                          │    │
│  │                                                                         │    │
│  │  ┌──────────────────┐      ┌─────────────────────────────────────┐     │    │
│  │  │  INIT Capital    │◀─────│   CollateralEscrow.sol              │     │    │
│  │  │  (Lending Pool)  │supply│   0xc8fcb1d31202...                 │     │    │
│  │  │  0xb069ca22...   │      │   (Extends SecuredTransferContract) │     │    │
│  │  │  (Mock/Testnet)  │      │                                     │     │    │
│  │  └─────────┬────────┘      │  • depositAsCollateral() - Lock     │     │    │
│  │            │                │  • borrowAgainstEscrow() - 80% LTV  │     │    │
│  │            │ Borrow/Repay   │  • repayBorrowed() - Track Debt     │     │    │
│  │            │                │  • releaseWithCollateral() - Unwind │     │    │
│  │            │                │  • getBorrowLimit() - Calculate     │     │    │
│  │            ▼                └─────────────────────────────────────┘     │    │
│  │  ┌──────────────────┐                                                   │    │
│  │  │  Working Capital │      Use Case: Freelancer Working Capital         │    │
│  │  │  for Freelancers │      1. Client creates $10k escrow               │    │
│  │  │                  │      2. Freelancer deposits as collateral         │    │
│  │  │  • Equipment     │      3. Borrows $8k (80% LTV) for expenses        │    │
│  │  │  • Outsourcing   │      4. Completes work, repays loan               │    │
│  │  │  • Early Access  │      5. Receives full $10k payment                │    │
│  │  └──────────────────┘                                                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│                                      │ Events & Logs                             │
│                                      ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                      MANTLE EXPLORER & TRANSPARENCY                     │    │
│  │                                                                         │    │
│  │  • Real-time Transaction Monitoring                                    │    │
│  │  • Event Logs (Deposited, Released, InvoiceMinted, etc.)              │    │
│  │  • Contract Verification & Source Code                                 │    │
│  │  • Public Audit Trail                                                  │    │
│  │  • https://explorer.sepolia.mantle.xyz                                 │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════
KEY ARCHITECTURAL COMPONENTS
═══════════════════════════════════════════════════════════════════════════════════

✅ DEPLOYED & TESTED CONTRACTS (Mantle Sepolia):

1. **SecuredTransferContract** - [`0xb07ce703ce01370660d12c963cde0785627ee789`](https://explorer.sepolia.mantle.xyz/address/0xb07ce703ce01370660d12c963cde0785627ee789)
   - Core escrow logic with USDT
   - Compliance integration
   - Invoice NFT auto-minting
   - Fraud detection hooks
   - **Status:** ✅ Live & Production Ready

2. **InvoiceNFT** - [`0x71f43c6c9598369f94dbd162dadb24c3d8df675c`](https://explorer.sepolia.mantle.xyz/address/0x71f43c6c9598369f94dbd162dadb24c3d8df675c)
   - ERC-721 tokens for invoices
   - OpenSea compatible
   - Tradable on marketplaces
   - Automatic minting/burning
   - **Status:** ✅ Minting Working (Token #1 Created)

3. **ComplianceOracle** - [`0x45e774cbd5877770bde1324347fc978939c884a3`](https://explorer.sepolia.mantle.xyz/address/0x45e774cbd5877770bde1324347fc978939c884a3)
   - 4-level KYC verification
   - AML risk scoring (0-100)
   - Transaction limits ($1k-$1M)
   - Blacklist management
   - **Status:** ✅ Live & Integrated

4. **YieldEscrow** - [`0xdbbe162c7adeec7bb4fe2745b42fcc8b2aba5933`](https://explorer.sepolia.mantle.xyz/address/0xdbbe162c7adeec7bb4fe2745b42fcc8b2aba5933)
   - cmETH integration for 7.2% APY
   - Agni Finance DEX swaps
   - Yield distribution (80/15/5)
   - No unstaking delays
   - **Status:** ⚠️ Disabled on Testnet (Requires Mainnet DeFi Protocols)

5. **CollateralEscrow** - [`0xc8fcb1d31202f2b75cea0ca70d8e00b96c24e296`](https://explorer.sepolia.mantle.xyz/address/0xc8fcb1d31202f2b75cea0ca70d8e00b96c24e296)
   - 80% Loan-to-Value ratio
   - INIT Capital integration
   - Working capital financing
   - Automatic collateral unwinding
   - 33 comprehensive tests (>90% coverage)
   - **Status:** ✅ Live & Tested

🔧 FRONTEND INTEGRATION STATUS:

✅ Fully Integrated Pages:
   • **/escrow** - Create & manage escrows (0xb07ce703ce01370660d12c963cde0785627ee789)
   • **/my-escrows** - User dashboard with real-time blockchain data
   • **/marketplace** - Invoice NFT trading (0x71f43c6c9598369f94dbd162dadb24c3d8df675c)
   • **/invoices** - Seller dashboard to list Invoice NFTs for sale (NEW!)
   • **/compliance** - KYC verification (0x45e774cbd5877770bde1324347fc978939c884a3)
   • **/collateral** - Working capital dashboard
   • **/yield** - cmETH yield interface (disabled on testnet)
   • **/tutorials** - Working capital educational content

📝 Invoice Marketplace Workflow:
   1. Buyer creates escrow → Invoice NFT automatically minted to seller
   2. Seller visits **/invoices** page → Lists invoice with discount (e.g. 10%)
   3. Buyers browse **/marketplace** → Purchase discounted invoices
   4. Seller receives payment immediately → Buyer receives full amount on escrow release

**Transaction Proof:**
   - Contract Link: TX `0x862ceaa05f6ef3b84b8e73402bcd107db8cd27cfba4045f4827563dad4f5da17`
   - First Invoice NFT Minted: Token #1 for Escrow #10007 (300 USDT)

⚙️ TECHNICAL INTEGRATIONS:
   • WalletConnect v2 - Multi-wallet support (300+ wallets)
   • Viem & Wagmi - Type-safe contract interactions
   • Dynamic SDK - Seamless wallet management
   • Ant Design - Polished UI/UX

🔐 SECURITY & COMPLIANCE:
   • ReentrancyGuard on all state-changing functions
   • Access control modifiers (onlyBuyer, onlyOracle)
   • Input validation and bounds checking
   • Automatic fraud refunds
   • Event emissions for transparency
   • OpenZeppelin battle-tested contracts

📊 TESTING & VERIFICATION:
   • CollateralEscrow: 33 tests, >90% coverage
   • YieldEscrow: Comprehensive test suite
   • All contracts compiled with Solidity 0.8.28
   • Deployed to Mantle Sepolia testnet
   • Verified on Mantle Explorer

```

---

## Features

* **USDT Escrow** – Secure smart contract holds buyer funds until completion
* **cmETH Yield Generation (NEW!)** – Optional 7.2% APY on escrowed funds via Mantle's cmETH on L2
* **Invoice Tokenization (RWA)** – ERC-721 NFTs representing invoices for trading and factoring
* **Invoice Marketplace** – Buy and sell tokenized invoices at discounted prices
* **Invoice Factoring** – Instant liquidity by selling invoices before payment due date
* **Compliance & KYC/AML** – 4-level verification system with transaction limits ($1k to $1M)
* **Automated Fraud Detection** – Real-time checks with automatic buyer refunds
* **Multi-Wallet Support** – Dynamic wallet connection (MetaMask, Coinbase, WalletConnect, etc.)
* **Complete Audit Trail** – All actions emit on-chain events viewable on Mantle Explorer

---

## Tech Stack

**Frontend:** Next.js 14, Ant Design, Viem, Wagmi, Dynamic Wallet SDK

**Wallet Integration:** WalletConnect v2, MetaMask, Coinbase Wallet, Rabby, and 300+ wallets

**Smart Contracts:** Solidity ^0.8.28, Hardhat, OpenZeppelin, ERC-721, ERC-20

**Blockchain:** Mantle Network (L2)
- **Mantle Mainnet** (Chain ID: 5000)
- **Mantle Sepolia Testnet** (Chain ID: 5003)

**Stablecoin:** USDT on Mantle
- Mainnet: `0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE`
- Alternative: USDC `0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9`

**DeFi Integration:**
- **cmETH (Composable mETH)** - Mantle's liquid staking token on L2 (~7.2% APY)
- **Agni Finance** - DEX for USDT ↔ cmETH swaps (via WMNT)

---

## cmETH Yield Generation (DeFi Track)

SecuredTransfer now integrates **Mantle's cmETH (Composable mETH)** for optional yield generation on escrowed funds - all on Layer 2!

### How It Works

1. **Enable Yield** - When creating an escrow, toggle "Enable Yield Generation"
2. **Automatic Swap** - Your USDT is swapped to cmETH via Agni Finance DEX
3. **Earn 7.2% APY** - cmETH accumulates value from Ethereum staking + restaking rewards
4. **Yield Distribution** - When released, yield is split:
   - **80% to Buyer** - You paid, you earn most
   - **15% to Seller** - Bonus for accepting yield escrow
   - **5% to Platform** - Covers gas and maintenance

### Example: $10,000 Escrow for 30 Days

```
Initial Deposit: $10,000 USDT
→ Swapped to cmETH via Agni Finance (USDT → WMNT → cmETH)
→ Held in cmETH (accrues value automatically)
→ Earns 7.2% APY (staking + restaking rewards)

After 30 days:
Total Value: $10,059.18
Yield: $59.18

Distribution:
- Buyer receives: $47.34 (80%)
- Seller receives: $10,008.88 ($10k + 15%)
- Platform: $2.96 (5%)
```

### Key Features

- ✅ **Instant Swaps** - No staking delays, swap USDT → cmETH immediately
- ⚡ **Instant Withdrawals** - No unstaking period! Swap cmETH → USDT anytime
- 🔒 **cmETH Security** - Backed by mETH (Ethereum 2.0 validators) + restaking rewards
- 📊 **Real-Time Tracking** - View accrued yield in dashboard
- 🎯 **Opt-In** - Traditional escrow still available without yield
- 🌉 **No Bridge Required** - Everything happens on Mantle L2

### Important Notes

**No Unstaking Delay:**  
Unlike L1 mETH which requires 12-40 hour unstaking, cmETH can be swapped back to USDT instantly via Agni Finance. Perfect for escrow use cases!

**Swap Path:**
- **Deposit:** USDT → WMNT → cmETH (3-hop swap via Agni Finance)
- **Withdrawal:** cmETH → WMNT → USDT (reverse swap)
- **Slippage:** 1% tolerance for price protection

**Exchange Rate:**  
cmETH is value-accumulating (same as mETH). 1 cmETH ≠ 1 ETH, but appreciates over time as staking + restaking rewards accrue.

**Risk Disclosure:**  
cmETH carries the same risks as mETH (Ethereum staking + Aave) plus additional Agni Finance DEX risks. Only enable yield if comfortable with DeFi protocols.

### Resources

- **cmETH Address**: `0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA`
- **Agni Finance**: https://agni.finance/
- **mETH Documentation**: https://docs.mantle.xyz/meth
- **APY Stats**: https://www.methprotocol.xyz/

---

## Wallet Integration

SecuredTransfer uses **WalletConnect v2** protocol integrated through Dynamic SDK for universal wallet support:

### Supported Wallets
- 🦊 **MetaMask** - Browser extension and mobile
- 🔵 **Coinbase Wallet** - Self-custodial wallet
- 🔌 **WalletConnect** - 300+ compatible wallets
- 🐰 **Rabby** - Multi-chain wallet
- And many more through WalletConnect protocol

### Key Features
- **One-Click Connection** - Connect with any wallet instantly
- **Multi-Chain Support** - Seamlessly switch between Mantle Mainnet and Sepolia Testnet
- **Mobile Compatible** - Works with mobile wallets via WalletConnect QR codes
- **Auto Network Switching** - Automatically prompts to switch to Mantle Network
- **Session Persistence** - Stay connected across page refreshes

### WalletConnect Configuration
The project is configured with WalletConnect Project ID: `1eebe528ca0ce94a99ceaa2e915058d7`

To customize or get your own project ID:
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID
4. Update `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `.env`

### Network Configuration
- **Mantle Mainnet** (Chain ID: 5000)
  - RPC: `https://rpc.mantle.xyz`
  - Explorer: `https://explorer.mantle.xyz`

- **Mantle Sepolia Testnet** (Chain ID: 5003)
  - RPC: `https://rpc.sepolia.mantle.xyz`
  - Explorer: `https://explorer.sepolia.mantle.xyz`

---

## How It Works

### SecuredTransferContract Flow

1. **Create Escrow** - Buyer approves USDT → calls `deposit()` → contract transfers funds and creates escrow → **mints Invoice NFT to seller** → oracle checks compliance/fraud → if flagged: auto-refund + revert, if clean: escrow created with tradable invoice NFT

2. **Transaction Outcomes**
   - **Normal**: Buyer or invoice NFT owner calls `release()` → funds sent to current invoice owner (enabling factoring) → invoice NFT burned
   - **Dispute**: Buyer calls `refund()` → funds returned to buyer → invoice NFT burned
   - **Fraud**: Oracle calls `markFraud()` → automatic buyer refund → invoice NFT burned

3. **Invoice Trading** (RWA Feature)
   - Seller lists invoice NFT on marketplace at discount price (e.g., $950 for $1000 invoice)
   - Buyer purchases discounted invoice → pays seller immediately
   - New invoice owner receives full amount when escrow is released
   - Enables invoice factoring and early payment liquidity

3. **Compliance Oracle** - KYC/AML verification, risk scoring, transaction limits, blacklist management

4. **Event Transparency** - All actions emit indexed events (`Deposited`, `Released`, `Refunded`, `InvoiceMinted`) viewable on Mantle Explorer

## Compliance Oracle Architecture

### ComplianceOracle Features

- **KYC Verification** - 4-level system (None, Basic, Advanced, Institutional)
- **Transaction Limits** - $1k to $1M based on KYC level
- **AML Risk Scoring** - 0-100 score with automatic flagging above 80
- **Blacklist Management** - Block fraudulent addresses
- **Compliance Checks** - Automatic validation on every escrow creation
- **Fraud Detection** - Automatic refunds for high-risk transactions

### Integration

- ComplianceOracle integrated with SecuredTransferContract via `IComplianceOracle` interface
- Oracle checks run during `deposit()` - flagged transactions automatically refunded
- Oracle failures handled gracefully - escrows proceed if oracle unavailable
- All compliance decisions auditable on-chain

## Why This Can Be Trusted

**Open Source & Auditable** - Smart contracts are fully deployed and verifiable on Mantle Explorer with complete source code.

**Automated Protection** - Funds are only released or refunded based on on-chain logic and compliance oracle attestations, not arbitrary admin decisions.

**Transparent Events** - Every action emits an on-chain event for public verification. All compliance decisions are auditable.

**Stablecoin Security** - USDT (Tether) is a widely-used stablecoin with 6 decimal precision, ensuring predictable settlement.

**ERC-721 Standard** - Invoice NFTs are standard ERC-721 tokens, compatible with OpenSea and all NFT marketplaces.

Users trust the immutable contract code and transparent on-chain operations.

---

## Deployed Contracts (Mantle Sepolia Testnet)

### Core Escrow System
- **SecuredTransferContract:** [`0xb07ce703ce01370660d12c963cde0785627ee789`](https://explorer.sepolia.mantle.xyz/address/0xb07ce703ce01370660d12c963cde0785627ee789)
  - Deployment: 2025-11-27 (Latest)
  - Tx: [View on Explorer](https://explorer.sepolia.mantle.xyz/address/0xb07ce703ce01370660d12c963cde0785627ee789)
  - Features: USDT escrow, compliance checks, invoice NFT auto-minting
  - Status: ✅ **Production Ready** - Invoice minting verified working

- **ComplianceOracle:** [`0x45e774cbd5877770bde1324347fc978939c884a3`](https://explorer.sepolia.mantle.xyz/address/0x45e774cbd5877770bde1324347fc978939c884a3)
  - Deployment: 2025-11-24 22:58:32 UTC
  - Tx: `0xc10a3ab7c4c4d603a827a96983af14d18804f7f0072deefacbbee8964e94626f`
  - Features: 4-level KYC, AML scoring, transaction limits

- **InvoiceNFT (RWA):** [`0x71f43c6c9598369f94dbd162dadb24c3d8df675c`](https://explorer.sepolia.mantle.xyz/address/0x71f43c6c9598369f94dbd162dadb24c3d8df675c)
  - Deployment: 2025-11-24 22:58:32 UTC
  - Tx: `0x5c6606de49b02f0c9f8bbb427446d8dd3c850a02c9d7ece9ee188e4ad59fb4f4`
  - Features: ERC-721 invoices, OpenSea compatible, tradable

### Collateral & Lending System
- **CollateralEscrow:** [`0xc8fcb1d31202f2b75cea0ca70d8e00b96c24e296`](https://explorer.sepolia.mantle.xyz/address/0xc8fcb1d31202f2b75cea0ca70d8e00b96c24e296)
  - Deployment: 2025-11-25 21:57:13 UTC
  - Tx: `0x29507a17492b64381e11acecc4d1d3e1ad5f8363027b9ca7b37dc8258addf105`
  - Features: 80% LTV, INIT Capital integration, working capital financing
  - Test Coverage: 33 tests, >90% coverage

- **MockINITCapital (Testnet):** [`0xb069ca22fb60c76c14a186c70655a42437162c7c`](https://explorer.sepolia.mantle.xyz/address/0xb069ca22fb60c76c14a186c70655a42437162c7c)
  - Deployment: 2025-11-25 21:57:13 UTC
  - Tx: `0x2237b93aac9cbb82180d2581570b2d51df194c6dea99c17c934012714c1da0a6`
  - Purpose: Mock lending protocol for testing (will use real INIT Capital on mainnet)

### Yield Generation System
- **YieldEscrow:** [`0xdbbe162c7adeec7bb4fe2745b42fcc8b2aba5933`](https://explorer.sepolia.mantle.xyz/address/0xdbbe162c7adeec7bb4fe2745b42fcc8b2aba5933)
  - Deployment: 2025-11-26 (Latest)
  - Tx: `0x5b445266c88cd71f0f39e568fea3c9fe9dcf3c47f355f24aed3f38b35e879f70`
  - Features: cmETH integration, 7.2% APY, Agni Finance swaps, yield distribution (80/15/5)
  - Status: ✅ Live and Ready for Testing

### Network Information
- **Network:** Mantle Sepolia Testnet
- **Chain ID:** 5003
- **RPC:** https://rpc.sepolia.mantle.xyz
- **Explorer:** https://explorer.sepolia.mantle.xyz
- **Stablecoin (USDT):** `0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE`

### Contract Verification

All contracts are deployed and verified on [Mantle Sepolia Explorer](https://explorer.sepolia.mantle.xyz). The complete source code is available in the `/contracts/contracts` directory with full test coverage.

---

## Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- MetaMask, Coinbase Wallet, or any WalletConnect-compatible wallet
- Mantle Sepolia testnet MNT for gas fees
- USDT testnet tokens

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/big14way/securedT.git
cd securedT
```

2. **Install frontend dependencies**
```bash
yarn install
```

3. **Install contract dependencies**
```bash
cd contracts
yarn install
```

4. **Set up environment variables**
```bash
# Copy example file
cp .env.example .env

# Configure your environment
NEXT_PUBLIC_CONTRACT_ADDRESS=0xb8a1446e1a9feb78c0e83196cda8366a53df5376
NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS=0x45e774cbd5877770bde1324347fc978939c884a3
NEXT_PUBLIC_INVOICE_NFT_ADDRESS=0x71f43c6c9598369f94dbd162dadb24c3d8df675c
NEXT_PUBLIC_YIELD_ESCROW_ADDRESS=0xdbbe162c7adeec7bb4fe2745b42fcc8b2aba5933
NEXT_PUBLIC_COLLATERAL_ESCROW_ADDRESS=0xc8fcb1d31202f2b75cea0ca70d8e00b96c24e296
NEXT_PUBLIC_NETWORK=testnet # or mainnet
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=1eebe528ca0ce94a99ceaa2e915058d7
NEXT_PUBLIC_DYNAMIC_ENV_ID=your_dynamic_environment_id # Optional
```

5. **Run development server**
```bash
yarn dev
# Open http://localhost:3000
```

### Deployment

#### Deploy Contracts with Fraud Oracle

```bash
cd contracts

# Compile contracts
yarn build

# Deploy to Sepolia testnet with oracle
yarn deploy:with-oracle

# Or deploy to mainnet
yarn deploy:oracle:mainnet
```

The deployment script will output:
- SimpleFraudOracle address
- SecuredTransferContract address
- Environment variables to add to your `.env` file

#### Run Frontend

```bash
# From project root
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

---

## License

MIT License - see LICENSE file for details
