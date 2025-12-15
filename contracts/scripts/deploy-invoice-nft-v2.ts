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

// Read compiled contract artifact
const InvoiceNFTArtifact = JSON.parse(
  readFileSync(join(__dirname, '../artifacts/contracts/InvoiceNFT.sol/InvoiceNFT.json'), 'utf-8')
);

const SecuredTransferContractArtifact = JSON.parse(
  readFileSync(join(__dirname, '../artifacts/contracts/SecuredTransferContract.sol/SecuredTransferContract.json'), 'utf-8')
);

async function main() {
  console.log("=".repeat(70));
  console.log("Deploying InvoiceNFT V2 with purchaseInvoice() to Mantle Sepolia");
  console.log("=".repeat(70));
  console.log("\n");

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

  // Configuration
  const stablecoinAddress = process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS || "0x5d7b6553ad6192a5a0bd2296e8ca118dc2586296";
  const securedTransferAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xb07ce703ce01370660d12c963cde0785627ee789";
  const platformWallet = account.address; // Deployer is platform wallet for now

  console.log(`\nConfiguration:`);
  console.log(`  Stablecoin (USDT): ${stablecoinAddress}`);
  console.log(`  SecuredTransferContract: ${securedTransferAddress}`);
  console.log(`  Platform Wallet: ${platformWallet}`);

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`\nDeployer MNT balance: ${Number(balance) / 1e18} MNT`);

  if (balance === 0n) {
    throw new Error('No MNT balance. Get testnet MNT from https://faucet.sepolia.mantle.xyz/');
  }

  // Deploy InvoiceNFT V2
  console.log("\n1. Deploying InvoiceNFT V2 with marketplace features...");

  const baseTokenURI = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/invoice-metadata`
    : 'https://securedtransfer.app/api/invoice-metadata';

  console.log(`   Base Token URI: ${baseTokenURI}`);

  const invoiceNFTHash = await walletClient.deployContract({
    abi: InvoiceNFTArtifact.abi,
    bytecode: InvoiceNFTArtifact.bytecode as `0x${string}`,
    args: [baseTokenURI, stablecoinAddress, platformWallet]
  });

  console.log(`   Transaction hash: ${invoiceNFTHash}`);
  const invoiceNFTReceipt = await publicClient.waitForTransactionReceipt({
    hash: invoiceNFTHash
  });
  const invoiceNFTAddress = invoiceNFTReceipt.contractAddress!;
  console.log(`   ✅ InvoiceNFT V2 deployed to: ${invoiceNFTAddress}\n`);

  // Configure InvoiceNFT with SecuredTransferContract
  console.log("2. Linking InvoiceNFT to SecuredTransferContract...");
  const setContractHash = await walletClient.writeContract({
    address: invoiceNFTAddress,
    abi: InvoiceNFTArtifact.abi,
    functionName: 'setSecuredTransferContract',
    args: [securedTransferAddress],
    account
  });

  await publicClient.waitForTransactionReceipt({ hash: setContractHash });
  console.log(`   ✅ InvoiceNFT configured with SecuredTransferContract\n`);

  // Update SecuredTransferContract to use new InvoiceNFT
  console.log("3. Updating SecuredTransferContract to use new InvoiceNFT...");
  const updateInvoiceNFTHash = await walletClient.writeContract({
    address: securedTransferAddress,
    abi: SecuredTransferContractArtifact.abi,
    functionName: 'updateInvoiceNFT',
    args: [invoiceNFTAddress],
    account
  });

  await publicClient.waitForTransactionReceipt({ hash: updateInvoiceNFTHash });
  console.log(`   ✅ SecuredTransferContract updated with new InvoiceNFT\n`);

  // Print summary
  console.log("=".repeat(70));
  console.log("✅ InvoiceNFT V2 Deployment Complete!");
  console.log("=".repeat(70));
  console.log(`\nNew InvoiceNFT V2:        ${invoiceNFTAddress}`);
  console.log(`SecuredTransferContract:  ${securedTransferAddress} (updated)`);
  console.log(`Stablecoin:               ${stablecoinAddress}`);
  console.log(`Platform Wallet:          ${platformWallet}`);
  console.log(`Platform Fee:             1% (100 bps)`);
  console.log(`\nNetwork: ${mantleSepoliaTestnet.name}`);
  console.log(`Chain ID: ${mantleSepoliaTestnet.id}`);
  console.log(`\nExplorer Link:`);
  console.log(`https://explorer.sepolia.mantle.xyz/address/${invoiceNFTAddress}`);
  console.log(`\n⚠️  UPDATE YOUR .env FILE:`);
  console.log(`NEXT_PUBLIC_INVOICE_NFT_ADDRESS=${invoiceNFTAddress}`);
  console.log("\n" + "=".repeat(70));

  // New features in V2
  console.log("\n🆕 New Features in InvoiceNFT V2:");
  console.log("   • purchaseInvoice() - Atomic buy function (no approval needed from seller)");
  console.log("   • updateListingPrice() - Update listing price");
  console.log("   • calculatePotentialReturn() - Get profit and APR for buyers");
  console.log("   • getMarketStats() - Get marketplace statistics");
  console.log("   • Platform fee: 1% on all sales");
  console.log("   • Events: InvoicePurchased, PriceUpdated");

  // Save deployment info
  const deploymentInfo = {
    network: mantleSepoliaTestnet.name,
    chainId: mantleSepoliaTestnet.id,
    timestamp: new Date().toISOString(),
    version: 'v2',
    contracts: {
      InvoiceNFT: invoiceNFTAddress,
      SecuredTransferContract: securedTransferAddress,
      Stablecoin: stablecoinAddress,
      PlatformWallet: platformWallet
    },
    features: [
      'purchaseInvoice() - Atomic purchases',
      'updateListingPrice() - Price updates',
      'calculatePotentialReturn() - Profit/APR calculation',
      'getMarketStats() - Market statistics',
      '1% platform fee on sales'
    ],
    transactions: {
      deploy: invoiceNFTHash,
      linkToSecuredTransfer: setContractHash,
      updateSecuredTransfer: updateInvoiceNFTHash
    }
  };

  const fs = await import('fs');
  fs.writeFileSync(
    join(__dirname, '../deployment-info-invoice-nft-v2.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to deployment-info-invoice-nft-v2.json");
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
