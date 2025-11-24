import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet } from 'viem/chains';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env'), override: true });

// Read compiled contract artifacts
const ComplianceOracleArtifact = JSON.parse(
  readFileSync(join(__dirname, '../artifacts/contracts/ComplianceOracle.sol/ComplianceOracle.json'), 'utf-8')
);
const SecuredTransferContractArtifact = JSON.parse(
  readFileSync(join(__dirname, '../artifacts/contracts/SecuredTransferContract.sol/SecuredTransferContract.json'), 'utf-8')
);
const InvoiceNFTArtifact = JSON.parse(
  readFileSync(join(__dirname, '../artifacts/contracts/InvoiceNFT.sol/InvoiceNFT.json'), 'utf-8')
);

async function main() {
  console.log("Deploying SecuredTransfer with Invoice NFT to Mantle Sepolia...\n");
  
  // Check for private key
  const privateKey = process.env.MANTLE_SEPOLIA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('MANTLE_SEPOLIA_PRIVATE_KEY not found in .env file');
  }
  
  // Setup account and clients
  const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}`);
  
  const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(process.env.MANTLE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.mantle.xyz')
  });
  
  const walletClient = createWalletClient({
    account,
    chain: mantleSepoliaTestnet,
    transport: http(process.env.MANTLE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.mantle.xyz')
  });
  
  console.log(`Deployer address: ${account.address}`);
  console.log(`Chain: ${mantleSepoliaTestnet.name} (${mantleSepoliaTestnet.id})`);
  
  // Stablecoin token address (USDT on Mantle Sepolia)
  const stablecoinAddress = "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE";
  console.log(`Stablecoin address: ${stablecoinAddress}\n`);
  
  // Deploy ComplianceOracle
  console.log("1. Deploying ComplianceOracle...");
  const complianceOracleHash = await walletClient.deployContract({
    abi: ComplianceOracleArtifact.abi,
    bytecode: ComplianceOracleArtifact.bytecode as `0x${string}`,
  });
  
  console.log(`   Transaction hash: ${complianceOracleHash}`);
  const complianceOracleReceipt = await publicClient.waitForTransactionReceipt({ 
    hash: complianceOracleHash 
  });
  const complianceOracleAddress = complianceOracleReceipt.contractAddress!;
  console.log(`✅ ComplianceOracle deployed to: ${complianceOracleAddress}\n`);
  
  // Deploy SecuredTransferContract
  console.log("2. Deploying SecuredTransferContract...");
  const securedTransferHash = await walletClient.deployContract({
    abi: SecuredTransferContractArtifact.abi,
    bytecode: SecuredTransferContractArtifact.bytecode as `0x${string}`,
    args: [stablecoinAddress, complianceOracleAddress]
  });
  
  console.log(`   Transaction hash: ${securedTransferHash}`);
  const securedTransferReceipt = await publicClient.waitForTransactionReceipt({ 
    hash: securedTransferHash 
  });
  const securedTransferAddress = securedTransferReceipt.contractAddress!;
  console.log(`✅ SecuredTransferContract deployed to: ${securedTransferAddress}\n`);
  
  // Deploy InvoiceNFT
  console.log("3. Deploying InvoiceNFT...");
  const baseTokenURI = process.env.NEXT_PUBLIC_BASE_URL 
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/invoice-metadata`
    : 'https://securedtransfer.app/api/invoice-metadata';
    
  const invoiceNFTHash = await walletClient.deployContract({
    abi: InvoiceNFTArtifact.abi,
    bytecode: InvoiceNFTArtifact.bytecode as `0x${string}`,
    args: [baseTokenURI]
  });
  
  console.log(`   Transaction hash: ${invoiceNFTHash}`);
  const invoiceNFTReceipt = await publicClient.waitForTransactionReceipt({ 
    hash: invoiceNFTHash 
  });
  const invoiceNFTAddress = invoiceNFTReceipt.contractAddress!;
  console.log(`✅ InvoiceNFT deployed to: ${invoiceNFTAddress}\n`);
  
  // Configure InvoiceNFT
  console.log("4. Configuring InvoiceNFT...");
  const setContractHash = await walletClient.writeContract({
    address: invoiceNFTAddress,
    abi: InvoiceNFTArtifact.abi,
    functionName: 'setSecuredTransferContract',
    args: [securedTransferAddress],
    account
  });
  
  await publicClient.waitForTransactionReceipt({ hash: setContractHash });
  console.log(`✅ InvoiceNFT configured with SecuredTransferContract\n`);
  
  // Configure SecuredTransferContract
  console.log("5. Configuring SecuredTransferContract...");
  const updateInvoiceNFTHash = await walletClient.writeContract({
    address: securedTransferAddress,
    abi: SecuredTransferContractArtifact.abi,
    functionName: 'updateInvoiceNFT',
    args: [invoiceNFTAddress],
    account
  });
  
  await publicClient.waitForTransactionReceipt({ hash: updateInvoiceNFTHash });
  console.log(`✅ SecuredTransferContract configured with InvoiceNFT\n`);
  
  // Print summary
  console.log("=".repeat(70));
  console.log("✅ Deployment Complete!");
  console.log("=".repeat(70));
  console.log(`\nComplianceOracle:         ${complianceOracleAddress}`);
  console.log(`SecuredTransferContract:  ${securedTransferAddress}`);
  console.log(`InvoiceNFT:               ${invoiceNFTAddress}`);
  console.log(`\nNetwork: ${mantleSepoliaTestnet.name}`);
  console.log(`Chain ID: ${mantleSepoliaTestnet.id}`);
  console.log(`\nExplorer Links:`);
  console.log(`ComplianceOracle: https://explorer.sepolia.mantle.xyz/address/${complianceOracleAddress}`);
  console.log(`SecuredTransferContract: https://explorer.sepolia.mantle.xyz/address/${securedTransferAddress}`);
  console.log(`InvoiceNFT: https://explorer.sepolia.mantle.xyz/address/${invoiceNFTAddress}`);
  console.log(`\nAdd these to your .env file:`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${securedTransferAddress}`);
  console.log(`NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS=${complianceOracleAddress}`);
  console.log(`NEXT_PUBLIC_INVOICE_NFT_ADDRESS=${invoiceNFTAddress}`);
  console.log("\n" + "=".repeat(70));
  
  // Save deployment info
  const deploymentInfo = {
    network: mantleSepoliaTestnet.name,
    chainId: mantleSepoliaTestnet.id,
    timestamp: new Date().toISOString(),
    contracts: {
      ComplianceOracle: complianceOracleAddress,
      SecuredTransferContract: securedTransferAddress,
      InvoiceNFT: invoiceNFTAddress,
      Stablecoin: stablecoinAddress
    },
    transactions: {
      ComplianceOracle: complianceOracleHash,
      SecuredTransferContract: securedTransferHash,
      InvoiceNFT: invoiceNFTHash,
      ConfigureInvoiceNFT: setContractHash,
      ConfigureSecuredTransfer: updateInvoiceNFTHash
    }
  };
  
  const fs = await import('fs');
  fs.writeFileSync(
    join(__dirname, '../deployment-info-with-invoice.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to deployment-info-with-invoice.json");
}

main()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
