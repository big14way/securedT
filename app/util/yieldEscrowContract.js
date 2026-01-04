'use client';

import {
    formatUnits,
    parseUnits,
    createPublicClient,
    http
} from 'viem';
import { handleContractError, formatDate } from '.';
import { PYUSD_TOKEN_ADDRESS, ACTIVE_CHAIN } from '../constants';

// YieldEscrow contract address from environment
const YIELD_ESCROW_ADDRESS = process.env.NEXT_PUBLIC_YIELD_ESCROW_ADDRESS;

// YieldEscrow ABI - extracted from compiled contract
const YIELD_ESCROW_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "seller", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"},
            {"internalType": "string", "name": "description", "type": "string"},
            {"internalType": "bool", "name": "yieldEnabled", "type": "bool"}
        ],
        "name": "deposit",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "escrowId", "type": "uint256"}],
        "name": "release",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "escrowId", "type": "uint256"}],
        "name": "refund",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "escrowId", "type": "uint256"}],
        "name": "getEscrow",
        "outputs": [
            {
                "components": [
                    {"internalType": "uint256", "name": "id", "type": "uint256"},
                    {"internalType": "address", "name": "buyer", "type": "address"},
                    {"internalType": "address", "name": "seller", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"},
                    {"internalType": "string", "name": "description", "type": "string"},
                    {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
                    {"internalType": "enum YieldEscrow.EscrowStatus", "name": "status", "type": "uint8"},
                    {"internalType": "bool", "name": "yieldEnabled", "type": "bool"},
                    {"internalType": "uint256", "name": "cmETHAmount", "type": "uint256"}
                ],
                "internalType": "struct YieldEscrow.Escrow",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "escrowId", "type": "uint256"}],
        "name": "getEstimatedYield",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "buyer", "type": "address"}],
        "name": "getBuyerEscrows",
        "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "seller", "type": "address"}],
        "name": "getSellerEscrows",
        "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "escrowCounter",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

// Create a public client for reading from the chain
const publicClient = createPublicClient({
    chain: ACTIVE_CHAIN,
    transport: http(undefined, {
        timeout: 10_000,
        retryCount: 2,
        retryDelay: 1000
    })
});

// Helper function to check if YieldEscrow contract is available
export const isYieldEscrowAvailable = () => {
    // YieldEscrow requires real DeFi protocols (Agni Finance DEX, cmETH) which only exist on mainnet
    // Testnet deployment at 0xdbbe162c7adeec7bb4fe2745b42fcc8b2aba5933 will fail because these protocols don't exist on Sepolia
    // Return false for testnet until we deploy on mainnet or create a testnet-compatible version
    const network = process.env.NEXT_PUBLIC_NETWORK;
    if (network === 'testnet') {
        console.log('⚠️ YieldEscrow disabled on testnet - requires mainnet DeFi protocols (Agni Finance, cmETH)');
        return false;
    }
    return !!YIELD_ESCROW_ADDRESS;
};

// Get YieldEscrow contract address with validation
export const getYieldEscrowAddress = () => {
    if (!isYieldEscrowAvailable()) {
        throw new Error('YieldEscrow contract address not configured');
    }
    return YIELD_ESCROW_ADDRESS;
};

// Enum for escrow status (matching Solidity enum)
export const YieldEscrowStatus = {
    Active: 0,
    Released: 1,
    Refunded: 2
};

export const getYieldStatusText = (status) => {
    switch (status) {
        case YieldEscrowStatus.Active: return 'Active';
        case YieldEscrowStatus.Released: return 'Released';
        case YieldEscrowStatus.Refunded: return 'Refunded';
        default: return 'Unknown';
    }
};

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

// Approve USDT token spending for YieldEscrow contract
export const approveYieldEscrowToken = async (walletClient, amount) => {
    try {
        if (!isYieldEscrowAvailable()) {
            throw new Error('YieldEscrow contract not available');
        }

        const contractAddress = getYieldEscrowAddress();
        const account = await getAccountFromWallet(walletClient);

        // ERC20 ABI for approve function
        const ERC20_ABI = [
            {
                "inputs": [
                    {"internalType": "address", "name": "spender", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ];

        const hash = await walletClient.writeContract({
            account,
            address: PYUSD_TOKEN_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [contractAddress, amount]
        });

        return hash;
    } catch (error) {
        console.error('Error approving token for YieldEscrow:', error);
        handleContractError(error, 'approve token for yield escrow');
        throw error;
    }
};

// Create a new yield-enabled escrow deposit
export const createYieldEscrow = async (walletClient, seller, amount, description, yieldEnabled, onProgress) => {
    try {
        if (!isYieldEscrowAvailable()) {
            throw new Error('YieldEscrow contract not available');
        }

        const contractAddress = getYieldEscrowAddress();
        const amountInWei = parseUnits(amount.toString(), 6); // USDT has 6 decimals

        console.log('Creating yield-enabled escrow:', {
            seller,
            amount,
            amountInWei: amountInWei.toString(),
            description,
            yieldEnabled,
            contractAddress
        });

        // Step 1: Approve USDT spending
        if (onProgress) onProgress('Approving USDT for yield escrow...');
        const approvalHash = await approveYieldEscrowToken(walletClient, amountInWei);
        console.log('Token approval hash:', approvalHash);

        // Wait for approval confirmation
        if (onProgress) onProgress('Waiting for approval confirmation...');
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        console.log('Approval confirmed');

        // Step 2: Create the yield escrow
        if (onProgress) onProgress(yieldEnabled ? 'Creating yield-enabled escrow (swapping to cMETH)...' : 'Creating escrow...');
        const account = await getAccountFromWallet(walletClient);
        const hash = await walletClient.writeContract({
            account,
            address: contractAddress,
            abi: YIELD_ESCROW_ABI,
            functionName: 'deposit',
            args: [seller, amountInWei, description, yieldEnabled]
        });

        console.log('Transaction hash:', hash);

        // Wait for escrow creation confirmation
        if (onProgress) onProgress('Waiting for transaction confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('Yield escrow created successfully. Receipt:', receipt);

        return hash;
    } catch (error) {
        console.error('Error creating yield escrow:', error);
        handleContractError(error, 'create yield escrow');
        throw error;
    }
};

// Get estimated yield for an escrow
export const getEstimatedYield = async (escrowId) => {
    try {
        if (!isYieldEscrowAvailable()) {
            throw new Error('YieldEscrow contract not available');
        }

        const contractAddress = getYieldEscrowAddress();

        const yieldAmount = await publicClient.readContract({
            address: contractAddress,
            abi: YIELD_ESCROW_ABI,
            functionName: 'getEstimatedYield',
            args: [escrowId]
        });

        // Return yield in USDT (6 decimals)
        return formatUnits(yieldAmount, 6);
    } catch (error) {
        console.error('Error getting estimated yield:', error);
        handleContractError(error, 'get estimated yield');
        throw error;
    }
};

// Get yield escrow details by ID
export const getYieldEscrow = async (escrowId) => {
    try {
        if (!isYieldEscrowAvailable()) {
            throw new Error('YieldEscrow contract not available');
        }

        const contractAddress = getYieldEscrowAddress();

        console.log('Fetching yield escrow from blockchain:', { escrowId, contractAddress });

        const escrow = await publicClient.readContract({
            address: contractAddress,
            abi: YIELD_ESCROW_ABI,
            functionName: 'getEscrow',
            args: [escrowId]
        });

        console.log('Yield escrow data received:', escrow);

        // Get estimated yield if active and yield-enabled
        let estimatedYield = null;
        if (escrow.status === YieldEscrowStatus.Active && escrow.yieldEnabled) {
            try {
                estimatedYield = await getEstimatedYield(escrowId);
            } catch (error) {
                console.error('Error fetching estimated yield:', error);
            }
        }

        return {
            id: Number(escrow.id),
            buyer: escrow.buyer,
            seller: escrow.seller,
            amount: formatUnits(escrow.amount, 6),
            description: escrow.description,
            status: escrow.status,
            statusText: getYieldStatusText(escrow.status),
            createdAt: formatDate(new Date(Number(escrow.createdAt) * 1000)),
            yieldEnabled: escrow.yieldEnabled,
            cmETHAmount: formatUnits(escrow.cmETHAmount, 18), // cMETH has 18 decimals
            estimatedYield: estimatedYield,
            events: [
                {
                    type: escrow.yieldEnabled ? 'Deposited (Yield-Enabled)' : 'Deposited',
                    timestamp: formatDate(new Date(Number(escrow.createdAt) * 1000)),
                    description: escrow.yieldEnabled
                        ? 'USDT deposited and swapped to cMETH for yield generation'
                        : 'USDT deposited into yield escrow contract'
                }
            ]
        };
    } catch (error) {
        console.error('Error getting yield escrow:', error);
        handleContractError(error, 'get yield escrow');
        throw error;
    }
};

// Release yield escrow funds to seller (swaps cMETH back to USDT and distributes yield)
export const releaseYieldEscrow = async (walletClient, escrowId) => {
    try {
        if (!isYieldEscrowAvailable()) {
            throw new Error('YieldEscrow contract not available');
        }

        const contractAddress = getYieldEscrowAddress();
        const account = await getAccountFromWallet(walletClient);

        const hash = await walletClient.writeContract({
            account,
            address: contractAddress,
            abi: YIELD_ESCROW_ABI,
            functionName: 'release',
            args: [escrowId]
        });

        return hash;
    } catch (error) {
        console.error('Error releasing yield escrow:', error);
        handleContractError(error, 'release yield escrow');
        throw error;
    }
};

// Refund yield escrow to buyer
export const refundYieldEscrow = async (walletClient, escrowId) => {
    try {
        if (!isYieldEscrowAvailable()) {
            throw new Error('YieldEscrow contract not available');
        }

        const contractAddress = getYieldEscrowAddress();
        const account = await getAccountFromWallet(walletClient);

        const hash = await walletClient.writeContract({
            account,
            address: contractAddress,
            abi: YIELD_ESCROW_ABI,
            functionName: 'refund',
            args: [escrowId]
        });

        return hash;
    } catch (error) {
        console.error('Error refunding yield escrow:', error);
        handleContractError(error, 'refund yield escrow');
        throw error;
    }
};

// Get all yield escrows for a buyer
export const getBuyerYieldEscrows = async (buyerAddress) => {
    try {
        if (!isYieldEscrowAvailable()) {
            throw new Error('YieldEscrow contract not available');
        }

        const contractAddress = getYieldEscrowAddress();

        const escrowIds = await publicClient.readContract({
            address: contractAddress,
            abi: YIELD_ESCROW_ABI,
            functionName: 'getBuyerEscrows',
            args: [buyerAddress]
        });

        // Fetch details for each escrow
        const escrows = await Promise.all(
            escrowIds.map(id => getYieldEscrow(Number(id)))
        );

        return escrows;
    } catch (error) {
        console.error('Error getting buyer yield escrows:', error);
        handleContractError(error, 'get buyer yield escrows');
        throw error;
    }
};

// Get all yield escrows for a seller
export const getSellerYieldEscrows = async (sellerAddress) => {
    try {
        if (!isYieldEscrowAvailable()) {
            throw new Error('YieldEscrow contract not available');
        }

        const contractAddress = getYieldEscrowAddress();

        const escrowIds = await publicClient.readContract({
            address: contractAddress,
            abi: YIELD_ESCROW_ABI,
            functionName: 'getSellerEscrows',
            args: [sellerAddress]
        });

        // Fetch details for each escrow
        const escrows = await Promise.all(
            escrowIds.map(id => getYieldEscrow(Number(id)))
        );

        return escrows;
    } catch (error) {
        console.error('Error getting seller yield escrows:', error);
        handleContractError(error, 'get seller yield escrows');
        throw error;
    }
};

// Get total yield escrow count
export const getYieldEscrowCounter = async () => {
    try {
        if (!isYieldEscrowAvailable()) {
            throw new Error('YieldEscrow contract not available');
        }

        const contractAddress = getYieldEscrowAddress();

        const counter = await publicClient.readContract({
            address: contractAddress,
            abi: YIELD_ESCROW_ABI,
            functionName: 'escrowCounter'
        });

        return Number(counter);
    } catch (error) {
        console.error('Error getting yield escrow counter:', error);
        handleContractError(error, 'get yield escrow counter');
        throw error;
    }
};
