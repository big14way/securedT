import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseEther, zeroAddress } from "viem";

describe("SecuredTransferContract", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  
  // Test accounts
  const [deployer, buyer, seller, fraudOracle, other] = await viem.getWalletClients();
  
  let securedTransferContract: any;
  let mockPYUSD: any;
  const escrowAmount = parseEther("100"); // 100 PYUSD
  const description = "Website development project";

  beforeEach(async function () {
    // Deploy mock PYUSD token
    mockPYUSD = await viem.deployContract("MockERC20", ["PYUSD", "PYUSD", 18]);
    
    // Deploy SecuredTransfer contract
    securedTransferContract = await viem.deployContract("SecuredTransferContract", [
      mockPYUSD.address,
      fraudOracle.account.address
    ]);
    
    // Mint PYUSD tokens to buyer for testing
    await mockPYUSD.write.mint([buyer.account.address, parseEther("1000")]);
    
    // Approve SafeSend contract to spend buyer's PYUSD
    await mockPYUSD.write.approve(
      [securedTransferContract.address, parseEther("1000")],
      { account: buyer.account }
    );
  });

  describe("Deployment", function () {
    it("Should set the correct PYUSD token address", async function () {
      const tokenAddress = await securedTransferContract.read.pyusdToken();
      assert.equal(tokenAddress.toLowerCase(), mockPYUSD.address.toLowerCase());
    });

    it("Should set the correct fraud oracle", async function () {
      const oracle = await securedTransferContract.read.fraudOracle();
      assert.equal(oracle.toLowerCase(), fraudOracle.account.address.toLowerCase());
    });

    it("Should set the deployer as owner", async function () {
      const owner = await securedTransferContract.read.owner();
      assert.equal(owner.toLowerCase(), deployer.account.address.toLowerCase());
    });
  });

  describe("Deposit", function () {
    it("Should create escrow successfully", async function () {
      await securedTransferContract.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );

      // Check escrow details
      const escrow = await securedTransferContract.read.getEscrow([1n]);
      assert.equal(escrow.buyer.toLowerCase(), buyer.account.address.toLowerCase());
      assert.equal(escrow.seller.toLowerCase(), seller.account.address.toLowerCase());
      assert.equal(escrow.amount, escrowAmount);
      assert.equal(escrow.description, description);
      assert.equal(escrow.status, 0); // EscrowStatus.Active
      assert.equal(escrow.fraudFlagged, false);
    });

    it("Should transfer PYUSD to contract", async function () {
      const contractBalanceBefore = await mockPYUSD.read.balanceOf([securedTransferContract.address]);
      const buyerBalanceBefore = await mockPYUSD.read.balanceOf([buyer.account.address]);

      await securedTransferContract.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );

      const contractBalanceAfter = await mockPYUSD.read.balanceOf([securedTransferContract.address]);
      const buyerBalanceAfter = await mockPYUSD.read.balanceOf([buyer.account.address]);

      assert.equal(contractBalanceAfter - contractBalanceBefore, escrowAmount);
      assert.equal(buyerBalanceBefore - buyerBalanceAfter, escrowAmount);
    });

    it("Should revert with invalid seller address", async function () {
      await assert.rejects(
        securedTransferContract.write.deposit(
          [zeroAddress, escrowAmount, description],
          { account: buyer.account }
        )
      );
    });

    it("Should revert when buyer is seller", async function () {
      await assert.rejects(
        securedTransferContract.write.deposit(
          [buyer.account.address, escrowAmount, description],
          { account: buyer.account }
        )
      );
    });
  });

  describe("Release", function () {
    beforeEach(async function () {
      // Create an escrow
      await securedTransferContract.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
    });

    it("Should release funds to seller successfully", async function () {
      const sellerBalanceBefore = await mockPYUSD.read.balanceOf([seller.account.address]);

      await securedTransferContract.write.release([1n], { account: buyer.account });

      const sellerBalanceAfter = await mockPYUSD.read.balanceOf([seller.account.address]);
      assert.equal(sellerBalanceAfter - sellerBalanceBefore, escrowAmount);

      // Check escrow status
      const escrow = await securedTransferContract.read.getEscrow([1n]);
      assert.equal(escrow.status, 1); // EscrowStatus.Released
    });

    it("Should revert if called by non-buyer", async function () {
      await assert.rejects(
        securedTransferContract.write.release([1n], { account: seller.account })
      );
    });
  });

  describe("Refund", function () {
    beforeEach(async function () {
      // Create an escrow
      await securedTransferContract.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
    });

    it("Should refund buyer successfully", async function () {
      const buyerBalanceBefore = await mockPYUSD.read.balanceOf([buyer.account.address]);

      await securedTransferContract.write.refund([1n], { account: buyer.account });

      const buyerBalanceAfter = await mockPYUSD.read.balanceOf([buyer.account.address]);
      assert.equal(buyerBalanceAfter - buyerBalanceBefore, escrowAmount);

      // Check escrow status
      const escrow = await securedTransferContract.read.getEscrow([1n]);
      assert.equal(escrow.status, 2); // EscrowStatus.Refunded
    });

    it("Should allow fraud oracle to refund", async function () {
      const buyerBalanceBefore = await mockPYUSD.read.balanceOf([buyer.account.address]);

      await securedTransferContract.write.refund([1n], { account: fraudOracle.account });

      const buyerBalanceAfter = await mockPYUSD.read.balanceOf([buyer.account.address]);
      assert.equal(buyerBalanceAfter - buyerBalanceBefore, escrowAmount);
    });
  });

  describe("Fraud Protection", function () {
    beforeEach(async function () {
      // Create an escrow
      await securedTransferContract.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
    });

    it("Should mark fraud and auto-refund", async function () {
      const buyerBalanceBefore = await mockPYUSD.read.balanceOf([buyer.account.address]);

      await securedTransferContract.write.markFraud([1n], { account: fraudOracle.account });

      const buyerBalanceAfter = await mockPYUSD.read.balanceOf([buyer.account.address]);
      assert.equal(buyerBalanceAfter - buyerBalanceBefore, escrowAmount);

      // Check escrow status
      const escrow = await securedTransferContract.read.getEscrow([1n]);
      assert.equal(escrow.fraudFlagged, true);
      assert.equal(escrow.status, 2); // EscrowStatus.Refunded
    });

    it("Should revert if non-oracle tries to mark fraud", async function () {
      await assert.rejects(
        securedTransferContract.write.markFraud([1n], { account: other.account })
      );
    });
  });

  describe("Oracle Management", function () {
    it("Should update fraud oracle", async function () {
      const newOracle = other.account.address;

      await securedTransferContract.write.updateFraudOracle([newOracle]);

      const updatedOracle = await securedTransferContract.read.fraudOracle();
      assert.equal(updatedOracle.toLowerCase(), newOracle.toLowerCase());
    });

    it("Should revert if non-owner tries to update oracle", async function () {
      await assert.rejects(
        securedTransferContract.write.updateFraudOracle([other.account.address], { account: other.account })
      );
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Mint tokens and approve for seller as well
      await mockPYUSD.write.mint([seller.account.address, parseEther("1000")]);
      await mockPYUSD.write.approve(
        [securedTransferContract.address, parseEther("1000")],
        { account: seller.account }
      );
      
      // Create multiple escrows
      await securedTransferContract.write.deposit(
        [seller.account.address, escrowAmount, "Project 1"],
        { account: buyer.account }
      );
      await securedTransferContract.write.deposit(
        [buyer.account.address, escrowAmount, "Project 2"],
        { account: seller.account }
      );
    });

    it("Should return buyer escrows", async function () {
      const buyerEscrows = await securedTransferContract.read.getBuyerEscrows([buyer.account.address]);
      assert.equal(buyerEscrows.length, 1);
      assert.equal(buyerEscrows[0], 1n);
    });

    it("Should return seller escrows", async function () {
      const sellerEscrows = await securedTransferContract.read.getSellerEscrows([seller.account.address]);
      assert.equal(sellerEscrows.length, 1);
      assert.equal(sellerEscrows[0], 1n);
    });
  });
});
