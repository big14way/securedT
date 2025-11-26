import { expect } from "chai";
import hre from "hardhat";
import { parseUnits } from "viem";

describe("CollateralEscrow", function () {
  async function deployCollateralEscrowFixture() {
    const [deployer, buyer, seller, other] = await hre.viem.getWalletClients();
    
    // Deploy mock USDT token (6 decimals like real USDT)
    const mockUSDT = await hre.viem.deployContract("MockERC20", ["Mock USDT", "USDT", 6]);
    
    // Deploy mock INIT Capital contract
    const mockInitCapital = await hre.viem.deployContract("MockINITCapital", [mockUSDT.address]);
    
    // Deploy CollateralEscrow contract
    const collateralEscrow = await hre.viem.deployContract("CollateralEscrow", [
      mockUSDT.address,
      deployer.account.address, // fraud oracle
      mockInitCapital.address
    ]);
    
    const publicClient = await hre.viem.getPublicClient();

    // Mint USDT tokens to buyer and seller for testing
    await mockUSDT.write.mint([buyer.account.address, parseUnits("100000", 6)]);
    await mockUSDT.write.mint([seller.account.address, parseUnits("100000", 6)]);
    
    // Approve CollateralEscrow contract to spend buyer's USDT
    await mockUSDT.write.approve([collateralEscrow.address, parseUnits("100000", 6)], { account: buyer.account });
    
    // Fund mock INIT Capital with USDT for borrowing
    await mockUSDT.write.mint([mockInitCapital.address, parseUnits("1000000", 6)]);

    return {
      collateralEscrow,
      mockUSDT,
      mockInitCapital,
      deployer,
      buyer,
      seller,
      other,
      publicClient
    };
  }

  const escrowAmount = parseUnits("10000", 6); // 10,000 USDT
  const description = "Website redesign project";

  describe("Deployment", function () {
    it("Should set the correct USDT token address", async function () {
      const { collateralEscrow, mockUSDT } = await deployCollateralEscrowFixture();
      
      const tokenAddress = await collateralEscrow.read.pyusdToken();
      expect(tokenAddress.toLowerCase()).to.equal(mockUSDT.address.toLowerCase());
    });

    it("Should set the correct fraud oracle", async function () {
      const { collateralEscrow, deployer } = await deployCollateralEscrowFixture();
      
      const oracle = await collateralEscrow.read.fraudOracle();
      expect(oracle.toLowerCase()).to.equal(deployer.account.address.toLowerCase());
    });

    it("Should set the correct INIT Capital address", async function () {
      const { collateralEscrow, mockInitCapital } = await deployCollateralEscrowFixture();
      
      const initCapitalAddress = await collateralEscrow.read.initCapital();
      expect(initCapitalAddress.toLowerCase()).to.equal(mockInitCapital.address.toLowerCase());
    });

    it("Should set the correct MAX_LTV to 80%", async function () {
      const { collateralEscrow } = await deployCollateralEscrowFixture();
      
      const maxLtv = await collateralEscrow.read.MAX_LTV();
      expect(maxLtv).to.equal(8000n); // 8000 basis points = 80%
    });

    it("Should set the deployer as owner", async function () {
      const { collateralEscrow, deployer } = await deployCollateralEscrowFixture();
      
      const owner = await collateralEscrow.read.owner();
      expect(owner.toLowerCase()).to.equal(deployer.account.address.toLowerCase());
    });
  });

  describe("Create Escrow", function () {
    it("Should create escrow successfully", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );

      const escrow = await collateralEscrow.read.getEscrow([10001n]);
      expect(escrow.buyer.toLowerCase()).to.equal(buyer.account.address.toLowerCase());
      expect(escrow.seller.toLowerCase()).to.equal(seller.account.address.toLowerCase());
      expect(escrow.amount).to.equal(escrowAmount);
      expect(escrow.description).to.equal(description);
      expect(escrow.status).to.equal(0); // EscrowStatus.Active
    });
  });

  describe("Deposit as Collateral", function () {
    it("Should deposit escrow as collateral successfully", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      // Create escrow
      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );

      // Deposit as collateral
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });

      const collateralData = await collateralEscrow.read.collateralData([10001n]);
      expect(collateralData.isCollateralized).to.be.true;
      expect(collateralData.suppliedAmount).to.equal(escrowAmount);
      expect(collateralData.borrowedAmount).to.equal(0n);
    });

    it("Should transfer USDT to INIT Capital", async function () {
      const { collateralEscrow, mockUSDT, mockInitCapital, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );

      const initCapitalBalanceBefore = await mockUSDT.read.balanceOf([mockInitCapital.address]);

      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });

      const initCapitalBalanceAfter = await mockUSDT.read.balanceOf([mockInitCapital.address]);
      expect(initCapitalBalanceAfter - initCapitalBalanceBefore).to.equal(escrowAmount);
    });

    it("Should revert if not called by buyer", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );

      await expect(
        collateralEscrow.write.depositAsCollateral([10001n], { account: seller.account })
      ).to.be.rejectedWith("Only buyer can call this");
    });

    it("Should revert if already collateralized", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });

      await expect(
        collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account })
      ).to.be.rejectedWith("Already collateralized");
    });
  });

  describe("Borrow Against Escrow", function () {
    it("Should borrow against collateral successfully", async function () {
      const { collateralEscrow, mockUSDT, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });

      const borrowAmount = parseUnits("5000", 6);
      const buyerBalanceBefore = await mockUSDT.read.balanceOf([buyer.account.address]);

      await collateralEscrow.write.borrowAgainstEscrow([10001n, borrowAmount], { account: buyer.account });

      const buyerBalanceAfter = await mockUSDT.read.balanceOf([buyer.account.address]);
      expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(borrowAmount);

      const collateralData = await collateralEscrow.read.collateralData([10001n]);
      expect(collateralData.borrowedAmount).to.equal(borrowAmount);
    });

    it("Should borrow maximum 80% LTV", async function () {
      const { collateralEscrow, mockUSDT, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });

      const maxBorrowAmount = parseUnits("8000", 6);
      const buyerBalanceBefore = await mockUSDT.read.balanceOf([buyer.account.address]);

      await collateralEscrow.write.borrowAgainstEscrow([10001n, maxBorrowAmount], { account: buyer.account });

      const buyerBalanceAfter = await mockUSDT.read.balanceOf([buyer.account.address]);
      expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(maxBorrowAmount);
    });

    it("Should allow multiple borrows up to limit", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });

      const firstBorrow = parseUnits("4000", 6);
      const secondBorrow = parseUnits("4000", 6);

      await collateralEscrow.write.borrowAgainstEscrow([10001n, firstBorrow], { account: buyer.account });
      await collateralEscrow.write.borrowAgainstEscrow([10001n, secondBorrow], { account: buyer.account });

      const collateralData = await collateralEscrow.read.collateralData([10001n]);
      expect(collateralData.borrowedAmount).to.equal(firstBorrow + secondBorrow);
    });

    it("Should revert if not collateralized", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );

      await expect(
        collateralEscrow.write.borrowAgainstEscrow([10001n, parseUnits("1000", 6)], { account: buyer.account })
      ).to.be.rejectedWith("Not collateralized");
    });

    it("Should revert if exceeds borrow limit", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });

      const overLimitAmount = parseUnits("8001", 6);

      await expect(
        collateralEscrow.write.borrowAgainstEscrow([10001n, overLimitAmount], { account: buyer.account })
      ).to.be.rejectedWith("Exceeds borrow limit");
    });
  });

  describe("Repay Borrowed", function () {
    it("Should repay borrowed amount successfully", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });
      await collateralEscrow.write.borrowAgainstEscrow([10001n, parseUnits("5000", 6)], { account: buyer.account });

      const repayAmount = parseUnits("2000", 6);
      await collateralEscrow.write.repayBorrowed([10001n, repayAmount], { account: buyer.account });

      const collateralData = await collateralEscrow.read.collateralData([10001n]);
      expect(collateralData.borrowedAmount).to.equal(parseUnits("3000", 6));
    });

    it("Should repay full borrowed amount", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });
      await collateralEscrow.write.borrowAgainstEscrow([10001n, parseUnits("5000", 6)], { account: buyer.account });

      const fullRepayAmount = parseUnits("5000", 6);
      await collateralEscrow.write.repayBorrowed([10001n, fullRepayAmount], { account: buyer.account });

      const collateralData = await collateralEscrow.read.collateralData([10001n]);
      expect(collateralData.borrowedAmount).to.equal(0n);
    });

    it("Should revert if amount is zero", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });
      await collateralEscrow.write.borrowAgainstEscrow([10001n, parseUnits("5000", 6)], { account: buyer.account });

      await expect(
        collateralEscrow.write.repayBorrowed([10001n, 0n], { account: buyer.account })
      ).to.be.rejectedWith("Amount must be greater than 0");
    });

    it("Should allow anyone to repay (not just buyer)", async function () {
      const { collateralEscrow, mockUSDT, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });
      await collateralEscrow.write.borrowAgainstEscrow([10001n, parseUnits("5000", 6)], { account: buyer.account });

      const repayAmount = parseUnits("1000", 6);

      // Seller repays on behalf of buyer
      await mockUSDT.write.approve([collateralEscrow.address, parseUnits("10000", 6)], { account: seller.account });
      await collateralEscrow.write.repayBorrowed([10001n, repayAmount], { account: seller.account });

      const collateralData = await collateralEscrow.read.collateralData([10001n]);
      expect(collateralData.borrowedAmount).to.equal(parseUnits("4000", 6));
    });
  });

  describe("Release With Collateral", function () {
    it("Should release with collateral unwinding when no debt", async function () {
      const { collateralEscrow, mockUSDT, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });

      const sellerBalanceBefore = await mockUSDT.read.balanceOf([seller.account.address]);

      await collateralEscrow.write.releaseWithCollateral([10001n], { account: buyer.account });

      const sellerBalanceAfter = await mockUSDT.read.balanceOf([seller.account.address]);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(escrowAmount);

      // Check escrow status
      const escrow = await collateralEscrow.read.getEscrow([10001n]);
      expect(escrow.status).to.equal(1); // EscrowStatus.Released

      // Check collateral is unwound
      const collateralData = await collateralEscrow.read.collateralData([10001n]);
      expect(collateralData.isCollateralized).to.be.false;
    });

    it("Should revert if outstanding debt exists", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });
      await collateralEscrow.write.borrowAgainstEscrow([10001n, parseUnits("5000", 6)], { account: buyer.account });

      await expect(
        collateralEscrow.write.releaseWithCollateral([10001n], { account: buyer.account })
      ).to.be.rejectedWith("Outstanding debt exists");
    });

    it("Should release after full repayment", async function () {
      const { collateralEscrow, mockUSDT, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });
      await collateralEscrow.write.borrowAgainstEscrow([10001n, parseUnits("5000", 6)], { account: buyer.account });
      await collateralEscrow.write.repayBorrowed([10001n, parseUnits("5000", 6)], { account: buyer.account });

      const sellerBalanceBefore = await mockUSDT.read.balanceOf([seller.account.address]);

      await collateralEscrow.write.releaseWithCollateral([10001n], { account: buyer.account });

      const sellerBalanceAfter = await mockUSDT.read.balanceOf([seller.account.address]);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(escrowAmount);
    });
  });

  describe("View Functions", function () {
    it("Should return correct borrow limit", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });

      const borrowLimit = await collateralEscrow.read.getBorrowLimit([10001n]);
      const expectedLimit = parseUnits("8000", 6); // 80% of 10,000
      expect(borrowLimit).to.equal(expectedLimit);
    });

    it("Should return correct available to borrow", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });

      const available = await collateralEscrow.read.getAvailableToBorrow([10001n]);
      const expectedAvailable = parseUnits("8000", 6);
      expect(available).to.equal(expectedAvailable);
    });

    it("Should return updated available after borrowing", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });
      await collateralEscrow.write.borrowAgainstEscrow([10001n, parseUnits("3000", 6)], { account: buyer.account });

      const available = await collateralEscrow.read.getAvailableToBorrow([10001n]);
      const expectedAvailable = parseUnits("5000", 6); // 8000 - 3000
      expect(available).to.equal(expectedAvailable);
    });

    it("Should return complete collateral info", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, description],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });
      await collateralEscrow.write.borrowAgainstEscrow([10001n, parseUnits("5000", 6)], { account: buyer.account });

      const info = await collateralEscrow.read.getCollateralInfo([10001n]);

      expect(info[0]).to.be.true; // isCollateralized
      expect(info[1]).to.equal(escrowAmount); // suppliedAmount
      expect(info[2]).to.equal(parseUnits("5000", 6)); // borrowedAmount
      expect(info[3]).to.equal(parseUnits("3000", 6)); // availableToBorrow
      expect(info[4]).to.be.greaterThan(0n); // timestamp
    });
  });

  describe("Integration Scenarios", function () {
    it("Should handle complete freelancer workflow", async function () {
      const { collateralEscrow, mockUSDT, buyer, seller } = await deployCollateralEscrowFixture();

      // 1. Client creates $10,000 escrow
      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, "Website redesign"],
        { account: buyer.account }
      );

      // 2. Freelancer deposits as collateral
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });

      // 3. Freelancer borrows $8,000
      const borrowAmount = parseUnits("8000", 6);
      await collateralEscrow.write.borrowAgainstEscrow([10001n, borrowAmount], { account: buyer.account });

      const buyerBalance = await mockUSDT.read.balanceOf([buyer.account.address]);
      expect(buyerBalance).to.be.greaterThanOrEqual(borrowAmount);

      // 4. Freelancer repays loan
      await collateralEscrow.write.repayBorrowed([10001n, borrowAmount], { account: buyer.account });

      // 5. Client releases payment
      const sellerBalanceBefore = await mockUSDT.read.balanceOf([seller.account.address]);
      await collateralEscrow.write.releaseWithCollateral([10001n], { account: buyer.account });
      const sellerBalanceAfter = await mockUSDT.read.balanceOf([seller.account.address]);

      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(escrowAmount);
    });

    it("Should handle partial borrowing and repayment", async function () {
      const { collateralEscrow, buyer, seller } = await deployCollateralEscrowFixture();

      await collateralEscrow.write.deposit(
        [seller.account.address, escrowAmount, "Project"],
        { account: buyer.account }
      );
      await collateralEscrow.write.depositAsCollateral([10001n], { account: buyer.account });

      // Borrow in two parts
      await collateralEscrow.write.borrowAgainstEscrow([10001n, parseUnits("3000", 6)], { account: buyer.account });
      await collateralEscrow.write.borrowAgainstEscrow([10001n, parseUnits("2000", 6)], { account: buyer.account });

      let collateralData = await collateralEscrow.read.collateralData([10001n]);
      expect(collateralData.borrowedAmount).to.equal(parseUnits("5000", 6));

      // Repay in parts
      await collateralEscrow.write.repayBorrowed([10001n, parseUnits("2000", 6)], { account: buyer.account });
      await collateralEscrow.write.repayBorrowed([10001n, parseUnits("3000", 6)], { account: buyer.account });

      collateralData = await collateralEscrow.read.collateralData([10001n]);
      expect(collateralData.borrowedAmount).to.equal(0n);
    });
  });
});
