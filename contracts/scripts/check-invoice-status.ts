import { createPublicClient, http } from 'viem';
import { mantleSepoliaTestnet } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ABIs
const InvoiceNFTArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/InvoiceNFT.sol/InvoiceNFT.json'), 'utf8')
);

const SecuredTransferArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/SecuredTransferContract.sol/SecuredTransferContract.json'), 'utf8')
);

const INVOICE_NFT_ADDRESS = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS as `0x${string}`;
const SECURED_TRANSFER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

async function main() {
  console.log('\n🔍 Checking Invoice NFT Status\n');
  console.log(`📍 InvoiceNFT Address: ${INVOICE_NFT_ADDRESS}`);
  console.log(`📍 SecuredTransferContract Address: ${SECURED_TRANSFER_ADDRESS}\n`);

  const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(),
  });

  try {
    // Check if InvoiceNFT is linked in SecuredTransferContract
    console.log('1️⃣ Checking if contracts are linked...');
    const linkedAddress = await publicClient.readContract({
      address: SECURED_TRANSFER_ADDRESS,
      abi: SecuredTransferArtifact.abi,
      functionName: 'invoiceNFT',
    });
    console.log(`   ✅ InvoiceNFT linked address: ${linkedAddress}`);

    if (linkedAddress === '0x0000000000000000000000000000000000000000') {
      console.log('   ❌ ERROR: InvoiceNFT not linked to SecuredTransferContract!');
      return;
    }

    // Check if any invoices exist by trying to get listed invoices
    console.log('\n2️⃣ Checking for existing invoices...');

    // Get listed invoices
    console.log('\n3️⃣ Checking listed invoices...');
    const listedInvoices = await publicClient.readContract({
      address: INVOICE_NFT_ADDRESS,
      abi: InvoiceNFTArtifact.abi,
      functionName: 'getListedInvoices',
    });
    console.log(`   ✅ Listed Invoice IDs: ${JSON.stringify(listedInvoices)}`);

    if (listedInvoices.length === 0) {
      console.log('   ⚠️  No invoices are currently listed for sale');
      console.log('   💡 Invoice owners need to call listInvoiceForSale() to list their invoices');
    } else {
      console.log('\n4️⃣ Checking listed invoice details...');
      for (let tokenId of listedInvoices) {
        try {
          const invoice = await publicClient.readContract({
            address: INVOICE_NFT_ADDRESS,
            abi: InvoiceNFTArtifact.abi,
            functionName: 'getInvoice',
            args: [tokenId],
          });
          console.log(`   Invoice #${tokenId}:`, {
            escrowId: invoice.escrowId.toString(),
            amount: invoice.amount.toString(),
            issuer: invoice.issuer,
            currentOwner: invoice.currentOwner,
            status: invoice.status,
            listedPrice: invoice.listedPrice.toString(),
          });
        } catch (error: any) {
          console.log(`   ❌ Invoice #${tokenId}: ${error.message}`);
        }
      }
    }

    // Check escrow counter in SecuredTransferContract
    console.log('\n5️⃣ Checking escrow counter...');
    const escrowCounter = await publicClient.readContract({
      address: SECURED_TRANSFER_ADDRESS,
      abi: SecuredTransferArtifact.abi,
      functionName: 'escrowCounter',
    });
    console.log(`   ✅ Total escrows created: ${escrowCounter}`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

main()
  .then(() => {
    console.log('\n✅ Check complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Check failed:', error);
    process.exit(1);
  });
