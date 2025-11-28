import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SecuredTransferArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/SecuredTransferContract.sol/SecuredTransferContract.json'), 'utf8')
);

const InvoiceNFTArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/InvoiceNFT.sol/InvoiceNFT.json'), 'utf8')
);

const SECURED_TRANSFER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const INVOICE_NFT_ADDRESS = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS as `0x${string}`;
const PRIVATE_KEY = process.env.MANTLE_SEPOLIA_PRIVATE_KEY;

async function main() {
  console.log('\n🔗 Bidirectional Contract Linking\n');
  console.log(`📍 SecuredTransferContract: ${SECURED_TRANSFER_ADDRESS}`);
  console.log(`📍 InvoiceNFT: ${INVOICE_NFT_ADDRESS}\n`);

  if (!PRIVATE_KEY) {
    throw new Error('MANTLE_SEPOLIA_PRIVATE_KEY not found');
  }

  const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace('0x', '')}` as `0x${string}`);
  console.log(`🔑 Using account: ${account.address}\n`);

  const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: mantleSepoliaTestnet,
    transport: http(),
  });

  // Step 1: Check current link in SecuredTransferContract
  console.log('1️⃣ Checking SecuredTransferContract → InvoiceNFT link...');
  const currentInvoiceNFT = await publicClient.readContract({
    address: SECURED_TRANSFER_ADDRESS,
    abi: SecuredTransferArtifact.abi,
    functionName: 'invoiceNFT',
  });
  console.log(`   Current InvoiceNFT in SecuredTransferContract: ${currentInvoiceNFT}`);

  if (currentInvoiceNFT === '0x0000000000000000000000000000000000000000') {
    console.log('   ⚠️  Not linked, updating...');
    const hash1 = await walletClient.writeContract({
      address: SECURED_TRANSFER_ADDRESS,
      abi: SecuredTransferArtifact.abi,
      functionName: 'updateInvoiceNFT',
      args: [INVOICE_NFT_ADDRESS],
    });
    console.log(`   📝 Transaction: ${hash1}`);
    await publicClient.waitForTransactionReceipt({ hash: hash1 });
    console.log('   ✅ SecuredTransferContract → InvoiceNFT linked!');
  } else if (currentInvoiceNFT.toLowerCase() === INVOICE_NFT_ADDRESS.toLowerCase()) {
    console.log('   ✅ Already linked correctly!');
  } else {
    console.log(`   ⚠️  Linked to different address: ${currentInvoiceNFT}`);
  }

  // Step 2: Check current link in InvoiceNFT
  console.log('\n2️⃣ Checking InvoiceNFT → SecuredTransferContract link...');
  const currentSecuredTransfer = await publicClient.readContract({
    address: INVOICE_NFT_ADDRESS,
    abi: InvoiceNFTArtifact.abi,
    functionName: 'securedTransferContract',
  });
  console.log(`   Current SecuredTransferContract in InvoiceNFT: ${currentSecuredTransfer}`);

  if (currentSecuredTransfer === '0x0000000000000000000000000000000000000000') {
    console.log('   ⚠️  Not linked! This is why invoices are not being minted.');
    console.log('   Setting SecuredTransferContract in InvoiceNFT...');
    const hash2 = await walletClient.writeContract({
      address: INVOICE_NFT_ADDRESS,
      abi: InvoiceNFTArtifact.abi,
      functionName: 'setSecuredTransferContract',
      args: [SECURED_TRANSFER_ADDRESS],
    });
    console.log(`   📝 Transaction: ${hash2}`);
    await publicClient.waitForTransactionReceipt({ hash: hash2 });
    console.log('   ✅ InvoiceNFT → SecuredTransferContract linked!');
  } else if (currentSecuredTransfer.toLowerCase() === SECURED_TRANSFER_ADDRESS.toLowerCase()) {
    console.log('   ✅ Already linked correctly!');
  } else {
    console.log(`   ⚠️  Linked to OLD address: ${currentSecuredTransfer}`);
    console.log('   Updating to new SecuredTransferContract address...');
    const hash3 = await walletClient.writeContract({
      address: INVOICE_NFT_ADDRESS,
      abi: InvoiceNFTArtifact.abi,
      functionName: 'setSecuredTransferContract',
      args: [SECURED_TRANSFER_ADDRESS],
    });
    console.log(`   📝 Transaction: ${hash3}`);
    await publicClient.waitForTransactionReceipt({ hash: hash3 });
    console.log('   ✅ Updated to new SecuredTransferContract!');
  }

  console.log('\n✨ Bidirectional linking complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Create a new escrow');
  console.log('   2. Invoice NFT will be automatically minted');
  console.log('   3. Seller can list the invoice on marketplace with listInvoiceForSale()');
}

main()
  .then(() => {
    console.log('\n✅ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
