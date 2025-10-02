import { createPublicClient, http } from 'viem'
import { baseSepolia } from '@wagmi/vue/chains'

const addressNftDirectory = "0x498e0e6B245898c5E2dD0299d0456a8928F58ECC"; // TODO: enter the address NFT directory
const kindNftCollection = "NftCollection";

export function getProjectId() {
  return 'iggy-social-gae' // TODO: change to your project ID
}

export function getAddressNftDirectory() {
  return addressNftDirectory;
}

export function getKindNftCollection() {
  return kindNftCollection;
}

// Create a shared public client for server-side blockchain interactions
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})
