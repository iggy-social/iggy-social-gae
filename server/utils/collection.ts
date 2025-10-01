import { publicClient } from './project.js';
import { sleep } from './time.js';
import { metadataAbi, nftAbi } from './abi.js';

const pauseMs = 500;
const descriptionMaxLength = 500;

/**
 * Get collection data from the blockchain
 * @param {string} nftAddress - NFT contract address
 * @param {string} scope - Amount of data to be returned: all, mint, burn, feeChange, description, title, previewImage
 * @returns {object} - Collection data
 */
export async function getCollectionDataFromBlockchain(nftAddress: string, scope?: string) {
  try {
    if (!scope) {
      scope = "all";
    }

    // last updated
    const lastUpdatedTimestamp = Math.floor(new Date().getTime() / 1000);
    const lastUpdatedDate = new Date();

    // narrow scope actions: mint, burn
    if (scope === "mint") {
      const [mintPrice, burnPrice] = await Promise.all([
        publicClient.readContract({
          address: nftAddress as `0x${string}`,
          abi: nftAbi,
          functionName: 'getMintPrice'
        }),
        publicClient.readContract({
          address: nftAddress as `0x${string}`,
          abi: nftAbi,
          functionName: 'getBurnPrice'
        })
      ]);

      await sleep(pauseMs);

      const [counter, totalSupply] = await Promise.all([
        publicClient.readContract({
          address: nftAddress as `0x${string}`,
          abi: nftAbi,
          functionName: 'counter'
        }),
        publicClient.readContract({
          address: nftAddress as `0x${string}`,
          abi: nftAbi,
          functionName: 'totalSupply'
        })
      ]);

      await sleep(pauseMs);

      const activity = Number(counter) - Number(totalSupply);
      return {
        activity: activity,
        address: nftAddress,
        burnPrice: Number(mintPrice) / 1e18,
        counter: Number(counter),
        mintPrice: Number(burnPrice) / 1e18,
        supply: Number(totalSupply),
        lastUpdatedTimestamp: lastUpdatedTimestamp,
        lastUpdatedDate: lastUpdatedDate
      };
    } else if (scope === "burn") {
      const [burnPrice, mintPrice] = await Promise.all([
        publicClient.readContract({
          address: nftAddress as `0x${string}`,
          abi: nftAbi,
          functionName: 'getBurnPrice'
        }),
        publicClient.readContract({
          address: nftAddress as `0x${string}`,
          abi: nftAbi,
          functionName: 'getMintPrice'
        })
      ]);

      await sleep(pauseMs);

      const [counter, totalSupply] = await Promise.all([
        publicClient.readContract({
          address: nftAddress as `0x${string}`,
          abi: nftAbi,
          functionName: 'counter'
        }),
        publicClient.readContract({
          address: nftAddress as `0x${string}`,
          abi: nftAbi,
          functionName: 'totalSupply'
        })
      ]);

      await sleep(pauseMs);

      const activity = Number(counter) - Number(totalSupply);
      return {
        activity: activity,
        address: nftAddress,
        burnPrice: Number(burnPrice) / 1e18,
        mintPrice: Number(mintPrice) / 1e18,
        supply: Number(totalSupply),
        lastUpdatedTimestamp: lastUpdatedTimestamp,
        lastUpdatedDate: lastUpdatedDate
      };
    } else if (scope === "feeChange") {
      const mintingFee = await publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: nftAbi,
        functionName: 'mintingFeePercentage'
      });

      return {
        address: nftAddress,
        mintingFee: Number(mintingFee) / 1e18,
        lastUpdatedTimestamp: lastUpdatedTimestamp,
        lastUpdatedDate: lastUpdatedDate
      };
    }

    // create metadata contract
    const metadataAddress = await publicClient.readContract({
      address: nftAddress as `0x${string}`,
      abi: nftAbi,
      functionName: 'metadataAddress'
    });

    await sleep(pauseMs);

    // narrow scope actions: description, metadata, previewImage
    if (scope === "description") {
      let description = await publicClient.readContract({
        address: metadataAddress as `0x${string}`,
        abi: metadataAbi,
        functionName: 'getCollectionDescription',
        args: [nftAddress as `0x${string}`]
      });

      // if description is longer than X characters, only use the first 500 characters
      if (description.length > descriptionMaxLength) {
        description = description.substring(0, descriptionMaxLength) + "...";
      }

      return {
        address: nftAddress,
        description: description,
        lastUpdatedTimestamp: lastUpdatedTimestamp,
        lastUpdatedDate: lastUpdatedDate
      };
    } else if (scope === "title") {
      const title = await publicClient.readContract({
        address: metadataAddress as `0x${string}`,
        abi: metadataAbi,
        functionName: 'getCollectionName',
        args: [nftAddress as `0x${string}`]
      });

      return {
        address: nftAddress,
        title: title,
        lastUpdatedTimestamp: lastUpdatedTimestamp,
        lastUpdatedDate: lastUpdatedDate
      };
    } else if (scope === "previewImage") {
      try {
        const previewImage = await publicClient.readContract({
          address: metadataAddress as `0x${string}`,
          abi: metadataAbi,
          functionName: 'getCollectionPreviewImage',
          args: [nftAddress as `0x${string}`]
        });

        return {
          address: nftAddress,
          previewImage: previewImage,
          lastUpdatedTimestamp: lastUpdatedTimestamp,
          lastUpdatedDate: lastUpdatedDate
        };
      } catch (error) {
        console.error(`Error fetching preview image for ${nftAddress}:`, error);
        return {
          address: nftAddress
        };
      }
    }

    // SCOPE: ALL

    // fetch data from the NFT contract (counter, supply, mintPrice, burnPrice, ratio, mintingFee, nftCreatedTimestamp, ownerAddress, ownerName)
    const [counter, createdAt] = await Promise.all([
      publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: nftAbi,
        functionName: 'counter'
      }),
      publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: nftAbi,
        functionName: 'createdAt'
      })
    ]);

    await sleep(pauseMs);

    const [burnPrice, mintPrice] = await Promise.all([
      publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: nftAbi,
        functionName: 'getBurnPrice'
      }),
      publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: nftAbi,
        functionName: 'getMintPrice'
      })
    ]);

    await sleep(pauseMs);

    const [ratio, mintingFee] = await Promise.all([
      publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: nftAbi,
        functionName: 'ratio'
      }),
      publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: nftAbi,
        functionName: 'mintingFeePercentage'
      })
    ]);

    await sleep(pauseMs);

    const [ownerAddress, totalSupply] = await Promise.all([
      publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: nftAbi,
        functionName: 'owner'
      }),
      publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: nftAbi,
        functionName: 'totalSupply'
      })
    ]);

    await sleep(pauseMs);

    // fetch data from the NFT metadata contract (description, title, previewImage)
    let description = await publicClient.readContract({
      address: metadataAddress as `0x${string}`,
      abi: metadataAbi,
      functionName: 'getCollectionDescription',
      args: [nftAddress as `0x${string}`]
    });

    // if description is longer than X characters, only use the first 500 characters
    if (description.length > descriptionMaxLength) {
      description = description.substring(0, descriptionMaxLength) + "...";
    }

    const [title, previewImage] = await Promise.all([
      publicClient.readContract({
        address: metadataAddress as `0x${string}`,
        abi: metadataAbi,
        functionName: 'getCollectionName',
        args: [nftAddress as `0x${string}`]
      }),
      publicClient.readContract({
        address: metadataAddress as `0x${string}`,
        abi: metadataAbi,
        functionName: 'getCollectionPreviewImage',
        args: [nftAddress as `0x${string}`]
      })
    ]);

    const activity = Number(counter) - Number(totalSupply);

    return {
      activity: activity,
      address: nftAddress,
      burnPrice: Number(burnPrice) / 1e18, 
      counter: Number(counter),
      description: description,
      lastUpdatedDate: lastUpdatedDate,
      lastUpdatedTimestamp: lastUpdatedTimestamp,
      mintingFee: Number(mintingFee) / 1e18, 
      mintPrice: Number(mintPrice) / 1e18, 
      nftCreatedTimestamp: Number(createdAt),
      ownerAddress: ownerAddress,
      previewImage: previewImage,
      ratio: Number(ratio) / 1e18, 
      supply: Number(totalSupply),
      title: title
    };
  } catch (error) {
    console.error(`Error fetching collection data for ${nftAddress}:`, error);
    return {
      address: nftAddress
    };
  }
}
