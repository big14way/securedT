'use client';

import { ACTIVE_CHAIN, siteConfig, getExplorerLink } from '../constants';

/**
 * Custom hook for Mantle Explorer integration (Replaces Blockscout SDK)
 * Opens explorer links directly (pages should handle their own notifications)
 */
export function useBlockscout() {
    // Mantle Explorer doesn't have an SDK, so we use direct links

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
            console.log('Transaction submitted:', txHash);
            console.log('View on Mantle Explorer:', explorerLink);
            // Note: Pages should use their own message API to show notifications
            return explorerLink;
        } catch (error) {
            console.error('Failed to get transaction link:', error);
            return null;
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
                console.log(`Opening ${label} transactions on Mantle Explorer`);
            }

            // Open Mantle Explorer in new tab
            if (typeof window !== 'undefined') {
                window.open(explorerLink, '_blank', 'noopener,noreferrer');
            }
            return explorerLink;
        } catch (error) {
            console.error('Failed to open Mantle Explorer:', error);
            return null;
        }
    };

    /**
     * Show recent transactions for the entire chain on Mantle Explorer
     * Opens the explorer in a new tab
     * @param {string} customChainId - Optional custom chain ID (defaults to current chain)
     */
    const showChainTransactions = (customChainId = chainId) => {
        try {
            const explorerUrl = ACTIVE_CHAIN.blockExplorers.default.url;
            console.log('Opening Mantle Explorer...');
            if (typeof window !== 'undefined') {
                window.open(explorerUrl, '_blank', 'noopener,noreferrer');
            }
            return explorerUrl;
        } catch (error) {
            console.error('Failed to open Mantle Explorer:', error);
            return null;
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
            console.log(`Opening ${siteConfig.name} contract transactions on Mantle Explorer`);
        }

        return showAddressTransactions(contractAddress);
    };

    /**
     * Show transactions for USDT token contract
     * This displays all USDT token transfers on the chain
     * @param {string} tokenAddress - USDT token address
     * @param {boolean} showMessage - Whether to show an info message (default: true)
     */
    const showTokenTransactions = (tokenAddress, showMessage = true) => {
        if (showMessage) {
            console.log('Opening USDT token transactions on Mantle Explorer');
        }

        return showAddressTransactions(tokenAddress);
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