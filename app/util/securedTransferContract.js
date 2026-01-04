'use client';

import { 
    formatUnits,
    parseUnits,
    createPublicClient,
    http
} from 'viem';
import { handleContractError, formatDate } from '.';
import { PYUSD_TOKEN_ADDRESS, ACTIVE_CHAIN, siteConfig } from '../constants';
import { SECUREDTRANSFER_CONTRACT } from './metadata';

// Create a public client for reading from the chain with timeout
const publicClient = createPublicClient({
    chain: ACTIVE_CHAIN,
    transport: http(undefined, {
        timeout: 10_000, // 10 second timeout for RPC calls
        retryCount: 2,
        retryDelay: 1000
    })
});

// Helper function to check if SecuredTransfer contract is deployed and available
export const isContractAvailable = () => {
    return !!siteConfig.contractAddress;
};

// Get contract address with validation
export const getContractAddress = () => {
    if (!isContractAvailable()) {
        throw new Error('SecuredTransferContract address not configured. Running in demo mode.');
    }
    return siteConfig.contractAddress;
};

// Enum for escrow status (matching Solidity enum)
export const EscrowStatus = {
    Active: 0,
    Released: 1,
    Refunded: 2,
    FraudFlagged: 3
};

export const getStatusText = (status) => {
    switch (status) {
        case EscrowStatus.Active: return 'Active';
        case EscrowStatus.Released: return 'Released by buyer';
        case EscrowStatus.Refunded: return 'Refunded';
        case EscrowStatus.FraudFlagged: return 'Fraud Flagged';
        default: return 'Unknown';
    }
};

// Create a new escrow deposit
export const createEscrow = async (walletClient, seller, amount, description, onProgress) => {
    try {
        if (!isContractAvailable()) {
            throw new Error('Contract not available - running in demo mode');
        }

        const contractAddress = getContractAddress();
        const amountInWei = parseUnits(amount.toString(), 6); // USDT has 6 decimals

        console.log('Creating escrow:', {
            seller,
            amount,
            amountInWei: amountInWei.toString(),
            description,
            contractAddress
        });

        // Step 1: Approve USDT spending
        if (onProgress) onProgress('Approving USDT...');
        const approvalHash = await approveToken(walletClient, amountInWei);
        console.log('Token approval hash:', approvalHash);

        // Wait for approval confirmation
        if (onProgress) onProgress('Waiting for approval confirmation...');
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        console.log('Approval confirmed');

        // Step 2: Create the escrow
        if (onProgress) onProgress('Creating escrow...');
        const account = await getAccountFromWallet(walletClient);
        const hash = await walletClient.writeContract({
            account,
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'deposit',
            args: [seller, amountInWei, description]
        });

        console.log('Transaction hash:', hash);

        // Wait for escrow creation confirmation
        if (onProgress) onProgress('Waiting for transaction confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('Escrow created successfully. Receipt:', receipt);

        // Verify the transaction was successful
        if (receipt.status === 'reverted') {
            throw new Error('Transaction reverted - escrow creation failed');
        }

        console.log('✅ Escrow creation confirmed on-chain');
        console.log('Transaction status:', receipt.status);
        console.log('Block number:', receipt.blockNumber);
        console.log('Gas used:', receipt.gasUsed?.toString());

        return hash;
    } catch (error) {
        console.error('Error creating escrow:', error);
        handleContractError(error, 'create escrow');
        throw error;
    }
};

// Helper to get account from wallet client
const getAccountFromWallet = async (walletClient) => {
    // If wallet client already has an account, use it
    if (walletClient.account) {
        return walletClient.account;
    }

    // Otherwise, get addresses from the wallet
    try {
        const addresses = await walletClient.getAddresses();
        if (addresses && addresses.length > 0) {
            return addresses[0];
        }
    } catch (error) {
        console.log('getAddresses failed, trying requestAddresses:', error.message);
    }

    // Try requesting addresses (triggers wallet popup if needed)
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

// Approve USDT token spending
export const approveToken = async (walletClient, amount) => {
    try {
        if (!isContractAvailable()) {
            throw new Error('Contract not available - running in demo mode');
        }

        const contractAddress = getContractAddress();
        const account = await getAccountFromWallet(walletClient);

        console.log('Approving token with account:', account);

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
        console.error('Error approving token:', error);
        handleContractError(error, 'approve token');
        throw error;
    }
};

// Release escrow funds to seller
export const releaseEscrow = async (walletClient, escrowId) => {
    try {
        if (!isContractAvailable()) {
            throw new Error('Contract not available - running in demo mode');
        }

        const contractAddress = getContractAddress();
        const account = await getAccountFromWallet(walletClient);

        const hash = await walletClient.writeContract({
            account,
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'release',
            args: [escrowId]
        });

        return hash;
    } catch (error) {
        console.error('Error releasing escrow:', error);
        handleContractError(error, 'release escrow');
        throw error;
    }
};

// Refund escrow to buyer
export const refundEscrow = async (walletClient, escrowId) => {
    try {
        if (!isContractAvailable()) {
            throw new Error('Contract not available - running in demo mode');
        }

        const contractAddress = getContractAddress();
        const account = await getAccountFromWallet(walletClient);

        const hash = await walletClient.writeContract({
            account,
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'refund',
            args: [escrowId]
        });

        return hash;
    } catch (error) {
        console.error('Error refunding escrow:', error);
        handleContractError(error, 'refund escrow');
        throw error;
    }
};

// Helper to add timeout to async operations
const withTimeout = (promise, timeoutMs = 15000, errorMessage = 'Operation timed out') => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        )
    ]);
};

// Get escrow details by ID
export const getEscrow = async (escrowId) => {
    try {
        if (!isContractAvailable()) {
            throw new Error('Contract not available - running in demo mode');
        }

        const contractAddress = getContractAddress();
        
        console.log('Fetching escrow from blockchain:', { escrowId, contractAddress });
        
        // Add timeout to prevent infinite hanging
        const escrow = await withTimeout(
            publicClient.readContract({
                address: contractAddress,
                abi: SECUREDTRANSFER_CONTRACT.abi,
                functionName: 'getEscrow',
                args: [escrowId]
            }),
            15000, // 15 second timeout
            `Request timed out while loading escrow #${escrowId}. Please check your network connection and try again.`
        );

        console.log('Escrow data received:', escrow);

        return {
            id: Number(escrow.id),
            buyer: escrow.buyer,
            seller: escrow.seller,
            amount: formatUnits(escrow.amount, 6),
            description: escrow.description,
            status: escrow.status,
            statusText: getStatusText(escrow.status),
            createdAt: formatDate(new Date(Number(escrow.createdAt) * 1000)),
            fraudFlagged: escrow.fraudFlagged,
            txHash: escrow.txHash || '', // Add txHash if available
            events: [
                {
                    type: 'Deposited',
                    timestamp: formatDate(new Date(Number(escrow.createdAt) * 1000)),
                    description: 'USDT deposited into escrow contract'
                }
            ]
        };
    } catch (error) {
        console.error('Error getting escrow:', error);
        
        // Check for timeout errors
        if (error.message && error.message.includes('timed out')) {
            throw error; // Re-throw timeout errors directly
        }
        
        // Handle the error and throw the processed error message
        handleContractError(error, 'get escrow');
        throw error; // Ensure error is thrown
    }
};

// Get all escrows for a buyer
export const getBuyerEscrows = async (buyerAddress) => {
    try {
        if (!isContractAvailable()) {
            throw new Error('Contract not available - running in demo mode');
        }

        const contractAddress = getContractAddress();

        console.log('🔍 Fetching buyer escrows for:', buyerAddress);
        console.log('Using contract address:', contractAddress);

        const escrowIds = await publicClient.readContract({
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'getBuyerEscrows',
            args: [buyerAddress]
        });

        console.log('Found escrow IDs:', escrowIds.map(id => id.toString()));

        // Fetch details for each escrow
        const escrows = await Promise.all(
            escrowIds.map(id => getEscrow(Number(id)))
        );

        console.log(`✅ Loaded ${escrows.length} buyer escrows`);
        return escrows;
    } catch (error) {
        console.error('Error getting buyer escrows:', error);
        handleContractError(error, 'get buyer escrows');
        throw error;
    }
};

// Get all escrows for a seller
export const getSellerEscrows = async (sellerAddress) => {
    try {
        if (!isContractAvailable()) {
            throw new Error('Contract not available - running in demo mode');
        }

        console.log('🔍 Fetching seller escrows for:', sellerAddress);

        const contractAddress = getContractAddress();
        
        const escrowIds = await publicClient.readContract({
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'getSellerEscrows',
            args: [sellerAddress]
        });

        // Fetch details for each escrow
        const escrows = await Promise.all(
            escrowIds.map(id => getEscrow(Number(id)))
        );

        return escrows;
    } catch (error) {
        console.error('Error getting seller escrows:', error);
        handleContractError(error, 'get seller escrows');
        throw error;
    }
};

// Get total escrow count
export const getEscrowCounter = async () => {
    try {
        if (!isContractAvailable()) {
            throw new Error('Contract not available - running in demo mode');
        }

        const contractAddress = getContractAddress();
        
        const counter = await publicClient.readContract({
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'escrowCounter'
        });

        return Number(counter);
    } catch (error) {
        console.error('Error getting escrow counter:', error);
        handleContractError(error, 'get escrow counter');
        throw error;
    }
};

// Get USDT token address from contract
export const getPyusdTokenAddress = async () => {
    try {
        if (!isContractAvailable()) {
            return PYUSD_TOKEN_ADDRESS; // fallback to constant
        }

        const contractAddress = getContractAddress();

        const tokenAddress = await publicClient.readContract({
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'pyusdToken'
        });

        return tokenAddress;
    } catch (error) {
        console.error('Error getting USDT token address:', error);
        return PYUSD_TOKEN_ADDRESS; // fallback to constant
    }
};

// Get fraud oracle address
export const getFraudOracle = async () => {
    try {
        if (!isContractAvailable()) {
            throw new Error('Contract not available - running in demo mode');
        }

        const contractAddress = getContractAddress();
        
        const oracleAddress = await publicClient.readContract({
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'fraudOracle'
        });

        return oracleAddress;
    } catch (error) {
        console.error('Error getting fraud oracle:', error);
        handleContractError(error, 'get fraud oracle');
        throw error;
    }
};

// Mark escrow as fraudulent (fraud oracle only)
export const markFraud = async (walletClient, escrowId) => {
    try {
        if (!isContractAvailable()) {
            throw new Error('Contract not available - running in demo mode');
        }

        const contractAddress = getContractAddress();
        const account = await getAccountFromWallet(walletClient);

        const hash = await walletClient.writeContract({
            account,
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'markFraud',
            args: [escrowId]
        });

        return hash;
    } catch (error) {
        console.error('Error marking fraud:', error);
        handleContractError(error, 'mark fraud');
        throw error;
    }
};

// Update fraud oracle (owner only)
export const updateFraudOracle = async (walletClient, newOracleAddress) => {
    try {
        if (!isContractAvailable()) {
            throw new Error('Contract not available - running in demo mode');
        }

        const contractAddress = getContractAddress();
        const account = await getAccountFromWallet(walletClient);

        const hash = await walletClient.writeContract({
            account,
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'updateFraudOracle',
            args: [newOracleAddress]
        });

        return hash;
    } catch (error) {
        console.error('Error updating fraud oracle:', error);
        handleContractError(error, 'update fraud oracle');
        throw error;
    }
};

// Check if current wallet is the fraud oracle
export const isFraudOracle = async (walletAddress) => {
    try {
        if (!isContractAvailable() || !walletAddress) {
            return false;
        }

        const oracleAddress = await getFraudOracle();
        
        // Check if oracle is configured (not zero address)
        const isConfigured = oracleAddress && oracleAddress !== '0x0000000000000000000000000000000000000000';
        if (!isConfigured) {
            return false;
        }
        
        return oracleAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
        console.error('Error checking if fraud oracle:', error);
        return false;
    }
};

// Check if fraud oracle is configured for the contract
export const isFraudOracleConfigured = async () => {
    try {
        if (!isContractAvailable()) {
            return false;
        }

        const contractAddress = getContractAddress();
        
        const isConfigured = await publicClient.readContract({
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'isFraudOracleConfigured'
        });

        return isConfigured;
    } catch (error) {
        console.error('Error checking fraud oracle configuration:', error);
        // Fallback to old method if new function not available
        try {
            const oracleAddress = await getFraudOracle();
            return oracleAddress && oracleAddress !== '0x0000000000000000000000000000000000000000';
        } catch {
            return false;
        }
    }
};

// Query oracle for escrow fraud status
export const queryOracleStatus = async (escrowId) => {
    try {
        if (!isContractAvailable()) {
            throw new Error('Contract not available - running in demo mode');
        }

        const contractAddress = getContractAddress();
        
        const result = await publicClient.readContract({
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'queryOracleStatus',
            args: [escrowId]
        });

        return {
            isFlagged: result[0],
            reason: result[1]
        };
    } catch (error) {
        console.error('Error querying oracle status:', error);
        handleContractError(error, 'query oracle status');
        throw error;
    }
};

// Get comprehensive compliance info for a user
export const getComplianceInfo = async (userAddress) => {
    try {
        if (!isContractAvailable()) {
            // Return mock data for demo mode
            return {
                level: 0,
                limit: parseUnits('1000', 6), // $1,000
                riskScore: 0,
                isBlacklisted: false,
                verifiedAt: 0
            };
        }

        const contractAddress = getContractAddress();
        
        const result = await publicClient.readContract({
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'getComplianceInfo',
            args: [userAddress]
        });

        return {
            level: Number(result[0]),
            limit: result[1],
            riskScore: Number(result[2]),
            isBlacklisted: result[3],
            verifiedAt: Number(result[4])
        };
    } catch (error) {
        console.error('Error getting compliance info:', error);
        // Return default values on error
        return {
            level: 0,
            limit: parseUnits('1000', 6),
            riskScore: 0,
            isBlacklisted: false,
            verifiedAt: 0
        };
    }
};

// Check if a user has completed KYC verification
export const isKYCVerified = async (userAddress) => {
    try {
        if (!isContractAvailable()) {
            return false;
        }

        const contractAddress = getContractAddress();
        
        const result = await publicClient.readContract({
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'isKYCVerified',
            args: [userAddress]
        });

        return result;
    } catch (error) {
        console.error('Error checking KYC status:', error);
        return false;
    }
};

// Get KYC level for a user
export const getKYCLevel = async (userAddress) => {
    try {
        if (!isContractAvailable()) {
            return 0;
        }

        const contractAddress = getContractAddress();
        
        const result = await publicClient.readContract({
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'getKYCLevel',
            args: [userAddress]
        });

        return Number(result);
    } catch (error) {
        console.error('Error getting KYC level:', error);
        return 0;
    }
};

// Get transaction limit for a user
export const getTransactionLimit = async (userAddress) => {
    try {
        if (!isContractAvailable()) {
            return parseUnits('1000', 6); // Default $1,000
        }

        const contractAddress = getContractAddress();
        
        const result = await publicClient.readContract({
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'getTransactionLimit',
            args: [userAddress]
        });

        return result;
    } catch (error) {
        console.error('Error getting transaction limit:', error);
        return parseUnits('1000', 6);
    }
};

// Get AML risk score for a user
export const getAMLRiskScore = async (userAddress) => {
    try {
        if (!isContractAvailable()) {
            return 0;
        }

        const contractAddress = getContractAddress();
        
        const result = await publicClient.readContract({
            address: contractAddress,
            abi: SECUREDTRANSFER_CONTRACT.abi,
            functionName: 'getAMLRiskScore',
            args: [userAddress]
        });

        return Number(result);
    } catch (error) {
        console.error('Error getting AML risk score:', error);
        return 0;
    }
};