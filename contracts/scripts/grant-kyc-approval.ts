import { createWalletClient, http, createPublicClient, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet, mantle } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ComplianceOracle ABI
const ComplianceOracleArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/ComplianceOracle.sol/ComplianceOracle.json'), 'utf8')
);

// Configuration
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
const activeChain = NETWORK === 'mainnet' ? mantle : mantleSepoliaTestnet;

// Get private key from environment
const PRIVATE_KEY = process.env.MANTLE_SEPOLIA_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error('MANTLE_SEPOLIA_PRIVATE_KEY not found in .env');
}

// ComplianceOracle contract address
const COMPLIANCE_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS as `0x${string}`;
if (!COMPLIANCE_ORACLE_ADDRESS) {
  throw new Error('NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS not found in .env');
}

/**
 * Grant KYC approval to a wallet address for testing
 * This allows you to create escrows immediately without waiting for real KYC verification
 */
async function main() {
  console.log('🔐 Granting KYC Approval for Testing...\n');

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
  console.log('Owner balance:', formatUnits(balance, 18), 'MNT\n');
  console.log('ComplianceOracle address:', COMPLIANCE_ORACLE_ADDRESS);
  console.log('Network:', activeChain.name, '(Chain ID:', activeChain.id, ')\n');

  // The wallet address you want to grant KYC to
  // You can override by setting TEST_WALLET_ADDRESS env var
  const testWallet = (process.env.TEST_WALLET_ADDRESS || account.address) as `0x${string}`;

  console.log('📋 Checking KYC status for:', testWallet);

  // Check current KYC level
  const currentLevel = await publicClient.readContract({
    address: COMPLIANCE_ORACLE_ADDRESS,
    abi: ComplianceOracleArtifact.abi,
    functionName: 'getKYCLevel',
    args: [testWallet],
  }) as number;

  console.log('Current KYC level:', currentLevel);

  if (currentLevel >= 1) {
    console.log('✅ Wallet already has KYC approval (Level', currentLevel, ')');

    // Show current limits
    const info = await publicClient.readContract({
      address: COMPLIANCE_ORACLE_ADDRESS,
      abi: ComplianceOracleArtifact.abi,
      functionName: 'getComplianceInfo',
      args: [testWallet],
    }) as [number, bigint, number, boolean, bigint];

    console.log('\nCurrent compliance info:');
    console.log('  - KYC Level:', info[0]);
    console.log('  - Transaction Limit:', formatUnits(info[1], 6), 'USDT');
    console.log('  - AML Risk Score:', info[2]);
    console.log('  - Blacklisted:', info[3]);
    console.log('  - Verified At:', info[4] > 0n ? new Date(Number(info[4]) * 1000).toISOString() : 'Not verified');

    return;
  }

  // Grant KYC Level 1 (Basic) - $10,000 transaction limit
  console.log('\n⏳ Setting KYC Level to 1 (Basic - $10,000 limit)...');

  const hash = await walletClient.writeContract({
    address: COMPLIANCE_ORACLE_ADDRESS,
    abi: ComplianceOracleArtifact.abi,
    functionName: 'setKYCStatus',
    args: [testWallet, 1],
  });

  console.log('Transaction hash:', hash);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

  // Verify the update
  const newLevel = await publicClient.readContract({
    address: COMPLIANCE_ORACLE_ADDRESS,
    abi: ComplianceOracleArtifact.abi,
    functionName: 'getKYCLevel',
    args: [testWallet],
  }) as number;

  const info = await publicClient.readContract({
    address: COMPLIANCE_ORACLE_ADDRESS,
    abi: ComplianceOracleArtifact.abi,
    functionName: 'getComplianceInfo',
    args: [testWallet],
  }) as [number, bigint, number, boolean, bigint];

  console.log('\n🎉 KYC Approval Granted!');
  console.log('  - Wallet:', testWallet);
  console.log('  - KYC Level:', info[0]);
  console.log('  - Transaction Limit:', formatUnits(info[1], 6), 'USDT');
  console.log('  - AML Risk Score:', info[2]);
  console.log('  - Blacklisted:', info[3]);
  console.log('  - Verified At:', new Date(Number(info[4]) * 1000).toISOString());

  console.log('\n✨ You can now create escrows without waiting for KYC verification!');
  console.log('💡 Note: Your real KYC submission is still being processed. This is just for testing.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
