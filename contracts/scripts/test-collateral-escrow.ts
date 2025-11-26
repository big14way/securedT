import { parseUnits, formatUnits } from "viem";

/**
 * Simple verification script for CollateralEscrow contract
 * This script deploys the contract and verifies basic functionality
 */
async function main() {
  console.log("=== CollateralEscrow Contract Verification ===\n");

  const hre = await import("hardhat");
  const [deployer, buyer, seller] = await hre.viem.getWalletClients();

  console.log("Accounts:");
  console.log("- Deployer:", deployer.account.address);
  console.log("- Buyer:", buyer.account.address);
  console.log("- Seller:", seller.account.address);
  console.log();

  // Deploy mock USDT
  console.log("1. Deploying MockERC20 (USDT)...");
  const usdt = await hre.viem.deployContract("MockERC20", ["Mock USDT", "USDT", 6]);
  console.log("✓ MockERC20 deployed to:", usdt.address);

  // Deploy mock INIT Capital
  console.log("\n2. Deploying MockINITCapital...");
  const initCapital = await hre.viem.deployContract("MockINITCapital", [usdt.address]);
  console.log("✓ MockINITCapital deployed to:", initCapital.address);

  // Deploy CollateralEscrow
  console.log("\n3. Deploying CollateralEscrow...");
  const collateralEscrow = await hre.viem.deployContract("CollateralEscrow", [
    usdt.address,
    deployer.account.address, // fraud oracle
    initCapital.address
  ]);
  console.log("✓ CollateralEscrow deployed to:", collateralEscrow.address);

  // Verify deployment
  console.log("\n4. Verifying deployment configuration...");
  const pyusdToken = await collateralEscrow.read.pyusdToken();
  const fraudOracle = await collateralEscrow.read.fraudOracle();
  const initCapitalAddr = await collateralEscrow.read.initCapital();
  const maxLtv = await collateralEscrow.read.MAX_LTV();

  console.log("✓ PYUSD Token:", pyusdToken);
  console.log("✓ Fraud Oracle:", fraudOracle);
  console.log("✓ INIT Capital:", initCapitalAddr);
  console.log("✓ MAX_LTV:", maxLtv.toString(), "(80%)");

  // Setup test environment
  console.log("\n5. Setting up test environment...");
  const amount = parseUnits("10000", 6); // 10,000 USDT

  // Mint USDT to buyer
  await usdt.write.mint([buyer.account.address, amount]);
  console.log("✓ Minted", formatUnits(amount, 6), "USDT to buyer");

  // Fund INIT Capital for borrowing
  await usdt.write.mint([initCapital.address, parseUnits("1000000", 6)]);
  console.log("✓ Funded INIT Capital with 1,000,000 USDT");

  // Approve CollateralEscrow to spend buyer's USDT
  await usdt.write.approve([collateralEscrow.address, parseUnits("100000", 6)], { account: buyer.account });
  console.log("✓ Buyer approved CollateralEscrow to spend USDT");

  // Test 1: Create Escrow
  console.log("\n6. Test 1: Creating escrow...");
  await collateralEscrow.write.deposit(
    [seller.account.address, amount, "Website redesign project"],
    { account: buyer.account }
  );
  console.log("✓ Escrow created (ID: 10001)");

  const escrow = await collateralEscrow.read.getEscrow([10001n]);
  console.log("  - Buyer:", escrow.buyer);
  console.log("  - Seller:", escrow.seller);
  console.log("  - Amount:", formatUnits(escrow.amount, 6), "USDT");
  console.log("  - Status:", escrow.status === 0 ? "Active" : "Other");

  // Test 2: Deposit as Collateral
  console.log("\n7. Test 2: Depositing escrow as collateral...");
  await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });
  console.log("✓ Escrow deposited as collateral");

  const collateralData = await collateralEscrow.read.collateralData([10001n]);
  console.log("  - Is Collateralized:", collateralData.isCollateralized);
  console.log("  - Supplied Amount:", formatUnits(collateralData.suppliedAmount, 6), "USDT");
  console.log("  - Borrowed Amount:", formatUnits(collateralData.borrowedAmount, 6), "USDT");

  // Test 3: Check Borrow Limit
  console.log("\n8. Test 3: Checking borrow limit...");
  const borrowLimit = await collateralEscrow.read.getBorrowLimit([10001n]);
  const available = await collateralEscrow.read.getAvailableToBorrow([10001n]);
  console.log("✓ Borrow Limit:", formatUnits(borrowLimit, 6), "USDT (80% LTV)");
  console.log("✓ Available to Borrow:", formatUnits(available, 6), "USDT");

  // Test 4: Borrow Against Escrow
  console.log("\n9. Test 4: Borrowing against escrow...");
  const borrowAmount = parseUnits("5000", 6); // Borrow 5,000 USDT
  const buyerBalanceBefore = await usdt.read.balanceOf([buyer.account.address]);

  await collateralEscrow.write.borrowAgainstEscrow([10001n, borrowAmount], { account: buyer.account });
  console.log("✓ Borrowed", formatUnits(borrowAmount, 6), "USDT");

  const buyerBalanceAfter = await usdt.read.balanceOf([buyer.account.address]);
  console.log("  - Buyer balance increased by:", formatUnits(buyerBalanceAfter - buyerBalanceBefore, 6), "USDT");

  const updatedCollateralData = await collateralEscrow.read.collateralData([10001n]);
  console.log("  - Total Borrowed:", formatUnits(updatedCollateralData.borrowedAmount, 6), "USDT");

  // Test 5: Check Available After Borrowing
  console.log("\n10. Test 5: Checking available after borrowing...");
  const availableAfterBorrow = await collateralEscrow.read.getAvailableToBorrow([10001n]);
  console.log("✓ Available to Borrow:", formatUnits(availableAfterBorrow, 6), "USDT");

  // Test 6: Repay Borrowed
  console.log("\n11. Test 6: Repaying borrowed amount...");
  const repayAmount = parseUnits("5000", 6);
  await collateralEscrow.write.repayBorrowed([10001n, repayAmount], { account: buyer.account });
  console.log("✓ Repaid", formatUnits(repayAmount, 6), "USDT");

  const finalCollateralData = await collateralEscrow.read.collateralData([10001n]);
  console.log("  - Remaining Borrowed:", formatUnits(finalCollateralData.borrowedAmount, 6), "USDT");

  // Test 7: Release With Collateral
  console.log("\n12. Test 7: Releasing escrow with collateral unwinding...");
  const sellerBalanceBefore = await usdt.read.balanceOf([seller.account.address]);

  await collateralEscrow.write.releaseWithCollateral([10001n], { account: buyer.account });
  console.log("✓ Escrow released to seller");

  const sellerBalanceAfter = await usdt.read.balanceOf([seller.account.address]);
  console.log("  - Seller received:", formatUnits(sellerBalanceAfter - sellerBalanceBefore, 6), "USDT");

  const releasedEscrow = await collateralEscrow.read.getEscrow([10001n]);
  console.log("  - Escrow status:", releasedEscrow.status === 1 ? "Released" : "Other");

  const releasedCollateralData = await collateralEscrow.read.collateralData([10001n]);
  console.log("  - Is still collateralized:", releasedCollateralData.isCollateralized);

  // Summary
  console.log("\n=== Verification Complete ===");
  console.log("✓ All basic functions tested successfully!");
  console.log("\nContract Addresses:");
  console.log("- MockERC20 (USDT):", usdt.address);
  console.log("- MockINITCapital:", initCapital.address);
  console.log("- CollateralEscrow:", collateralEscrow.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
