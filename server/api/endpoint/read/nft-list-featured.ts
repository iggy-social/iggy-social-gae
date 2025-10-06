import { defineEventHandler, getQuery, createError } from 'h3'
import { getKindFeatured, getKindNftCollection, getMaxLimit } from '~/server/utils/project'
import datastore from '~/server/utils/datastore'

const kindNftCollection = getKindNftCollection()
const kindFeatured = getKindFeatured()
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
        // Fetch featured NFTs
        const featuredQuery = datastore
          .createQuery(kindFeatured)
          .limit(limitNum)
        
        const [featuredResults] = await datastore.runQuery(featuredQuery)
        let featuredList = featuredResults
        
        // Fetch collections data from NFT Collections
        let topCollections: any[] = []
        const collectionPromises: Promise<void>[] = [] // Array to store promises

        for (const featured of featuredList) {
          try {
            const collKey = datastore.key([kindNftCollection, featured['address']])

            collectionPromises.push(datastore.get(collKey)
              .then(entity => {
                if (entity.length > 0) {
                  if (entity[0]["address"]) {
                    topCollections.push(entity[0])
                  }
                }
              })
              .catch(err => {
                console.error(`Error fetching collection data for ${featured['address']}:`, err)
              })
            )
          } catch (err) {
            console.error('Error fetching data:', err)
          }
        }

        // Wait for all promises to resolve before sending the reply
        await Promise.all(collectionPromises)

        return {
          success: true,
          code: 200,
          limit: limitNum,
          topCollections: topCollections
        }
      } catch (datastoreError) {
        console.error('Error fetching featured NFTs from datastore:', datastoreError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to fetch featured NFTs'
        })
      }
    }

    // Return empty result for localhost
    return {
      success: true,
      code: 200,
      limit: limitNum,
      topCollections: []
    }

  } catch (error: any) {
    console.error('Featured NFTs API error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})