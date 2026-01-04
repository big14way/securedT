import { STABLECOIN_CONFIG, NETWORK } from '../constants';

// MockUSDT ABI - only the faucet and balanceOf functions
const MOCK_USDT_ABI = [
    {
        "inputs": [],
        "name": "faucet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    }
];

// Helper to get account from wallet client
const getAccountFromWallet = async (walletClient) => {
    if (walletClient.account) {
        return walletClient.account;
    }

    try {
        const addresses = await walletClient.getAddresses();
        if (addresses && addresses.length > 0) {
            return addresses[0];
        }
    } catch (error) {
        console.log('getAddresses failed, trying requestAddresses:', error.message);
    }

    try {
        const addresses = await walletClient.requestAddresses();
        if (addresses && addresses.length > 0) {
            return addresses[0];
        }
    } catch (error) {
        console.log('requestAddresses failed:', error.message);
    }

    throw new Error('Could not get account from wallet. Please ensure your wallet is connected and authorized.');
};

/**
 * Get test USDT from the faucet (testnet only)
 * Gives 1000 USDT per call
 */
export async function getTestUSDT(walletClient) {
    if (NETWORK !== 'testnet') {
        throw new Error('Faucet is only available on testnet');
    }

    const mockUsdtAddress = STABLECOIN_CONFIG.testnet.USDT;

    try {
        const account = await getAccountFromWallet(walletClient);

        // Call the faucet function
        const hash = await walletClient.writeContract({
            account,
            address: mockUsdtAddress,
            abi: MOCK_USDT_ABI,
            functionName: 'faucet',
            args: []
        });

        console.log('Faucet transaction hash:', hash);
        return hash;
    } catch (error) {
        console.error('Failed to get test USDT:', error);
        throw error;
    }
}

/**
 * Check USDT balance
 */
export async function checkUSDTBalance(publicClient, address) {
    const usdtAddress = NETWORK === 'testnet'
        ? STABLECOIN_CONFIG.testnet.USDT
        : STABLECOIN_CONFIG.mainnet.USDT;

    try {
        const balance = await publicClient.readContract({
            address: usdtAddress,
            abi: MOCK_USDT_ABI,
            functionName: 'balanceOf',
            args: [address]
        });

        return balance;
    } catch (error) {
        console.error('Failed to check USDT balance:', error);
        return 0n;
    }
}
