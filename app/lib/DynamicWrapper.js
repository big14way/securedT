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
  return (
    <DynamicContextProvider
      settings={{
        // Environment ID provided by user
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID || "c4e54441-0fde-4888-a5e3-44c34def69af",
        walletConnectors: [EthereumWalletConnectors],
        appName: siteConfig.title,
        appLogoUrl: "/logo.png",
        primaryColor: "#ec348b",
        borderRadius: 8,
        // WalletConnect configuration
        walletConnectPreferences: {
          projectId: WALLETCONNECT_PROJECT_ID,
        },
        // Network configuration - Mantle Networks
        overrides: {
          evmNetworks: [
            {
              chainId: 5003,
              name: 'Mantle Sepolia Testnet',
              rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
              nativeCurrency: {
                name: 'MNT',
                symbol: 'MNT',
                decimals: 18,
              },
              blockExplorerUrls: ['https://explorer.sepolia.mantle.xyz'],
              vanityName: 'Mantle Sepolia',
              networkId: 5003,
            },
            {
              chainId: 5000,
              name: 'Mantle Mainnet',
              rpcUrls: ['https://rpc.mantle.xyz'],
              nativeCurrency: {
                name: 'MNT',
                symbol: 'MNT',
                decimals: 18,
              },
              blockExplorerUrls: ['https://explorer.mantle.xyz'],
              vanityName: 'Mantle',
              networkId: 5000,
            },
          ],
        },
        // Recommended wallets with WalletConnect support
        recommendedWallets: [
          {
            walletKey: 'metamask',
          },
          {
            walletKey: 'walletconnect',
          },
          {
            walletKey: 'coinbase',
          },
          {
            walletKey: 'rabby',
          },
        ],
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
