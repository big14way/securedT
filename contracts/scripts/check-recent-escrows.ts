import { createPublicClient, http } from 'viem';
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

async function main() {
  console.log('\n🔍 Checking Recent Escrows for Invoice NFTs\n');

  const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(),
  });

  try {
    // Get total escrow count
    const escrowCounter = await publicClient.readContract({
      address: SECURED_TRANSFER_ADDRESS,
      abi: SecuredTransferArtifact.abi,
      functionName: 'escrowCounter',
    });

    const total = Number(escrowCounter);
    console.log(`📊 Total Escrows: ${total}`);
    console.log(`\n🔎 Checking last 10 escrows for Invoice NFT tokens...\n`);

    // Check last 10 escrows
    for (let i = Math.max(0, total - 10); i < total; i++) {
      try {
        const escrow = await publicClient.readContract({
          address: SECURED_TRANSFER_ADDRESS,
          abi: SecuredTransferArtifact.abi,
          functionName: 'getEscrow',
          args: [BigInt(i)],
        });

        // Check if this escrow has an Invoice NFT
        const tokenId = await publicClient.readContract({
          address: INVOICE_NFT_ADDRESS,
          abi: InvoiceNFTArtifact.abi,
          functionName: 'getTokenByEscrow',
          args: [BigInt(i)],
        });

        const hasInvoice = Number(tokenId) !== 0;

        console.log(`Escrow #${i}:`, {
          buyer: escrow.buyer,
          seller: escrow.seller,
          amount: escrow.amount.toString(),
          status: escrow.status,
          hasInvoiceNFT: hasInvoice,
          tokenId: hasInvoice ? tokenId.toString() : 'N/A',
        });

        if (hasInvoice) {
          // Get invoice details
          const invoice = await publicClient.readContract({
            address: INVOICE_NFT_ADDRESS,
            abi: InvoiceNFTArtifact.abi,
            functionName: 'getInvoice',
            args: [tokenId],
          });

          console.log(`   📜 Invoice Details:`, {
            currentOwner: invoice.currentOwner,
            status: invoice.status,
            listedPrice: invoice.listedPrice.toString(),
            isListed: invoice.status === 3, // InvoiceStatus.Listed = 3
          });
        }
      } catch (error: any) {
        console.log(`❌ Escrow #${i}: ${error.shortMessage || error.message}`);
      }
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
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
