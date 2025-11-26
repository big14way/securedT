import { createWalletClient, http, createPublicClient, formatEther } from 'viem';
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

/**
 * Deploy updated ComplianceOracle with Web3-native permissionless design
 */
async function main() {
  console.log('🚀 Deploying ComplianceOracle (Web3-Native Permissionless Design)...\n');

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

  // Deploy ComplianceOracle
  console.log('⏳ Deploying ComplianceOracle...');

  const hash = await walletClient.deployContract({
    abi: ComplianceOracleArtifact.abi,
    bytecode: ComplianceOracleArtifact.bytecode as `0x${string}`,
    args: [],
  });

  console.log('Transaction hash:', hash);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

  const complianceOracleAddress = receipt.contractAddress;
  console.log('\n🎉 ComplianceOracle deployed at:', complianceOracleAddress);

  // Verify the deployment
  console.log('\n📋 Verifying deployment...');

  const LIMIT_LEVEL_0 = await publicClient.readContract({
    address: complianceOracleAddress!,
    abi: ComplianceOracleArtifact.abi,
    functionName: 'LIMIT_LEVEL_0',
  }) as bigint;

  const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
  const isPermissionless = LIMIT_LEVEL_0 === maxUint256;

  console.log('  - LIMIT_LEVEL_0 (no KYC):', isPermissionless ? 'Unlimited ✅' : 'Limited ❌');
  console.log('  - Design:', isPermissionless ? 'Web3-Native Permissionless ✅' : 'Web2-Style KYC-Gated ❌');

  if (!isPermissionless) {
    console.log('\n⚠️  WARNING: Contract is not permissionless! Please check the deployment.');
    process.exit(1);
  }

  // Save deployment info
  const deploymentInfo = {
    network: activeChain.name,
    chainId: activeChain.id,
    complianceOracleAddress,
    deployer: account.address,
    deployedAt: new Date().toISOString(),
    blockNumber: receipt.blockNumber.toString(),
    transactionHash: hash,
    design: 'Web3-Native Permissionless',
    features: [
      'No KYC required',
      'Unlimited transaction limits',
      'Fraud protection via blacklist & AML',
      'Optional KYC for compliance badges'
    ]
  };

  const deploymentPath = path.join(__dirname, '../deployment-compliance-oracle.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('\n💾 Deployment info saved to:', deploymentPath);

  // Instructions
  console.log('\n═══════════════════════════════════════════════');
  console.log('📝 Next Steps:');
  console.log('═══════════════════════════════════════════════');
  console.log('1. Update .env with new address:');
  console.log(`   NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS=${complianceOracleAddress}`);
  console.log('\n2. Update SecuredTransferContract to use new oracle:');
  console.log(`   Run: npx tsx scripts/update-oracle-address.ts ${complianceOracleAddress}`);
  console.log('\n3. Test the permissionless design:');
  console.log('   Run: npx tsx scripts/test-compliance-permissionless.ts');
  console.log('\n4. Verify contract on Mantle Explorer (optional):');
  console.log(`   npx hardhat verify --network mantleSepolia ${complianceOracleAddress}`);
  console.log('\n✨ Your protocol is now Web3-native and permissionless!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
