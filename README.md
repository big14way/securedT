# SecuredTransfer – Stablecoin Consumer Protection on Mantle Network

<p align="center">
  <img src="https://raw.githubusercontent.com/cbonoz/online25/refs/heads/main/public/logo.png" alt="SecuredTransfer Logo" width="200"/>
</p>

> Bringing PayPal-like consumer protection to on-chain stablecoin payments using fraud oracles and transparent smart contracts on **Mantle Network's ultra-low-cost Layer 2**.

## The Problem

Traditional payment systems on Web2 offer robust buyer protection and fraud detection, but can often come with high fees (ex: 2-3% per transaction) and centralized control. Meanwhile, Web3 payments offer low costs and transparency but lack consumer protection—once you send crypto, it's gone. Even on Layer 1 chains, gas fees can be prohibitively expensive for everyday transactions.

**SecuredTransfer** is a decentralized escrow platform built on **Mantle Network** that combines the security of traditional payment processors with the ultra-low-cost transparency of Layer 2 blockchain technology. By using **USDT** (Tether stablecoin) and a modular fraud oracle architecture on Mantle's high-performance L2, SecuredTransfer enables:

**🛡️ Enterprise-Grade Fraud Protection at Blockchain Costs**
- Real-time fraud detection during every transaction
- Automatic buyer refunds when fraud is detected
- No payment processing fees—just gas costs

**🔄 Evolving Security Without Contract Redeployment**
- Fraud detection algorithm lives in a separate, upgradeable oracle contract
- New fraud patterns can be detected by simply updating the oracle
- SecuredTransferContract remains immutable while security evolves
- Oracle maintained by specialized fraud detection authorities

**💰 Ultra-Low Cost on Mantle Network**
- Escrow creation: ~$0.10-0.20 (vs $10-20 on Ethereum L1)
- Oracle consultation: ~$0.05-0.10 per escrow
- **99% cost reduction** compared to Ethereum Layer 1
- Compare to: 2-3% fee on a $1,000 transaction = $20-30
- Gas fees: ~0.02 gwei on Mantle vs 20-50 gwei on Ethereum

**⚖️ Transparent Trust Model**
- Oracle address publicly viewable and verifiable
- All fraud decisions logged on-chain with reasons
- Users choose which oracle-enabled contracts to trust
- No black-box algorithms or arbitrary account freezes

## How It Works

SecuredTransfer uses a **oracle pattern** where the payment escrow contract (SecuredTransferContract) consults an external fraud detection oracle (ex: SimpleFraudOracle) through a standardized interface (IFraudOracle). This architectural separation enables:

1. **Immutable Payment Logic** - Core escrow contract never needs updates
2. **Evolving Fraud Detection** - Oracle can be upgraded as new threats emerge
3. **Specialized Expertise** - Fraud detection maintained by security specialists
4. **User Choice** - Different oracles for different risk tolerances
5. **Cost Efficiency** - Single oracle call replaces expensive off-chain verification

The oracle evaluates transactions against blacklists, amount limits, behavioral patterns, and manual flags—returning a simple pass/fail decision. Flagged transactions are automatically refunded, protecting buyers without manual dispute resolution.

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
│  │  PYUSD TOKEN     │────────▶│    SECUREDTRANSFERCONTRACT.SOL   |  │
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

* **PYUSD Escrow** – Secure smart contract holds buyer funds until completion
* **Automated Fraud Detection** – Real-time checks with automatic refunds for flagged transactions
* **Buyer Protection** – Release funds or request refunds with transparent on-chain status
* **Blockscout SDK Integration** – Real-time transaction monitoring and explorer integration
* **Multi-Wallet Support** – Dynamic wallet connection (MetaMask, Coinbase, WalletConnect, etc.)
* **Complete Audit Trail** – All actions emit on-chain events viewable on explorers

---

## Tech Stack

**Frontend:** Next.js 14, Ant Design, Viem, Dynamic Wallet SDK, Mantle Explorer Integration

**Smart Contracts:** Solidity ^0.8.28, Hardhat, OpenZeppelin, Hardhat Ignition

**Blockchain:** Mantle Network (L2)
- **Mantle Mainnet** (Chain ID: 5000)
- **Mantle Sepolia Testnet** (Chain ID: 5003)

**Stablecoin:** USDT on Mantle
- Mainnet: `0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE`
- Alternative: USDC `0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9`

## Technology Partners

SecuredTransfer is built around three key partner technologies: PYUSD, Hardhat, and Blockscout.

**PYUSD** – PayPal's regulated stablecoin serves as the payment rail for all SecuredTransfer escrow transactions. Because it's fully ERC-20 compatible and backed by real-world reserves, it provides the reliability and consumer confidence needed for escrow-based payments.

**PYUSD Integration in SecuredTransfer:**
- **Escrow Currency** – All SecuredTransferContract deposits, releases, and refunds use PYUSD via ERC-20 transferFrom/transfer functions with 6 decimal precision
- **Fraud Detection Amounts** – SimpleFraudOracle validates transaction amounts in PYUSD units (default 5000 PYUSD max) to prevent suspicious large transfers
- **Automatic Network Selection** – SecuredTransfer automatically uses Sepolia PYUSD (0xCaC...bB9) for testnet and Mainnet PYUSD (0x6c3...0e8) based on deployment

**Hardhat** – Used for contract development, deployment, and verification. Hardhat's comprehensive tooling environment made it possible to build a production-ready escrow system with separate oracle architecture.

**Hardhat Integration in SecuredTransfer:**
- **Oracle-Linked Deployment** – Hardhat Ignition's SecuredTransferWithOracle module automatically deploys SimpleFraudOracle then passes its address to SecuredTransferContract's constructor
- **Fraud Scenario Testing** – Test suite validates blacklist checks, amount limits, same-address detection, and escrow state transitions using Hardhat's testing framework
- **Production Deployment** – `yarn deploy:with-oracle` script uses Hardhat to deploy both contracts to Sepolia/Mainnet and outputs addresses for frontend .env configuration

**Blockscout** – Integrated as both a transparency layer and developer tool using the official Blockscout SDK (@blockscout/app-sdk). Every SecuredTransfer action (deposit, fraud attestation, refund, release) emits an event visible through Blockscout's explorer and SDK, making the entire fraud arbitration process publicly auditable.

**Blockscout SDK Integration in SecuredTransfer:**
- **Transaction Monitoring** – useBlockscout hook wraps SDK to show toast notifications for every deposit/release/refund/markFraud transaction with real-time pending→success status updates
- **Contract Transparency** – My Escrows page and Escrow Details page include dedicated buttons that open Blockscout popups showing SecuredTransferContract transaction history filtered by escrow events
- **Oracle Verification** – Fraud oracle addresses are clickable links to Blockscout allowing users to verify SimpleFraudOracle contract code and flagging decisions

SecuredTransfer is designed for independent deployment—each service provider deploys their own SecuredTransferContract instance with their choice of fraud oracle. The public, auditable contract code ensures transparency while the separate oracle design allows upgrading fraud detection without redeploying the payment contract.

SecuredTransfer combines on-chain logic, stablecoin security, and oracle-based fraud detection to create a protection system for consumer payments.

---

## How It Works

### SecuredTransferContract Flow

1. **Create Escrow** - Buyer approves PYUSD → calls `deposit()` → contract transfers funds and creates escrow → oracle checks for fraud (blacklist, amount limits, same-address) → if flagged: auto-refund + revert, if clean: escrow created with ID

2. **Transaction Outcomes**
   - **Normal**: Buyer calls `release()` → funds sent to seller
   - **Dispute**: Buyer calls `refund()` → funds returned to buyer
   - **Fraud**: Oracle calls `markFraud()` → automatic buyer refund

3. **Oracle Controls** - Blacklist management, transaction limits, manual flagging, dispute window configuration

4. **Event Transparency** - All actions emit indexed events (`Deposited`, `Released`, `Refunded`, `FraudFlagged`) viewable on Blockscout/Etherscan

### Blockscout SDK Integration

The Blockscout SDK provides real-time transaction monitoring throughout SecuredTransfer:

- **Toast Notifications** - Instant status updates for all escrow operations (pending → confirmed)
- **Transaction History Popups** - One-click access to contract, wallet, and PYUSD token activity
- **Explorer Links** - Direct integration with Blockscout explorer for detailed transaction views
- **Event Monitoring** - Public audit trail of all escrow events and oracle decisions

## Fraud Oracle Architecture

### IFraudOracle Interface

SecuredTransfer uses a standardized `IFraudOracle` interface with two key functions: `checkEscrow()` (automatic checks during deposit) and `isEscrowFlagged()` (view flagged status). Any contract implementing this interface can serve as a fraud oracle.

### SimpleFraudOracle Implementation

The included `SimpleFraudOracle` performs automatic checks (blacklist verification, amount limits, same-address detection, manual flags) and provides owner controls for blacklist management, transaction limits, and manual flagging.

### Integration & Deployment

- One oracle per SecuredTransferContract deployment (updatable by owner via `updateFraudOracle()`)
- Deploy options: SimpleFraudOracle (`yarn deploy:with-oracle`), custom oracle, third-party API, or multi-sig
- Oracle failures are handled gracefully with `try/catch` - escrows proceed if oracle is unavailable
- Oracle address and all fraud decisions are publicly auditable on-chain

## Why This Can Be Trusted

**Open Source & Auditable** - Smart contracts are fully deployed and verifiable on Blockscout/Etherscan with complete source code.

**Automated Protection** - Funds are only released or refunded based on on-chain logic and oracle attestations, not arbitrary admin decisions.

**Transparent Events** - Every action emits an on-chain event for public verification. Oracle address and decisions are publicly viewable.

**Regulated Stablecoin** - PYUSD is PayPal's regulated stablecoin, ensuring real-world value and predictable settlement.

Users trust the immutable contract code, not the developer.

---

## Deployed Contracts (Mantle Sepolia Testnet)

- **SecuredTransferContract:** [`0xa273fc650baa2dc55fde63e733178f7b645372a1`](https://explorer.sepolia.mantle.xyz/address/0xa273fc650baa2dc55fde63e733178f7b645372a1)
- **ComplianceOracle:** [`0xe9da61e2728b6ad3dd41595c139195d52605c1ea`](https://explorer.sepolia.mantle.xyz/address/0xe9da61e2728b6ad3dd41595c139195d52605c1ea)
- **Network:** Mantle Sepolia Testnet (Chain ID: 5003)
- **Deployed:** 2025-11-24

---

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn or npm
- MetaMask or compatible Web3 wallet

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

# Add your configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Your deployed SecuredTransferContract
NEXT_PUBLIC_NETWORK=sepolia # or mainnet
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

## Screenshots

<p align="center">
  <img src="img/home_page.png" alt="SecuredTransfer Home Page" width="800"/>
  <br/>
  <strong>Home Page</strong>
  <br/><br/>
</p>

<p align="center">
  <img src="img/safesend_contract.png" alt="SecuredTransfer Contract Interface" width="800"/>
  <br/>
  <strong>SecuredTransfer Contract Interface</strong>
  <br/><br/>
</p>

<p align="center">
  <img src="img/oracle_detection_calls_before)_release.png" alt="Oracle Detection Calls Before Release" width="800"/>
  <br/>
  <strong>Oracle Detection Calls Before Release</strong>
  <br/><br/>
</p>

<p align="center">
  <img src="img/completed_transactions.png" alt="Completed Transactions" width="800"/>
  <br/>
  <strong>Completed Transactions</strong>
  <br/><br/>
</p>

<p align="center">
  <img src="img/transaction_history.png" alt="Transaction History" width="800"/>
  <br/>
  <strong>Transaction History</strong>
  <br/><br/>
</p>

<p align="center">
  <img src="img/blockscout_view_of_contract_in_app.png" alt="Blockscout View of Contract in App" width="800"/>
  <br/>
  <strong>Blockscout View of Contract in App</strong>
  <br/><br/>
</p>

---

## License

MIT License - see LICENSE file for details
