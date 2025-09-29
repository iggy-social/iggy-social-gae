import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { isAddress } from 'viem'
import { getWorkingUrl } from '~/utils/fileUtils'
import { publicClient } from '~/server/utils/wagmi'

// NFT Contract ABI
const nftAbi = [
  {
    name: 'getBurnPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'getMintPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  }, 
  {
    name: 'metadataAddress',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }]
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  }
]

// Metadata Contract ABI
const metadataAbi = [
  {
    name: 'getCollectionDescription',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'nftAddress', type: 'address' }],
    outputs: [{ type: 'string' }]
  },
  {
    name: 'getCollectionMetadataType',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'nftAddress_', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'getCollectionName',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'nftAddress_', type: 'address' }],
    outputs: [{ type: 'string' }]
  },
  {
    name: 'getCollectionPreviewImage',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'nftAddress', type: 'address' }],
    outputs: [{ type: 'string' }]
  }
]

// Fallback NFT ABI for non-native NFTs
const fallbackNftAbi = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }]
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }]
  },
  {
    name: 'uri',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }]
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  }
]

async function fetchCollectionFromBlockchain(address: string) {
  try {
    // Validate address
    if (!isAddress(address)) {
      throw new Error('Invalid NFT address')
    }

    // Try to fetch as native NFT first
    try {
      const mdAddress = await publicClient.readContract({
        address: address as `0x${string}`,
        abi: nftAbi,
        functionName: 'metadataAddress',
      })

      // Fetch collection data from metadata contract
      const [name, description, image, type] = await Promise.all([
        publicClient.readContract({
          address: address as `0x${string}`,
          abi: nftAbi,
          functionName: 'name',
        }),
        publicClient.readContract({
          address: mdAddress as `0x${string}`,
          abi: metadataAbi,
          functionName: 'getCollectionDescription',
          args: [address as `0x${string}`],
        }),
        publicClient.readContract({
          address: mdAddress as `0x${string}`,
          abi: metadataAbi,
          functionName: 'getCollectionPreviewImage',
          args: [address as `0x${string}`],
        }),
        publicClient.readContract({
          address: mdAddress as `0x${string}`,
          abi: metadataAbi,
          functionName: 'getCollectionMetadataType',
          args: [address as `0x${string}`],
        })
      ])

      // Process IPFS URLs and get working URL
      let processedImage = String(image)
      
      // Get working URL to ensure it's accessible
      try {
        const workingUrlResult = await getWorkingUrl(processedImage)
        if (workingUrlResult.success) {
          processedImage = workingUrlResult.url
        }
      } catch (error) {
        console.log('Could not verify image URL:', error)
      }

      return {
        name: name as string,
        description: description as string,
        image: processedImage,
        type: Number(type),
        authorAddress: null, // Will be fetched separately if needed
        supply: null, // Will be fetched separately if needed
        nativeNft: true
      }
    } catch (error) {
      // If native NFT fails, try fallback method
      console.log('Native NFT method failed, trying fallback:', error)
      return await fetchFallbackCollection(address)
    }
  } catch (error) {
    console.error('Error fetching collection data:', error)
    throw error
  }
}

async function fetchFallbackCollection(address: string) {
  try {
    // Fetch basic NFT data
    const [name, owner, totalSupply] = await Promise.all([
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: fallbackNftAbi,
        functionName: 'name',
      }),
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: fallbackNftAbi,
        functionName: 'owner',
      }).catch(() => null),
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: fallbackNftAbi,
        functionName: 'totalSupply',
      }).catch(() => null)
    ])

    // Try to get tokenURI for metadata
    let tokenURI: string | null = null
    try {
      const tokenURIResult = await publicClient.readContract({
        address: address as `0x${string}`,
        abi: fallbackNftAbi,
        functionName: 'tokenURI',
        args: [BigInt(1)],
      })
      tokenURI = String(tokenURIResult)
    } catch (error) {
      // Try ERC-1155 uri function
      try {
        const uriResult = await publicClient.readContract({
          address: address as `0x${string}`,
          abi: fallbackNftAbi,
          functionName: 'uri',
          args: [BigInt(1)],
        })
        tokenURI = String(uriResult)
      } catch (uriError) {
        console.log('Could not fetch tokenURI:', uriError)
      }
    }

    let description = ''
    let image = ''
    let type = 0

    // Process tokenURI if available
    if (tokenURI) {
      if (tokenURI.startsWith("data:application/json;")) {
        const metadata = JSON.parse(atob(String(tokenURI).replace("data:application/json;base64,", "")))
        description = metadata?.description || ''
        image = metadata?.image || ''
      } else if (tokenURI.startsWith("http")) {
        try {
          const response = await fetch(tokenURI)
          const metadata = await response.json()
          description = metadata?.description || ''
          image = metadata?.image || ''
        } catch (fetchError) {
          console.log('Could not fetch metadata from URL:', fetchError)
        }
      }
    }

    // Process IPFS URLs and get working URL
    if (image) {
      // Get working URL to ensure it's accessible
      try {
        const workingUrlResult = await getWorkingUrl(image)
        if (workingUrlResult.success) {
          image = workingUrlResult.url
        }
      } catch (error) {
        console.log('Could not verify image URL:', error)
      }
    }

    return {
      name: name as string,
      description,
      image,
      type,
      authorAddress: owner as string,
      supply: totalSupply ? Number(totalSupply) : null,
      nativeNft: false
    }
  } catch (error) {
    console.error('Error in fallback collection fetch:', error)
    throw error
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Try to get address from path parameter first, then fallback to query parameter
    const address = getRouterParam(event, 'address') || getQuery(event).address as string

    if (!address) {
      return {
        error: 'NFT address is required',
        data: null
      }
    }

    if (!isAddress(address)) {
      return {
        error: 'Invalid NFT address format',
        data: null
      }
    }

    const collectionData = await fetchCollectionFromBlockchain(address)

    return {
      data: collectionData,
      error: null
    }
  } catch (error: any) {
    console.error('NFT collection API error:', error)
    return {
      error: error.message || 'Failed to fetch collection data',
      data: null
    }
  }
})
