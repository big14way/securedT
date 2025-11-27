import { createWalletClient, http, createPublicClient, formatEther, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet } from 'viem/chains';
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

const MOCK_USDT_ADDRESS = '0x5d7b6553ad6192a5a0bd2296e8ca118dc2586296' as Address;
const COMPLIANCE_ORACLE_ADDRESS = '0x99ce6cc9064a6a88b6fb4abda170844c45d8d1ae' as Address;

// Get private key from environment
const PRIVATE_KEY = process.env.MANTLE_SEPOLIA_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error('MANTLE_SEPOLIA_PRIVATE_KEY not found in .env');
}

async function main() {
  console.log('\n🚀 Deploying SecuredTransferContract with MockUSDT...\n');

  // Set up account from private key
  const account = privateKeyToAccount(`0x${PRIVATE_KEY}` as `0x${string}`);

  // Create wallet client
  const walletClient = createWalletClient({
    account,
    chain: mantleSepoliaTestnet,
    transport: http(),
  });

  // Create public client for reading
  const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(),
  });

  console.log('Deployer wallet:', account.address);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Deployer balance:', formatEther(balance), 'MNT\n');

  console.log('MockUSDT Address:', MOCK_USDT_ADDRESS);
  console.log('ComplianceOracle Address:', COMPLIANCE_ORACLE_ADDRESS);
  console.log('');

  // Deploy SecuredTransferContract
  console.log('⏳ Deploying SecuredTransferContract...');

  const hash = await walletClient.deployContract({
    abi: SecuredTransferArtifact.abi,
    bytecode: SecuredTransferArtifact.bytecode as `0x${string}`,
    args: [MOCK_USDT_ADDRESS, COMPLIANCE_ORACLE_ADDRESS],
  });

  console.log('Transaction hash:', hash);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

  const escrowAddress = receipt.contractAddress;
  console.log('\n🎉 SecuredTransferContract deployed at:', escrowAddress);
  console.log('');
  console.log('📝 Update your .env file:');
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${escrowAddress}`);
  console.log('');
  console.log('🎉 Done! Now you can create escrows with MockUSDT');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
