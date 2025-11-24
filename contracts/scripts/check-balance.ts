import { createPublicClient, http, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet } from 'viem/chains';
import * as dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

async function main() {
  const privateKey = process.env.MANTLE_SEPOLIA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('MANTLE_SEPOLIA_PRIVATE_KEY not found in .env file');
  }
  
  const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}`);
  
  const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(process.env.MANTLE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.mantle.xyz')
  });
  
  console.log(`Checking balance for: ${account.address}`);
  console.log(`Network: ${mantleSepoliaTestnet.name} (Chain ID: ${mantleSepoliaTestnet.id})\n`);
  
  const balance = await publicClient.getBalance({ address: account.address });
  
  console.log(`Balance: ${formatEther(balance)} MNT`);
  
  if (balance === 0n) {
    console.log('\n⚠️  Account has no MNT tokens!');
    console.log('\nPlease fund your account from:');
    console.log('1. Official Mantle Faucet: https://faucet.sepolia.mantle.xyz/');
    console.log('2. Or bridge from Sepolia ETH: https://bridge.sepolia.mantle.xyz/');
  } else {
    console.log('\n✅ Account has sufficient funds for deployment!');
  }
}

main().catch(console.error);
