import { createWalletClient, http, createPublicClient, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet, mantle } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load SecuredTransferContract ABI
const SecuredTransferArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/SecuredTransferContract.sol/SecuredTransferContract.json'), 'utf8')
);

// Configuration
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
const activeChain = NETWORK === 'mainnet' ? mantle : mantleSepoliaTestnet;

// Get private key from environment
const PRIVATE_KEY = process.env.MANTLE_SEPOLIA_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error('MANTLE_SEPOLIA_PRIVATE_KEY not found in .env');
}

// Contract addresses
const SECURED_TRANSFER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
if (!SECURED_TRANSFER_ADDRESS) {
  throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS not found in .env');
}

const NEW_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS as `0x${string}`;
if (!NEW_ORACLE_ADDRESS) {
  throw new Error('NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS not found in .env');
}

/**
 * Update oracle address in SecuredTransferContract
 */
async function main() {
  console.log('🔄 Updating ComplianceOracle address in SecuredTransferContract...\n');

  // Set up account from private key
  const account = privateKeyToAccount(`0x${PRIVATE_KEY}` as `0x${string}`);

  // Create wallet client
  const walletClient = createWalletClient({
    account,
    chain: activeChain,
    transport: http(),
  });

  // Create public client for reading
  const publicClient = createPublicClient({
    chain: activeChain,
    transport: http(),
  });

  console.log('Owner wallet:', account.address);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Owner balance:', formatEther(balance), 'MNT\n');
  console.log('Network:', activeChain.name, '(Chain ID:', activeChain.id, ')\n');
  console.log('SecuredTransferContract:', SECURED_TRANSFER_ADDRESS);
  console.log('New ComplianceOracle:', NEW_ORACLE_ADDRESS);

  // Check current oracle address
  console.log('\n📋 Checking current oracle address...');
  const currentOracle = await publicClient.readContract({
    address: SECURED_TRANSFER_ADDRESS,
    abi: SecuredTransferArtifact.abi,
    functionName: 'fraudOracle',
  }) as `0x${string}`;

  console.log('  - Current oracle:', currentOracle);
  console.log('  - New oracle:', NEW_ORACLE_ADDRESS);

  if (currentOracle.toLowerCase() === NEW_ORACLE_ADDRESS.toLowerCase()) {
    console.log('\n✅ Oracle address is already up to date!');
    return;
  }

  // Update oracle address
  console.log('\n⏳ Updating oracle address...');

  const hash = await walletClient.writeContract({
    address: SECURED_TRANSFER_ADDRESS,
    abi: SecuredTransferArtifact.abi,
    functionName: 'updateFraudOracle',
    args: [NEW_ORACLE_ADDRESS],
  });

  console.log('Transaction hash:', hash);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

  // Verify the update
  const updatedOracle = await publicClient.readContract({
    address: SECURED_TRANSFER_ADDRESS,
    abi: SecuredTransferArtifact.abi,
    functionName: 'fraudOracle',
  }) as `0x${string}`;

  console.log('\n🎉 Oracle address updated successfully!');
  console.log('  - Old oracle:', currentOracle);
  console.log('  - New oracle:', updatedOracle);

  if (updatedOracle.toLowerCase() !== NEW_ORACLE_ADDRESS.toLowerCase()) {
    console.log('\n⚠️  WARNING: Oracle address mismatch! Please check the transaction.');
    process.exit(1);
  }

  console.log('\n✨ Your escrow contract is now using the Web3-native permissionless ComplianceOracle!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
