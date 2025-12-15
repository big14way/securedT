'use client';

/**
 * Simulated Yield System for Testnet
 *
 * This module provides simulated yield calculations for escrows on testnet
 * where real DeFi protocols (mETH, Agni Finance) are not available.
 *
 * The simulation accurately models what would happen on mainnet:
 * - 7.2% APY yield generation
 * - 80/15/5 yield distribution (buyer/seller/platform)
 * - Time-based yield accrual
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { ACTIVE_CHAIN, STABLECOIN_DECIMALS } from '../constants';

// Simulated mETH APY (matches mainnet)
export const SIMULATED_APY = 7.2;

// Yield distribution percentages
export const YIELD_DISTRIBUTION = {
  buyer: 0.80,    // 80%
  seller: 0.15,   // 15%
  platform: 0.05  // 5%
};

// SecuredTransferContract ABI for reading escrows
const ESCROW_ABI = [
  {
    "inputs": [{"type": "uint256", "name": "escrowId"}],
    "name": "getEscrow",
    "outputs": [{
      "type": "tuple",
      "components": [
        {"type": "uint256", "name": "id"},
        {"type": "address", "name": "buyer"},
        {"type": "address", "name": "seller"},
        {"type": "uint256", "name": "amount"},
        {"type": "string", "name": "description"},
        {"type": "uint256", "name": "createdAt"},
        {"type": "uint8", "name": "status"}
      ]
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"type": "address", "name": "buyer"}],
    "name": "getBuyerEscrows",
    "outputs": [{"type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "escrowCounter",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Create public client
const getPublicClient = () => createPublicClient({
  chain: ACTIVE_CHAIN,
  transport: http()
});

/**
 * Check if we're on testnet (simulated yield mode)
 */
export const isSimulatedYieldMode = () => {
  const network = process.env.NEXT_PUBLIC_NETWORK;
  return network === 'testnet';
};

/**
 * Calculate simulated yield based on amount and time elapsed
 * @param {number} amount - Principal amount in USDT
 * @param {number} daysElapsed - Number of days since deposit
 * @param {number} apy - Annual percentage yield (default 7.2%)
 * @returns {number} Yield amount in USDT
 */
export const calculateSimulatedYield = (amount, daysElapsed, apy = SIMULATED_APY) => {
  // Yield = Principal * APY * (Days / 365)
  const yield_ = amount * (apy / 100) * (daysElapsed / 365);
  return yield_;
};

/**
 * Calculate yield distribution
 * @param {number} totalYield - Total yield amount
 * @returns {object} Distribution breakdown
 */
export const calculateYieldDistribution = (totalYield) => {
  return {
    buyer: totalYield * YIELD_DISTRIBUTION.buyer,
    seller: totalYield * YIELD_DISTRIBUTION.seller,
    platform: totalYield * YIELD_DISTRIBUTION.platform,
    total: totalYield
  };
};

/**
 * Calculate projected annual yield
 * @param {number} amount - Principal amount
 * @param {number} apy - Annual percentage yield
 * @returns {number} Projected annual yield
 */
export const calculateProjectedYield = (amount, apy = SIMULATED_APY) => {
  return amount * (apy / 100);
};

/**
 * Get all escrows with simulated yield data for a buyer
 * @param {string} buyerAddress - Buyer's wallet address
 * @returns {Promise<Array>} Array of escrows with yield data
 */
export const getSimulatedYieldEscrows = async (buyerAddress) => {
  try {
    const publicClient = getPublicClient();
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    if (!contractAddress) {
      console.warn('Contract address not configured');
      return [];
    }

    // Get buyer's escrow IDs
    const escrowIds = await publicClient.readContract({
      address: contractAddress,
      abi: ESCROW_ABI,
      functionName: 'getBuyerEscrows',
      args: [buyerAddress]
    });

    // Fetch details for each escrow
    const escrows = await Promise.all(
      escrowIds.map(async (escrowId) => {
        try {
          const escrow = await publicClient.readContract({
            address: contractAddress,
            abi: ESCROW_ABI,
            functionName: 'getEscrow',
            args: [escrowId]
          });

          const amount = Number(formatUnits(escrow.amount, STABLECOIN_DECIMALS));
          const createdAt = new Date(Number(escrow.createdAt) * 1000);
          const now = new Date();
          const daysElapsed = Math.max(0, (now - createdAt) / (1000 * 60 * 60 * 24));

          // Calculate simulated yield
          const estimatedYield = calculateSimulatedYield(amount, daysElapsed);
          const projectedYield = calculateProjectedYield(amount);
          const distribution = calculateYieldDistribution(estimatedYield);

          // Simulate cMETH amount (1 cMETH ≈ 1.07 ETH value, ETH ≈ $2000)
          // For simulation: amount in USDT / 2000 = ETH equivalent
          const simulatedCmETH = (amount / 2000).toFixed(6);

          return {
            id: Number(escrow.id),
            escrowId: escrow.id.toString(),
            buyer: escrow.buyer,
            seller: escrow.seller,
            amount: amount.toString(),
            description: escrow.description,
            status: Number(escrow.status),
            statusText: getStatusText(Number(escrow.status)),
            createdAt: createdAt,
            daysActive: Math.floor(daysElapsed),
            yieldEnabled: true, // Simulated - all escrows can "earn" yield
            isSimulated: true,
            // Yield data
            estimatedYield: estimatedYield.toFixed(4),
            projectedYield: projectedYield.toFixed(2),
            distribution: {
              buyer: distribution.buyer.toFixed(4),
              seller: distribution.seller.toFixed(4),
              platform: distribution.platform.toFixed(4)
            },
            // Simulated mETH data
            cmETHAmount: simulatedCmETH,
            apy: SIMULATED_APY
          };
        } catch (error) {
          console.error(`Error fetching escrow ${escrowId}:`, error);
          return null;
        }
      })
    );

    // Filter out nulls and only return active escrows (status 0)
    return escrows.filter(e => e !== null && e.status === 0);
  } catch (error) {
    console.error('Error getting simulated yield escrows:', error);
    return [];
  }
};

/**
 * Get total statistics for simulated yield
 * @param {Array} escrows - Array of escrow objects
 * @returns {object} Total statistics
 */
export const calculateSimulatedStats = (escrows) => {
  const tvl = escrows.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalYield = escrows.reduce((sum, e) => sum + parseFloat(e.estimatedYield), 0);
  const activeEscrows = escrows.length;

  return {
    tvl,
    totalYield,
    activeEscrows,
    avgAPY: SIMULATED_APY,
    isSimulated: true
  };
};

/**
 * Get status text from status number
 */
const getStatusText = (status) => {
  switch (status) {
    case 0: return 'Active';
    case 1: return 'Released';
    case 2: return 'Refunded';
    case 3: return 'Disputed';
    default: return 'Unknown';
  }
};

/**
 * Format yield for display
 * @param {number|string} yield_ - Yield amount
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted yield
 */
export const formatYield = (yield_, decimals = 2) => {
  const num = typeof yield_ === 'string' ? parseFloat(yield_) : yield_;
  return num.toFixed(decimals);
};

/**
 * Get real-time simulated yield (updates every second for demo)
 * @param {number} amount - Principal amount
 * @param {Date} startDate - Deposit date
 * @returns {number} Current yield
 */
export const getRealTimeYield = (amount, startDate) => {
  const now = new Date();
  const secondsElapsed = (now - startDate) / 1000;
  const daysElapsed = secondsElapsed / (60 * 60 * 24);
  return calculateSimulatedYield(amount, daysElapsed);
};
