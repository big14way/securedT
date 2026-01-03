'use client';

import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";

import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import {
  createConfig,
  WagmiProvider,
} from 'wagmi';
import {siteConfig, ACTIVE_CHAIN, CHAIN_OPTIONS} from '../constants'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import { mantleSepoliaTestnet, mantle } from 'viem/chains';
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

// WalletConnect Project ID
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "1eebe528ca0ce94a99ceaa2e915058d7";

// Wagmi configuration with Mantle Network support
const config = createConfig({
  chains: [mantleSepoliaTestnet, mantle, mainnet, sepolia],
  multiInjectedProviderDiscovery: false,
  transports: {
    [mantleSepoliaTestnet.id]: http(),
    [mantle.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

const DynamicWrapper = ({ children }) => {
  // Log environment ID on client side for debugging
  if (typeof window !== 'undefined') {
    console.log('Dynamic ENV ID:', process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID);
    console.log('Origin:', window.location.origin);
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID || "80c9ac91-1cc0-454c-a570-9901c4eaef92",
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            {children}
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
};

export default DynamicWrapper;
