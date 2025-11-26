'use client';

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { createWalletClient, custom } from "viem";
import { ACTIVE_CHAIN } from "../constants";
import { useMemo, useEffect, useState, useRef } from "react";

export function useWalletClient() {
    const { primaryWallet, user } = useDynamicContext();
    const [asyncProvider, setAsyncProvider] = useState(null);
    const lastFailedAttemptRef = useRef(null);
    
    // Extract only stable primitive values for useMemo dependencies
    const walletAddress = primaryWallet?.address || user?.walletAddress || '';
    const connectorKey = primaryWallet?.connector?.key || '';
    const hasWallet = !!primaryWallet;
    const hasConnector = !!primaryWallet?.connector;

    // Handle async provider retrieval
    useEffect(() => {
        if (primaryWallet?.connector?.getWalletProvider) {
            primaryWallet.connector.getWalletProvider()
                .then(provider => {
                    setAsyncProvider(provider);
                })
                .catch(error => {
                    console.error('Failed to get async provider:', error);
                    setAsyncProvider(null);
                });
        } else {
            setAsyncProvider(null);
        }
    }, [primaryWallet?.connector, connectorKey]);

    const walletClient = useMemo(() => {
        if (!hasWallet || !hasConnector) {
            return null;
        }
        
        // Prevent repeated failed attempts for the same configuration
        const currentAttemptKey = `${connectorKey}-${walletAddress}`;
        if (lastFailedAttemptRef.current === currentAttemptKey) {
            return null;
        }
        
        // Get provider - different wallets expose this differently
        let provider;
        try {
            // Try multiple methods to get the provider from Dynamic.xyz
            // Wrap each in try-catch to prevent SDK errors from breaking everything
            try {
                provider = primaryWallet.connector.provider;
            } catch (e) {
                console.log('provider property failed:', e.message);
            }

            if (!provider) {
                try {
                    provider = primaryWallet.connector.getProvider?.();
                } catch (e) {
                    console.log('getProvider() failed:', e.message);
                }
            }

            if (!provider) {
                provider = primaryWallet.connector.ethereum ||
                           primaryWallet.connector._provider ||
                           asyncProvider;
            }
            
            // For Coinbase wallet, sometimes we need to get it from window.ethereum
            if (!provider && (connectorKey === 'coinbasewallet' || connectorKey === 'coinbase')) {
                if (typeof window !== 'undefined' && window.ethereum) {
                    // Check if this is Coinbase wallet
                    if (window.ethereum.isCoinbaseWallet || window.ethereum.selectedProvider?.isCoinbaseWallet) {
                        provider = window.ethereum.isCoinbaseWallet ? window.ethereum : window.ethereum.selectedProvider;
                    }
                }
            }
            
            // Additional Coinbase wallet detection methods
            if (!provider && (connectorKey === 'coinbasewallet' || connectorKey === 'coinbase')) {
                const connector = primaryWallet.connector;
                if (connector) {
                    const potentialProviders = [
                        connector.provider,
                        connector.getProvider?.(),
                        connector.ethereum,
                        connector._provider,
                        connector.wallet?.provider,
                        connector.sdk?.provider
                    ];
                    
                    for (const potentialProvider of potentialProviders) {
                        if (potentialProvider) {
                            provider = potentialProvider;
                            break;
                        }
                    }
                }
                
                // Try window.coinbaseWalletExtension
                if (!provider && typeof window !== 'undefined' && window.coinbaseWalletExtension) {
                    provider = window.coinbaseWalletExtension;
                }
            }
            
            if (!provider) {
                // Mark this attempt as failed to prevent repeated tries
                lastFailedAttemptRef.current = currentAttemptKey;
                return null;
            }
        } catch (error) {
            console.error('Error getting provider:', error);
            lastFailedAttemptRef.current = currentAttemptKey;
            return null;
        }

        // Ensure we have a valid provider before creating wallet client
        if (!provider) {
            lastFailedAttemptRef.current = currentAttemptKey;
            return null;
        }

        try {
            const client = createWalletClient({
                account: walletAddress,
                chain: ACTIVE_CHAIN,
                transport: custom(provider),
            });
            
            // Reset failed attempts on success
            lastFailedAttemptRef.current = null;
            return client;
        } catch (error) {
            console.error('Error creating wallet client:', error);
            lastFailedAttemptRef.current = currentAttemptKey;
            return null;
        }
    }, [walletAddress, connectorKey, hasWallet, hasConnector, asyncProvider]);

    return walletClient;
}
