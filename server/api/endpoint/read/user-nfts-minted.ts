import { defineEventHandler, getQuery, createError } from 'h3'
import { getAddress, isAddress } from 'viem'
import { PropertyFilter } from '@google-cloud/datastore'
import { getKindNftCollection, getKindUserNfts, getMaxLimit } from '~/server/utils/project'
import datastore from '~/server/utils/datastore'

const kindNftCollection = getKindNftCollection()
const kindUserNfts = getKindUserNfts()
const maxLimit = getMaxLimit()

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const userAddressRaw = query['user_address'] as string
    let limit = query.limit as string
    let nextPageCursor = query.cursor as string

    // Validate required parameters
    if (!userAddressRaw) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameter: user_address'
      })
    }

    // Get checksummed address
    let userAddress: string
    try {
      userAddress = getAddress(userAddressRaw)
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid address format'
      })
    }

    // Validate and set limit
    let limitNum = 4 // default limit
    if (limit) {
      limitNum = parseInt(limit, 10)
      if (isNaN(limitNum) || limitNum < 1) {
        limitNum = 4
      }
      if (limitNum > maxLimit) {
        limitNum = maxLimit
      }
    }

    // Handle pagination cursor
    if (nextPageCursor) {
      nextPageCursor = String(nextPageCursor).trim().replace(/\s/g, '+')
    }

    // Only run datastore queries in production
    if (!process.env.MYLOCALHOST) {
      try {
        // Fetch objects from UserNfts datastore collection
        const query = datastore
          .createQuery(kindUserNfts)
          .filter(new PropertyFilter('userAddress', '=', userAddress))
          .limit(limitNum)
        
        if (nextPageCursor) {
          query.start(nextPageCursor)
        }
        
        const results = await datastore.runQuery(query)
        const userNftsObjects = results[0]
        const nextCursor = results[1]

        // Loop through userNftsObjects and fetch the corresponding NFT collection objects
        const collections = []
        for (let i = 0; i < userNftsObjects.length; i++) {
          const userNft = userNftsObjects[i]
          const collectionAddress = userNft.nftAddress

          const collectionKey = datastore.key([kindNftCollection, collectionAddress])
          const [collection] = await datastore.get(collectionKey)
          
          if (collection) {
            collection.balance = userNft.balanceOf
            collections.push(collection)
          }
        }

        return {
          success: true,
          code: 200,
          limit: limitNum,
          collections: collections,
          cursor: nextCursor
        }
      } catch (datastoreError) {
        console.error('Error fetching user NFTs from datastore:', datastoreError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to fetch user NFTs'
        })
      }
    }

    // Return empty result for localhost
    return {
      success: true,
      code: 200,
      limit: limitNum,
      collections: [],
      cursor: null
    }

  } catch (error: any) {
    console.error('User NFTs minted API error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
