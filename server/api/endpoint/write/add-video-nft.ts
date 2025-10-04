import { getAddress, zeroAddress } from 'viem';
import { createTask } from "~/server/utils/tasks.js";

export default defineEventHandler(async (event) => {
  const hostname = getHeader(event, "x-appengine-default-version-hostname");
  const nftAddressRaw = getQuery(event)['nft_address'] as string;
  const nftAddress = getAddress(nftAddressRaw);

  if (!nftAddress || nftAddress === zeroAddress) {
    return { error: "nft_address is required", code: 400 };
  }

  const taskUrl = `https://${hostname}/api/task/add-video-nft?nft_address=${nftAddress}`;
  console.log(`Running the following task: ${taskUrl}`);
  
  if (!process.env.MYLOCALHOST) {
    createTask(taskUrl);
  }

  return { success: true, code: 200 };
});
