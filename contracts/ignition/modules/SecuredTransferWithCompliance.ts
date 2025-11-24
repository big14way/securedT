import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * SecuredTransfer with RWA Compliance Oracle Deployment Module
 * 
 * This module:
 * 1. Deploys ComplianceOracle (with KYC and AML features)
 * 2. Deploys SecuredTransferContract with the compliance oracle address
 * 
 * Usage:
 *   npx hardhat ignition deploy ignition/modules/SecuredTransferWithCompliance.ts --network mantleSepolia
 *   npx hardhat ignition deploy ignition/modules/SecuredTransferWithCompliance.ts --network mantleMainnet
 */
export default buildModule("SecuredTransferWithComplianceModule", (m) => {
  // Get network from environment
  const network = process.env.HARDHAT_NETWORK || process.env.NEXT_PUBLIC_NETWORK || 'mantleSepolia';
  
  // Stablecoin token addresses on Mantle Network
  // Using USDT as default stablecoin (6 decimals, same as PYUSD)
  const defaultStablecoinAddress = 
    network === 'mantleMainnet' || network === 'mainnet'
      ? '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE' // USDT on Mantle Mainnet
      : '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE'; // USDT on Mantle Sepolia (update with actual testnet address)
  
  // Get stablecoin token address from parameters (with network-appropriate default)
  const stablecoinAddress = m.getParameter("stablecoinToken", defaultStablecoinAddress);
  
  // Step 1: Deploy ComplianceOracle (RWA compliance with KYC/AML)
  const complianceOracle = m.contract("ComplianceOracle");
  
  // Step 2: Deploy SecuredTransferContract with the compliance oracle address
  const securedTransferContract = m.contract("SecuredTransferContract", [
    stablecoinAddress,
    complianceOracle
  ]);

  return { 
    complianceOracle,
    securedTransferContract
  };
});
