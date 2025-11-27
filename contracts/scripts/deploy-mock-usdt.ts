import { createWalletClient, http, createPublicClient, formatEther, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet, mantle } from 'viem/chains';
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

// Configuration
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
const activeChain = NETWORK === 'mainnet' ? mantle : mantleSepoliaTestnet;

// Get private key from environment
const PRIVATE_KEY = process.env.MANTLE_SEPOLIA_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error('MANTLE_SEPOLIA_PRIVATE_KEY not found in .env');
}

/**
 * Deploy Mock USDT for testing on Mantle Sepolia
 */
async function main() {
  console.log('🪙  Deploying Mock USDT for Testing...\n');

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

  console.log('Deployer wallet:', account.address);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Deployer balance:', formatEther(balance), 'MNT\n');
  console.log('Network:', activeChain.name, '(Chain ID:', activeChain.id, ')\n');

  // Deploy MockUSDT
  console.log('⏳ Deploying MockUSDT...');

  const hash = await walletClient.deployContract({
    abi: MockUSDTArtifact.abi,
    bytecode: MockUSDTArtifact.bytecode as `0x${string}`,
    args: [],
  });

  console.log('Transaction hash:', hash);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

  const mockUSDTAddress = receipt.contractAddress;
  console.log('\n🎉 MockUSDT deployed at:', mockUSDTAddress);

  // Check deployer's balance
  const deployerBalance = await publicClient.readContract({
    address: mockUSDTAddress!,
    abi: MockUSDTArtifact.abi,
    functionName: 'balanceOf',
    args: [account.address],
  }) as bigint;

  console.log('\n📊 Deployer USDT Balance:', formatUnits(deployerBalance, 6), 'USDT');

  // Save deployment info
  const deploymentInfo = {
    network: activeChain.name,
    chainId: activeChain.id,
    mockUSDTAddress,
    deployer: account.address,
    deployedAt: new Date().toISOString(),
    blockNumber: receipt.blockNumber.toString(),
    transactionHash: hash,
    initialSupply: '1,000,000 USDT',
    decimals: 6,
    symbol: 'USDT',
    faucet: 'Anyone can call faucet() to get 1000 USDT for testing'
  };

  const deploymentPath = path.join(__dirname, '../deployment-mock-usdt.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('\n💾 Deployment info saved to:', deploymentPath);

  // Instructions
  console.log('\n═══════════════════════════════════════════════');
  console.log('📝 Next Steps:');
  console.log('═══════════════════════════════════════════════');
  console.log('1. Update .env with Mock USDT address:');
  console.log(`   Update STABLECOIN_CONFIG.testnet.USDT to: ${mockUSDTAddress}`);
  console.log('\n2. Get test tokens using the faucet:');
  console.log(`   Call faucet() on contract: ${mockUSDTAddress}`);
  console.log(`   Or run: npx tsx scripts/mint-usdt.ts <your-address>`);
  console.log('\n3. Anyone can mint test USDT:');
  console.log('   - Call faucet() to get 1000 USDT');
  console.log('   - Call mint(address, amount) for custom amounts');
  console.log('\n✨ Your testnet now has unlimited test USDT!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
