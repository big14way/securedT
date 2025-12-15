'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatUnits } from 'viem';
import { STABLECOIN_DECIMALS } from '../constants';
import { getBuyerYieldEscrows, isYieldEscrowAvailable } from '../util/yieldEscrowContract';
import {
    isSimulatedYieldMode,
    getSimulatedYieldEscrows,
    calculateSimulatedStats,
    getRealTimeYield,
    SIMULATED_APY,
    YIELD_DISTRIBUTION
} from '../util/simulatedYield';
import { useWalletAddress } from '../hooks/useWalletAddress';

// mETH Protocol APY
const METH_APY = 7.2;

export default function YieldPage() {
    const { address: walletAddress } = useWalletAddress();
    const [loading, setLoading] = useState(false);
    const [yieldEscrows, setYieldEscrows] = useState([]);
    const [isSimulated, setIsSimulated] = useState(false);
    const [realTimeYields, setRealTimeYields] = useState({});
    const [totalStats, setTotalStats] = useState({
        tvl: 0,
        totalYield: 0,
        activeEscrows: 0,
        avgAPY: METH_APY
    });

    // Real-time yield counter effect
    useEffect(() => {
        if (yieldEscrows.length === 0) return;

        const interval = setInterval(() => {
            const newYields = {};
            yieldEscrows.forEach(escrow => {
                const amount = parseFloat(escrow.amount);
                const createdAt = new Date(escrow.depositDate || escrow.createdAt);
                newYields[escrow.escrowId] = getRealTimeYield(amount, createdAt);
            });
            setRealTimeYields(newYields);
        }, 1000);

        return () => clearInterval(interval);
    }, [yieldEscrows]);

    const loadYieldData = useCallback(async () => {
        if (!walletAddress) return;

        setLoading(true);
        try {
            const simulated = isSimulatedYieldMode();
            setIsSimulated(simulated);

            let escrows = [];

            if (simulated) {
                // Use simulated yield data for testnet
                escrows = await getSimulatedYieldEscrows(walletAddress);

                const tableData = escrows.map(escrow => ({
                    escrowId: escrow.escrowId,
                    amount: escrow.amount,
                    depositDate: escrow.createdAt,
                    daysActive: escrow.daysActive,
                    estimatedYield: escrow.estimatedYield,
                    projectedYield: escrow.projectedYield,
                    mETHStaked: escrow.cmETHAmount,
                    status: escrow.statusText,
                    distribution: escrow.distribution,
                    description: escrow.description,
                    seller: escrow.seller
                }));

                setYieldEscrows(tableData);

                const stats = calculateSimulatedStats(escrows);
                setTotalStats(stats);
            } else if (isYieldEscrowAvailable()) {
                // Use real yield data for mainnet
                escrows = await getBuyerYieldEscrows(walletAddress);
                const yieldEnabledEscrows = escrows.filter(e => e.yieldEnabled && e.status === 0);

                const tableData = yieldEnabledEscrows.map(escrow => {
                    const amount = parseFloat(escrow.amount);
                    const createdAt = new Date(escrow.createdAt);
                    const daysActive = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                    const estimatedYield = amount * (METH_APY / 100) * (daysActive / 365);
                    const projectedYield = amount * (METH_APY / 100);

                    return {
                        escrowId: escrow.id.toString(),
                        amount: amount.toString(),
                        depositDate: createdAt,
                        daysActive,
                        estimatedYield: estimatedYield.toFixed(4),
                        projectedYield: projectedYield.toFixed(2),
                        mETHStaked: escrow.cmETHAmount || '0',
                        status: escrow.statusText,
                        distribution: {
                            buyer: (estimatedYield * 0.80).toFixed(4),
                            seller: (estimatedYield * 0.15).toFixed(4),
                            platform: (estimatedYield * 0.05).toFixed(4)
                        }
                    };
                });

                setYieldEscrows(tableData);

                const tvl = tableData.reduce((sum, e) => sum + parseFloat(e.amount), 0);
                const totalYield = tableData.reduce((sum, e) => sum + parseFloat(e.estimatedYield), 0);

                setTotalStats({
                    tvl,
                    totalYield,
                    activeEscrows: tableData.length,
                    avgAPY: METH_APY
                });
            }
        } catch (error) {
            console.error('Error loading yield data:', error);
            setYieldEscrows([]);
            setTotalStats({ tvl: 0, totalYield: 0, activeEscrows: 0, avgAPY: METH_APY });
        } finally {
            setLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        loadYieldData();
    }, [loadYieldData]);

    const formatAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (!walletAddress) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="cyber-card p-12">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                            <svg className="w-12 h-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
                        <p className="text-gray-400 mb-8">
                            Connect your wallet to view your yield-generating escrows and track earnings from mETH staking.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                            <span className="text-cyan-400 text-sm">Waiting for connection...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Yield Dashboard
                        </h1>
                        {isSimulated && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse">
                                ⚡ SIMULATED (Testnet)
                            </span>
                        )}
                    </div>
                    <p className="text-gray-400 max-w-2xl">
                        Track your yield-generating escrows powered by Mantle's mETH Protocol.
                        {isSimulated
                            ? ' Simulated yield shows what you would earn on mainnet at 7.2% APY.'
                            : ' Escrowed funds are staked in mETH to earn ~7.2% APY while maintaining payment security.'
                        }
                    </p>
                </div>

                {/* mETH Protocol Banner */}
                <div className="cyber-card mb-8 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-cyan-600/20 to-pink-600/20"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
                    <div className="relative p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">⚡</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">mETH Protocol Integration</h3>
                                </div>
                                <p className="text-gray-300">
                                    {isSimulated
                                        ? 'On mainnet, your escrowed funds would be staked in Mantle\'s mETH liquid staking protocol for real yield generation.'
                                        : 'Your escrowed funds are staked in Mantle\'s mETH liquid staking protocol. Withdrawals require a minimum 12-hour unstaking period.'
                                    }
                                </p>
                            </div>
                            <a
                                href="https://www.methprotocol.xyz/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cyber-button-secondary whitespace-nowrap"
                            >
                                Learn More →
                            </a>
                        </div>
                    </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* TVL */}
                    <div className="cyber-card p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
                        <div className="relative">
                            <p className="text-gray-400 text-sm mb-1">Total Value Locked</p>
                            <p className="text-3xl font-bold text-cyan-400">
                                ${totalStats.tvl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-gray-500">In yield escrows</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Yield */}
                    <div className="cyber-card p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
                        <div className="relative">
                            <p className="text-gray-400 text-sm mb-1">Total Yield Accrued</p>
                            <p className="text-3xl font-bold text-green-400">
                                +${totalStats.totalYield.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                <span className="text-xs text-green-400/80">Growing in real-time</span>
                            </div>
                        </div>
                    </div>

                    {/* Active Escrows */}
                    <div className="cyber-card p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                        <div className="relative">
                            <p className="text-gray-400 text-sm mb-1">Active Yield Escrows</p>
                            <p className="text-3xl font-bold text-purple-400">{totalStats.activeEscrows}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-gray-500">Earning yield</span>
                            </div>
                        </div>
                    </div>

                    {/* APY */}
                    <div className="cyber-card p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-all"></div>
                        <div className="relative">
                            <p className="text-gray-400 text-sm mb-1">Current mETH APY</p>
                            <p className="text-3xl font-bold text-yellow-400">{totalStats.avgAPY}%</p>
                            <div className="mt-2">
                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                    <div
                                        className="bg-gradient-to-r from-yellow-500 to-orange-500 h-1.5 rounded-full"
                                        style={{ width: `${Math.min(totalStats.avgAPY * 10, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Yield Distribution */}
                <div className="cyber-card p-6 mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-white">Yield Distribution</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-cyan-400 font-semibold">Buyer Share</span>
                                <span className="text-2xl font-bold text-cyan-400">80%</span>
                            </div>
                            <p className="text-gray-400 text-sm">You funded the escrow, so you receive the majority of yield earnings.</p>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-green-400 font-semibold">Seller Share</span>
                                <span className="text-2xl font-bold text-green-400">15%</span>
                            </div>
                            <p className="text-gray-400 text-sm">Seller receives bonus for accepting yield-enabled escrow payment.</p>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-yellow-400 font-semibold">Platform Fee</span>
                                <span className="text-2xl font-bold text-yellow-400">5%</span>
                            </div>
                            <p className="text-gray-400 text-sm">Covers gas costs and protocol maintenance operations.</p>
                        </div>
                    </div>
                </div>

                {/* Escrows Table */}
                <div className="cyber-card overflow-hidden">
                    <div className="p-6 border-b border-gray-700/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                <h3 className="text-lg font-semibold text-white">Your Yield-Generating Escrows</h3>
                            </div>
                            <button
                                onClick={loadYieldData}
                                className="cyber-button-secondary text-sm"
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center gap-3">
                                <svg className="animate-spin h-6 w-6 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-gray-400">Loading yield data...</span>
                            </div>
                        </div>
                    ) : yieldEscrows.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-800/50">
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Escrow</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Days Active</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">mETH Staked</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Live Yield</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Your Share (80%)</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/50">
                                    {yieldEscrows.map((escrow) => {
                                        const liveYield = realTimeYields[escrow.escrowId] || parseFloat(escrow.estimatedYield);
                                        const buyerShare = liveYield * 0.80;

                                        return (
                                            <tr key={escrow.escrowId} className="hover:bg-gray-800/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <span className="text-white font-medium">#{escrow.escrowId}</span>
                                                        {escrow.description && (
                                                            <p className="text-gray-500 text-xs mt-1 truncate max-w-[150px]">{escrow.description}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-white font-semibold">${parseFloat(escrow.amount).toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {escrow.daysActive} days
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-gray-300">{escrow.mETHStaked} mETH</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-green-400 font-mono font-semibold">
                                                            +${liveYield.toFixed(6)}
                                                        </span>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-cyan-400 font-mono">
                                                        +${buyerShare.toFixed(6)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        {escrow.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <a
                                                        href={`/escrow/${escrow.escrowId}`}
                                                        className="cyber-button text-xs px-3 py-1.5"
                                                    >
                                                        Release & Claim
                                                    </a>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No Yield-Generating Escrows</h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                Create an escrow with "Enable Yield Generation" to start earning {METH_APY}% APY on your escrowed funds.
                            </p>
                            <a href="/escrow" className="cyber-button inline-flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Yield Escrow
                            </a>
                        </div>
                    )}
                </div>

                {/* Important Notes */}
                <div className="cyber-card p-6 mt-8">
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-white">Important Information</h3>
                        {isSimulated && (
                            <span className="ml-auto px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                Testnet Simulation
                            </span>
                        )}
                    </div>
                    <div className="space-y-4 text-gray-300 text-sm">
                        {isSimulated ? (
                            <>
                                <div className="flex gap-3">
                                    <span className="text-yellow-400">⚡</span>
                                    <p><strong className="text-white">Simulated Yield:</strong> On testnet, yield is calculated based on what you would earn on mainnet. No actual mETH staking occurs.</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-cyan-400">📊</span>
                                    <p><strong className="text-white">Real-Time Display:</strong> The yield counter updates in real-time to show how yield accumulates over time at {METH_APY}% APY.</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-green-400">✅</span>
                                    <p><strong className="text-white">Mainnet Ready:</strong> On mainnet deployment, actual mETH staking will generate real yield through Mantle's liquid staking protocol.</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex gap-3">
                                    <span className="text-yellow-400">⏱️</span>
                                    <p><strong className="text-white">Unstaking Period:</strong> When you release or refund a yield-enabled escrow, there is a minimum 12-hour delay for mETH unstaking (up to 40+ days depending on Ethereum validator queue).</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-cyan-400">💰</span>
                                    <p><strong className="text-white">mETH Protocol Fee:</strong> mETH Protocol charges a 0.04% (4 bps) fee on deposits and approximately 10% of staking rewards.</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-purple-400">📈</span>
                                    <p><strong className="text-white">Exchange Rate:</strong> mETH is a value-accumulating token. 1 mETH ≠ 1 ETH but appreciates over time as staking rewards accrue.</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-red-400">⚠️</span>
                                    <p><strong className="text-white">Risk:</strong> While mETH is secured by blue-chip protocols, DeFi always carries smart contract risk. Only enable yield if you're comfortable with this.</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* How It Works - for testnet */}
                {isSimulated && (
                    <div className="cyber-card p-6 mt-8">
                        <div className="flex items-center gap-2 mb-6">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <h3 className="text-lg font-semibold text-white">How Simulated Yield Works</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-cyan-500/30 to-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-xl">1</div>
                                <h4 className="text-white font-medium mb-2">Create Escrow</h4>
                                <p className="text-gray-400 text-sm">Fund an escrow with USDT. On testnet, yield simulation begins immediately.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-purple-500/30 to-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-xl">2</div>
                                <h4 className="text-white font-medium mb-2">Yield Accrues</h4>
                                <p className="text-gray-400 text-sm">Yield is calculated at {METH_APY}% APY based on time elapsed since escrow creation.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-green-500/30 to-green-500/10 flex items-center justify-center text-green-400 font-bold text-xl">3</div>
                                <h4 className="text-white font-medium mb-2">Distribution</h4>
                                <p className="text-gray-400 text-sm">When released, yield is split: 80% buyer, 15% seller, 5% platform.</p>
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                            <p className="text-cyan-300 text-sm text-center">
                                <strong>Formula:</strong> Yield = Principal × (APY / 100) × (Days Elapsed / 365)
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
