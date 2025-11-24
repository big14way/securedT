import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SecuredTransferContractModule", (m) => {
  // Get network from environment
  const network = process.env.HARDHAT_NETWORK || process.env.NEXT_PUBLIC_NETWORK || 'mantleSepolia';
  
  // Stablecoin token addresses on Mantle Network
  const defaultStablecoinAddress = 
    network === 'mantleMainnet' || network === 'mainnet'
      ? '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE' // USDT on Mantle Mainnet
      : '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE'; // USDT on Mantle Sepolia
  
  // Get stablecoin token address from parameters (with network-appropriate default)
  const stablecoinAddress = m.getParameter("stablecoinToken", defaultStablecoinAddress);
  
  // Set fraud oracle address (defaults to zero address if not provided)
  const fraudOracle = m.getParameter("fraudOracle", "0x0000000000000000000000000000000000000000");
  
  // Deploy SecuredTransfer contract with the configured addresses
  const securedTransferContract = m.contract("SecuredTransferContract", [stablecoinAddress, fraudOracle]);

  return { 
    securedTransferContract
  };
});