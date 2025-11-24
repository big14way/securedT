import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * SecuredTransfer with Fraud Oracle Deployment Module
 * 
 * This module:
 * 1. Deploys SimpleFraudOracle
 * 2. Deploys SecuredTransferContract with the oracle address
 * 
 * Usage:
 *   npx hardhat ignition deploy ignition/modules/SecuredTransferWithOracle.ts --network mantleSepolia
 *   npx hardhat ignition deploy ignition/modules/SecuredTransferWithOracle.ts --network mantleMainnet
 */
export default buildModule("SecuredTransferWithOracleModule", (m) => {
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
  
  // Step 1: Deploy SimpleFraudOracle
  const fraudOracle = m.contract("SimpleFraudOracle");
  
  // Step 2: Deploy SecuredTransferContract with the oracle address
  const securedTransferContract = m.contract("SecuredTransferContract", [
    stablecoinAddress,
    fraudOracle
  ]);

  return { 
    fraudOracle,
    securedTransferContract
  };
});
