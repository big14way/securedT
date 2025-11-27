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
        // Call the faucet function
        const hash = await walletClient.writeContract({
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
