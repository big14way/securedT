import { createPublicClient, http, decodeEventLog } from 'viem';
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
  console.log('\n🔍 Debugging Invoice NFT Minting\n');

  const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(),
  });

  // Get the most recent escrow
  const escrowCounter = await publicClient.readContract({
    address: SECURED_TRANSFER_ADDRESS,
    abi: SecuredTransferArtifact.abi,
    functionName: 'escrowCounter',
  });

  const latestEscrowId = Number(escrowCounter);
  console.log(`📊 Latest Escrow ID: ${latestEscrowId}\n`);

  // Get deposit events for the latest escrow
  console.log('🔎 Searching for Deposited events...');

  const depositEvents = await publicClient.getLogs({
    address: SECURED_TRANSFER_ADDRESS,
    event: {
      type: 'event',
      name: 'Deposited',
      inputs: [
        { type: 'uint256', indexed: true, name: 'escrowId' },
        { type: 'address', indexed: true, name: 'buyer' },
        { type: 'address', indexed: true, name: 'seller' },
        { type: 'uint256', indexed: false, name: 'amount' },
        { type: 'string', indexed: false, name: 'description' },
      ],
    },
    fromBlock: BigInt(latestEscrowId >= 10006 ? 31374000 : 0), // Recent block
    toBlock: 'latest',
  });

  console.log(`   Found ${depositEvents.length} deposit events\n`);

  // Check for InvoiceMinted events
  console.log('🔎 Searching for InvoiceMinted events...');

  const mintEvents = await publicClient.getLogs({
    address: SECURED_TRANSFER_ADDRESS,
    event: {
      type: 'event',
      name: 'InvoiceMinted',
      inputs: [
        { type: 'uint256', indexed: true, name: 'escrowId' },
        { type: 'uint256', indexed: true, name: 'tokenId' },
        { type: 'address', indexed: true, name: 'seller' },
      ],
    },
    fromBlock: BigInt(31374000),
    toBlock: 'latest',
  });

  console.log(`   Found ${mintEvents.length} InvoiceMinted events\n`);

  if (mintEvents.length === 0) {
    console.log('❌ No InvoiceMinted events found!');
    console.log('   This means the mintInvoice() call is failing silently in the try-catch block.\n');

    // Let's manually test if we can call mintInvoice
    console.log('🧪 Testing manual mintInvoice call...');
    console.log('   Checking if InvoiceNFT.securedTransferContract is set correctly...\n');

    const securedTransferInNFT = await publicClient.readContract({
      address: INVOICE_NFT_ADDRESS,
      abi: InvoiceNFTArtifact.abi,
      functionName: 'securedTransferContract',
    });

    console.log(`   InvoiceNFT.securedTransferContract: ${securedTransferInNFT}`);
    console.log(`   Expected: ${SECURED_TRANSFER_ADDRESS}`);

    if (securedTransferInNFT.toLowerCase() === SECURED_TRANSFER_ADDRESS.toLowerCase()) {
      console.log('   ✅ Correct!\n');
    } else {
      console.log('   ❌ MISMATCH! This is why minting fails.\n');
      return;
    }

    // Check owner
    const owner = await publicClient.readContract({
      address: INVOICE_NFT_ADDRESS,
      abi: InvoiceNFTArtifact.abi,
      functionName: 'owner',
    });

    console.log(`   InvoiceNFT owner: ${owner}\n`);

    // Try to simulate a mint
    console.log('🧪 Simulating mintInvoice call...');
    try {
      await publicClient.simulateContract({
        address: INVOICE_NFT_ADDRESS,
        abi: InvoiceNFTArtifact.abi,
        functionName: 'mintInvoice',
        args: [
          BigInt(99999), // test escrow ID
          '0x81e9aA254Ff408458A7267Df3469198f5045A561', // issuer (seller)
          '0x3C343AD077983371b29fee386bdBC8a92E934C51', // payer (buyer)
          BigInt(100000000), // amount
          BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60), // dueDate
        ],
        account: SECURED_TRANSFER_ADDRESS, // Simulate as if called by SecuredTransferContract
      });
      console.log('   ✅ Simulation succeeded - minting should work!\n');
    } catch (error: any) {
      console.log(`   ❌ Simulation failed: ${error.shortMessage || error.message}\n`);
    }
  } else {
    console.log('✅ InvoiceMinted events found! Minting is working.');
    mintEvents.forEach((event, i) => {
      console.log(`   Event ${i + 1}:`, event.args);
    });
  }
}

main()
  .then(() => {
    console.log('\n✅ Debug complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Debug failed:', error);
    process.exit(1);
  });
