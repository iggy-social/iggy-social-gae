import { createPublicClient, http } from 'viem'

// Arbitrum Sepolia chain configuration for server-side use
export const customArbitrumSepolia = {
  id: 421_614,
  name: 'Arbitrum Sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        'https://sepolia-rollup.arbitrum.io/rpc',
        'https://arbitrum-sepolia.drpc.org',
        'https://arbitrum-sepolia.therpc.io',
        'https://arbitrum-sepolia.gateway.tenderly.co',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://sepolia.arbiscan.io',
    },
  },
  testnet: true,
}

// Create a shared public client for server-side blockchain interactions
export const publicClient = createPublicClient({
  chain: customArbitrumSepolia,
  transport: http(),
})
