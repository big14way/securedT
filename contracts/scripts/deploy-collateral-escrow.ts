import { createWalletClient, http, createPublicClient, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet, mantle } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ABIs
function loadABI(contractName: string) {
  const artifactPath = path.join(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
}

// Configuration
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
const activeChain = NETWORK === 'mainnet' ? mantle : mantleSepoliaTestnet;

// Contract addresses on Mantle
const ADDRESSES = {
  mainnet: {
    USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
    // TODO: Add real INIT Capital address for mainnet
    initCapital: '0x0000000000000000000000000000000000000000', // Placeholder
  },
  testnet: {
    USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
    // TODO: Add real INIT Capital address for testnet
    initCapital: '0x0000000000000000000000000000000000000000', // Placeholder
  }
};

async function main() {
  console.log('\n🚀 Deploying CollateralEscrow Contract to Mantle Network');
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

  // Create wallet and public clients
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
    throw new Error('❌ Insufficient balance. Please fund your wallet with MNT.');
  }

  // Get addresses for this network
  const networkAddresses = ADDRESSES[NETWORK === 'mainnet' ? 'mainnet' : 'testnet'];
  const usdtAddress = networkAddresses.USDT;
  const initCapitalAddress = networkAddresses.initCapital;

  console.log('📋 Contract Configuration:');
  console.log(`   USDT Token: ${usdtAddress}`);
  console.log(`   INIT Capital: ${initCapitalAddress}`);
  console.log(`   Fraud Oracle: ${account.address} (deployer)\n`);

  // Check if INIT Capital address is set
  if (initCapitalAddress === '0x0000000000000000000000000000000000000000') {
    console.log('⚠️  WARNING: INIT Capital address not configured!');
    console.log('   Deploying with placeholder. Update after deployment.\n');
  }

  // Load CollateralEscrow artifact
  const collateralEscrowArtifact = loadABI('CollateralEscrow');

  console.log('🔨 Deploying CollateralEscrow Contract...');
  console.log('   Parameters:');
  console.log(`   - USDT: ${usdtAddress}`);
  console.log(`   - Fraud Oracle: ${account.address}`);
  console.log(`   - INIT Capital: ${initCapitalAddress}`);
  console.log('');

  try {
    // Deploy contract
    const deployHash = await walletClient.deployContract({
      abi: collateralEscrowArtifact.abi,
      bytecode: collateralEscrowArtifact.bytecode as `0x${string}`,
      args: [
        usdtAddress as `0x${string}`,
        account.address,
        initCapitalAddress as `0x${string}`
      ],
    });

    console.log(`📤 Transaction Hash: ${deployHash}`);
    console.log('⏳ Waiting for confirmation...\n');

    // Wait for deployment
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: deployHash,
      confirmations: 2
    });

    if (receipt.status === 'success') {
      const contractAddress = receipt.contractAddress!;
      
      console.log('='.repeat(70));
      console.log('✅ DEPLOYMENT SUCCESSFUL!');
      console.log('='.repeat(70));
      console.log(`\n📍 CollateralEscrow Address: ${contractAddress}`);
      console.log(`🔍 Explorer: ${activeChain.blockExplorers.default.url}/address/${contractAddress}`);
      console.log(`📊 Transaction: ${activeChain.blockExplorers.default.url}/tx/${deployHash}`);
      console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}\n`);

      // Verify deployment
      console.log('🔍 Verifying Deployment...');
      try {
        const pyusdToken = await publicClient.readContract({
          address: contractAddress,
          abi: collateralEscrowArtifact.abi,
          functionName: 'pyusdToken',
        });

        const fraudOracle = await publicClient.readContract({
          address: contractAddress,
          abi: collateralEscrowArtifact.abi,
          functionName: 'fraudOracle',
        });

        const initCapital = await publicClient.readContract({
          address: contractAddress,
          abi: collateralEscrowArtifact.abi,
          functionName: 'initCapital',
        });

        const maxLtv = await publicClient.readContract({
          address: contractAddress,
          abi: collateralEscrowArtifact.abi,
          functionName: 'MAX_LTV',
        });

        console.log('✅ Contract Configuration Verified:');
        console.log(`   - PYUSD Token: ${pyusdToken}`);
        console.log(`   - Fraud Oracle: ${fraudOracle}`);
        console.log(`   - INIT Capital: ${initCapital}`);
        console.log(`   - MAX_LTV: ${maxLtv} (80%)\n`);

      } catch (error) {
        console.log('⚠️  Could not verify contract configuration');
        console.log('   This is normal immediately after deployment\n');
      }

      // Save deployment info
      const deploymentInfo = {
        network: NETWORK,
        chainId: activeChain.id,
        contractAddress,
        deploymentHash: deployHash,
        deployer: account.address,
        timestamp: new Date().toISOString(),
        configuration: {
          usdtToken: usdtAddress,
          fraudOracle: account.address,
          initCapital: initCapitalAddress,
          maxLtv: '8000 (80%)'
        },
        explorerUrl: `${activeChain.blockExplorers.default.url}/address/${contractAddress}`,
        transactionUrl: `${activeChain.blockExplorers.default.url}/tx/${deployHash}`
      };

      const deploymentFile = path.join(__dirname, '../deployment-collateral-escrow.json');
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
      console.log(`💾 Deployment info saved to: deployment-collateral-escrow.json\n`);

      // Next steps
      console.log('📝 NEXT STEPS:');
      console.log('='.repeat(70));
      console.log('1. Update .env.local with:');
      console.log(`   NEXT_PUBLIC_COLLATERAL_ESCROW_ADDRESS=${contractAddress}`);
      console.log('');
      console.log('2. If INIT Capital address was placeholder, update contract:');
      console.log('   - Deploy real INIT Capital or get address');
      console.log('   - Call updateInitCapital() (if function exists)');
      console.log('');
      console.log('3. Verify contract on explorer (optional):');
      console.log(`   npx hardhat verify --network ${NETWORK === 'mainnet' ? 'mantle' : 'mantleSepolia'} ${contractAddress} ${usdtAddress} ${account.address} ${initCapitalAddress}`);
      console.log('');
      console.log('4. Test the deployment:');
      console.log('   - Create a test escrow');
      console.log('   - Deposit as collateral');
      console.log('   - Test borrow/repay functions');
      console.log('');
      console.log('5. Update navigation in app/lib/Navigation.js');
      console.log('='.repeat(70) + '\n');

      console.log('🎉 Deployment Complete!\n');

      return {
        success: true,
        contractAddress,
        deploymentHash: deployHash
      };

    } else {
      throw new Error('Transaction failed');
    }

  } catch (error: any) {
    console.error('\n❌ DEPLOYMENT FAILED:');
    console.error(error.message || error);
    
    if (error.message?.includes('insufficient funds')) {
      console.error('\n💡 TIP: Fund your wallet with MNT:');
      console.error(`   Address: ${account.address}`);
      console.error(`   Faucet: https://faucet.sepolia.mantle.xyz`);
    }
    
    throw error;
  }
}

// Execute deployment
main()
  .then((result) => {
    if (result.success) {
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('\n❌ FATAL ERROR:');
    console.error(error);
    process.exit(1);
  });
