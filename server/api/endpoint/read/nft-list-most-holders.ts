import { defineEventHandler, getQuery, createError } from 'h3'
import { getKindNftCollection, getMaxLimit } from '~/server/utils/project'
import datastore from '~/server/utils/datastore'

const kindNftCollection = getKindNftCollection()
const maxLimit = getMaxLimit()

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    let limit = query.limit as string

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

    // Only run datastore queries in production
    if (!process.env.MYLOCALHOST) {
      try {
        // Fetch NFT collections ordered by supply descending (most holders)
        const query = datastore
          .createQuery(kindNftCollection)
          .order('supply', {
            descending: true
          })
          .limit(Number(limitNum))

        const results = await datastore.runQuery(query)
        const collections = results[0]

        return {
          success: true,
          code: 200,
          limit: limitNum,
          collections: collections
        }
      } catch (datastoreError) {
        console.error('Error fetching most holders NFTs from datastore:', datastoreError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to fetch most holders NFTs'
        })
      }
    }

    // Return empty result for localhost
    return {
      success: true,
      code: 200,
      limit: limitNum,
      collections: []
    }

  } catch (error: any) {
    console.error('Most holders NFTs API error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

