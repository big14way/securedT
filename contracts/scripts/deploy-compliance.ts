import hre from "hardhat";

async function main() {
  console.log("Deploying RWA Compliance Contracts to Mantle Sepolia...");
  
  // Get network name
  const network = hre.network.name;
  console.log(`Network: ${network}`);
  
  // Get signer
  const [deployer] = await hre.viem.getWalletClients();
  console.log(`Deployer address: ${deployer.account.address}`);
  
  // Stablecoin token address (USDT on Mantle Sepolia)
  const stablecoinAddress = "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE";
  console.log(`Stablecoin address: ${stablecoinAddress}`);
  
  // Deploy ComplianceOracle
  console.log("\n1. Deploying ComplianceOracle...");
  const complianceOracle = await hre.viem.deployContract("ComplianceOracle");
  console.log(`✅ ComplianceOracle deployed to: ${complianceOracle.address}`);
  
  // Deploy SecuredTransferContract
  console.log("\n2. Deploying SecuredTransferContract...");
  const securedTransfer = await hre.viem.deployContract("SecuredTransferContract", [
    stablecoinAddress,
    complianceOracle.address
  ]);
  console.log(`✅ SecuredTransferContract deployed to: ${securedTransfer.address}`);
  
  console.log("\n" + "=".repeat(60));
  console.log("Deployment Complete!");
  console.log("=".repeat(60));
  console.log(`\nComplianceOracle:         ${complianceOracle.address}`);
  console.log(`SecuredTransferContract:  ${securedTransfer.address}`);
  console.log(`\nNetwork: ${network}`);
  console.log(`\nAdd these to your .env file:`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${securedTransfer.address}`);
  console.log(`NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS=${complianceOracle.address}`);
  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
