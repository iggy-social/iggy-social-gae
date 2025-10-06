import { getAddress, zeroAddress } from 'viem';
import { createTask } from "~/server/utils/tasks.js";

export default defineEventHandler(async (event) => {
  const hostname = getHeader(event, "x-appengine-default-version-hostname");
  const nftAddressRaw = getQuery(event)['nft_address'] as string;
  const userAddressRaw = getQuery(event)['user_address'] as string;

  const nftAddress = getAddress(nftAddressRaw);
  const userAddress = getAddress(userAddressRaw);

  if (!nftAddress || nftAddress === zeroAddress) {
    return { error: "nft_address is required", code: 400 };
  }

  if (!userAddress || userAddress === zeroAddress) {
    return { error: "user_address is required", code: 400 };
  }

  const taskUrl = `https://${hostname}/api/task/user-nfts-add?nft_address=${nftAddress}&user_address=${userAddress}`;
  console.log(`Running the following task: ${taskUrl}`);
  
  if (!process.env.MYLOCALHOST) {
    createTask(taskUrl);
  }

  return { success: true, code: 200 };
});
