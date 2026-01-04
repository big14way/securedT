'use client';

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { createWalletClient, custom } from "viem";
import { ACTIVE_CHAIN } from "../constants";
import { useMemo, useEffect, useState, useRef } from "react";

export function useWalletClient() {
    const { primaryWallet, user } = useDynamicContext();
    const [dynamicClient, setDynamicClient] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const lastAttemptRef = useRef(null);

    const walletAddress = primaryWallet?.address || user?.walletAddress || '';
    const hasWallet = !!primaryWallet;

    // Prefer Dynamic's built-in getWalletClient() which handles authorization properly
    useEffect(() => {
        const getClient = async () => {
            if (!primaryWallet || !walletAddress) {
                setDynamicClient(null);
                return;
            }

            const attemptKey = `${walletAddress}-${primaryWallet.connector?.key}`;
            if (lastAttemptRef.current === attemptKey && dynamicClient) {
                return; // Already have a client for this wallet
            }

            setIsLoading(true);
            try {
                // Method 1: Use Dynamic's getWalletClient (preferred - handles auth properly)
                if (primaryWallet.getWalletClient) {
                    const client = await primaryWallet.getWalletClient();
                    if (client) {
                        console.log('Got wallet client from Dynamic.xyz');
                        lastAttemptRef.current = attemptKey;
                        setDynamicClient(client);
                        setIsLoading(false);
                        return;
                    }
                }

                // Method 2: Get provider and create client with proper account setup
                let provider = null;

                // Try connector methods
                if (primaryWallet.connector) {
                    const connector = primaryWallet.connector;

                    // Try async getProvider first
                    if (typeof connector.getProvider === 'function') {
                        try {
                            provider = await connector.getProvider();
                        } catch (e) {
                            console.log('getProvider() failed:', e.message);
                        }
                    }

                    // Try sync properties
                    if (!provider) {
                        provider = connector.provider || connector.ethereum || connector._provider;
                    }
                }

                // Fallback to window.ethereum
                if (!provider && typeof window !== 'undefined' && window.ethereum) {
                    provider = window.ethereum;
                }

                if (provider) {
                    // Request account access to ensure authorization
                    try {
                        await provider.request({ method: 'eth_requestAccounts' });
                    } catch (authError) {
                        console.log('Account authorization request failed:', authError.message);
                    }

                    // Create wallet client WITHOUT setting account - let provider manage it
                    const client = createWalletClient({
                        chain: ACTIVE_CHAIN,
                        transport: custom(provider),
                    });

                    console.log('Created wallet client with provider');
                    lastAttemptRef.current = attemptKey;
                    setDynamicClient(client);
                }
            } catch (error) {
                console.error('Error getting wallet client:', error);
                setDynamicClient(null);
            } finally {
                setIsLoading(false);
            }
        };

        getClient();
    }, [primaryWallet, walletAddress, hasWallet]);

    return dynamicClient;
}
