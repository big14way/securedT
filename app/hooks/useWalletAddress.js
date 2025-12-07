'use client';

import { useState, useEffect, useRef } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useWalletClient } from './useWalletClient';

export function useWalletAddress() {
    const { primaryWallet, user } = useDynamicContext();
    const walletClient = useWalletClient();
    const [address, setAddress] = useState(null);
    const [prevAddress, setPrevAddress] = useState(null);
    const [hasChanged, setHasChanged] = useState(false);
    const lastAddressRef = useRef(null);

    useEffect(() => {
        const getAddress = () => {
            let newAddress = null;

            // Method 1: Get from Dynamic's primaryWallet
            if (primaryWallet?.address) {
                newAddress = primaryWallet.address;
            }
            // Method 2: Get from Dynamic's user
            else if (user?.walletAddress) {
                newAddress = user.walletAddress;
            }
            // Method 3: Get from walletClient
            else if (walletClient) {
                try {
                    newAddress = walletClient.account?.address || walletClient.address;
                } catch (error) {
                    newAddress = null;
                }
            }

            // Only update if the address actually changed
            if (newAddress !== lastAddressRef.current) {
                setPrevAddress(lastAddressRef.current);
                setAddress(newAddress);
                setHasChanged(lastAddressRef.current !== null);
                lastAddressRef.current = newAddress;
            }
        };

        getAddress();
    }, [primaryWallet, user, walletClient]);

    // Reset the change flag after it's been consumed
    const resetHasChanged = () => {
        setHasChanged(false);
    };

    return {
        address,
        prevAddress,
        hasChanged,
        resetHasChanged,
        isConnected: !!address,
        // Additional Dynamic.xyz specific info for debugging
        walletType: primaryWallet?.connector?.key,
        walletName: primaryWallet?.connector?.name
    };
}
