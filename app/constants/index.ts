// Define Mantle chain objects
import { mantleSepoliaTestnet, mantle } from 'viem/chains';

export const siteConfig = {
    title: 'SecuredTransfer | Stablecoin Consumer Protection On-Chain',
    name: 'SecuredTransfer',
    description: 'Tokenizing real-world invoices as tradable NFTs with instant liquidity through blockchain-based escrow and compliance on Mantle Network',
    cta: {
        primary: 'Create Escrow',
        secondary: 'Learn More'
    },
    logo: {
        url : '/logo.png',
        width: 180,
        height: 37,
        alt: 'SecuredTransfer Logo'
    },
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || undefined,
    useCases: [
        'Freelancers and service providers collecting offers or deposits',
        'Anyone looking to simplify client onboarding and payment',
        'Agencies or consultants issuing milestone-based contracts',
        'Teams wanting full audibility of actions with on-chain payout logic'
    ]
};

// Demo data for testing
export const DEMO_DATA = {
    sellerAddress: '0x81e9aA254Ff408458A7267Df3469198f5045A561',
    amount: 100, // USDT (6 decimals)
    description: 'Website design project'
};

// Legacy exports for backward compatibility
export const APP_NAME = siteConfig.name;
export const APP_DESC = siteConfig.description;


// Chain configuration - Mantle Networks
export const CHAIN_OPTIONS = [mantleSepoliaTestnet, mantle];
export const CHAIN_MAP = {
    [mantleSepoliaTestnet.id]: mantleSepoliaTestnet, // 5003
    [mantle.id]: mantle // 5000
};

export const NETWORK = process.env.NEXT_PUBLIC_NETWORK
export const ACTIVE_CHAIN =  NETWORK === 'mainnet' ? mantle : mantleSepoliaTestnet;

// Mantle Explorer URLs
const MANTLE_EXPLORER_URLS = {
    [mantleSepoliaTestnet.id]: 'https://explorer.sepolia.mantle.xyz',
    [mantle.id]: 'https://explorer.mantle.xyz'
};

// Helper function to get Mantle explorer URL for current chain
export const getExplorerUrl = (chainId = ACTIVE_CHAIN.id) => {
    return MANTLE_EXPLORER_URLS[chainId] || MANTLE_EXPLORER_URLS[mantleSepoliaTestnet.id];
};

// Helper function to generate Mantle explorer links
export const getExplorerLink = (address, type = 'address', chainId = ACTIVE_CHAIN.id) => {
    const baseUrl = getExplorerUrl(chainId);
    return `${baseUrl}/${type}/${address}`;
};

// Mantle Network configuration
export const MANTLE_CONFIG = {
    // Current chain ID as string
    chainId: ACTIVE_CHAIN.id.toString(),
    // Supported chain IDs for Mantle
    supportedChains: ['5000', '5003'], // mainnet, sepolia testnet
    // Check if current chain is supported
    isSupported: () => {
        const currentChainId = ACTIVE_CHAIN.id.toString();
        return MANTLE_CONFIG.supportedChains.includes(currentChainId);
    },
    // Mantle RPC URLs
    rpcUrls: {
        mainnet: 'https://rpc.mantle.xyz',
        testnet: 'https://rpc.sepolia.mantle.xyz'
    }
};

// Stablecoin addresses on Mantle Network
// Using USDT as the primary stablecoin (6 decimals like PYUSD)
export const STABLECOIN_CONFIG = {
    mainnet: {
        USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
        USDC: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
    },
    testnet: {
        // Mantle Sepolia testnet stablecoin addresses (use faucet tokens or mock)
        USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE', // Note: Update with actual testnet address
        USDC: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9', // Note: Update with actual testnet address
    }
};

// Primary stablecoin address (USDT on Mantle)
export const STABLECOIN_ADDRESS = NETWORK === 'mainnet'
    ? STABLECOIN_CONFIG.mainnet.USDT
    : STABLECOIN_CONFIG.testnet.USDT;

// Legacy alias for backward compatibility
export const PYUSD_TOKEN_ADDRESS = STABLECOIN_ADDRESS;

// Stablecoin decimals (USDT uses 6 decimals like PYUSD)
export const STABLECOIN_DECIMALS = 6;
export const STABLECOIN_SYMBOL = 'USDT';

export const IPFS_BASE_URL = 'https://ipfs.io/ipfs';

// Dynamic and other integrations (add more as needed)
export const DYNAMIC_AUTH_URL = 'https://dynamic.xyz'; // Example placeholder

// Escrow creation steps configuration
export const ESCROW_CREATION_STEPS = [
    {
        title: 'Escrow Details',
        description: 'Set up the escrow parameters'
    },
    {
        title: 'Deposit Funds',
        description: 'Deposit USDT into escrow'
    },
    {
        title: 'Confirmation',
        description: 'Review and confirm transaction'
    }
];
