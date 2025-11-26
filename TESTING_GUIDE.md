# SecuredTransfer - Comprehensive Testing Guide

> Complete end-to-end testing guide for all features on Mantle Sepolia Testnet

**Test Environment:**
- Network: Mantle Sepolia Testnet
- Chain ID: 5003
- RPC: https://rpc.sepolia.mantle.xyz
- Explorer: https://explorer.sepolia.mantle.xyz
- Application URL: http://localhost:3000 (or your deployed URL)

---

## Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Core Escrow System Tests](#core-escrow-system-tests)
3. [Invoice NFT & Marketplace Tests](#invoice-nft--marketplace-tests)
4. [Compliance & KYC Tests](#compliance--kyc-tests)
5. [Yield Generation System Tests](#yield-generation-system-tests)
6. [Collateral & Lending System Tests](#collateral--lending-system-tests)
7. [Integration Tests](#integration-tests)
8. [Expected Outcomes](#expected-outcomes)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Testing Setup

### Step 1: Get Testnet Funds

**1.1 Get MNT for Gas Fees**
```
Visit: https://faucet.sepolia.mantle.xyz/
- Connect your wallet
- Request testnet MNT
- Wait for confirmation (~30 seconds)
- Expected: Receive 0.5-1 MNT
```

**1.2 Get USDT Testnet Tokens**
```
USDT Contract: 0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE

Option A: Use existing testnet faucet
Option B: Contact deployer for test tokens
Option C: Mint directly if you have access

Recommended amount: 10,000 USDT for comprehensive testing
```

### Step 2: Connect Wallet

**2.1 Configure Network**
```
Network Name: Mantle Sepolia Testnet
RPC URL: https://rpc.sepolia.mantle.xyz
Chain ID: 5003
Currency Symbol: MNT
Block Explorer: https://explorer.sepolia.mantle.xyz
```

**2.2 Connect to Application**
- Visit http://localhost:3000
- Click "Connect Wallet"
- Select MetaMask, Coinbase Wallet, or WalletConnect
- Approve connection
- Verify network is Mantle Sepolia
- If wrong network, wallet should auto-prompt to switch

**Expected Outcome:**
- ✅ Wallet connected indicator shows your address
- ✅ Balance displayed correctly
- ✅ Network badge shows "Mantle Sepolia"

### Step 3: Verify Contract Deployment

**Check all deployed contracts on Mantle Explorer:**

1. **SecuredTransferContract**: [0xb8a1446e1a9feb78c0e83196cda8366a53df5376](https://explorer.sepolia.mantle.xyz/address/0xb8a1446e1a9feb78c0e83196cda8366a53df5376)
2. **ComplianceOracle**: [0x45e774cbd5877770bde1324347fc978939c884a3](https://explorer.sepolia.mantle.xyz/address/0x45e774cbd5877770bde1324347fc978939c884a3)
3. **InvoiceNFT**: [0x71f43c6c9598369f94dbd162dadb24c3d8df675c](https://explorer.sepolia.mantle.xyz/address/0x71f43c6c9598369f94dbd162dadb24c3d8df675c)
4. **YieldEscrow**: [0xdbbe162c7adeec7bb4fe2745b42fcc8b2aba5933](https://explorer.sepolia.mantle.xyz/address/0xdbbe162c7adeec7bb4fe2745b42fcc8b2aba5933)
5. **CollateralEscrow**: [0xc8fcb1d31202f2b75cea0ca70d8e00b96c24e296](https://explorer.sepolia.mantle.xyz/address/0xc8fcb1d31202f2b75cea0ca70d8e00b96c24e296)

**Expected Outcome:**
- ✅ All contracts show "Contract" badge
- ✅ Contract creation transactions visible
- ✅ Recent transactions (if any) visible

---

## Core Escrow System Tests

### Test 1: Create Basic Escrow

**Steps:**
1. Navigate to `/escrow` or click "Create Escrow"
2. Fill in escrow details:
   - **Seller Address**: `0x81e9aA254Ff408458A7267Df3469198f5045A561` (or any valid address)
   - **Amount**: `100` USDT
   - **Description**: `Website design project - Test 1`
3. Click "Approve USDT"
4. Confirm approval in wallet
5. Wait for approval confirmation
6. Click "Create Escrow"
7. Confirm transaction in wallet
8. Wait for confirmation

**Expected Outcomes:**
- ✅ Approval transaction confirms (~5-10 seconds)
- ✅ Create escrow transaction confirms (~5-10 seconds)
- ✅ Success message: "Escrow created successfully!"
- ✅ Redirected to escrow details page
- ✅ Invoice NFT minted to seller address
- ✅ Transaction appears on Mantle Explorer
- ✅ Event `Deposited` emitted with correct parameters
- ✅ Event `InvoiceMinted` emitted with NFT ID

**Verify on Explorer:**
```
1. Check USDT transfer from your wallet to contract
2. Check InvoiceNFT mint event to seller
3. Verify escrow ID and amount match
```

**Gas Cost Estimate:** ~$0.05-0.10 USD

---

### Test 2: Release Escrow Payment

**Prerequisites:** Escrow from Test 1 created

**Steps:**
1. Navigate to `/my-escrows`
2. Find the escrow you created (should show "Active" status)
3. Click "View Details"
4. Click "Release Payment" button
5. Confirm transaction in wallet
6. Wait for confirmation

**Expected Outcomes:**
- ✅ Transaction confirms (~5-10 seconds)
- ✅ Escrow status changes to "Released"
- ✅ USDT transferred to seller address
- ✅ Invoice NFT burned
- ✅ "Release Payment" button disabled
- ✅ Event `Released` emitted
- ✅ Event `InvoiceBurned` emitted

**Verify on Explorer:**
```
1. Check USDT transfer from contract to seller
2. Verify InvoiceNFT burn event
3. Confirm seller balance increased by escrow amount
```

**Gas Cost Estimate:** ~$0.03-0.05 USD

---

### Test 3: Refund Escrow

**Prerequisites:** Create a new escrow (100 USDT)

**Steps:**
1. Create another escrow (repeat Test 1 with different description)
2. Navigate to escrow details
3. Click "Refund" button
4. Confirm transaction in wallet
5. Wait for confirmation

**Expected Outcomes:**
- ✅ Transaction confirms (~5-10 seconds)
- ✅ Escrow status changes to "Refunded"
- ✅ USDT returned to your wallet
- ✅ Invoice NFT burned
- ✅ Both "Release" and "Refund" buttons disabled
- ✅ Event `Refunded` emitted

**Verify on Explorer:**
```
1. Check USDT transfer back to buyer (your wallet)
2. Verify InvoiceNFT burn event
3. Confirm your balance restored
```

**Gas Cost Estimate:** ~$0.03-0.05 USD

---

## Invoice NFT & Marketplace Tests

### Test 4: View Invoice NFT

**Prerequisites:** Active escrow with minted NFT

**Steps:**
1. Navigate to `/marketplace`
2. View "Active Invoices" section
3. Locate your invoice NFT
4. Click to view details

**Expected Outcomes:**
- ✅ NFT card displays:
  - Token ID
  - Escrow amount (100 USDT)
  - Buyer address (your address)
  - Seller address
  - Description
  - Creation timestamp
  - "Active" status badge
- ✅ NFT metadata viewable on Mantle Explorer
- ✅ NFT follows ERC-721 standard
- ✅ Owner is seller address

**Verify on Explorer:**
```
1. Navigate to InvoiceNFT contract
2. Read `ownerOf(tokenId)` - should be seller address
3. Read `tokenURI(tokenId)` - should return metadata
4. Verify metadata matches escrow details
```

---

### Test 5: Invoice Factoring (Trading NFT)

**Prerequisites:** Active escrow, access to seller wallet

**Scenario:** Seller wants immediate liquidity and sells invoice at discount

**Steps:**

**As Seller (Switch to seller wallet):**
1. Navigate to `/marketplace`
2. Find your invoice NFT
3. Click "List for Sale"
4. Set discount price: `95` USDT (5% discount for $100 invoice)
5. Approve NFT transfer
6. Confirm listing transaction

**As Factoring Buyer (Switch to a third wallet):**
1. Navigate to `/marketplace`
2. Find the listed invoice
3. Click "Buy Invoice"
4. Review: Pay 95 USDT, receive rights to 100 USDT when released
5. Approve USDT transfer
6. Confirm purchase transaction

**Expected Outcomes:**
- ✅ Seller lists invoice successfully
- ✅ Invoice shows "For Sale" badge with price
- ✅ Factoring buyer purchases invoice
- ✅ NFT ownership transfers to factoring buyer
- ✅ Seller receives 95 USDT immediately
- ✅ Original escrow still shows seller as beneficiary initially
- ✅ When released, 100 USDT goes to current NFT owner (factoring buyer)
- ✅ Factoring buyer earns 5 USDT profit (5% ROI)

**ROI Calculation:**
```
Purchase Price: 95 USDT
Release Amount: 100 USDT
Profit: 5 USDT
ROI: 5.26%
Seller gets immediate liquidity
```

**Gas Cost Estimate:** ~$0.08-0.12 USD total

---

## Compliance & KYC Tests

### Test 6: Check KYC Status

**Steps:**
1. Navigate to `/compliance`
2. View your compliance dashboard
3. Check current KYC level

**Expected Outcomes:**
- ✅ Dashboard displays:
  - KYC Level (0-3)
  - Transaction Limit
  - AML Risk Score
  - Verification Status
  - Blacklist Status (should be false)
- ✅ Default level: 0 (None) with $1,000 limit
- ✅ "Get Verified" button visible

**KYC Levels:**
```
Level 0 (None): $1,000 limit
Level 1 (Basic): $10,000 limit
Level 2 (Advanced): $100,000 limit
Level 3 (Institutional): $1,000,000 limit
```

---

### Test 7: Transaction Limit Enforcement

**Prerequisites:** KYC Level 0 ($1,000 limit)

**Steps:**
1. Attempt to create escrow with amount > limit
2. Try to create escrow for `1500` USDT
3. Submit transaction

**Expected Outcomes:**
- ✅ Transaction reverts with error: "Amount exceeds transaction limit"
- ✅ No USDT transferred
- ✅ User prompted to increase KYC level
- ✅ Escrow NOT created

**Then test within limit:**
1. Create escrow for `500` USDT (under limit)
2. Transaction should succeed

**Expected Outcomes:**
- ✅ Escrow created successfully
- ✅ No compliance errors
- ✅ NFT minted to seller

---

### Test 8: AML Risk Scoring

**Prerequisites:** Access to ComplianceOracle contract (owner only)

**Simulate High-Risk User (Owner Only):**
```solidity
// Call on ComplianceOracle contract
updateAMLRiskScore(userAddress, 85); // Score > 80 = high risk
```

**Then test escrow creation:**
1. Try to create escrow
2. Transaction should revert or auto-refund

**Expected Outcomes:**
- ✅ High-risk user blocked from creating escrow
- ✅ Or escrow auto-refunded by fraud oracle
- ✅ Event `FraudFlagged` emitted
- ✅ Funds returned to buyer

---

## Yield Generation System Tests

### Test 9: Create Yield-Generating Escrow

**Prerequisites:**
- 1,000 USDT in wallet
- cmETH and Agni Finance available on testnet

**Steps:**
1. Navigate to `/yield`
2. Click "Create Yield Escrow"
3. Fill in details:
   - **Seller Address**: Valid address
   - **Amount**: `1000` USDT
   - **Description**: `Project with yield - Test 9`
   - **Enable Yield**: ✅ Toggle ON
4. Review yield projection:
   - 7.2% APY
   - Duration estimate (30 days)
   - Yield distribution preview (80/15/5)
5. Approve USDT
6. Create escrow with yield

**Expected Outcomes:**
- ✅ USDT approved
- ✅ Escrow created
- ✅ USDT automatically swapped to cmETH via Agni Finance
- ✅ Swap path: USDT → WMNT → cmETH
- ✅ cmETH balance visible in escrow
- ✅ Yield tracking starts
- ✅ Dashboard shows accruing yield

**Swap Verification on Explorer:**
```
1. Check USDT transfer to Agni Router
2. Verify WMNT intermediate swap
3. Confirm cmETH received by YieldEscrow contract
4. Check slippage (should be < 1%)
```

**Gas Cost Estimate:** ~$0.15-0.25 USD (includes DEX swaps)

---

### Test 10: Monitor Yield Accrual

**Prerequisites:** Yield escrow from Test 9

**Steps:**
1. Navigate to yield escrow details
2. View "Yield Dashboard" section
3. Note current yield amount
4. Wait 1 hour (or return later)
5. Refresh page
6. Check updated yield amount

**Expected Outcomes:**
- ✅ Initial cmETH balance recorded
- ✅ Current value calculated based on cmETH exchange rate
- ✅ Yield increases over time
- ✅ APY displayed (~7.2%)
- ✅ Yield breakdown shown:
  - Buyer's share: 80%
  - Seller's share: 15%
  - Platform fee: 5%
- ✅ Projected total at current rate displayed

**Yield Calculation (30 days):**
```
Principal: 1,000 USDT
APY: 7.2%
Duration: 30 days
Daily Rate: 7.2% / 365 = 0.0197%
30-day Yield: 1,000 × 0.0197% × 30 = ~$5.92

Distribution:
- Buyer: $4.74 (80%)
- Seller: $0.89 (15%)
- Platform: $0.30 (5%)
Total Released: $1,005.92
```

---

### Test 11: Release Yield Escrow

**Prerequisites:** Yield escrow with accrued yield

**Steps:**
1. Navigate to yield escrow details
2. Review final yield amount
3. Click "Release with Yield"
4. Review yield distribution breakdown
5. Confirm transaction
6. Wait for confirmation

**Expected Outcomes:**
- ✅ cmETH swapped back to USDT via Agni Finance
- ✅ Swap path: cmETH → WMNT → USDT
- ✅ Yield distributed:
  - 80% to buyer (you)
  - 15% to seller
  - 5% to platform wallet
- ✅ Seller receives: Principal + 15% yield
- ✅ Buyer receives: 80% yield back to wallet
- ✅ Total amounts match projection
- ✅ Invoice NFT burned
- ✅ Escrow marked as "Released"

**Verify on Explorer:**
```
1. Check cmETH → USDT swap on Agni Finance
2. Verify 3 USDT transfers:
   - Principal + 15% yield → Seller
   - 80% yield → Buyer
   - 5% yield → Platform
3. Confirm amounts match calculation
```

**Gas Cost Estimate:** ~$0.15-0.25 USD (includes DEX swaps)

---

## Collateral & Lending System Tests

### Test 12: Deposit Escrow as Collateral

**Prerequisites:** Active escrow worth 1,000 USDT

**Steps:**
1. Create escrow for 1,000 USDT
2. Navigate to `/collateral`
3. Find your escrow in "Available Escrows" section
4. Click "Use as Collateral"
5. Review collateral terms:
   - Max LTV: 80%
   - Borrow Limit: 800 USDT
   - Interest rates from INIT Capital
6. Confirm "Deposit as Collateral"
7. Approve transaction

**Expected Outcomes:**
- ✅ Escrow marked as collateralized
- ✅ USDT supplied to INIT Capital
- ✅ Borrow limit calculated (800 USDT = 80% of 1,000)
- ✅ Available to borrow: 800 USDT
- ✅ Health factor: Healthy (>1.5)
- ✅ Collateral card appears in dashboard
- ✅ Event `CollateralDeposited` emitted

**Verify on Explorer:**
```
1. Check USDT transfer to INIT Capital
2. Verify supply transaction
3. Confirm escrow still locked in contract
4. Check borrow limit matches 80% LTV
```

**Gas Cost Estimate:** ~$0.05-0.08 USD

---

### Test 13: Borrow Against Collateral

**Prerequisites:** Collateralized escrow from Test 12

**Steps:**
1. Navigate to collateral dashboard
2. Find your collateral
3. Click "Borrow Funds"
4. Enter borrow amount: `500` USDT (62.5% of limit)
5. Review terms:
   - Amount: 500 USDT
   - Available after: 300 USDT
   - Current LTV: 50%
   - Health Factor: >2.0 (very healthy)
6. Confirm borrow
7. Approve transaction

**Expected Outcomes:**
- ✅ 500 USDT transferred to your wallet
- ✅ Outstanding debt: 500 USDT recorded
- ✅ Available to borrow: 300 USDT remaining
- ✅ Health factor updated (still healthy)
- ✅ Interest starts accruing
- ✅ Dashboard shows borrowed amount
- ✅ Event `BorrowedAgainstEscrow` emitted

**Use Case - Freelancer Working Capital:**
```
Scenario: Sarah needs funds to start project

1. Client creates $10,000 escrow
2. Sarah deposits as collateral
3. Sarah borrows $8,000 (80% LTV)
4. Uses funds for:
   - Software/equipment: $2,000
   - Outsourcing: $4,000
   - Working capital: $2,000
5. Completes project
6. Repays $8,000 + interest
7. Receives full $10,000 payment
```

**Verify on Explorer:**
```
1. Check borrow transaction from INIT Capital
2. Verify USDT received in your wallet
3. Confirm debt tracking in CollateralEscrow
4. Check health factor calculation
```

**Gas Cost Estimate:** ~$0.05-0.08 USD

---

### Test 14: Repay Borrowed Amount

**Prerequisites:** Outstanding debt from Test 13

**Steps:**
1. Navigate to collateral details
2. View "Outstanding Debt" section
3. Click "Repay Debt"
4. Enter repayment amount: `500` USDT (full repayment)
5. Approve USDT transfer
6. Confirm repayment transaction

**Expected Outcomes:**
- ✅ USDT transferred from wallet to INIT Capital
- ✅ Debt reduced by repayment amount
- ✅ Outstanding debt: 0 USDT
- ✅ Available to borrow: 800 USDT (full limit restored)
- ✅ Health factor: ∞ (no debt)
- ✅ "Release Collateral" button enabled
- ✅ Event `DebtRepaid` emitted

**Verify on Explorer:**
```
1. Check USDT transfer to INIT Capital
2. Verify repay transaction
3. Confirm debt = 0 in contract state
4. Check borrow limit fully available again
```

**Gas Cost Estimate:** ~$0.05-0.08 USD

---

### Test 15: Release Collateral After Repayment

**Prerequisites:** Fully repaid debt (Test 14 complete)

**Steps:**
1. Navigate to collateral details
2. Verify "Outstanding Debt: 0 USDT"
3. Click "Release Collateral"
4. Review release details:
   - Collateral will be unwound
   - USDT withdrawn from INIT Capital
   - Funds released to seller
   - NFT burned
5. Confirm release transaction

**Expected Outcomes:**
- ✅ Collateral unwound from INIT Capital
- ✅ USDT withdrawn to contract
- ✅ Full escrow amount released to seller
- ✅ Invoice NFT burned
- ✅ Escrow status: "Released"
- ✅ Collateral entry removed from dashboard
- ✅ Event `CollateralReleased` emitted

**Complete Working Capital Workflow:**
```
1. ✅ Client creates $10,000 escrow
2. ✅ Freelancer deposits as collateral
3. ✅ Freelancer borrows $8,000
4. ✅ Uses funds for project expenses
5. ✅ Completes project
6. ✅ Repays $8,000 + interest
7. ✅ Receives full $10,000 payment

Net Benefit: Early access to working capital
Cost: Interest on borrowed amount (~0.1-0.5%)
```

**Verify on Explorer:**
```
1. Check withdrawal from INIT Capital
2. Verify payment to seller
3. Confirm NFT burn
4. All collateral-related state cleared
```

**Gas Cost Estimate:** ~$0.08-0.12 USD

---

### Test 16: Attempt Release with Outstanding Debt

**Prerequisites:** Collateralized escrow with unpaid debt

**Steps:**
1. Borrow against collateral (e.g., 500 USDT)
2. Without repaying, try to release escrow
3. Click "Release Collateral" (should be disabled)
4. If enabled, attempt transaction

**Expected Outcomes:**
- ✅ "Release" button disabled with debt outstanding
- ✅ Warning message: "Repay debt before releasing"
- ✅ If transaction attempted: Reverts with "Outstanding debt exists"
- ✅ No funds transferred
- ✅ Collateral remains locked
- ✅ Debt amount clearly displayed

**This ensures:**
- Lenders are protected
- Borrowers must repay before accessing collateral
- No unexpected liquidations

---

## Integration Tests

### Test 17: Complete Invoice Factoring + Yield Flow

**Full Scenario: Seller gets immediate liquidity, buyer earns yield**

**Step 1: Buyer creates yield escrow**
- Amount: 1,000 USDT
- Yield enabled
- Invoice NFT minted to seller

**Step 2: Seller lists invoice at discount**
- List for 950 USDT (5% discount)
- Keep 50 USDT for early payment fee

**Step 3: Factoring buyer purchases**
- Pays 950 USDT
- Receives NFT ownership
- Now owns right to 1,000 USDT + yield

**Step 4: Yield accrues (30 days)**
- Original 1,000 USDT in cmETH
- Earns ~5.92 USDT yield
- Total value: ~1,005.92 USDT

**Step 5: Original buyer releases escrow**
- cmETH swapped to USDT
- Yield distributed:
  - Original buyer (creator): 80% × 5.92 = 4.74 USDT
  - Factoring buyer (current NFT owner): 1,000 + (15% × 5.92) = 1,000.89 USDT
  - Platform: 5% × 5.92 = 0.30 USDT

**Expected Outcomes:**

**Seller:**
- ✅ Received 950 USDT immediately
- ✅ Lost 50 USDT for early payment
- ✅ Benefit: Immediate liquidity

**Factoring Buyer:**
- ✅ Paid 950 USDT upfront
- ✅ Received 1,000.89 USDT after 30 days
- ✅ Profit: 50.89 USDT (5.36% ROI)
- ✅ Includes: 50 USDT discount + 0.89 USDT yield share

**Original Buyer:**
- ✅ Created 1,000 USDT escrow
- ✅ Received 4.74 USDT yield (80% share)
- ✅ Net cost: 995.26 USDT for 1,000 USDT service
- ✅ Benefit: Yield offset escrow cost

**Platform:**
- ✅ Earned 0.30 USDT fee
- ✅ 5% of yield as revenue

---

### Test 18: Complete Working Capital Workflow

**Full Scenario: Freelancer uses escrow for working capital**

**Setup:**
- Freelancer: Sarah (needs equipment for project)
- Client: Creates 10,000 USDT escrow
- Project duration: 60 days

**Step 1: Escrow Creation**
- Client deposits 10,000 USDT
- Invoice NFT minted to Sarah
- Escrow locked until completion

**Step 2: Collateral Deposit**
- Sarah deposits escrow as collateral
- USDT supplied to INIT Capital
- Borrow limit: 8,000 USDT (80% LTV)

**Step 3: Borrow for Working Capital**
- Sarah borrows 8,000 USDT
- Uses funds:
  - Design software: 500 USDT
  - Hire assistant: 3,000 USDT
  - Outsource copywriting: 1,500 USDT
  - Stock photos: 1,000 USDT
  - Working capital buffer: 2,000 USDT

**Step 4: Project Completion**
- Sarah completes project in 60 days
- Client approves work
- Interest accrued: ~35 USDT (0.35% for 60 days)

**Step 5: Debt Repayment**
- Sarah repays 8,035 USDT (principal + interest)
- Debt cleared
- Collateral available for release

**Step 6: Payment Release**
- Client releases escrow
- Sarah receives 10,000 USDT
- Net profit: 10,000 - 8,035 = 1,965 USDT

**Expected Outcomes:**

**Sarah (Freelancer):**
- ✅ Got 8,000 USDT working capital upfront
- ✅ Completed project with proper resources
- ✅ Net profit: 1,965 USDT after expenses
- ✅ Successfully delivered quality work

**Client:**
- ✅ Funds safely held in escrow
- ✅ Quality project delivered
- ✅ Fair payment process
- ✅ No additional costs

**Platform:**
- ✅ Facilitated secure transaction
- ✅ Enabled working capital access
- ✅ All parties satisfied

---

## Expected Outcomes Summary

### Performance Metrics

**Gas Costs (Mantle Sepolia):**
- Create Escrow: ~$0.05-0.10
- Release Payment: ~$0.03-0.05
- Refund: ~$0.03-0.05
- Deposit Collateral: ~$0.05-0.08
- Borrow: ~$0.05-0.08
- Repay: ~$0.05-0.08
- Create Yield Escrow: ~$0.15-0.25 (includes swaps)
- Release Yield: ~$0.15-0.25 (includes swaps)

**Total for Complete Flow:** ~$0.50-1.00 USD
*vs $20-50 on Ethereum L1 (95-98% cost reduction)*

**Transaction Speed:**
- Average confirmation: 5-10 seconds
- Block time: ~2 seconds on Mantle
- Finality: <1 minute

**Yield Returns (cmETH @ 7.2% APY):**
```
30-day escrow of 1,000 USDT:
- Total yield: ~5.92 USDT
- Buyer share (80%): 4.74 USDT
- Seller share (15%): 0.89 USDT
- Platform fee (5%): 0.30 USDT

90-day escrow of 10,000 USDT:
- Total yield: ~177.53 USDT
- Buyer share (80%): 142.03 USDT
- Seller share (15%): 26.63 USDT
- Platform fee (5%): 8.88 USDT
```

**Collateral Borrowing (80% LTV):**
```
10,000 USDT escrow:
- Max borrow: 8,000 USDT
- Typical interest: ~0.1-0.5% monthly
- 60-day interest on 8,000: ~35 USDT
- Health factor threshold: >1.0 (liquidation if <1.0)
```

---

### Success Criteria Checklist

**Core Escrow System:**
- [ ] Create escrow with USDT
- [ ] Invoice NFT minted to seller
- [ ] Release payment to seller
- [ ] Refund to buyer
- [ ] All events emitted correctly
- [ ] Gas costs under $0.10 per transaction
- [ ] Confirmation time under 15 seconds

**Invoice NFT & Marketplace:**
- [ ] NFT visible on explorer
- [ ] NFT tradable (transfer ownership)
- [ ] Invoice factoring flow works
- [ ] Seller gets immediate liquidity
- [ ] Factoring buyer earns ROI
- [ ] Metadata correct and viewable

**Compliance & KYC:**
- [ ] KYC level displayed correctly
- [ ] Transaction limits enforced
- [ ] High-risk users blocked
- [ ] AML scoring works
- [ ] Blacklist functionality
- [ ] Compliance checks on all deposits

**Yield Generation:**
- [ ] USDT swaps to cmETH successfully
- [ ] Yield accrues over time
- [ ] Yield distribution correct (80/15/5)
- [ ] cmETH swaps back to USDT
- [ ] No unstaking delays
- [ ] All participants receive correct amounts

**Collateral & Lending:**
- [ ] Deposit escrow as collateral
- [ ] Borrow up to 80% LTV
- [ ] Interest accrues correctly
- [ ] Repayment reduces debt
- [ ] Cannot release with outstanding debt
- [ ] Successful release after full repayment
- [ ] Health factor calculated correctly

**Integration:**
- [ ] Multiple escrows tracked correctly
- [ ] Wallet balance updates accurate
- [ ] Dashboard shows all escrows
- [ ] Filters and search work
- [ ] Mobile responsive
- [ ] Works with multiple wallet types

---

## Troubleshooting

### Common Issues and Solutions

**Issue: Transaction Fails - "Insufficient Balance"**
```
Solution:
1. Check MNT balance for gas
2. Check USDT balance for escrow amount
3. Visit faucet for more testnet tokens
4. Reduce escrow amount
```

**Issue: "User denied transaction"**
```
Solution:
1. Review transaction details in wallet
2. Check gas fees are reasonable
3. Ensure correct network (Mantle Sepolia)
4. Try again with wallet unlocked
```

**Issue: USDT Approval Fails**
```
Solution:
1. Check USDT contract address correct
2. Verify you have USDT balance
3. Clear any existing approval first
4. Set approval to exact amount needed
```

**Issue: "Amount exceeds transaction limit"**
```
Solution:
1. Check your KYC level on /compliance
2. Reduce amount to within limit
3. Or request KYC level increase (owner only)
4. Limits: Level 0 = $1k, Level 1 = $10k, etc.
```

**Issue: Yield Escrow Creation Fails**
```
Solution:
1. Verify cmETH available on testnet
2. Check Agni Finance router address
3. Ensure sufficient USDT for swap + slippage
4. Try with smaller amount first
5. Check testnet liquidity pools
```

**Issue: Cannot Borrow Against Collateral**
```
Solution:
1. Verify escrow deposited as collateral
2. Check no existing debt outstanding
3. Ensure borrow amount ≤ available limit
4. Verify INIT Capital has liquidity
5. Check health factor > 1.0
```

**Issue: "Outstanding debt exists" when releasing**
```
Solution:
1. This is expected - must repay debt first
2. Go to collateral details
3. Click "Repay Debt"
4. Repay full outstanding amount + interest
5. Then release will be enabled
```

**Issue: NFT Not Showing in Marketplace**
```
Solution:
1. Wait 30 seconds for indexing
2. Refresh page
3. Check NFT on Mantle Explorer
4. Verify escrow is "Active" status
5. Check connected to correct wallet
```

**Issue: Network Switching Doesn't Work**
```
Solution:
1. Manually add Mantle Sepolia to wallet
2. Network settings:
   - RPC: https://rpc.sepolia.mantle.xyz
   - Chain ID: 5003
   - Currency: MNT
3. Switch network manually
4. Refresh application
```

**Issue: Yield Not Accruing**
```
Solution:
1. Check cmETH exchange rate hasn't changed
2. Verify swap to cmETH succeeded
3. Wait longer (yield accrues gradually)
4. Check escrow is yield-enabled type
5. Verify on Agni Finance pool activity
```

---

## Advanced Testing Scenarios

### Stress Test: Multiple Concurrent Escrows

**Objective:** Test system with multiple escrows simultaneously

1. Create 10 escrows in quick succession
2. Mix regular, yield, and collateral escrows
3. Release some, refund others
4. Trade NFTs between different wallets
5. Verify all tracked correctly
6. Check no race conditions or conflicts

**Expected:** All escrows independent, no interference

---

### Edge Case: Maximum Transaction Limit

**Objective:** Test upper boundary of transaction limits

1. Create escrow at exact KYC limit (e.g., $1,000 for Level 0)
2. Should succeed
3. Create escrow at limit + 1 ($1,001)
4. Should fail with limit error

**Expected:** Precise enforcement of limits

---

### Security Test: Unauthorized Actions

**Objective:** Verify access controls

1. Try to release escrow from wrong wallet (not buyer)
2. Should fail: "Only buyer can release"
3. Try to withdraw collateral with debt (different wallet)
4. Should fail: "Outstanding debt exists"
5. Try to mark fraud from non-oracle address
6. Should fail: "Only oracle can mark fraud"

**Expected:** All unauthorized actions blocked

---

## Reporting Issues

If you encounter any issues during testing:

1. **Document the issue:**
   - What you were trying to do
   - Steps to reproduce
   - Expected vs actual outcome
   - Error messages
   - Transaction hash (if applicable)

2. **Check Mantle Explorer:**
   - View failed transaction
   - Check revert reason
   - Verify contract state

3. **Report via GitHub:**
   - Create issue at: https://github.com/big14way/securedT/issues
   - Include all documentation above
   - Attach screenshots if helpful

4. **Get help:**
   - Check documentation: README.md
   - Review contract source code
   - Contact team for support

---

## Test Completion Checklist

After completing all tests, verify:

- [ ] All 18 core tests passed
- [ ] No critical errors encountered
- [ ] Gas costs as expected
- [ ] Transaction speeds acceptable
- [ ] All features working as designed
- [ ] Mobile testing completed
- [ ] Multiple wallet types tested
- [ ] Edge cases handled correctly
- [ ] Security controls working
- [ ] Documentation accurate

**Congratulations!** 🎉

If all tests pass, the SecuredTransfer platform is production-ready for Mantle Sepolia testnet usage. The system is secure, efficient, and fully functional across all three major systems:

1. ✅ Core Escrow & Invoice NFT
2. ✅ Yield Generation with cmETH
3. ✅ Collateral & Working Capital Financing

---

**Next Steps:**
1. Conduct user acceptance testing
2. Security audit (recommended before mainnet)
3. Deploy to Mantle Mainnet
4. Launch production application

**Network Readiness:**
- Mantle Sepolia Testnet: ✅ READY
- Mantle Mainnet: ⚠️ Requires audit first

---

*Last Updated: November 26, 2025*
*Network: Mantle Sepolia Testnet (Chain ID: 5003)*
*Version: 2.0 - Complete System*
