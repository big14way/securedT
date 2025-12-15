# SecuredT - 3-Minute Pitch

## "PayPal for the Unbanked, Built on Mantle"

---

## THE PROBLEM (60 seconds)

### Amara's Story

*Amara is a 24-year-old graphic designer from Lagos, Nigeria. Last month, she completed a $500 logo design project for a client in the UK. She waited. And waited. Three weeks later - nothing. No payment. No response. Her rent was due.*

**This is not just Amara's story. This is the story of 50 million African freelancers.**

### The Trust Crisis in African Commerce

- **$15 billion** lost annually to payment fraud and non-payment in Africa
- **67%** of African freelancers have been scammed at least once
- **Average wait time**: 45-90 days for international payments
- **The unbanked**: 57% of Sub-Saharan Africans lack access to traditional banking

### Why Traditional Solutions Fail

| Problem | PayPal's Limitation |
|---------|-------------------|
| Not available in 30+ African countries | Geographic restrictions |
| High fees (4-5% + currency conversion) | Expensive for small transactions |
| Account freezes without warning | Centralized control |
| No protection for service providers | Buyer-centric disputes |
| Money sits idle during disputes | Zero yield on escrow |

**The gap**: There's no trustless, accessible payment protection for the world's fastest-growing freelance economy.

---

## THE SOLUTION: SecuredT (60 seconds)

### "What if PayPal was built for Africa, on blockchain?"

SecuredT is a **decentralized escrow and invoice factoring platform** built on Mantle Network, bringing PayPal-style protection to the 1.4 billion people who need it most.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT                  ESCROW                  FREELANCER │
│    │                       │                         │      │
│    │──── Deposits $500 ───►│                         │      │
│    │                       │ (Funds locked safely)   │      │
│    │                       │                         │      │
│    │                       │◄── Delivers Work ───────│      │
│    │                       │                         │      │
│    │── Approves Release ──►│                         │      │
│    │                       │────── $500 + Yield ────►│      │
│    │                       │                         │      │
│    │      Trust = Restored │       Money = Protected │      │
└─────────────────────────────────────────────────────────────┘
```

### Core Features

| Feature | What It Does | Why It Matters |
|---------|-------------|----------------|
| **Smart Escrow** | Funds locked until work approved | No more "send work first, pray later" |
| **Invoice NFTs** | Tokenize invoices as tradable assets | Get paid NOW, not in 90 days |
| **Yield Generation** | Earn 7.2% APY on escrow via mETH | Your money works while it waits |
| **Optional KYC** | Permissionless by default | No bank account? No problem. |

### The Invoice Factoring Revolution

**Scenario**: Amara has a $5,000 invoice due in 30 days, but she needs money NOW for equipment.

1. She lists her invoice NFT at 10% discount ($4,500)
2. An investor buys it instantly
3. Amara gets $4,500 today
4. Investor receives $5,000 when escrow releases (11% profit, ~130% APR)

**Everyone wins. No banks. No borders. No BS.**

---

## WHY MANTLE? (30 seconds)

### The Perfect Chain for African Payments

| Mantle Advantage | Impact |
|-----------------|--------|
| **$0.001 gas fees** | Microtransactions viable (send $5, pay $0.001) |
| **2-second finality** | Instant confirmations |
| **mETH Protocol** | Native yield generation (7.2% APY) |
| **EVM Compatible** | Easy integration with existing tools |
| **L2 Security** | Ethereum-grade security, L2 speed |

### Deep Mantle Integration

- **cmETH** for yield on idle escrow funds
- **Agni Finance DEX** for instant swaps
- **Native USDT** for stablecoin payments
- **Low fees** make $10 escrows economically viable

---

## TRACTION & ROADMAP (30 seconds)

### What We've Built (Testnet Live)

- ✅ Smart Escrow Contract with multi-sig security
- ✅ Invoice NFT Marketplace with atomic purchases
- ✅ Compliance Oracle (optional KYC/AML)
- ✅ Yield Escrow with mETH integration
- ✅ Working Capital Financing (80% LTV)
- ✅ Cyberpunk UI with 300+ wallet support

### Roadmap

| Phase | Timeline | Milestones |
|-------|----------|------------|
| **Alpha** | Q1 2025 | Testnet launch, community testing |
| **Beta** | Q2 2025 | Mainnet launch, first 1,000 users |
| **Growth** | Q3 2025 | Mobile app, fiat on/off ramps |
| **Scale** | Q4 2025 | Multi-chain, 100K users |

### Target Market

- **Primary**: African freelancers & SMEs ($50B market)
- **Secondary**: Global remote workers & gig economy
- **Tertiary**: Invoice factoring investors seeking yield

---

## THE ASK

### We're Raising: $500K Seed Round

| Use of Funds | Allocation |
|--------------|------------|
| Engineering | 40% |
| Security Audits | 20% |
| Marketing & Growth | 25% |
| Operations | 15% |

### What We Need

1. **Funding** for security audits and mainnet launch
2. **Partners** in African fintech ecosystem
3. **Mentors** with payment/escrow experience
4. **Community** of early adopters and testers

---

## THE TEAM

Building at the intersection of African fintech and Web3.

*"We've experienced the pain of waiting months for international payments. We built SecuredT because we needed it to exist."*

---

## CLOSING: THE VISION

### Imagine...

- A world where **Amara never worries** about getting paid
- Where a **Nigerian developer** and **German startup** transact trustlessly
- Where your **escrow earns yield** instead of sitting idle
- Where **invoices are liquid assets**, not waiting games
- Where **financial inclusion** isn't a buzzword - it's code

### SecuredT: Secure Payments. Instant Liquidity. Built on Mantle.

---

## CONTACT

- **Website**: securedtransfer.app
- **GitHub**: github.com/big14way/securedT
- **Twitter**: @SecuredT_xyz

---

## APPENDIX: Technical Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     SECUREDT ARCHITECTURE                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Frontend  │────►│   Viem/     │────►│   Mantle    │      │
│  │  (Next.js)  │     │   Wagmi     │     │   Sepolia   │      │
│  └─────────────┘     └─────────────┘     └─────────────┘      │
│                                                 │              │
│                                                 ▼              │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                  SMART CONTRACTS                        │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │  SecuredTransferContract    │  Core escrow logic       │   │
│  │  InvoiceNFT                 │  ERC-721 + marketplace   │   │
│  │  ComplianceOracle           │  Optional KYC/AML        │   │
│  │  YieldEscrow                │  mETH integration        │   │
│  │  CollateralEscrow           │  Working capital loans   │   │
│  └────────────────────────────────────────────────────────┘   │
│                           │                                    │
│                           ▼                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              MANTLE ECOSYSTEM                           │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │  • cmETH (7.2% APY)         │  Yield generation        │   │
│  │  • Agni Finance             │  DEX swaps               │   │
│  │  • INIT Capital             │  Lending/borrowing       │   │
│  │  • Native USDT              │  Stablecoin payments     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## APPENDIX: Competitive Analysis

| Feature | PayPal | Escrow.com | SecuredT |
|---------|--------|------------|----------|
| Available in Africa | ❌ Limited | ❌ Limited | ✅ Global |
| Fees | 4-5% | 3-5% | 1% |
| Yield on Escrow | ❌ | ❌ | ✅ 7.2% APY |
| Invoice Factoring | ❌ | ❌ | ✅ NFT Market |
| Decentralized | ❌ | ❌ | ✅ Smart Contracts |
| KYC Required | ✅ Always | ✅ Always | ⚪ Optional |
| Settlement Time | 3-5 days | 1-3 days | Instant |

---

*SecuredT - Because trust shouldn't have borders.*
