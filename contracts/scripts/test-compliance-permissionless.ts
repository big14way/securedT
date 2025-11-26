import { createWalletClient, http, createPublicClient, parseUnits, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet } from 'viem/chains';
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
 * Test the permissionless design of ComplianceOracle
 */
async function main() {
  console.log('🧪 Testing ComplianceOracle - Web3-Native Permissionless Design\n');

  // Set up account from private key
  const account = privateKeyToAccount(`0x${PRIVATE_KEY}` as `0x${string}`);

  // Create public client for reading
  const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(),
  });

  console.log('📋 Test Configuration:');
  console.log('  - ComplianceOracle:', COMPLIANCE_ORACLE_ADDRESS);
  console.log('  - Test Wallet:', account.address);
  console.log('  - Network: Mantle Sepolia Testnet (5003)\n');

  // Test 1: Check transaction limit for user WITHOUT KYC
  console.log('✅ Test 1: Transaction limits should be unlimited by default (Web3 principle)');
  const limit = await publicClient.readContract({
    address: COMPLIANCE_ORACLE_ADDRESS,
    abi: ComplianceOracleArtifact.abi,
    functionName: 'getTransactionLimit',
    args: [account.address],
  }) as bigint;

  const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
  console.log('  - Expected: Unlimited (max uint256)');
  console.log('  - Actual:', limit === maxUint256 ? 'Unlimited ✅' : `${formatUnits(limit, 6)} USDT ❌`);
  console.log('  - Result:', limit === maxUint256 ? 'PASS ✅\n' : 'FAIL ❌\n');

  // Test 2: Check escrow WITHOUT KYC
  console.log('✅ Test 2: Escrows should be allowed WITHOUT KYC (permissionless)');

  // Create a fake buyer address (different from our wallet)
  const fakeBuyer = '0x0000000000000000000000000000000000000001' as `0x${string}`;
  const fakeSeller = '0x0000000000000000000000000000000000000002' as `0x${string}`;

  const result = await publicClient.readContract({
    address: COMPLIANCE_ORACLE_ADDRESS,
    abi: ComplianceOracleArtifact.abi,
    functionName: 'checkEscrow',
    args: [1n, fakeBuyer, fakeSeller, parseUnits('5000', 6)],
  }) as [boolean, string];

  console.log('  - Buyer KYC Level: 0 (no KYC)');
  console.log('  - Amount: $5,000 USDT');
  console.log('  - Is Flagged:', result[0] ? 'Yes ❌' : 'No ✅');
  console.log('  - Reason:', result[1] || 'None (allowed)');
  console.log('  - Result:', !result[0] ? 'PASS ✅\n' : 'FAIL ❌\n');

  // Test 3: Get compliance info for user without KYC
  console.log('✅ Test 3: Compliance info should show default values for users without KYC');
  const info = await publicClient.readContract({
    address: COMPLIANCE_ORACLE_ADDRESS,
    abi: ComplianceOracleArtifact.abi,
    functionName: 'getComplianceInfo',
    args: [fakeBuyer],
  }) as [number, bigint, number, boolean, bigint];

  console.log('  - KYC Level:', info[0], '(expected: 0)');
  console.log('  - Transaction Limit:', info[1] === maxUint256 ? 'Unlimited ✅' : `${formatUnits(info[1], 6)} USDT`);
  console.log('  - AML Risk Score:', info[2], '(expected: 0)');
  console.log('  - Blacklisted:', info[3], '(expected: false)');
  console.log('  - Verified At:', info[4] > 0n ? new Date(Number(info[4]) * 1000).toISOString() : 'Not verified ✅');
  console.log('  - Result:', info[0] === 0 && info[1] === maxUint256 && info[2] === 0 && !info[3] ? 'PASS ✅\n' : 'FAIL ❌\n');

  // Summary
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 Test Summary:');
  console.log('═══════════════════════════════════════════════');

  const allTestsPassed =
    limit === maxUint256 &&
    !result[0] &&
    info[0] === 0 &&
    info[1] === maxUint256;

  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n🎉 ComplianceOracle is now Web3-native and permissionless!');
    console.log('   - No KYC required for basic usage');
    console.log('   - Unlimited transaction limits by default');
    console.log('   - Fraud protection via blacklist & AML scoring');
    console.log('   - Optional KYC for compliance badges');
  } else {
    console.log('❌ SOME TESTS FAILED - Please review the output above');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
