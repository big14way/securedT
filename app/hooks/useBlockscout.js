'use client';

import { ACTIVE_CHAIN, siteConfig, getExplorerLink } from '../constants';
import { message } from 'antd';

/**
 * Custom hook for Mantle Explorer integration (Replaces Blockscout SDK)
 * Uses Ant Design's message API for notifications and opens explorer links
 */
export function useBlockscout() {
    // Mantle Explorer doesn't have an SDK, so we use direct links and toast notifications

    // Get the current chain ID as a string (Blockscout expects string)
    const chainId = ACTIVE_CHAIN.id.toString();

    /**
     * Show transaction notification toast with explorer link
     * @param {string} txHash - Transaction hash
     * @param {string} customChainId - Optional custom chain ID (defaults to current chain)
     */
    const showTransactionToast = async (txHash, customChainId = chainId) => {
        try {
            const explorerLink = getExplorerLink(txHash, 'tx', customChainId);
            
            message.loading({
                content: (
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            Transaction Pending
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                            Waiting for confirmation...
                        </div>
                        <a 
                            href={explorerLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ fontSize: '11px', marginTop: 4, display: 'block' }}
                        >
                            View on Mantle Explorer →
                        </a>
                    </div>
                ),
                duration: 4,
                key: txHash,
                style: { marginTop: '60px' }
            });
        } catch (error) {
            console.error('Failed to show transaction toast:', error);
        }
    };

    /**
     * Show transaction history for a specific address on Mantle Explorer
     * Opens the explorer in a new tab
     * @param {string} address - Address to show transactions for
     * @param {string} customChainId - Optional custom chain ID (defaults to current chain)
     * @param {string} label - Optional label to display in info message (e.g., "My Wallet")
     */
    const showAddressTransactions = (address, customChainId = chainId, label = null) => {
        try {
            const explorerLink = getExplorerLink(address, 'address', customChainId);
            
            if (label) {
                message.info({
                    content: (
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                {label} Transactions
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                Opening Mantle Explorer...
                            </div>
                        </div>
                    ),
                    duration: 3,
                    style: { marginTop: '60px' }
                });
            }
            
            // Open Mantle Explorer in new tab
            window.open(explorerLink, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('Failed to open Mantle Explorer:', error);
            message.error('Failed to open explorer');
        }
    };

    /**
     * Show recent transactions for the entire chain on Mantle Explorer
     * Opens the explorer in a new tab
     * @param {string} customChainId - Optional custom chain ID (defaults to current chain)
     */
    const showChainTransactions = (customChainId = chainId) => {
        try {
            const explorerUrl = getExplorerUrl(customChainId);
            message.info('Opening Mantle Explorer...', 2);
            window.open(explorerUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('Failed to open Mantle Explorer:', error);
            message.error('Failed to open explorer');
        }
    };

    /**
     * Show transactions for the SecuredTransfer escrow contract
     * This displays all transactions involving the contract (deposits, releases, refunds, etc.)
     * Shows a friendly message with the app name and provides a link to the contract
     * @param {string} contractAddress - SecuredTransfer contract address
     * @param {boolean} showMessage - Whether to show an info message (default: true)
     */
    const showContractTransactions = (contractAddress, showMessage = true) => {
        if (showMessage) {
            // Show a friendly message with app name and contract link
            const explorerLink = getExplorerLink(contractAddress, 'address');
            message.info({
                content: (
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            {siteConfig.name} Contract Transactions
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                            Viewing all transactions for the escrow contract
                        </div>
                        <a 
                            href={explorerLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ fontSize: '11px', marginTop: 4, display: 'block' }}
                        >
                            View full contract on explorer →
                        </a>
                    </div>
                ),
                duration: 4,
                style: { marginTop: '60px' }
            });
        }
        
        showAddressTransactions(contractAddress);
    };

    /**
     * Show transactions for PYUSD token contract
     * This displays all PYUSD token transfers on the chain
     * @param {string} tokenAddress - PYUSD token address
     * @param {boolean} showMessage - Whether to show an info message (default: true)
     */
    const showTokenTransactions = (tokenAddress, showMessage = true) => {
        if (showMessage) {
            const explorerLink = getExplorerLink(tokenAddress, 'token');
            message.info({
                content: (
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            PYUSD Token Transactions
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                            Viewing all PYUSD transfers on the network
                        </div>
                        <a 
                            href={explorerLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ fontSize: '11px', marginTop: 4, display: 'block' }}
                        >
                            View PYUSD token on explorer →
                        </a>
                    </div>
                ),
                duration: 4,
                style: { marginTop: '60px' }
            });
        }
        
        showAddressTransactions(tokenAddress);
    };

    /**
     * Show transactions for user's wallet with friendly labeling
     * @param {string} walletAddress - User's wallet address
     */
    const showMyTransactions = (walletAddress) => {
        showAddressTransactions(walletAddress, chainId, 'My Wallet');
    };

    return {
        chainId,
        showTransactionToast,
        showAddressTransactions,
        showChainTransactions,
        showContractTransactions,
        showTokenTransactions,
        showMyTransactions
    };
}

// Alias for backward compatibility
export { useBlockscout as useMantleExplorer };