import datastore from '~/server/utils/datastore';
import { getCollectionDataFromBlockchain } from '~/server/utils/collection';
import { getKindNftCollection } from '~/server/utils/project';

// TASK: ADD NFT COLLECTION BY ADDRESS (call from cron job or another task)
export default defineEventHandler(async (event) => {
  const nftAddress = getQuery(event)['nft_address'] as string;
  
  // CHECK IF NFT ADDRESS IS PROVIDED
  if (!nftAddress) {
    console.log("nft_address is required");
    return "nft_address is required";
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

  const kindNftCollection = getKindNftCollection();

  // SAVE TO DATASTORE
  if (!process.env.MYLOCALHOST) {
    const key = datastore.key([kindNftCollection, nftAddress]);

    // check if NFT collection is already stored
    const [exists] = await datastore.get(key);
    if (exists) {
      // if entity already exists, stop the task
      console.log("NFT collection already exists in the database");
      return "NFT collection already exists";
    }

    console.log("Adding NFT collection to the database... Collection address:", nftAddress);
    console.log("key: ", key);

    // fetch NFT collection data from the blockchain
    const collData = await getCollectionDataFromBlockchain(nftAddress, "all");

    const newEntity = {
      key: key,
      data: collData
    };

    await datastore.save(newEntity);
  } else {
    // for localhost testing purposes
    const collData = await getCollectionDataFromBlockchain(nftAddress, "all");
    console.log("collData:", collData);
  }

  console.log("Task completed!");
  return "ok";
});