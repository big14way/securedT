import { createPublicClient, http, Address } from 'viem';
import { mantleSepoliaTestnet } from 'viem/chains';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
dotenv.config({ path: '../.env' });

const SecuredTransferArtifact = JSON.parse(
  readFileSync('./artifacts/contracts/SecuredTransferContract.sol/SecuredTransferContract.json', 'utf-8')
);

const ESCROW_CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '') as Address;
const MOCK_USDT = '0x5d7b6553ad6192a5a0bd2296e8ca118dc2586296' as Address;

async function main() {
  console.log('\n=== Checking SecuredTransfer Contract Configuration ===\n');

  const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http()
  });

  console.log('Escrow Contract:', ESCROW_CONTRACT);
  console.log('Expected MockUSDT:', MOCK_USDT);
  console.log('');

  // Check what token the contract is configured to use
  const tokenAddress = await publicClient.readContract({
    address: ESCROW_CONTRACT,
    abi: SecuredTransferArtifact.abi,
    functionName: 'pyusdToken'
  }) as Address;

  console.log('Contract is configured to use token:', tokenAddress);
  console.log('Matches MockUSDT?', tokenAddress.toLowerCase() === MOCK_USDT.toLowerCase());

  if (tokenAddress.toLowerCase() !== MOCK_USDT.toLowerCase()) {
    console.log('\n⚠️  CONTRACT MISMATCH FOUND!');
    console.log('The escrow contract is configured to use:', tokenAddress);
    console.log('But your frontend is approving:', MOCK_USDT);
    console.log('\nSOLUTION: Need to redeploy SecuredTransferContract with MockUSDT address');
    console.log('Run: npx hardhat run scripts/deploy-escrow-with-mockusdt.ts --network mantleSepolia');
  } else {
    console.log('\n✅ Contract configuration is correct!');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
