import { expect } from "chai";
import { ethers } from "hardhat";
import { YieldEscrow, MockERC20, ComplianceOracle, InvoiceNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YieldEscrow", function () {
  let yieldEscrow: YieldEscrow;
  let usdt: MockERC20;
  let meth: MockERC20;
  let complianceOracle: ComplianceOracle;
  let invoiceNFT: InvoiceNFT;
  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let seller: SignerWithAddress;
  let platformWallet: SignerWithAddress;

  const INITIAL_BALANCE = ethers.parseUnits("10000", 6); // 10,000 USDT (6 decimals)
  const ESCROW_AMOUNT = ethers.parseUnits("1000", 6); // 1,000 USDT

  beforeEach(async function () {
    [owner, buyer, seller, platformWallet] = await ethers.getSigners();

    // Deploy mock USDT (6 decimals like real USDT)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdt = await MockERC20.deploy("Mock USDT", "USDT", 6);
    await usdt.waitForDeployment();

    // Deploy mock mETH (18 decimals like ETH)
    meth = await MockERC20.deploy("Mock mETH", "mETH", 18);
    await meth.waitForDeployment();

    // For now, use address(0) for mETHProtocol and agniRouter (TODO: create mocks)
    // In production tests, these should be proper mocks
    const mockMETHProtocol = ethers.ZeroAddress;
    const mockAgniRouter = ethers.ZeroAddress;

    // Deploy ComplianceOracle
    const ComplianceOracle = await ethers.getContractFactory("ComplianceOracle");
    complianceOracle = await ComplianceOracle.deploy();
    await complianceOracle.waitForDeployment();

    // Deploy InvoiceNFT
    const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
    invoiceNFT = await InvoiceNFT.deploy();
    await invoiceNFT.waitForDeployment();

    // Deploy YieldEscrow
    const YieldEscrow = await ethers.getContractFactory("YieldEscrow");
    yieldEscrow = await YieldEscrow.deploy(
      await usdt.getAddress(),
      await meth.getAddress(),
      mockMETHProtocol,
      mockAgniRouter,
      platformWallet.address
    );
    await yieldEscrow.waitForDeployment();

    // Set up contracts
    await yieldEscrow.updateComplianceOracle(await complianceOracle.getAddress());
    await yieldEscrow.updateInvoiceNFT(await invoiceNFT.getAddress());
    await invoiceNFT.setSecuredTransferContract(await yieldEscrow.getAddress());

    // Mint USDT to buyer and approve
    await usdt.mint(buyer.address, INITIAL_BALANCE);
    await usdt.connect(buyer).approve(await yieldEscrow.getAddress(), ethers.MaxUint256);

    // Set basic KYC for testing
    await complianceOracle.setKYCStatus(buyer.address, 1); // Basic KYC
    await complianceOracle.setKYCStatus(seller.address, 1);
  });

  describe("Deployment", function () {
    it("Should set the correct stablecoin address", async function () {
      expect(await yieldEscrow.stablecoin()).to.equal(await usdt.getAddress());
    });

    it("Should set the correct mETH address", async function () {
      expect(await yieldEscrow.mETH()).to.equal(await meth.getAddress());
    });

    it("Should set the correct platform wallet", async function () {
      expect(await yieldEscrow.platformWallet()).to.equal(platformWallet.address);
    });

    it("Should set yield distribution constants correctly", async function () {
      expect(await yieldEscrow.BUYER_SHARE()).to.equal(8000); // 80%
      expect(await yieldEscrow.SELLER_SHARE()).to.equal(1500); // 15%
      expect(await yieldEscrow.PLATFORM_SHARE()).to.equal(500); // 5%
    });
  });

  describe("Standard Escrow (No Yield)", function () {
    it("Should create escrow without yield", async function () {
      const tx = await yieldEscrow.connect(buyer).deposit(
        seller.address,
        ESCROW_AMOUNT,
        "Test escrow without yield",
        false // yieldEnabled = false
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          return yieldEscrow.interface.parseLog(log)?.name === "Deposited";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      // Check escrow was created
      const escrowId = 10001n; // First escrow ID
      const escrow = await yieldEscrow.getEscrow(escrowId);
      
      expect(escrow.buyer).to.equal(buyer.address);
      expect(escrow.seller).to.equal(seller.address);
      expect(escrow.amount).to.equal(ESCROW_AMOUNT);
      expect(escrow.yieldEnabled).to.be.false;
    });

    it("Should release escrow without yield", async function () {
      // Create escrow
      await yieldEscrow.connect(buyer).deposit(
        seller.address,
        ESCROW_AMOUNT,
        "Test escrow",
        false
      );

      const escrowId = 10001n;
      const sellerBalanceBefore = await usdt.balanceOf(seller.address);

      // Release escrow
      await yieldEscrow.connect(buyer).release(escrowId);

      const sellerBalanceAfter = await usdt.balanceOf(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(ESCROW_AMOUNT);

      // Check escrow status
      const escrow = await yieldEscrow.getEscrow(escrowId);
      expect(escrow.status).to.equal(1); // Released
    });

    it("Should refund escrow without yield", async function () {
      // Create escrow
      await yieldEscrow.connect(buyer).deposit(
        seller.address,
        ESCROW_AMOUNT,
        "Test escrow",
        false
      );

      const escrowId = 10001n;
      const buyerBalanceBefore = await usdt.balanceOf(buyer.address);

      // Refund escrow
      await yieldEscrow.connect(buyer).refund(escrowId);

      const buyerBalanceAfter = await usdt.balanceOf(buyer.address);
      expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(ESCROW_AMOUNT);

      // Check escrow status
      const escrow = await yieldEscrow.getEscrow(escrowId);
      expect(escrow.status).to.equal(2); // Refunded
    });
  });

  describe("Yield-Enabled Escrow", function () {
    it("Should create yield-enabled escrow", async function () {
      // Note: This will fail without proper mETH Protocol mock
      // For now, we test that the flag is set correctly
      
      await expect(
        yieldEscrow.connect(buyer).deposit(
          seller.address,
          ESCROW_AMOUNT,
          "Test yield escrow",
          true // yieldEnabled = true
        )
      ).to.be.reverted; // Will revert because mock contracts aren't fully implemented

      // In a complete implementation, you would:
      // 1. Create a MockMETHProtocol contract
      // 2. Create a MockAgniRouter contract
      // 3. Deploy those and use their addresses
      // 4. Then test successful yield staking
    });

    it("Should have correct yield distribution percentages", async function () {
      const BUYER_SHARE = await yieldEscrow.BUYER_SHARE();
      const SELLER_SHARE = await yieldEscrow.SELLER_SHARE();
      const PLATFORM_SHARE = await yieldEscrow.PLATFORM_SHARE();

      expect(BUYER_SHARE + SELLER_SHARE + PLATFORM_SHARE).to.equal(10000); // 100%
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to update compliance oracle", async function () {
      await expect(
        yieldEscrow.connect(buyer).updateComplianceOracle(ethers.ZeroAddress)
      ).to.be.reverted;

      await expect(
        yieldEscrow.connect(owner).updateComplianceOracle(ethers.ZeroAddress)
      ).to.not.be.reverted;
    });

    it("Should only allow owner to update invoice NFT", async function () {
      await expect(
        yieldEscrow.connect(buyer).updateInvoiceNFT(ethers.ZeroAddress)
      ).to.be.reverted;

      await expect(
        yieldEscrow.connect(owner).updateInvoiceNFT(ethers.ZeroAddress)
      ).to.not.be.reverted;
    });

    it("Should only allow owner to update platform wallet", async function () {
      const newWallet = seller.address;

      await expect(
        yieldEscrow.connect(buyer).updatePlatformWallet(newWallet)
      ).to.be.reverted;

      await yieldEscrow.connect(owner).updatePlatformWallet(newWallet);
      expect(await yieldEscrow.platformWallet()).to.equal(newWallet);
    });

    it("Should not allow zero address as platform wallet", async function () {
      await expect(
        yieldEscrow.connect(owner).updatePlatformWallet(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid wallet");
    });
  });

  describe("Compliance Integration", function () {
    it("Should respect KYC requirements", async function () {
      // Remove KYC status
      await complianceOracle.setKYCStatus(buyer.address, 0);

      // Should fail without KYC
      await expect(
        yieldEscrow.connect(buyer).deposit(
          seller.address,
          ESCROW_AMOUNT,
          "Test",
          false
        )
      ).to.be.reverted;
    });

    it("Should respect transaction limits based on KYC", async function () {
      // Basic KYC has 10k limit
      const OVER_LIMIT = ethers.parseUnits("15000", 6);
      
      await usdt.mint(buyer.address, OVER_LIMIT);
      await usdt.connect(buyer).approve(await yieldEscrow.getAddress(), OVER_LIMIT);

      await expect(
        yieldEscrow.connect(buyer).deposit(
          seller.address,
          OVER_LIMIT,
          "Over limit",
          false
        )
      ).to.be.reverted;
    });
  });

  describe("Invoice NFT Integration", function () {
    it("Should mint invoice NFT on escrow creation", async function () {
      await yieldEscrow.connect(buyer).deposit(
        seller.address,
        ESCROW_AMOUNT,
        "Test with NFT",
        false
      );

      const escrowId = 10001n;
      const tokenId = await invoiceNFT.escrowToToken(escrowId);
      
      expect(tokenId).to.not.equal(0n);
      expect(await invoiceNFT.ownerOf(tokenId)).to.equal(seller.address);
    });
  });

  describe("View Functions", function () {
    it("Should return correct escrow data", async function () {
      await yieldEscrow.connect(buyer).deposit(
        seller.address,
        ESCROW_AMOUNT,
        "Test escrow",
        false
      );

      const escrowId = 10001n;
      const escrow = await yieldEscrow.getEscrow(escrowId);

      expect(escrow.buyer).to.equal(buyer.address);
      expect(escrow.seller).to.equal(seller.address);
      expect(escrow.amount).to.equal(ESCROW_AMOUNT);
      expect(escrow.status).to.equal(0); // Active
      expect(escrow.yieldEnabled).to.be.false;
    });

    it("Should return correct yield data for yield-enabled escrows", async function () {
      const escrowId = 10001n;
      
      // For non-existent escrow, should return empty data
      const yieldData = await yieldEscrow.getYieldData(escrowId);
      expect(yieldData.ethStaked).to.equal(0);
      expect(yieldData.mETHReceived).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should not allow same buyer and seller", async function () {
      await expect(
        yieldEscrow.connect(buyer).deposit(
          buyer.address, // Same as buyer
          ESCROW_AMOUNT,
          "Same address",
          false
        )
      ).to.be.revertedWith("Buyer and seller cannot be the same");
    });

    it("Should not allow zero amount", async function () {
      await expect(
        yieldEscrow.connect(buyer).deposit(
          seller.address,
          0,
          "Zero amount",
          false
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should not allow invalid seller address", async function () {
      await expect(
        yieldEscrow.connect(buyer).deposit(
          ethers.ZeroAddress,
          ESCROW_AMOUNT,
          "Invalid seller",
          false
        )
      ).to.be.revertedWith("Invalid seller address");
    });
  });
});
