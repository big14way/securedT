import { createWalletClient, http, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet, mantle } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ABIs
function loadABI(contractName: string, isMock: boolean = false) {
  const basePath = isMock 
    ? path.join(__dirname, `../artifacts/contracts/mocks/${contractName}.sol/${contractName}.json`)
    : path.join(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
  return JSON.parse(fs.readFileSync(basePath, 'utf8'));
}

// Configuration
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
const activeChain = NETWORK === 'mainnet' ? mantle : mantleSepoliaTestnet;

const USDT_ADDRESS = '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE'; // Mantle USDT

async function main() {
  console.log('\n🚀 Deploying CollateralEscrow with Mock INIT Capital');
  console.log('='.repeat(70));
  console.log(`Network: ${NETWORK === 'mainnet' ? 'Mantle Mainnet' : 'Mantle Sepolia Testnet'}`);
  console.log(`Chain ID: ${activeChain.id}`);
  console.log('='.repeat(70) + '\n');

  // Load private key
  const privateKey = process.env.MANTLE_SEPOLIA_PRIVATE_KEY || process.env.MANTLE_MAINNET_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('❌ Private key not found in environment variables');
  }

  const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}`);
  console.log(`📝 Deploying from: ${account.address}\n`);

  // Create clients
  const walletClient = createWalletClient({
    account,
    chain: activeChain,
    transport: http(activeChain.rpcUrls.default.http[0]),
  });

  const publicClient = createPublicClient({
    chain: activeChain,
    transport: http(activeChain.rpcUrls.default.http[0]),
  });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`💰 Wallet Balance: ${Number(balance) / 1e18} MNT\n`);

  if (balance === 0n) {
    throw new Error('❌ Insufficient balance. Fund your wallet at https://faucet.sepolia.mantle.xyz');
  }

  try {
    // Step 1: Deploy MockINITCapital
    console.log('📋 Step 1: Deploying MockINITCapital...');
    const mockInitCapitalArtifact = loadABI('MockINITCapital', true);

    const mockInitCapitalHash = await walletClient.deployContract({
      abi: mockInitCapitalArtifact.abi,
      bytecode: mockInitCapitalArtifact.bytecode as `0x${string}`,
      args: [USDT_ADDRESS as `0x${string}`],
    });

    console.log(`   📤 TX Hash: ${mockInitCapitalHash}`);
    console.log('   ⏳ Waiting for confirmation...');

    const mockInitCapitalReceipt = await publicClient.waitForTransactionReceipt({ 
      hash: mockInitCapitalHash,
      confirmations: 2
    });

    const mockInitCapitalAddress = mockInitCapitalReceipt.contractAddress!;
    console.log(`   ✅ MockINITCapital deployed: ${mockInitCapitalAddress}\n`);

    // Step 2: Deploy CollateralEscrow
    console.log('📋 Step 2: Deploying CollateralEscrow...');
    console.log(`   Parameters:`);
    console.log(`   - USDT: ${USDT_ADDRESS}`);
    console.log(`   - Fraud Oracle: ${account.address}`);
    console.log(`   - INIT Capital: ${mockInitCapitalAddress}`);

    const collateralEscrowArtifact = loadABI('CollateralEscrow');

    const collateralEscrowHash = await walletClient.deployContract({
      abi: collateralEscrowArtifact.abi,
      bytecode: collateralEscrowArtifact.bytecode as `0x${string}`,
      args: [
        USDT_ADDRESS as `0x${string}`,
        account.address,
        mockInitCapitalAddress
      ],
    });

    console.log(`   📤 TX Hash: ${collateralEscrowHash}`);
    console.log('   ⏳ Waiting for confirmation...\n');

    const collateralEscrowReceipt = await publicClient.waitForTransactionReceipt({ 
      hash: collateralEscrowHash,
      confirmations: 2
    });

    const collateralEscrowAddress = collateralEscrowReceipt.contractAddress!;

    // Success!
    console.log('='.repeat(70));
    console.log('✅ DEPLOYMENT SUCCESSFUL!');
    console.log('='.repeat(70) + '\n');

    console.log('📍 Contract Addresses:');
    console.log(`   MockINITCapital:  ${mockInitCapitalAddress}`);
    console.log(`   CollateralEscrow: ${collateralEscrowAddress}\n`);

    console.log('🔍 Explorer Links:');
    console.log(`   MockINITCapital:  ${activeChain.blockExplorers.default.url}/address/${mockInitCapitalAddress}`);
    console.log(`   CollateralEscrow: ${activeChain.blockExplorers.default.url}/address/${collateralEscrowAddress}\n`);

    console.log('📊 Transaction Details:');
    console.log(`   MockINITCapital Gas: ${mockInitCapitalReceipt.gasUsed.toString()}`);
    console.log(`   CollateralEscrow Gas: ${collateralEscrowReceipt.gasUsed.toString()}\n`);

    // Verify configuration
    console.log('🔍 Verifying Configuration...');
    
    const pyusdToken = await publicClient.readContract({
      address: collateralEscrowAddress,
      abi: collateralEscrowArtifact.abi,
      functionName: 'pyusdToken',
    });

    const fraudOracle = await publicClient.readContract({
      address: collateralEscrowAddress,
      abi: collateralEscrowArtifact.abi,
      functionName: 'fraudOracle',
    });

    const initCapital = await publicClient.readContract({
      address: collateralEscrowAddress,
      abi: collateralEscrowArtifact.abi,
      functionName: 'initCapital',
    });

    const maxLtv = await publicClient.readContract({
      address: collateralEscrowAddress,
      abi: collateralEscrowArtifact.abi,
      functionName: 'MAX_LTV',
    });

    console.log('   ✅ PYUSD Token:', pyusdToken);
    console.log('   ✅ Fraud Oracle:', fraudOracle);
    console.log('   ✅ INIT Capital:', initCapital);
    console.log('   ✅ MAX_LTV:', maxLtv, '(80%)\n');

    // Save deployment info
    const deploymentInfo = {
      network: NETWORK,
      chainId: activeChain.id,
      timestamp: new Date().toISOString(),
      deployer: account.address,
      contracts: {
        mockINITCapital: {
          address: mockInitCapitalAddress,
          deployHash: mockInitCapitalHash,
          explorerUrl: `${activeChain.blockExplorers.default.url}/address/${mockInitCapitalAddress}`
        },
        collateralEscrow: {
          address: collateralEscrowAddress,
          deployHash: collateralEscrowHash,
          explorerUrl: `${activeChain.blockExplorers.default.url}/address/${collateralEscrowAddress}`
        }
      },
      configuration: {
        usdtToken: USDT_ADDRESS,
        fraudOracle: account.address,
        initCapital: mockInitCapitalAddress,
        maxLtv: '8000 (80%)'
      }
    };

    const deploymentFile = path.join(__dirname, '../deployment-collateral-escrow.json');
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: deployment-collateral-escrow.json\n`);

    // Next steps
    console.log('📝 NEXT STEPS:');
    console.log('='.repeat(70));
    console.log('1. Update .env.local:');
    console.log(`   NEXT_PUBLIC_COLLATERAL_ESCROW_ADDRESS=${collateralEscrowAddress}`);
    console.log(`   NEXT_PUBLIC_INIT_CAPITAL_ADDRESS=${mockInitCapitalAddress}`);
    console.log('');
    console.log('2. Update frontend navigation (app/lib/Navigation.js):');
    console.log('   Add links to /collateral and /tutorials/working-capital');
    console.log('');
    console.log('3. Create utility functions (app/util/collateralEscrowContract.js):');
    console.log('   - depositAsCollateral()');
    console.log('   - borrowAgainstEscrow()');
    console.log('   - repayBorrowed()');
    console.log('   - releaseWithCollateral()');
    console.log('   - getCollateralInfo()');
    console.log('');
    console.log('4. Test the deployment:');
    console.log('   a. Create test escrow on frontend');
    console.log('   b. Deposit as collateral');
    console.log('   c. Try borrowing (80% LTV)');
    console.log('   d. Repay and release');
    console.log('');
    console.log('5. For production, replace MockINITCapital with real INIT Capital');
    console.log('='.repeat(70) + '\n');

    console.log('🎉 All deployments complete!\n');

    return {
      success: true,
      contracts: {
        mockINITCapital: mockInitCapitalAddress,
        collateralEscrow: collateralEscrowAddress
      }
    };

  } catch (error: any) {
    console.error('\n❌ DEPLOYMENT FAILED:');
    console.error(error.message || error);
    
    if (error.message?.includes('insufficient funds')) {
      console.error('\n💡 TIP: Fund your wallet:');
      console.error(`   Address: ${account.address}`);
      console.error(`   Faucet: https://faucet.sepolia.mantle.xyz`);
    }
    
    throw error;
  }
}

main()
  .then((result) => {
    if (result.success) {
      console.log('✅ Script completed successfully');
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('\n❌ FATAL ERROR:');
    console.error(error);
    process.exit(1);
  });
