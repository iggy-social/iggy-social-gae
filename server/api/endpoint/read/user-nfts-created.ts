import { defineEventHandler, getQuery, createError } from 'h3'
import { getAddress } from 'viem'
import { PropertyFilter } from '@google-cloud/datastore'
import { getKindNftCollection, getMaxLimit } from '~/server/utils/project'
import datastore from '~/server/utils/datastore'

const kindNftCollection = getKindNftCollection()
const maxLimit = getMaxLimit()

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const ownerAddressRaw = query['user_address'] as string
    let limit = query.limit as string
    let nextPageCursor = query.cursor as string

    // Validate required parameters
    if (!ownerAddressRaw) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameter: user_address'
      })
    }

    // Get checksummed address
    let ownerAddress: string
    try {
      ownerAddress = getAddress(ownerAddressRaw)
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
        // Fetch NFT collections created by the owner
        const query = datastore
          .createQuery(kindNftCollection)
          .filter(new PropertyFilter('ownerAddress', '=', ownerAddress))
          .limit(limitNum)
        
        if (nextPageCursor) {
          query.start(nextPageCursor)
        }
        
        const results = await datastore.runQuery(query)
        const collections = results[0]
        const nextCursor = results[1]

        return {
          success: true,
          code: 200,
          limit: limitNum,
          collections: collections,
          cursor: nextCursor
        }
      } catch (datastoreError) {
        console.error('Error fetching user created NFTs from datastore:', datastoreError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to fetch user created NFTs'
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
    console.error('User NFTs created API error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
