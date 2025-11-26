import { createWalletClient, http, createPublicClient, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet, mantle } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ABI
const YieldEscrowArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/YieldEscrow.sol/YieldEscrow.json'), 'utf8')
);

// Configuration
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
const activeChain = NETWORK === 'mainnet' ? mantle : mantleSepoliaTestnet;

// Contract addresses (Real addresses from Mantle Network and Agni Finance)
const ADDRESSES = {
  mainnet: {
    USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
    cmETH: '0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA', // cmETH on Mantle L2 (composable mETH)
    cmETHProtocol: '0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA', // Same as cmETH (ERC20 only, no staking contract)
    agniRouter: '0x319b69888b0d11cec22caa5034e25fffbdc88421', // Agni Finance Swap Router
    WMNT: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8', // Wrapped MNT (for swaps)
  },
  testnet: {
    USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
    cmETH: '0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA', // cmETH on Mantle L2
    cmETHProtocol: '0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA', // Same (no separate staking)
    agniRouter: '0x319b69888b0d11cec22caa5034e25fffbdc88421', // Agni Finance Swap Router
    WMNT: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8', // Wrapped MNT
  }
};

async function main() {
  console.log('\n🚀 Deploying YieldEscrow Contract to Mantle Network');
  console.log('=====================================\n');

  // Load private key
  const privateKey = process.env.MANTLE_SEPOLIA_PRIVATE_KEY || process.env.MANTLE_MAINNET_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('Private key not found in environment variables');
  }

  const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}`);
  console.log(`📍 Deploying from: ${account.address}`);
  console.log(`🌐 Network: ${activeChain.name} (Chain ID: ${activeChain.id})\n`);

  // Check balance
  const publicClient = createPublicClient({
    chain: activeChain,
    transport: http(),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`💰 Account Balance: ${formatEther(balance)} MNT`);

  if (balance < parseEther('0.1')) {
    console.warn('⚠️  Warning: Low balance. You may need more MNT for deployment.');
  }

  // Get contract addresses for current network
  const networkAddresses = NETWORK === 'mainnet' ? ADDRESSES.mainnet : ADDRESSES.testnet;

  console.log('\n📋 Configuration:');
  console.log(`   USDT: ${networkAddresses.USDT}`);
  console.log(`   cmETH: ${networkAddresses.cmETH}`);
  console.log(`   Agni Router: ${networkAddresses.agniRouter}`);
  console.log(`   WMNT: ${networkAddresses.WMNT}`);
  
  console.log('\n✅ Using cmETH (Composable mETH) on Mantle L2');
  console.log('   - No L1 bridge required');
  console.log('   - cmETH accrues value like mETH + restaking rewards');
  console.log('   - Direct USDT → cmETH swaps via Agni Finance');

  // Verify addresses
  if (!networkAddresses.cmETH || !networkAddresses.agniRouter) {
    console.error('\n❌ ERROR: Missing required contract addresses!');
    console.error('Please update the ADDRESSES configuration in deploy-yield-escrow.ts\n');
    process.exit(1);
  }

  // Platform wallet (use deployer for now, can be updated later)
  const platformWallet = account.address;
  console.log(`\n💼 Platform Wallet: ${platformWallet}`);

  // Create wallet client
  const walletClient = createWalletClient({
    account,
    chain: activeChain,
    transport: http(),
  });

  console.log('\n🏗️  Deploying YieldEscrow contract...');

  try {
    // Deploy YieldEscrow
    const hash = await walletClient.deployContract({
      abi: YieldEscrowArtifact.abi,
      bytecode: YieldEscrowArtifact.bytecode as `0x${string}`,
      args: [
        networkAddresses.USDT,
        networkAddresses.cmETH,
        networkAddresses.cmETHProtocol,
        networkAddresses.agniRouter,
        platformWallet,
      ],
    });

    console.log(`📝 Transaction Hash: ${hash}`);
    console.log('⏳ Waiting for confirmation...');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success' && receipt.contractAddress) {
      console.log('\n✅ YieldEscrow Contract Deployed Successfully!');
      console.log(`📍 Contract Address: ${receipt.contractAddress}`);
      console.log(`🔗 Explorer: ${activeChain.blockExplorers?.default.url}/address/${receipt.contractAddress}`);

      // Save deployment info
      const deploymentInfo = {
        network: activeChain.name,
        chainId: activeChain.id,
        yieldEscrow: receipt.contractAddress,
        usdt: networkAddresses.USDT,
        cmETH: networkAddresses.cmETH,
        cmETHProtocol: networkAddresses.cmETHProtocol,
        agniRouter: networkAddresses.agniRouter,
        wmnt: networkAddresses.WMNT,
        platformWallet,
        deployer: account.address,
        timestamp: new Date().toISOString(),
        transactionHash: hash,
        blockNumber: receipt.blockNumber.toString(),
      };

      const outputPath = path.join(__dirname, '../deployments/yield-escrow-deployment.json');
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));

      console.log(`\n💾 Deployment info saved to: ${outputPath}`);

      // Generate .env update instructions
      console.log('\n📝 Update your .env file with:');
      console.log('=====================================');
      console.log(`NEXT_PUBLIC_YIELD_ESCROW_ADDRESS=${receipt.contractAddress}`);
      console.log('=====================================\n');

      // Optional: Set compliance oracle and invoice NFT if they exist
      console.log('🔧 Post-Deployment Steps:');
      console.log('1. Update .env with NEXT_PUBLIC_YIELD_ESCROW_ADDRESS');
      console.log('2. Call updateComplianceOracle() if you have a ComplianceOracle deployed');
      console.log('3. Call updateInvoiceNFT() if you have InvoiceNFT deployed');
      console.log('4. Test yield generation with a small escrow\n');

    } else {
      console.error('❌ Deployment failed');
      console.error('Receipt:', receipt);
    }
  } catch (error) {
    console.error('❌ Deployment Error:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('\n✨ Deployment complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Deployment failed:', error);
    process.exit(1);
  });
