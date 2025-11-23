import { isAddress } from 'viem';
import { publicClient } from '~/server/utils/project.js';
import { getAddressNftDirectory } from '~/server/utils/project.js';
import { createTask } from '~/server/utils/tasks.js';
import { sleep } from '~/server/utils/datetime.js';
import { nftDirectoryAbi } from '~/server/utils/abi.js';

const addressNftDirectory = getAddressNftDirectory();
const pauseMs = 500;
const queryLimit = 50;

// CRON: ADD COLLECTIONS
export default defineEventHandler(async (event) => {
  // check if request is from Google Scheduler
  if (!process.env.MYLOCALHOST) {
    const isCronRequest = getHeader(event, 'x-appengine-cron');

    if (!isCronRequest) {
      console.log("This is NOT a request from Google Scheduler");
      throw createError({
        statusCode: 403,
        statusMessage: "Sorry, but you cannot call this URL directly!"
      });
    }
  }

  const hostname = getHeader(event, "x-appengine-default-version-hostname");

  // get number of all NFT contracts in the directory
  const nftContractsArrayLength = await publicClient.readContract({
    address: addressNftDirectory as `0x${string}`,
    abi: nftDirectoryAbi,
    functionName: 'getNftContractsArrayLength'
  }) as bigint;

  await sleep(pauseMs);

  // get last NFT contracts
  try {
    const lastNftContracts = await publicClient.readContract({
      address: addressNftDirectory as `0x${string}`,
      abi: nftDirectoryAbi,
      functionName: 'getLastNftContracts',
      args: [BigInt(queryLimit)]
    }) as unknown as readonly `0x${string}`[];

    await sleep(pauseMs);

    for (let i = 0; i < lastNftContracts.length; i++) {
      const nftAddress = lastNftContracts[i];

      // check if nftAddress is a valid address
      if (isAddress(nftAddress)) {
        const taskUrl = `https://${hostname}/api/task/add-collection?nft_address=${nftAddress}`;
        console.log(`Running the following task: ${taskUrl}`);

        if (!process.env.MYLOCALHOST) {
          createTask(taskUrl);
        }
      }
    }
  } catch (error) {
    console.error("Error getting last NFT contracts:", error);
    return;
  }

  // get random range of NFT contracts using getNftContracts(fromIndex, toIndex) function
  const nftContractsArrayLengthNum = Number(nftContractsArrayLength);
  
  // Only process random range if there are enough contracts
  if (nftContractsArrayLengthNum > queryLimit) {
    const randomToIndex = Math.floor(Math.random() * (nftContractsArrayLengthNum - queryLimit - 1)) + queryLimit;
    const randomFromIndex = randomToIndex - queryLimit;

    try {
    const randomNftContracts = await publicClient.readContract({
      address: addressNftDirectory as `0x${string}`,
      abi: nftDirectoryAbi,
      functionName: 'getNftContracts',
      args: [BigInt(randomFromIndex), BigInt(randomToIndex)]
    }) as unknown as readonly `0x${string}`[];

    await sleep(pauseMs);

    for (let i = 0; i < randomNftContracts.length; i++) {
      const nftAddress = randomNftContracts[i];

      // check if nftAddress is a valid address
      if (isAddress(nftAddress)) {
        const taskUrl = `https://${hostname}/api/task/add-collection?nft_address=${nftAddress}`;
        console.log(`Running the following task: ${taskUrl}`);

        if (!process.env.MYLOCALHOST) {
          createTask(taskUrl);
        }
      }
    }
    } catch (error) {
      console.error("Error getting random NFT contracts:", error);
      return;
    }
  }

  return { success: true, code: 200 };
});

