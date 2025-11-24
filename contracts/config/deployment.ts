// Deployment configuration that uses the same constants as the frontend
import { sepolia, mainnet } from 'viem/chains';

// Network configuration
const NETWORK = process.env.HARDHAT_NETWORK || process.env.NEXT_PUBLIC_NETWORK || 'sepolia';

// PYUSD token addresses (same as frontend constants)
export const PYUSD_TOKEN_ADDRESS = NETWORK === 'mainnet'
    ? '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8' // mainnet address
    : '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9'; // sepolia address

// Chain configuration
export const CHAIN_CONFIG = {
    sepolia: {
        name: 'Sepolia',
        chainId: sepolia.id,
        pyusdAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9'
    },
    mainnet: {
        name: 'Ethereum Mainnet', 
        chainId: mainnet.id,
        pyusdAddress: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8'
    }
};

// Get deployment parameters for the current network
export function getDeploymentParams(network: string = NETWORK) {
    const config = CHAIN_CONFIG[network as keyof typeof CHAIN_CONFIG] || CHAIN_CONFIG.sepolia;
    
    return {
        pyusdToken: config.pyusdAddress,
        network: config.name,
        chainId: config.chainId
    };
}

export default getDeploymentParams;