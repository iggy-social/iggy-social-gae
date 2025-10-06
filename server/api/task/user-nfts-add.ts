import { getAddress, isAddress } from 'viem';
import datastore from '~/server/utils/datastore';
import { getKindNftCollection, getKindUserNfts, publicClient } from '~/server/utils/project';

// TASK: ADD NFT COLLECTION TO USER NFTS BY ADDRESS
export default defineEventHandler(async (event) => {
  const nftAddressRaw = getQuery(event)['nft_address'] as string;
  const userAddressRaw = getQuery(event)['user_address'] as string;

  console.log("Running taskAddNftToUserNfts...");
  console.log("nftAddress: ", nftAddressRaw);
  console.log("userAddress: ", userAddressRaw);

  // CHECK IF NFT ADDRESS IS PROVIDED
  if (!nftAddressRaw || !isAddress(nftAddressRaw)) {
    console.log("nftAddress is required and must be a valid address");
    return "nftAddress is required and must be a valid address";
  }

  // CHECK IF USER ADDRESS IS PROVIDED
  if (!userAddressRaw || !isAddress(userAddressRaw)) {
    console.log("userAddress is required and must be a valid address");
    return "userAddress is required and must be a valid address";
  }

  // make sure addresses are checksummed
  const nftAddress = getAddress(nftAddressRaw);
  const userAddress = getAddress(userAddressRaw);

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
  const kindUserNfts = getKindUserNfts();

  // SAVE TO DATASTORE
  if (!process.env.MYLOCALHOST) {
    // check if NFT collection exists in the database (in the Collection datastore collection)
    const nftKey = datastore.key([kindNftCollection, nftAddress]);
    const [nftCollection] = await datastore.get(nftKey);

    // if it doesn't exist, stop the task
    if (!nftCollection) {
      console.log("NFT collection does not exist in the database");
      return "NFT collection does not exist in our database";
    }

    // check on blockchain if user really holds this NFT
    const nftInterface = {
      balanceOf: {
        inputs: [{ name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }
    };

    try {
      const balanceOf = await publicClient.readContract({
        address: nftAddress,
        abi: [nftInterface.balanceOf],
        functionName: 'balanceOf',
        args: [userAddress]
      }) as bigint;

      const balanceOfNumber = Number(balanceOf);

      // create a key for the UserNfts datastore collection
      const userNftsKey = datastore.key([kindUserNfts, `${userAddress}_${nftAddress}`]);

      // if user's balanceOf is greater than 0, add the NFT to the UserNfts datastore collection
      if (balanceOfNumber > 0) {
        const userNfts = {
          key: userNftsKey,
          data: {
            userAddress: userAddress,
            nftAddress: nftAddress,
            balanceOf: balanceOfNumber
          }
        };

        await datastore.save(userNfts); // either inserts or updates the entity

        console.log("UserNfts saved to the database");
      } else if (balanceOfNumber === 0) {
        console.log("User does not have this NFT (anymore)");

        // delete the UserNfts entity if balanceOf is 0
        await datastore.delete(userNftsKey);

        return "User does not have this NFT";
      } else {
        console.log("balanceOf is not a number");
        return "balanceOf is not a number";
      }
    } catch (error) {
      console.log("Error: ", error);
      return "Error";
    }
  }

  console.log("Task completed!");
  return "ok";
});
