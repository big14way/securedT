import { createWalletClient, http, createPublicClient, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load MockUSDT ABI
const MockUSDTArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/MockUSDT.sol/MockUSDT.json'), 'utf8')
);

// Mock USDT address
const MOCK_USDT_ADDRESS = '0x5d7b6553ad6192a5a0bd2296e8ca118dc2586296' as `0x${string}`;

// Get private key from environment
const PRIVATE_KEY = process.env.MANTLE_SEPOLIA_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error('MANTLE_SEPOLIA_PRIVATE_KEY not found in .env');
}

/**
 * Get test USDT from faucet
 */
async function main() {
  console.log('🪙  Getting Test USDT from Faucet...\n');

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

  console.log('Wallet:', account.address);
  console.log('MockUSDT:', MOCK_USDT_ADDRESS);

  // Check current balance
  const balanceBefore = await publicClient.readContract({
    address: MOCK_USDT_ADDRESS,
    abi: MockUSDTArtifact.abi,
    functionName: 'balanceOf',
    args: [account.address],
  }) as bigint;

  console.log('Balance before:', formatUnits(balanceBefore, 6), 'USDT\n');

  // Call faucet
  console.log('⏳ Calling faucet()...');

  const hash = await walletClient.writeContract({
    address: MOCK_USDT_ADDRESS,
    abi: MockUSDTArtifact.abi,
    functionName: 'faucet',
  });

  console.log('Transaction hash:', hash);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

  // Check new balance
  const balanceAfter = await publicClient.readContract({
    address: MOCK_USDT_ADDRESS,
    abi: MockUSDTArtifact.abi,
    functionName: 'balanceOf',
    args: [account.address],
  }) as bigint;

  console.log('\n🎉 Success!');
  console.log('Balance after:', formatUnits(balanceAfter, 6), 'USDT');
  console.log('Received:', formatUnits(balanceAfter - balanceBefore, 6), 'USDT');
  console.log('\n✨ You can now create escrows!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
