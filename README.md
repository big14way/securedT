# SecuredTransfer – RWA Invoice Factoring on Mantle Network

> Tokenizing real-world invoices as tradable NFTs with instant liquidity through blockchain-based escrow and compliance on **Mantle Network's ultra-low-cost Layer 2**.

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
┌──────────────────────────────────────────────────────────────────────┐
│                  SECUREDTRANSFER ARCHITECTURE                        │
└──────────────────────────────────────────────────────────────────────┘

                     ┌─────────────────────┐
                     │       USER          │
                     │  (Buyer / Seller)   │
                     └──────────┬──────────┘
                                │
                                │ Connect Wallet
                                │ Create/Manage Escrows
                                ▼
              ┌──────────────────────────────────────┐
              │     NEXT.JS WEB APPLICATION          │
              │  ┌────────────────────────────────┐  │
              │  │  • Create Escrow Form          │  │
              │  │  • My Escrows Dashboard        │  │
              │  │  • Escrow Details & Actions    │  │
              │  └────────────────────────────────┘  │
              │                                      │
              │  ┌────────────────────────────────┐  │
              │  │  Viem + Dynamic SDK            │  │
              │  │  (Wallet Integration Layer)    │  │
              │  └────────────────────────────────┘  │
              └───────────────┬──────────────────────┘
                              │
                              │ Transaction Signing
                              │ Contract Interactions
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ETHEREUM BLOCKCHAIN (Sepolia/Mainnet)             │
│                                                                     │
│  ┌──────────────────┐         ┌────────────────────────────────-─┐  │
│  │  USDT TOKEN      │────────▶│    SECUREDTRANSFERCONTRACT.SOL   |  │
│  │  (ERC-20)        │ approve │                                  │  │
│  │                  │ transfer│  • deposit() - Create Escrow     │  │
│  └──────────────────┘         │  • release() - Complete Payment  │  │
│                                │  • refund() - Cancel & Refund   │  │
│                                │  • markFraud() - Flag Fraud     │  │
│                                └────────┬────────────────────────┘  │
│                                         │                           │
│                                         │ Oracle Fraud Check        │
│                                         │ (via IFraudOracle)        │
│                                         ▼                           │
│                                ┌─────────────────────────────────┐  │
│                                │  SIMPLEFRAUDORACLE.SOL          │  │
│                                │  (Modular & Upgradeable)        │  │
│                                │                                 │  │
│                                │  • Hardhat deployed             |  |
│                                │  • Blacklist Management         │  │
│                                │  • Transaction Limits           │  │
│                                │  • Manual Fraud Flagging        │  │
│                                │                                 │  │
│                                │  ⚠️ Maintained by External      │  │
│                                │     Authority - Swappable       │  │
│                                └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Event Emission
                              │ (Deposited, Released, Refunded, etc.)
                              ▼
              ┌──────────────────────────────────────┐
              │   BLOCKSCOUT EXPLORER & SDK          │
              │                                      │
              │  • Real-time Transaction Monitoring  │
              │  • Event Logs & Audit Trail          │
              │  • Public Oracle Verification        │
              └──────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════
KEY ARCHITECTURAL PIECES
═══════════════════════════════════════════════════════════════════════

   → Oracle implements IFraudOracle interface for standardization
   → Can be swapped without redeploying main payment contract
   → Maintained independently by deploying authority

```

---

## Features

* **USDT Escrow** – Secure smart contract holds buyer funds until completion
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

- **SecuredTransferContract:** [`0xb8a1446e1a9feb78c0e83196cda8366a53df5376`](https://explorer.sepolia.mantle.xyz/address/0xb8a1446e1a9feb78c0e83196cda8366a53df5376)
- **ComplianceOracle:** [`0x45e774cbd5877770bde1324347fc978939c884a3`](https://explorer.sepolia.mantle.xyz/address/0x45e774cbd5877770bde1324347fc978939c884a3)
- **InvoiceNFT (RWA):** [`0x71f43c6c9598369f94dbd162dadb24c3d8df675c`](https://explorer.sepolia.mantle.xyz/address/0x71f43c6c9598369f94dbd162dadb24c3d8df675c)
- **Network:** Mantle Sepolia Testnet (Chain ID: 5003)
- **Deployed:** 2025-11-24

### Contract Verification

All contracts are deployed and can be verified on [Mantle Sepolia Explorer](https://explorer.sepolia.mantle.xyz). The source code is available in the `/contracts/contracts` directory.

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
