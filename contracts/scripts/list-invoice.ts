import { createWalletClient, createPublicClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const InvoiceNFTArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/InvoiceNFT.sol/InvoiceNFT.json'), 'utf8')
);

const INVOICE_NFT_ADDRESS = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS as `0x${string}`;
const PRIVATE_KEY = process.env.MANTLE_SEPOLIA_PRIVATE_KEY;

async function main() {
  console.log('\n📝 Listing Invoice NFT for Sale\n');

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

  // Get all invoices owned by this address
  console.log('🔎 Finding your Invoice NFTs...');
  const ownedTokens = await publicClient.readContract({
    address: INVOICE_NFT_ADDRESS,
    abi: InvoiceNFTArtifact.abi,
    functionName: 'getInvoicesByOwner',
    args: [account.address],
  });

  console.log(`   Found ${ownedTokens.length} Invoice NFTs\n`);

  if (ownedTokens.length === 0) {
    console.log('❌ You don\'t own any Invoice NFTs');
    console.log('   Invoice NFTs are minted to the SELLER address when escrows are created.');
    console.log('   Make sure you are using the seller\'s private key.\n');
    return;
  }

  // Show details of each invoice
  for (const tokenId of ownedTokens) {
    const invoice = await publicClient.readContract({
      address: INVOICE_NFT_ADDRESS,
      abi: InvoiceNFTArtifact.abi,
      functionName: 'getInvoice',
      args: [tokenId],
    });

    console.log(`📜 Invoice NFT #${tokenId}:`);
    console.log(`   Escrow ID: ${invoice.escrowId}`);
    console.log(`   Amount: ${Number(invoice.amount) / 1_000_000} USDT`);
    console.log(`   Issuer (Seller): ${invoice.issuer}`);
    console.log(`   Payer (Buyer): ${invoice.payer}`);
    console.log(`   Current Owner: ${invoice.currentOwner}`);
    console.log(`   Status: ${invoice.status === 0 ? 'Active' : invoice.status === 3 ? 'Listed' : 'Other'}`);
    console.log(`   Listed Price: ${Number(invoice.listedPrice) / 1_000_000} USDT\n`);

    if (invoice.status === 3) {
      console.log('   ✅ Already listed for sale!\n');
      continue;
    }

    if (invoice.status !== 0) {
      console.log('   ⚠️  Invoice is not active, skipping...\n');
      continue;
    }

    // List for sale at 10% discount
    const originalAmount = Number(invoice.amount);
    const discountPercent = 10;
    const listedPrice = BigInt(Math.floor(originalAmount * (1 - discountPercent / 100)));

    console.log(`💰 Listing Invoice #${tokenId} for sale...`);
    console.log(`   Original Amount: ${originalAmount / 1_000_000} USDT`);
    console.log(`   Discount: ${discountPercent}%`);
    console.log(`   Listed Price: ${Number(listedPrice) / 1_000_000} USDT\n`);

    try {
      const hash = await walletClient.writeContract({
        address: INVOICE_NFT_ADDRESS,
        abi: InvoiceNFTArtifact.abi,
        functionName: 'listInvoiceForSale',
        args: [tokenId, listedPrice],
      });

      console.log(`   📝 Transaction: ${hash}`);
      console.log('   ⏳ Waiting for confirmation...');

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        console.log(`   ✅ Invoice #${tokenId} listed successfully!`);
        console.log(`   🔗 View on explorer: ${mantleSepoliaTestnet.blockExplorers?.default.url}/tx/${hash}\n`);
      } else {
        console.log(`   ❌ Transaction failed\n`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error listing invoice: ${error.shortMessage || error.message}\n`);
    }
  }

  console.log('✨ Done!');
  console.log('   Check the marketplace to see your listed invoices.\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
