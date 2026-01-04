'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBuyerYieldEscrows, isYieldEscrowAvailable } from '../util/yieldEscrowContract';
import {
    isSimulatedYieldMode,
    getSimulatedYieldEscrows,
    calculateSimulatedStats,
    getRealTimeYield
} from '../util/simulatedYield';
import { useWalletAddress } from '../hooks/useWalletAddress';

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
                setTotalStats({ tvl, totalYield, activeEscrows: tableData.length, avgAPY: METH_APY });
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

    if (!walletAddress) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto text-center">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
                        <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-gray-800 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-white mb-2">Connect Wallet</h2>
                        <p className="text-gray-500 text-sm mb-4">
                            Connect your wallet to view yield-generating escrows.
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 text-gray-400 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse"></span>
                            Waiting for connection
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-xl font-semibold text-white">Yield Dashboard</h1>
                        {isSimulated && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                TESTNET
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 text-sm">
                        Track earnings from mETH staking at {METH_APY}% APY
                    </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">TVL</p>
                        <p className="text-base font-semibold text-white">
                            ${totalStats.tvl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Yield Earned</p>
                        <p className="text-base font-semibold text-emerald-400">
                            +${totalStats.totalYield.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Escrows</p>
                        <p className="text-base font-semibold text-white">{totalStats.activeEscrows}</p>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">APY</p>
                        <p className="text-base font-semibold text-white">{totalStats.avgAPY}%</p>
                    </div>
                </div>

                {/* Distribution Info */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mb-6">
                    <p className="text-xs text-gray-400 mb-3">Yield Distribution</p>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                            <span className="text-gray-400">Buyer</span>
                            <span className="text-white font-medium">80%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span className="text-gray-400">Seller</span>
                            <span className="text-white font-medium">15%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                            <span className="text-gray-400">Platform</span>
                            <span className="text-white font-medium">5%</span>
                        </div>
                    </div>
                </div>

                {/* Escrows Section */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-white">Active Escrows</h2>
                        <button
                            onClick={loadYieldData}
                            disabled={loading}
                            className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading...
                            </div>
                        </div>
                    ) : yieldEscrows.length > 0 ? (
                        <>
                            {/* Mobile */}
                            <div className="block lg:hidden divide-y divide-gray-800">
                                {yieldEscrows.map((escrow) => {
                                    const liveYield = realTimeYields[escrow.escrowId] || parseFloat(escrow.estimatedYield);
                                    const buyerShare = liveYield * 0.80;
                                    return (
                                        <div key={escrow.escrowId} className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <span className="text-white text-sm font-medium">#{escrow.escrowId}</span>
                                                    {escrow.description && (
                                                        <p className="text-gray-600 text-xs truncate max-w-[180px]">{escrow.description}</p>
                                                    )}
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                                                    {escrow.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div>
                                                    <p className="text-[10px] text-gray-600 mb-0.5">Amount</p>
                                                    <p className="text-sm text-white">${parseFloat(escrow.amount).toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-600 mb-0.5">Days</p>
                                                    <p className="text-sm text-gray-400">{escrow.daysActive}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-600 mb-0.5">Live Yield</p>
                                                    <p className="text-sm text-emerald-400 font-mono">+${liveYield.toFixed(4)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-600 mb-0.5">Your Share</p>
                                                    <p className="text-sm text-cyan-400 font-mono">+${buyerShare.toFixed(4)}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={`/escrow/${escrow.escrowId}`}
                                                className="block w-full text-center text-xs py-2 rounded bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                                            >
                                                View Details
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop */}
                            <div className="hidden lg:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-800">
                                            <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wide text-gray-500 font-medium">Escrow</th>
                                            <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wide text-gray-500 font-medium">Amount</th>
                                            <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wide text-gray-500 font-medium">Days</th>
                                            <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wide text-gray-500 font-medium">Live Yield</th>
                                            <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wide text-gray-500 font-medium">Your Share</th>
                                            <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wide text-gray-500 font-medium">Status</th>
                                            <th className="px-4 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {yieldEscrows.map((escrow) => {
                                            const liveYield = realTimeYields[escrow.escrowId] || parseFloat(escrow.estimatedYield);
                                            const buyerShare = liveYield * 0.80;
                                            return (
                                                <tr key={escrow.escrowId} className="hover:bg-gray-800/30">
                                                    <td className="px-4 py-3">
                                                        <span className="text-white">#{escrow.escrowId}</span>
                                                        {escrow.description && (
                                                            <p className="text-gray-600 text-xs truncate max-w-[100px]">{escrow.description}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-white">${parseFloat(escrow.amount).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-gray-400">{escrow.daysActive}d</td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-emerald-400 font-mono text-xs">+${liveYield.toFixed(4)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-cyan-400 font-mono text-xs">+${buyerShare.toFixed(4)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                                                            {escrow.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <a
                                                            href={`/escrow/${escrow.escrowId}`}
                                                            className="text-xs text-gray-400 hover:text-white transition-colors"
                                                        >
                                                            View
                                                        </a>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 text-sm mb-3">No yield-generating escrows yet</p>
                            <a
                                href="/escrow"
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                            >
                                Create Escrow
                            </a>
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="mt-6 text-xs text-gray-600">
                    <p className="mb-2">
                        <span className="text-gray-500">Powered by</span>{' '}
                        <a href="https://www.methprotocol.xyz/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                            mETH Protocol
                        </a>
                        {isSimulated && <span className="text-gray-600"> · Simulated yields for testnet</span>}
                    </p>
                    {!isSimulated && (
                        <p className="text-gray-600">
                            Note: Unstaking requires 12+ hours. mETH Protocol charges 0.04% deposit fee and ~10% of rewards.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
