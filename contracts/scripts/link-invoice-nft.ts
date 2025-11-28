import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load SecuredTransferContract ABI
const SecuredTransferArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/SecuredTransferContract.sol/SecuredTransferContract.json'), 'utf8')
);

// Contract addresses from .env
const SECURED_TRANSFER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const INVOICE_NFT_ADDRESS = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS as `0x${string}`;
const PRIVATE_KEY = process.env.MANTLE_SEPOLIA_PRIVATE_KEY;

async function main() {
  console.log('\n🔗 Linking InvoiceNFT to SecuredTransferContract\n');

  if (!PRIVATE_KEY) {
    throw new Error('MANTLE_SEPOLIA_PRIVATE_KEY not found in .env');
  }

  if (!SECURED_TRANSFER_ADDRESS) {
    throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS not found in .env');
  }

  if (!INVOICE_NFT_ADDRESS) {
    throw new Error('NEXT_PUBLIC_INVOICE_NFT_ADDRESS not found in .env');
  }

  const account = privateKeyToAccount(`0x${PRIVATE_KEY}` as `0x${string}`);

  console.log('Deployer:', account.address);
  console.log('SecuredTransfer:', SECURED_TRANSFER_ADDRESS);
  console.log('InvoiceNFT:', INVOICE_NFT_ADDRESS);
  console.log('');

  const walletClient = createWalletClient({
    account,
    chain: mantleSepoliaTestnet,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(),
  });

  // Call updateInvoiceNFT on SecuredTransferContract
  console.log('⏳ Calling updateInvoiceNFT...');

  const hash = await walletClient.writeContract({
    address: SECURED_TRANSFER_ADDRESS,
    abi: SecuredTransferArtifact.abi,
    functionName: 'updateInvoiceNFT',
    args: [INVOICE_NFT_ADDRESS],
  });

  console.log('Transaction hash:', hash);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status === 'success') {
    console.log('\n✅ Successfully linked InvoiceNFT to SecuredTransferContract!');
    console.log('');
    console.log('Now when you create escrows, they will automatically mint invoice NFTs.');
    console.log('Sellers can list these NFTs on the marketplace for early payment discounts.');
    console.log('');
  } else {
    console.error('❌ Transaction failed');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
