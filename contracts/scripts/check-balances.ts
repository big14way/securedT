import { createPublicClient, http, formatUnits, Address } from 'viem';
import { mantleSepoliaTestnet } from 'viem/chains';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const MockUSDTArtifact = require('../artifacts/contracts/MockUSDT.sol/MockUSDT.json');

// Mock USDT address from deployment
const MOCK_USDT_ADDRESS = '0x5d7b6553ad6192a5a0bd2296e8ca118dc2586296' as Address;
const ESCROW_CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '') as Address;

// Your wallet address - update this
const YOUR_WALLET = process.argv[2] as Address || '0x';

async function main() {
  console.log('\n=== Checking Balances for SecuredTransfer ===\n');

  const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http()
  });

  console.log('Wallet:', YOUR_WALLET);
  console.log('MockUSDT:', MOCK_USDT_ADDRESS);
  console.log('Escrow Contract:', ESCROW_CONTRACT);
  console.log('');

  // Check MNT balance
  const mntBalance = await publicClient.getBalance({ address: YOUR_WALLET });
  console.log(`MNT Balance: ${formatUnits(mntBalance, 18)} MNT`);

  // Check USDT balance
  const usdtBalance = await publicClient.readContract({
    address: MOCK_USDT_ADDRESS,
    abi: MockUSDTArtifact.abi,
    functionName: 'balanceOf',
    args: [YOUR_WALLET]
  }) as bigint;

  console.log(`MockUSDT Balance: ${formatUnits(usdtBalance, 6)} USDT`);

  // Check allowance
  const allowance = await publicClient.readContract({
    address: MOCK_USDT_ADDRESS,
    abi: MockUSDTArtifact.abi,
    functionName: 'allowance',
    args: [YOUR_WALLET, ESCROW_CONTRACT]
  }) as bigint;

  console.log(`Allowance to Escrow: ${formatUnits(allowance, 6)} USDT`);

  if (usdtBalance === 0n) {
    console.log('\n⚠️  You have 0 USDT! Run: npx hardhat run scripts/get-test-usdt.ts --network mantleSepolia');
  } else {
    console.log('\n✅ You have USDT! You can create escrows.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
