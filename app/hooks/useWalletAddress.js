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
                console.log('Address from primaryWallet:', newAddress);
            }
            // Method 2: Get from Dynamic's user
            else if (user?.walletAddress) {
                newAddress = user.walletAddress;
                console.log('Address from user:', newAddress);
            }
            // Method 3: Get from walletClient
            else if (walletClient) {
                try {
                    newAddress = walletClient.account?.address || walletClient.address;
                    console.log('Address from walletClient:', newAddress);
                } catch (error) {
                    console.error('Error getting wallet address from client:', error);
                    newAddress = null;
                }
            }
            
            // Debug logging
            console.log('Wallet connection state:', {
                primaryWallet: !!primaryWallet,
                primaryWalletAddress: primaryWallet?.address,
                user: !!user,
                userWalletAddress: user?.walletAddress,
                walletClient: !!walletClient,
                finalAddress: newAddress
            });
            
            // Only update if the address actually changed
            if (newAddress !== lastAddressRef.current) {
                console.log('Address change detected:', lastAddressRef.current, '->', newAddress);
                setPrevAddress(lastAddressRef.current);
                setAddress(newAddress);
                setHasChanged(lastAddressRef.current !== null); // Only mark as changed if we had a previous address
                lastAddressRef.current = newAddress;
            }
        };

        getAddress();
    }, [primaryWallet, user, walletClient]);

    // Reset the change flag after it's been consumed
    const resetHasChanged = () => {
        console.log('Resetting hasChanged flag');
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
