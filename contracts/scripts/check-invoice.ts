import { createPublicClient, http } from 'viem';
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

async function main() {
  console.log('\n📜 Checking Invoice NFT #1\n');

  const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(),
  });

  const invoice = await publicClient.readContract({
    address: INVOICE_NFT_ADDRESS,
    abi: InvoiceNFTArtifact.abi,
    functionName: 'getInvoice',
    args: [BigInt(1)],
  });

  console.log('Invoice Details:');
  console.log(`   Token ID: 1`);
  console.log(`   Escrow ID: ${invoice.escrowId}`);
  console.log(`   Amount: ${Number(invoice.amount) / 1_000_000} USDT`);
  console.log(`   Issuer (Seller): ${invoice.issuer}`);
  console.log(`   Payer (Buyer): ${invoice.payer}`);
  console.log(`   Current Owner: ${invoice.currentOwner}`);
  console.log(`   Status: ${invoice.status} (0=Active, 3=Listed)`);
  console.log(`   Listed Price: ${Number(invoice.listedPrice) / 1_000_000} USDT`);
  console.log(`   Created At: ${new Date(Number(invoice.createdAt) * 1000).toLocaleString()}\n`);

  if (invoice.status === 3) {
    console.log('✅ This invoice IS listed on the marketplace!');
  } else {
    console.log('❌ This invoice is NOT listed yet.');
    console.log(`   The owner (${invoice.currentOwner}) needs to call listInvoiceForSale()\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
