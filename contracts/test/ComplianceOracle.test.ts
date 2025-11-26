import { expect } from "chai";
import hre from "hardhat";
import { parseUnits } from "viem";

describe("ComplianceOracle - Web3-Native Fraud Protection", function () {
  async function deployComplianceOracleFixture() {
    const [owner, user1, user2] = await hre.viem.getWalletClients();

    const complianceOracle = await hre.viem.deployContract("ComplianceOracle");
    const publicClient = await hre.viem.getPublicClient();

    return {
      complianceOracle,
      owner,
      user1,
      user2,
      publicClient
    };
  }

  describe("Permissionless Design (Web3 Best Practice)", function () {
    it("Should allow escrows WITHOUT KYC (permissionless)", async function () {
      const { complianceOracle, user1, user2 } = await deployComplianceOracleFixture();

      // Both users have NO KYC - should still work (Web3 principle)
      const result = await complianceOracle.read.checkEscrow([
        1n,
        user1.account.address,
        user2.account.address,
        parseUnits("5000", 6)
      ]);

      expect(result[0]).to.be.false; // NOT flagged - permissionless access
      expect(result[1]).to.equal(""); // No reason
    });

    it("Should have unlimited transaction limits by default", async function () {
      const { complianceOracle, user1 } = await deployComplianceOracleFixture();

      // Level 0 (no KYC) - should be unlimited (Web3 best practice)
      const limit = await complianceOracle.read.getTransactionLimit([user1.account.address]);
      const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      expect(limit).to.equal(maxUint256);
    });

    it("Should allow any transaction amount without KYC", async function () {
      const { complianceOracle, user1, user2 } = await deployComplianceOracleFixture();

      // Try creating a large escrow without KYC
      const result = await complianceOracle.read.checkEscrow([
        1n,
        user1.account.address,
        user2.account.address,
        parseUnits("1000000", 6) // $1M - should work without KYC
      ]);

      expect(result[0]).to.be.false; // NOT flagged
    });
  });

  describe("Optional KYC (Badge/Compliance Only)", function () {
    it("Should set KYC status correctly", async function () {
      const { complianceOracle, user1 } = await deployComplianceOracleFixture();

      // Set KYC level to Basic (1)
      await complianceOracle.write.setKYCStatus([user1.account.address, 1]);

      // Check KYC level
      const level = await complianceOracle.read.getKYCLevel([user1.account.address]);
      expect(level).to.equal(1);

      // Check if verified
      const isVerified = await complianceOracle.read.isKYCVerified([user1.account.address]);
      expect(isVerified).to.be.true;
    });

    it("Should return unlimited limits for all KYC levels", async function () {
      const { complianceOracle, user1 } = await deployComplianceOracleFixture();
      const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

      // Level 0 - Unlimited
      let limit = await complianceOracle.read.getTransactionLimit([user1.account.address]);
      expect(limit).to.equal(maxUint256);

      // Level 1 - Still unlimited
      await complianceOracle.write.setKYCStatus([user1.account.address, 1]);
      limit = await complianceOracle.read.getTransactionLimit([user1.account.address]);
      expect(limit).to.equal(maxUint256);

      // Level 2 - Still unlimited
      await complianceOracle.write.setKYCStatus([user1.account.address, 2]);
      limit = await complianceOracle.read.getTransactionLimit([user1.account.address]);
      expect(limit).to.equal(maxUint256);

      // Level 3 - Unlimited
      await complianceOracle.write.setKYCStatus([user1.account.address, 3]);
      limit = await complianceOracle.read.getTransactionLimit([user1.account.address]);
      expect(limit).to.equal(maxUint256);
    });

    it("Should batch set KYC status", async function () {
      const { complianceOracle, user1, user2 } = await deployComplianceOracleFixture();

      await complianceOracle.write.batchSetKYCStatus(
        [[user1.account.address, user2.account.address], [1, 2]]
      );

      const level1 = await complianceOracle.read.getKYCLevel([user1.account.address]);
      const level2 = await complianceOracle.read.getKYCLevel([user2.account.address]);

      expect(level1).to.equal(1);
      expect(level2).to.equal(2);
    });
  });

  describe("Fraud Protection (Actual Security)", function () {
    it("Should flag blacklisted addresses", async function () {
      const { complianceOracle, user1, user2 } = await deployComplianceOracleFixture();

      // Blacklist user1 for fraud
      await complianceOracle.write.blacklistAddress([user1.account.address, "Fraudulent activity detected"]);

      const result = await complianceOracle.read.checkEscrow([
        1n,
        user1.account.address,
        user2.account.address,
        parseUnits("500", 6)
      ]);

      expect(result[0]).to.be.true; // Flagged
      expect(result[1]).to.include("blacklisted");
    });

    it("Should flag high AML risk scores", async function () {
      const { complianceOracle, user1, user2 } = await deployComplianceOracleFixture();

      // Set high risk score for user1
      await complianceOracle.write.setAMLRiskScore([user1.account.address, 85]);

      const result = await complianceOracle.read.checkEscrow([
        1n,
        user1.account.address,
        user2.account.address,
        parseUnits("500", 6)
      ]);

      expect(result[0]).to.be.true; // Flagged
      expect(result[1]).to.include("AML risk score");
    });

    it("Should prevent wash trading (same buyer/seller)", async function () {
      const { complianceOracle, user1 } = await deployComplianceOracleFixture();

      const result = await complianceOracle.read.checkEscrow([
        1n,
        user1.account.address,
        user1.account.address, // Same address for buyer and seller
        parseUnits("500", 6)
      ]);

      expect(result[0]).to.be.true; // Flagged
      expect(result[1]).to.include("same address");
    });

    it("Should auto-blacklist high risk users", async function () {
      const { complianceOracle, user1 } = await deployComplianceOracleFixture();

      // Set high risk score (> 80)
      await complianceOracle.write.setAMLRiskScore([user1.account.address, 85]);

      // Check if blacklisted
      const isBlacklisted = await complianceOracle.read.blacklistedAddresses([user1.account.address]);
      expect(isBlacklisted).to.be.true;
    });

    it("Should allow manual flagging", async function () {
      const { complianceOracle, user1, user2 } = await deployComplianceOracleFixture();

      // Manually flag an escrow
      await complianceOracle.write.flagEscrow([1n, user1.account.address, "Suspicious transaction pattern"]);

      const result = await complianceOracle.read.checkEscrow([
        1n,
        user1.account.address,
        user2.account.address,
        parseUnits("500", 6)
      ]);

      expect(result[0]).to.be.true; // Flagged
      expect(result[1]).to.include("Suspicious");
    });
  });

  describe("AML Risk Scoring", function () {
    it("Should set AML risk score correctly", async function () {
      const { complianceOracle, user1 } = await deployComplianceOracleFixture();

      await complianceOracle.write.setAMLRiskScore([user1.account.address, 50]);

      const score = await complianceOracle.read.getAMLRiskScore([user1.account.address]);
      expect(score).to.equal(50);
    });

    it("Should allow escrows with low AML risk (no KYC required)", async function () {
      const { complianceOracle, user1, user2 } = await deployComplianceOracleFixture();

      // Set low risk scores, no KYC
      await complianceOracle.write.setAMLRiskScore([user1.account.address, 10]);
      await complianceOracle.write.setAMLRiskScore([user2.account.address, 15]);

      const result = await complianceOracle.read.checkEscrow([
        1n,
        user1.account.address,
        user2.account.address,
        parseUnits("500", 6)
      ]);

      expect(result[0]).to.be.false; // NOT flagged - permissionless
    });
  });

  describe("Get Compliance Info", function () {
    it("Should return comprehensive compliance info", async function () {
      const { complianceOracle, user1 } = await deployComplianceOracleFixture();

      await complianceOracle.write.setKYCStatus([user1.account.address, 2]);
      await complianceOracle.write.setAMLRiskScore([user1.account.address, 25]);

      const info = await complianceOracle.read.getComplianceInfo([user1.account.address]);
      const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

      expect(info[0]).to.equal(2); // KYC level
      expect(info[1]).to.equal(maxUint256); // Transaction limit (unlimited)
      expect(info[2]).to.equal(25); // AML risk score
      expect(info[3]).to.be.false; // Not blacklisted
      expect(info[4]).to.be.greaterThan(0n); // Verified timestamp
    });

    it("Should return default info for users without KYC", async function () {
      const { complianceOracle, user1 } = await deployComplianceOracleFixture();

      const info = await complianceOracle.read.getComplianceInfo([user1.account.address]);
      const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

      expect(info[0]).to.equal(0); // KYC level 0
      expect(info[1]).to.equal(maxUint256); // Unlimited (permissionless)
      expect(info[2]).to.equal(0); // AML risk score 0
      expect(info[3]).to.be.false; // Not blacklisted
      expect(info[4]).to.equal(0n); // Not verified
    });
  });
});
