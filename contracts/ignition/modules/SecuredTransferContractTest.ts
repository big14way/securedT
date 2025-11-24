import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SecuredTransferContractTestModule", (m) => {
  // Deploy Mock PYUSD token for testing
  const mockPYUSD = m.contract("MockERC20", ["PayPal USD", "PYUSD", 6]);
  
  // Set fraud oracle address for testing
  const fraudOracle = m.getParameter("fraudOracle", "0x0000000000000000000000000000000000000000");
  
  // Deploy SecuredTransfer contract with mock token
  const securedTransferContract = m.contract("SecuredTransferContract", [mockPYUSD, fraudOracle]);

  return { 
    securedTransferContract,
    mockPYUSD
  };
});