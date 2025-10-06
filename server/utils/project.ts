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

export function getProjectId() {
  return 'iggy-social-gae' // TODO: change to your project ID
}

export function getKindFeatured() {
  return kindFeatured;
}

export function getKindMusicNfts() {
  return kindMusicNfts;
}

export function getAddressNftDirectory() {
  return addressNftDirectory;
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

// Create a shared public client for server-side blockchain interactions
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})
