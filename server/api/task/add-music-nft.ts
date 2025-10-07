import axios from 'axios';
import { getAddress, isAddress } from 'viem';
import datastore from '~/server/utils/datastore';
import { getKindNftCollection, getKindMusicNfts, publicClient } from '~/server/utils/project';
import { getWorkingUrl } from '~/utils/fileUtils';

// TASK: ADD NFT COLLECTION TO MUSIC NFTS
export default defineEventHandler(async (event) => {
  const nftAddressRaw = getQuery(event)['nft_address'] as string;

  console.log("Running taskAddNftToMusicNfts...");
  console.log("nftAddress: ", nftAddressRaw);

  // CHECK IF NFT ADDRESS IS PROVIDED
  if (!nftAddressRaw || !isAddress(nftAddressRaw)) {
    console.log("nftAddress is required and must be a valid address");
    return "nftAddress is required and must be a valid address";
  }

  // make sure NFT address is checksummed
  const nftAddress = getAddress(nftAddressRaw);

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

  const kindNftCollection = getKindNftCollection();
  const kindMusicNfts = getKindMusicNfts();

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
    const metadataInterface = {
      getMetadata: {
        inputs: [
          { name: 'nftAddress_', type: 'address' },
          { name: 'tokenId_', type: 'uint256' }
        ],
        name: 'getMetadata',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function'
      }
    };

    const nftInterface = {
      metadataAddress: {
        inputs: [],
        name: 'metadataAddress',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function'
      },
      tokenURI: {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'tokenURI',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function'
      }
    };

    console.log("Fetching metadata for NFT contract", nftAddress);

    try {
      const metadataAddress = await publicClient.readContract({
        address: nftAddress,
        abi: [nftInterface.metadataAddress],
        functionName: 'metadataAddress'
      }) as `0x${string}`;

      let metadataUrl: string | undefined;

      try {
        metadataUrl = await publicClient.readContract({
          address: metadataAddress,
          abi: [metadataInterface.getMetadata],
          functionName: 'getMetadata',
          args: [nftAddress, 1n]
        }) as string;
      } catch (error) {
        console.log("Could not get metadata via the getMetadata() function in the Metadata contract", error);

        try {
          metadataUrl = await publicClient.readContract({
            address: nftAddress,
            abi: [nftInterface.tokenURI],
            functionName: 'tokenURI',
            args: [1n]
          }) as string;
        } catch (error) {
          console.log("Could not get metadata via the tokenURI() function in the NFT contract", error);
        }
      }

      console.log("Metadata URL: ", metadataUrl);

      if (metadataUrl) {
        const urlResult = await getWorkingUrl(metadataUrl);

        if (urlResult?.success) {
          metadataUrl = urlResult.url;
        }

        let audioUrl: string | undefined;
        if (metadataUrl.startsWith("http")) {
          console.log("Fetching metadata from", metadataUrl);
          const metadataResponse = await axios.get(metadataUrl);
          let metadata: any = metadataResponse.data;

          if (metadata) {
            // check if metadata type is a string
            if (typeof metadata == 'string') {
              metadata = JSON.parse(metadata);
            }

            console.log("Metadata: ", metadata);

            if (typeof metadata == 'object') {
              console.log("Metadata Audio URL: ", metadata?.audio_url);
              audioUrl = metadata?.audio_url;
            }
          }
        } else {
          // metadataUrl is very likely base64 encoded string. Convert it to metadata JSON object and extract audio_url
          console.log("metadataUrl is not a valid URL, but probably a base64 encoded string");

          try {
            let metadata: any = Buffer.from(metadataUrl.replace("data:application/json;base64,", ""), 'base64').toString('utf-8');

            // check if metadata type is a string
            if (typeof metadata == 'string') {
              metadata = JSON.parse(metadata);
            }

            console.log("Metadata: ", metadata);

            // check if metadata is a JSON object
            if (typeof metadata == 'object') {
              console.log("Metadata Audio URL: ", metadata?.audio_url);
              audioUrl = metadata?.audio_url;
            }
          } catch (error) {
            console.log("Could not decode base64 metadata string", error);
          }
        }

        if (audioUrl) {
          // add or update NFT in the Music NFTs collection
          const musicNftKey = datastore.key([kindMusicNfts, nftAddress]);

          console.log("Adding NFT to Music NFTs collection");

          const timestamp = Math.floor(new Date().getTime() / 1000);

          const entity = {
            key: musicNftKey,
            data: {
              address: nftAddress,
              audioUrl: audioUrl,
              timestamp: timestamp
            }
          };

          await datastore.save(entity);

          // add audio=true to the existing NFT collection in the database
          const updatedNftCollection = {
            ...nftCollection,
            audio: true,
            audioUrl: audioUrl,
          };

          const updatedNftCollectionEntity = {
            key: nftKey,
            data: updatedNftCollection
          };

          await datastore.save(updatedNftCollectionEntity);
        }
      }
    } catch (error) {
      console.log("Error: ", error);
      return "Error";
    }
  }

  console.log("Task completed!");
  return "ok";
});
