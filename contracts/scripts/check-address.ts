import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const privateKey = process.env.MANTLE_SEPOLIA_PRIVATE_KEY;
if (!privateKey) {
  console.log('No private key found');
  process.exit(1);
}

const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}`);
console.log(`Private Key: ${privateKey.substring(0, 10)}...${privateKey.substring(privateKey.length - 6)}`);
console.log(`Address: ${account.address}`);
