import hre from "hardhat";
import { parseUnits } from "viem";

async function main() {
  console.log("Deploying RWA Compliance Contracts to Mantle Sepolia...");
  
  // Get network info
  const networkName = hre.network.name;
  console.log(`Network: ${networkName}`);
  
  // Get deployer
  const [deployer] = await hre.viem.getWalletClients();
  console.log(`Deployer address: ${deployer.account.address}`);
  
  // Get public client for reading
  const publicClient = await hre.viem.getPublicClient();
  
  // Stablecoin token address (USDT on Mantle Sepolia)
  const stablecoinAddress = "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE";
  console.log(`Stablecoin address: ${stablecoinAddress}`);
  
  // Step 1: Deploy ComplianceOracle
  console.log("\n1. Deploying ComplianceOracle...");
  const complianceOracle = await hre.viem.deployContract("ComplianceOracle");
  console.log(`✅ ComplianceOracle deployed to: ${complianceOracle.address}`);
  
  // Wait for confirmation
  await publicClient.waitForTransactionReceipt({ 
    hash: complianceOracle.deploymentTransaction().hash 
  });
  
  // Step 2: Deploy SecuredTransferContract
  console.log("\n2. Deploying SecuredTransferContract...");
  const securedTransfer = await hre.viem.deployContract("SecuredTransferContract", [
    stablecoinAddress,
    complianceOracle.address
  ]);
  console.log(`✅ SecuredTransferContract deployed to: ${securedTransfer.address}`);
  
  // Wait for confirmation
  await publicClient.waitForTransactionReceipt({ 
    hash: securedTransfer.deploymentTransaction().hash 
  });
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ Deployment Complete!");
  console.log("=".repeat(60));
  console.log(`\nComplianceOracle:         ${complianceOracle.address}`);
  console.log(`SecuredTransferContract:  ${securedTransfer.address}`);
  console.log(`\nNetwork: ${networkName}`);
  console.log(`Chain ID: ${await publicClient.getChainId()}`);
  console.log(`\nAdd these to your .env file:`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${securedTransfer.address}`);
  console.log(`NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS=${complianceOracle.address}`);
  console.log("\n" + "=".repeat(60));
  
  // Save deployment info to file
  const fs = await import('fs');
  const deploymentInfo = {
    network: networkName,
    chainId: await publicClient.getChainId(),
    timestamp: new Date().toISOString(),
    contracts: {
      ComplianceOracle: complianceOracle.address,
      SecuredTransferContract: securedTransfer.address,
      Stablecoin: stablecoinAddress
    }
  };
  
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
