import { publicClient, getAddressNftDirectory } from '~/server/utils/project';
import { nftDirectoryAbi } from '~/server/utils/abi';
import { createTask } from '~/server/utils/tasks';
import { sleep } from '~/server/utils/datetime';
import { isAddress, zeroAddress } from 'viem';
import type { Address } from 'viem';

const pauseMs = 500;

// TASK: FIND NFT COLLECTION ADDRESS BY UNIQUE ID (call from when user creates a new collection)
export default defineEventHandler(async (event) => {
  const hostname = getHeader(event, "x-appengine-default-version-hostname");
  const uniqueId = getQuery(event)['unique_id'] as string;

  // if uniqueId is not provided, return an error
  if (!uniqueId) {
    throw createError({
      statusCode: 400,
      statusMessage: "uniqueId is required"
    });
  }

  // PRODUCTION: CHECK IF REQUEST COMES FROM GOOGLE CLOUD
  if (!process.env.MYLOCALHOST) {
    const isFromGoogleCloud = getHeader(event, 'x-cloudtasks-queuename');

    if (!isFromGoogleCloud) {
      console.log("This is NOT a request from Google Cloud!");
      throw createError({
        statusCode: 403,
        statusMessage: "Sorry, but you cannot call this task directly!"
      });
    }
  }

  const addressNftDirectory = getAddressNftDirectory();

  try {
    // get NFT contract address by unique ID
    const nftAddress = await publicClient.readContract({
      address: addressNftDirectory as Address,
      abi: nftDirectoryAbi,
      functionName: 'getNftContractAddress',
      args: [uniqueId]
    });

    await sleep(pauseMs);

    // if nftAddress is not a zero address, call the task to add collection by address
    if (nftAddress && isAddress(nftAddress) && nftAddress !== zeroAddress) {
      const taskUrl = `https://${hostname}/api/task/add-collection?nft_address=${nftAddress}`;
      console.log(`Running the following task: ${taskUrl}`);
      await createTask(taskUrl);
    }
    
    return "ok";
  } catch (error) {
    console.error("Error finding NFT collection:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to find NFT collection"
    });
  }
});
