'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ACTIVE_CHAIN } from '../constants';

export const useNetworkSwitcher = () => {
  const { primaryWallet } = useDynamicContext();
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true); // Start with true to prevent initial flash
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const checkTimeoutRef = useRef(null);

  const checkNetwork = useCallback(async () => {
    if (!primaryWallet) {
      console.log('No primary wallet connected');
      setIsCorrectNetwork(true); // Set to true when no wallet to hide network switcher
      setHasChecked(true);
      return true; // Return true so network switcher doesn't show
    }
    
    try {
      console.log('Checking network for wallet:', primaryWallet.connector?.key || 'unknown');
      console.log('Required chain ID:', ACTIVE_CHAIN.id, 'Required chain name:', ACTIVE_CHAIN.name);

      let currentChainId;

      // Method 1: Try getting network from Dynamic connector first (most reliable after switch)
      if (!currentChainId) {
        try {
          const network = await primaryWallet.connector.getNetwork();
          console.log('Network from connector.getNetwork():', network);

          // Handle different network response formats
          if (typeof network === 'number') {
            currentChainId = network;
          } else if (network?.chain?.id) {
            currentChainId = network.chain.id;
          } else if (network?.chainId) {
            currentChainId = typeof network.chainId === 'string' ? parseInt(network.chainId, 16) : network.chainId;
          } else if (network?.id) {
            currentChainId = typeof network.id === 'string' ? parseInt(network.id, 16) : network.id;
          }
        } catch (error) {
          console.log('connector.getNetwork() failed:', error);
        }
      }

      // Method 2: Try getting chain ID directly from provider if available
      if (!currentChainId && primaryWallet.connector?.provider) {
        try {
          const provider = primaryWallet.connector.provider;
          
          // For MetaMask/injected wallets
          if (provider.request) {
            const chainId = await provider.request({ method: 'eth_chainId' });
            currentChainId = parseInt(chainId, 16);
            console.log('Chain ID from provider.request:', currentChainId);
          }
          // For other providers
          else if (provider.chainId) {
            currentChainId = typeof provider.chainId === 'string' ? parseInt(provider.chainId, 16) : provider.chainId;
            console.log('Chain ID from provider.chainId:', currentChainId);
          }
        } catch (error) {
          console.log('Provider chain ID detection failed:', error);
        }
      }
      
      // Method 4: Try getting from wallet directly
      if (!currentChainId && primaryWallet.network) {
        currentChainId = primaryWallet.network;
        console.log('Chain ID from wallet.network:', currentChainId);
      }
      
      // Method 5: For Coinbase wallet specifically
      if (!currentChainId && primaryWallet.connector?.key === 'coinbasewallet') {
        try {
          // Coinbase wallet sometimes exposes chainId differently
          const cbProvider = primaryWallet.connector.provider;
          if (cbProvider?.selectedAddress && cbProvider?.networkVersion) {
            currentChainId = parseInt(cbProvider.networkVersion);
            console.log('Coinbase wallet networkVersion:', currentChainId);
          }
        } catch (error) {
          console.log('Coinbase wallet detection failed:', error);
        }
      }

      // Method 6: LAST RESORT - Check window.ethereum (may not reflect Dynamic wallet state)
      if (!currentChainId && typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          currentChainId = parseInt(chainId, 16);
          console.log('Chain ID from window.ethereum (last resort):', currentChainId);
        } catch (error) {
          console.log('window.ethereum.request failed:', error);
        }
      }

      if (!currentChainId) {
        console.error('Unable to determine chain ID from any method');
        console.log('Wallet details:', {
          connectorKey: primaryWallet.connector?.key,
          network: primaryWallet.network,
          provider: !!primaryWallet.connector?.provider
        });
        setIsCorrectNetwork(false);
        setHasChecked(true);
        return false;
      }
      
      console.log('Detected chain ID:', currentChainId, 'Required chain ID:', ACTIVE_CHAIN.id);
      
      const isCorrect = currentChainId === ACTIVE_CHAIN.id;
      console.log('Network is correct:', isCorrect);
      
      // Only update state if the value actually changed to prevent unnecessary re-renders
      setIsCorrectNetwork(prev => prev !== isCorrect ? isCorrect : prev);
      setHasChecked(true);
      return isCorrect;
    } catch (error) {
      console.error('Error checking network:', error);
      setIsCorrectNetwork(false);
      setHasChecked(true);
      return false;
    }
  }, [primaryWallet]);

  const switchToRequiredNetwork = useCallback(async () => {
    if (!primaryWallet) {
      throw new Error('No wallet connected');
    }

    setIsChecking(true);
    try {
      const targetChainId = ACTIVE_CHAIN.id;
      const targetChainIdHex = `0x${targetChainId.toString(16)}`;
      console.log('Attempting to switch to network:', targetChainId, 'hex:', targetChainIdHex);
      console.log('Wallet connector:', primaryWallet.connector?.key);
      console.log('Active chain config:', ACTIVE_CHAIN);
      
      // Try different network switching approaches based on wallet type
      const provider = primaryWallet.connector?.provider;
      console.log('Provider details:', {
        hasProvider: !!provider,
        hasRequest: !!provider?.request,
        providerType: typeof provider,
        providerKeys: provider ? Object.keys(provider) : [],
        walletKey: primaryWallet.connector?.key,
        hasPrimaryWalletSwitch: !!primaryWallet.switchNetwork,
        hasConnectorSwitch: !!primaryWallet.connector?.switchNetwork
      });
      
      // Method 1: For Dynamic.xyz wallets, try Dynamic's methods first (most reliable for Dynamic)
      if (primaryWallet.switchNetwork) {
        try {
          console.log('Trying Dynamic primaryWallet.switchNetwork...');
          await primaryWallet.switchNetwork(targetChainId);
          console.log('Dynamic primaryWallet.switchNetwork successful');
        } catch (dynamicError) {
          console.log('Dynamic primaryWallet.switchNetwork failed:', {
            message: dynamicError.message,
            code: dynamicError.code,
            fullError: dynamicError
          });
          
          // Try connector.switchNetwork as fallback
          if (primaryWallet.connector?.switchNetwork) {
            try {
              console.log('Trying Dynamic connector.switchNetwork...');
              await primaryWallet.connector.switchNetwork(targetChainId);
              console.log('Dynamic connector.switchNetwork successful');
            } catch (connectorError) {
              console.log('Dynamic connector.switchNetwork failed:', {
                message: connectorError.message,
                code: connectorError.code,
                fullError: connectorError
              });
              
              // Continue to try provider.request method
            }
          }
        }
      }
      
      // Method 2: Try direct provider request for non-Dynamic or as fallback
      if (provider?.request) {
        try {
          console.log('Trying direct provider wallet_switchEthereumChain...');
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainIdHex }],
          });
          console.log('Direct provider switch successful');
        } catch (switchError) {
          console.log('Direct provider switch failed:', {
            message: switchError.message,
            code: switchError.code,
            data: switchError.data,
            fullError: switchError
          });
          
          // If chain doesn't exist (error 4902), try to add it
          if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain ID')) {
            try {
              console.log('Chain not found, attempting to add Mantle Sepolia...');
              const chainParams = {
                chainId: targetChainIdHex,
                chainName: ACTIVE_CHAIN.name,
                nativeCurrency: {
                  name: ACTIVE_CHAIN.nativeCurrency.name,
                  symbol: ACTIVE_CHAIN.nativeCurrency.symbol,
                  decimals: ACTIVE_CHAIN.nativeCurrency.decimals,
                },
                rpcUrls: ACTIVE_CHAIN.rpcUrls.default.http,
                blockExplorerUrls: [ACTIVE_CHAIN.blockExplorers.default.url],
              };
              
              console.log('Adding chain with params:', chainParams);
              
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [chainParams],
              });
              console.log('Chain added successfully');
            } catch (addError) {
              console.log('Failed to add chain:', {
                message: addError.message,
                code: addError.code,
                fullError: addError
              });
              throw new Error(`Unable to add ${ACTIVE_CHAIN.name} network. Error: ${addError.message}`);
            }
          } else {
            throw switchError;
          }
        }
      }
      
      // If all methods failed, throw a comprehensive error
      if (!primaryWallet.switchNetwork && !provider?.request) {
        throw new Error(`Unable to switch networks automatically. Please manually switch your wallet to ${ACTIVE_CHAIN.name} (Chain ID: ${targetChainId}). 
        
Debugging info:
- Wallet: ${primaryWallet.connector?.key || 'unknown'}
- Has provider.request: ${!!provider?.request}
- Has primaryWallet.switchNetwork: ${!!primaryWallet.switchNetwork}
- Has connector.switchNetwork: ${!!primaryWallet.connector?.switchNetwork}`);
      }
        
      // Wait a moment for the network to settle
      await new Promise(resolve => setTimeout(resolve, 1500));
      await checkNetwork();
      return true;
    } catch (error) {
      console.error('Error switching network:', error);
      throw error;
    } finally {
      setIsChecking(false);
    }
  }, [primaryWallet, checkNetwork]);  const ensureCorrectNetwork = useCallback(async () => {
    const isCorrect = await checkNetwork();
    if (!isCorrect) {
      console.log('Network is incorrect, attempting to switch...');
      try {
        await switchToRequiredNetwork();
        // Wait a bit for the switch to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Check again after switching
        const isNowCorrect = await checkNetwork();
        console.log('After switch, network correct?', isNowCorrect);
        if (!isNowCorrect) {
          // Don't throw - let the transaction proceed and fail naturally if network is actually wrong
          console.warn('Network switch may have failed, but proceeding anyway. Transaction will fail if network is wrong.');
        }
      } catch (switchError) {
        console.log('Auto-switch failed:', switchError);
        // Don't throw - let user proceed. Transaction will fail if network is actually wrong
        console.warn('Auto-switch failed, but proceeding anyway. Make sure you are on the correct network.');
      }
    }
    return isCorrectNetwork;
  }, [checkNetwork, switchToRequiredNetwork, isCorrectNetwork]);

  // Check network when wallet changes and set up network change listener
  useEffect(() => {
    if (primaryWallet && !hasChecked) {
      // Add a small delay to prevent rapid state changes
      const timeoutId = setTimeout(() => {
        checkNetwork();
      }, 100);
      
      // Set up network change listener if provider supports it
      const setupNetworkListener = () => {
        const provider = primaryWallet.connector?.provider;
        if (provider && provider.on) {
          const handleChainChanged = (chainId) => {
            console.log('Chain changed detected:', chainId);
            // Wait a bit for the change to settle
            setTimeout(() => {
              checkNetwork();
            }, 500);
          };
          
          provider.on('chainChanged', handleChainChanged);
          
          // Cleanup function
          return () => {
            if (provider.removeListener) {
              provider.removeListener('chainChanged', handleChainChanged);
            } else if (provider.off) {
              provider.off('chainChanged', handleChainChanged);
            }
          };
        }
      };
      
      const cleanup = setupNetworkListener();
      
      return () => {
        clearTimeout(timeoutId);
        if (cleanup) cleanup();
      };
    }
  }, [primaryWallet, hasChecked, checkNetwork]);

  // Reset hasChecked when wallet changes
  useEffect(() => {
    if (!primaryWallet) {
      setHasChecked(false);
      setIsCorrectNetwork(true); // Default to true when no wallet to hide switcher
    }
  }, [primaryWallet]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  return {
    isCorrectNetwork,
    isChecking,
    switchToRequiredNetwork,
    ensureCorrectNetwork,
    checkNetwork,
    requiredNetwork: ACTIVE_CHAIN
  };
};
