import * as React from 'react'
import { useWalletClient } from 'wagmi'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { ethers } from 'ethers'
import { ACTIVE_CHAIN } from '../constants'
 
export function walletClientToSigner(walletClient) {
  if (!walletClient) {
    return undefined;
  }
  
  let { account, chain, transport } = walletClient
  if (!chain) {
    chain = ACTIVE_CHAIN
  }
  
  if (!account || !transport) {
    console.warn("walletClientToSigner: Missing account or transport", walletClient);
    return undefined;
  }
  
  console.log("walletClientToSigner", walletClient, chain)
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  const provider = new ethers.providers.Web3Provider(transport, network)
  const signer = provider.getSigner(account.address)
  return signer
}

// Convert Dynamic wallet to ethers signer
export function dynamicWalletToSigner(wallet) {
  if (!wallet?.connector?.ethers) {
    return undefined;
  }
  
  try {
    // Dynamic provides ethers provider directly
    const provider = wallet.connector.ethers;
    const signer = provider.getSigner();
    return signer;
  } catch (error) {
    console.error('Error creating signer from Dynamic wallet:', error);
    return undefined;
  }
}
 
/** Hook to convert a viem Wallet Client or Dynamic wallet to an ethers.js Signer. */
export function useEthersSigner({ chainId } = {}) {
  const { data: walletClient } = useWalletClient({ chainId })
  const { primaryWallet } = useDynamicContext()
  
  return React.useMemo(() => {
    // Try Dynamic wallet first
    if (primaryWallet?.connector?.ethers) {
      console.log('Using Dynamic wallet for signer')
      return dynamicWalletToSigner(primaryWallet)
    }
    
    // Fallback to wagmi wallet client
    if (walletClient) {
      console.log('Using wagmi wallet client for signer')
      return walletClientToSigner(walletClient)
    }
    
    return undefined
  }, [walletClient, primaryWallet])
}