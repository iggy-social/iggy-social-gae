import { getAddress } from 'viem';
import datastore from '~/server/utils/datastore';
import { getAddressNftDirectory, getKindFeatured, publicClient } from '~/server/utils/project';
import { nftDirectoryAbi } from '~/server/utils/abi';

// TASK: UPDATE FEATURED NFT COLLECTION FROM BLOCKCHAIN
export default defineEventHandler(async (event) => {
  console.log("Running taskUpdateFeatured...");

  // PRODUCTION: CHECK IF REQUEST COMES FROM GOOGLE CLOUD
  if (!process.env.MYLOCALHOST) {
    const isFromGoogleCloud = getHeader(event, 'x-cloudtasks-queuename');

    if (!isFromGoogleCloud) {
      console.log("This is NOT a request from Google Cloud!");
      throw createError({
        statusCode: 403,
        statusMessage: "Sorry, but you cannot call this URL directly!"
      });
    }
  }

  const addressNftDirectory = getAddressNftDirectory();
  const kindFeatured = getKindFeatured();

  try {
    // Fetch all featured NFT addresses from blockchain
    console.log("Fetching featured NFT addresses from blockchain...");
    const featuredAddresses = await publicClient.readContract({
      address: addressNftDirectory as `0x${string}`,
      abi: nftDirectoryAbi,
      functionName: 'getAllFeaturedNftContracts'
    }) as `0x${string}`[];

    console.log(`Found ${featuredAddresses.length} featured NFT addresses on blockchain`);

    // Only run datastore operations in production
    if (!process.env.MYLOCALHOST) {
      // Fetch all existing Featured entities from datastore
      console.log("Fetching existing Featured entities from datastore...");
      const featuredQuery = datastore.createQuery(kindFeatured);
      const [existingFeatured] = await datastore.runQuery(featuredQuery);
      
      console.log(`Found ${existingFeatured.length} existing Featured entities in datastore`);

      // Create sets for easier comparison
      const blockchainAddresses = new Set(featuredAddresses.map(addr => getAddress(addr)));
      const datastoreAddresses = new Set(existingFeatured.map(entity => entity.address));

      // Add missing addresses to datastore
      const addressesToAdd = featuredAddresses.filter(addr => {
        const checksummedAddr = getAddress(addr);
        return !datastoreAddresses.has(checksummedAddr);
      });

      console.log(`Adding ${addressesToAdd.length} new featured addresses to datastore`);
      for (const address of addressesToAdd) {
        const checksummedAddr = getAddress(address);
        const key = datastore.key([kindFeatured, checksummedAddr]);
        const entity = {
          key: key,
          data: {
            address: checksummedAddr
          }
        };
        await datastore.save(entity);
        console.log(`Added featured NFT: ${checksummedAddr}`);
      }

      // Remove addresses that are no longer featured on blockchain
      const addressesToRemove = existingFeatured.filter(entity => {
        const entityAddress = entity.address;
        return !blockchainAddresses.has(entityAddress);
      });

      console.log(`Removing ${addressesToRemove.length} addresses that are no longer featured`);
      for (const entity of addressesToRemove) {
        const key = datastore.key([kindFeatured, entity.address]);
        await datastore.delete(key);
        console.log(`Removed featured NFT: ${entity.address}`);
      }

      console.log("Featured collection synchronization completed!");
      console.log(`Added: ${addressesToAdd.length}, Removed: ${addressesToRemove.length}`);
    } else {
      // For localhost testing, just log the addresses
      console.log("Featured NFT addresses from blockchain:", featuredAddresses);
    }

    return "ok";
  } catch (error) {
    console.error("Error updating featured NFTs:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update featured NFTs"
    });
  }
});
