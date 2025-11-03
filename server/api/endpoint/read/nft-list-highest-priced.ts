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
        // Fetch NFT collections ordered by mintPrice descending
        // Fetch limit*3 to account for filtering out collections with supply < 20
        const query = datastore
          .createQuery(kindNftCollection)
          .order('mintPrice', {
            descending: true
          })
          .limit(Number(limitNum) * 3)

        const results = await datastore.runQuery(query)

        //console.log("Highest priced NFTs API results:", results)

        let collections = results[0]

        //console.log("Highest priced NFTs API collections:", collections)

        // if collections length is greater than limitNum
        if (collections.length > limitNum) {

          // store the original collections array in a variable
          let originalCollections = collections

          // Remove entries with supply less than 20
          let i = 0
          while (i < collections.length) {
            if (collections[i].supply < 20) {
              collections.splice(i, 1)
            } else {
              i++
            }
          }

          if (collections.length == 0) {
            collections = originalCollections
          }
        }

        // Return only the top N entries (where N is the limit)
        if (collections.length > limitNum) {
          collections = collections.slice(0, limitNum)
        }

        return {
          success: true,
          code: 200,
          limit: limitNum,
          collections: collections
        }
      } catch (datastoreError) {
        console.error('Error fetching highest priced NFTs from datastore:', datastoreError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to fetch highest priced NFTs'
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
    console.error('Highest priced NFTs API error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

