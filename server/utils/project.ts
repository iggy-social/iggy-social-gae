import { createPublicClient, http } from 'viem'
import { baseSepolia } from '@wagmi/vue/chains'

const addressNftDirectory = "0x498e0e6B245898c5E2dD0299d0456a8928F58ECC"; // TODO: enter the address NFT directory
const kindFeatured = "Featured";
const kindMusicNfts = "MusicNfts";
const kindNftCollection = "NftCollection";
const kindTradingVolumeDaily = "TradingVolumeDaily";
const kindTradingVolumeWeekly = "TradingVolumeWeekly";
const kindUserNfts = "UserNfts";
const kindVideoNfts = "VideoNfts";
const maxLimit = 16;
const nativeTokenCoingeckoId = "ethereum"; // TODO: change to the native token of the chain
const projectId = "iggy-social-gae"; // TODO: change to your project ID
const selectedChain = baseSepolia; // TODO: change to the chain you are using

export function getAddressNftDirectory() {
  return addressNftDirectory;
}

export function getChainId() {
  return selectedChain.id;
}

export function getKindFeatured() {
  return kindFeatured;
}

export function getKindMusicNfts() {
  return kindMusicNfts;
}

export function getKindNftCollection() {
  return kindNftCollection;
}

export function getKindTradingVolumeDaily() {
  return kindTradingVolumeDaily;
}

export function getKindTradingVolumeWeekly() {
  return kindTradingVolumeWeekly;
}

export function getKindUserNfts() {
  return kindUserNfts;
}

export function getKindVideoNfts() {
  return kindVideoNfts;
}

export function getMaxLimit() {
  return maxLimit; // Maximum number of items to return in a single request
}

export function getNativeTokenCoingeckoId() {
  return nativeTokenCoingeckoId;
}

export function getProjectId() {
  return projectId;
}

// Create a shared public client for server-side blockchain interactions
export const publicClient = createPublicClient({
  chain: selectedChain,
  transport: http(),
})
