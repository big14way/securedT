// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./SecuredTransferContract.sol";
import "./interfaces/IINITCapital.sol";

contract CollateralEscrow is SecuredTransferContract {
    IINITCapital public initCapital;
    
    struct CollateralData {
        bool isCollateralized;
        uint256 suppliedAmount;
        uint256 borrowedAmount;
        uint256 timestamp;
    }
    
    mapping(uint256 => CollateralData) public collateralData;
    uint256 public constant MAX_LTV = 8000; // 80% loan-to-value
    
    event EscrowCollateralized(uint256 indexed escrowId, uint256 amount);
    event BorrowedAgainstEscrow(uint256 indexed escrowId, uint256 amount);
    event CollateralRepaid(uint256 indexed escrowId, uint256 amount);
    event CollateralWithdrawn(uint256 indexed escrowId, uint256 amount);
    
    constructor(
        address _pyusdToken,
        address _complianceOracle,
        address _initCapital
    ) SecuredTransferContract(_pyusdToken, _complianceOracle) {
        require(_initCapital != address(0), "Invalid INIT Capital address");
        initCapital = IINITCapital(_initCapital);
    }
    
    // Deposit escrow as collateral on INIT Capital
    function depositAsCollateral(uint256 escrowId) 
        external 
        escrowExists(escrowId) 
        onlyBuyer(escrowId) 
        nonReentrant
    {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(!collateralData[escrowId].isCollateralized, "Already collateralized");
        
        // Approve INIT Capital to use PYUSD
        pyusdToken.approve(address(initCapital), escrow.amount);
        
        // Supply to INIT Capital
        initCapital.supply(address(pyusdToken), escrow.amount);
        
        collateralData[escrowId] = CollateralData({
            isCollateralized: true,
            suppliedAmount: escrow.amount,
            borrowedAmount: 0,
            timestamp: block.timestamp
        });
        
        emit EscrowCollateralized(escrowId, escrow.amount);
    }
    
    // Borrow against collateralized escrow
    function borrowAgainstEscrow(uint256 escrowId, uint256 amount) 
        external 
        escrowExists(escrowId) 
        onlyBuyer(escrowId) 
        nonReentrant
    {
        require(collateralData[escrowId].isCollateralized, "Not collateralized");
        
        Escrow storage escrow = escrows[escrowId];
        uint256 maxBorrow = (escrow.amount * MAX_LTV) / 10000;
        uint256 totalBorrowed = collateralData[escrowId].borrowedAmount + amount;
        
        require(totalBorrowed <= maxBorrow, "Exceeds borrow limit");
        
        // Borrow from INIT Capital
        initCapital.borrow(address(pyusdToken), amount);
        
        // Transfer to buyer
        pyusdToken.transfer(msg.sender, amount);
        
        collateralData[escrowId].borrowedAmount = totalBorrowed;
        
        emit BorrowedAgainstEscrow(escrowId, amount);
    }
    
    // Repay borrowed amount
    function repayBorrowed(uint256 escrowId, uint256 amount) 
        external 
        escrowExists(escrowId) 
        nonReentrant
    {
        require(collateralData[escrowId].isCollateralized, "Not collateralized");
        require(amount > 0, "Amount must be greater than 0");
        require(collateralData[escrowId].borrowedAmount >= amount, "Amount exceeds borrowed");
        
        // Transfer PYUSD from user
        pyusdToken.transferFrom(msg.sender, address(this), amount);
        
        // Repay to INIT Capital
        pyusdToken.approve(address(initCapital), amount);
        initCapital.repay(address(pyusdToken), amount);
        
        collateralData[escrowId].borrowedAmount -= amount;
        
        emit CollateralRepaid(escrowId, amount);
    }
    
    // Release with collateral unwinding
    function releaseWithCollateral(uint256 escrowId) 
        external 
        escrowExists(escrowId) 
        onlyBuyer(escrowId) 
        nonReentrant
    {
        Escrow storage escrow = escrows[escrowId];
        CollateralData storage colData = collateralData[escrowId];
        
        require(escrow.status == EscrowStatus.Active, "Escrow is not active");
        require(!escrow.fraudFlagged, "Cannot release flagged escrow");
        
        if (colData.isCollateralized) {
            // Ensure all borrowed amount is repaid
            require(colData.borrowedAmount == 0, "Outstanding debt exists");
            
            // Withdraw from INIT Capital
            initCapital.withdraw(address(pyusdToken), colData.suppliedAmount);
            
            // Mark as no longer collateralized
            colData.isCollateralized = false;
            
            emit CollateralWithdrawn(escrowId, colData.suppliedAmount);
        }
        
        // Standard release
        escrow.status = EscrowStatus.Released;
        pyusdToken.transfer(escrow.seller, escrow.amount);
        
        emit Released(escrowId, escrow.buyer, escrow.seller, escrow.amount);
    }
    
    // View functions
    function getBorrowLimit(uint256 escrowId) external view returns (uint256) {
        Escrow memory escrow = escrows[escrowId];
        return (escrow.amount * MAX_LTV) / 10000;
    }
    
    function getAvailableToBorrow(uint256 escrowId) external view returns (uint256) {
        uint256 maxBorrow = this.getBorrowLimit(escrowId);
        uint256 borrowed = collateralData[escrowId].borrowedAmount;
        return borrowed < maxBorrow ? maxBorrow - borrowed : 0;
    }
    
    function getCollateralInfo(uint256 escrowId) external view returns (
        bool isCollateralized,
        uint256 suppliedAmount,
        uint256 borrowedAmount,
        uint256 availableToBorrow,
        uint256 timestamp
    ) {
        CollateralData memory data = collateralData[escrowId];
        uint256 available = this.getAvailableToBorrow(escrowId);
        
        return (
            data.isCollateralized,
            data.suppliedAmount,
            data.borrowedAmount,
            available,
            data.timestamp
        );
    }
}
