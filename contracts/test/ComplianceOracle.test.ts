import { expect } from "chai";
import hre from "hardhat";
import { parseUnits } from "viem";

describe("ComplianceOracle", function () {
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

  describe("KYC Management", function () {
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

    it("Should return correct transaction limits", async function () {
      const { complianceOracle, user1 } = await deployComplianceOracleFixture();

      // Level 0 - $1,000
      let limit = await complianceOracle.read.getTransactionLimit([user1.account.address]);
      expect(limit).to.equal(parseUnits("1000", 6));

      // Level 1 - $10,000
      await complianceOracle.write.setKYCStatus([user1.account.address, 1]);
      limit = await complianceOracle.read.getTransactionLimit([user1.account.address]);
      expect(limit).to.equal(parseUnits("10000", 6));

      // Level 2 - $100,000
      await complianceOracle.write.setKYCStatus([user1.account.address, 2]);
      limit = await complianceOracle.read.getTransactionLimit([user1.account.address]);
      expect(limit).to.equal(parseUnits("100000", 6));

      // Level 3 - Unlimited
      await complianceOracle.write.setKYCStatus([user1.account.address, 3]);
      limit = await complianceOracle.read.getTransactionLimit([user1.account.address]);
      expect(limit).to.equal(BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));
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

  describe("AML Risk Scoring", function () {
    it("Should set AML risk score correctly", async function () {
      const { complianceOracle, user1 } = await deployComplianceOracleFixture();

      await complianceOracle.write.setAMLRiskScore([user1.account.address, 50]);

      const score = await complianceOracle.read.getAMLRiskScore([user1.account.address]);
      expect(score).to.equal(50);
    });

    it("Should auto-blacklist high risk users", async function () {
      const { complianceOracle, user1 } = await deployComplianceOracleFixture();

      // Set high risk score (> 80)
      await complianceOracle.write.setAMLRiskScore([user1.account.address, 85]);

      // Check if blacklisted
      const isBlacklisted = await complianceOracle.read.blacklistedAddresses([user1.account.address]);
      expect(isBlacklisted).to.be.true;
    });
  });

  describe("Escrow Compliance Checks", function () {
    it("Should flag escrow if buyer has no KYC", async function () {
      const { complianceOracle, user1, user2 } = await deployComplianceOracleFixture();

      // user1 has no KYC, user2 has KYC
      await complianceOracle.write.setKYCStatus([user2.account.address, 1]);

      const result = await complianceOracle.read.checkEscrow([
        1n,
        user1.account.address,
        user2.account.address,
        parseUnits("500", 6)
      ]);

      expect(result[0]).to.be.true; // isFlagged
      expect(result[1]).to.include("KYC verification");
    });

    it("Should flag escrow if amount exceeds buyer's limit", async function () {
      const { complianceOracle, user1, user2 } = await deployComplianceOracleFixture();

      // user1 has Basic KYC (limit $10,000)
      await complianceOracle.write.setKYCStatus([user1.account.address, 1]);
      await complianceOracle.write.setKYCStatus([user2.account.address, 1]);

      // Try to create escrow for $15,000 (exceeds limit)
      const result = await complianceOracle.read.checkEscrow([
        1n,
        user1.account.address,
        user2.account.address,
        parseUnits("15000", 6)
      ]);

      expect(result[0]).to.be.true; // isFlagged
      expect(result[1]).to.include("KYC limit");
    });

    it("Should flag escrow if buyer has high AML risk", async function () {
      const { complianceOracle, user1, user2 } = await deployComplianceOracleFixture();

      await complianceOracle.write.setKYCStatus([user1.account.address, 1]);
      await complianceOracle.write.setKYCStatus([user2.account.address, 1]);
      await complianceOracle.write.setAMLRiskScore([user1.account.address, 85]);

      const result = await complianceOracle.read.checkEscrow([
        1n,
        user1.account.address,
        user2.account.address,
        parseUnits("500", 6)
      ]);

      expect(result[0]).to.be.true; // isFlagged
      expect(result[1]).to.include("AML risk");
    });

    it("Should allow valid escrow", async function () {
      const { complianceOracle, user1, user2 } = await deployComplianceOracleFixture();

      // Both users have valid KYC and low risk
      await complianceOracle.write.setKYCStatus([user1.account.address, 1]);
      await complianceOracle.write.setKYCStatus([user2.account.address, 1]);
      await complianceOracle.write.setAMLRiskScore([user1.account.address, 10]);
      await complianceOracle.write.setAMLRiskScore([user2.account.address, 15]);

      const result = await complianceOracle.read.checkEscrow([
        1n,
        user1.account.address,
        user2.account.address,
        parseUnits("500", 6)
      ]);

      expect(result[0]).to.be.false; // not flagged
    });
  });

  describe("Get Compliance Info", function () {
    it("Should return comprehensive compliance info", async function () {
      const { complianceOracle, user1 } = await deployComplianceOracleFixture();

      await complianceOracle.write.setKYCStatus([user1.account.address, 2]);
      await complianceOracle.write.setAMLRiskScore([user1.account.address, 25]);

      const info = await complianceOracle.read.getComplianceInfo([user1.account.address]);

      expect(info[0]).to.equal(2); // KYC level
      expect(info[1]).to.equal(parseUnits("100000", 6)); // Transaction limit
      expect(info[2]).to.equal(25); // AML risk score
      expect(info[3]).to.be.false; // Not blacklisted
      expect(info[4]).to.be.greaterThan(0n); // Verified timestamp
    });
  });
});
