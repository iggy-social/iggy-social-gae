import { isAddress } from 'viem'
import { publicClient } from '@/server/utils/project'
import { getWorkingUrl } from '@/utils/fileUtils'
import { getEnvVar } from '@/server/utils/env-vars'
import { punkTldAbi } from '~/server/utils/abi'

interface ProfileMetadata {
  image?: string
  domainName?: string
  walletAddress?: string
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const id = query.id as string

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameter: id'
      })
    }

    // Get environment variables
    const punkTldAddress = await getEnvVar('PUNK_TLD_ADDRESS')
    let tldName = await getEnvVar('TLD_NAME')

    // if tldName does not start with a dot, add it
    if (!String(tldName).startsWith('.')) {
      tldName = "." + tldName
    }
    
    if (!punkTldAddress || !tldName) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Missing required environment variables'
      })
    }

    const result: ProfileMetadata = {}

    // Check if input is a domain name (contains a dot)
    if (id.includes('.')) {
      // It's a domain name
      result.domainName = id
      
      // Extract domain name without TLD
      const domainName = id.replace(tldName, '').toLowerCase()
      
      try {
        // Read domain data from contract
        const domainData = await publicClient.readContract({
          address: punkTldAddress as `0x${string}`,
          abi: punkTldAbi,
          functionName: 'getDomainData',
          args: [domainName]
        })

        if (domainData) {
          const domainDataJson = JSON.parse(domainData as string)
          
          if (domainDataJson?.image) {
            // Validate the image URL
            const imageResult = await getWorkingUrl(domainDataJson.image)
            if (imageResult.success) {
              result.image = imageResult.url
            }
          }
        }

        // Get wallet address for the domain
        try {
          const walletAddress = await publicClient.readContract({
            address: punkTldAddress as `0x${string}`,
            abi: punkTldAbi,
            functionName: 'getDomainHolder',
            args: [domainName]
          })
          
          if (walletAddress) {
            result.walletAddress = walletAddress as string
          }
        } catch (error) {
          console.error('Error fetching domain holder:', error)
        }

      } catch (error) {
        console.error('Error fetching domain data:', error)
      }
    } else if (isAddress(id)) {
      // It's a wallet address
      result.walletAddress = id
      
      // Try to get the default domain name for this address
      try {
        const defaultDomain = await publicClient.readContract({
          address: punkTldAddress as `0x${string}`,
          abi: punkTldAbi,
          functionName: 'defaultNames',
          args: [id as `0x${string}`]
        })
        
        if (defaultDomain && defaultDomain !== '') {
          result.domainName = defaultDomain + tldName
          
          // Now fetch the profile data for this domain
          try {
            const domainData = await publicClient.readContract({
              address: punkTldAddress as `0x${string}`,
              abi: punkTldAbi,
              functionName: 'getDomainData',
              args: [defaultDomain as string]
            })

            if (domainData) {
              const domainDataJson = JSON.parse(domainData as string)
              
              if (domainDataJson?.image) {
                // Validate the image URL
                const imageResult = await getWorkingUrl(domainDataJson.image)
                if (imageResult.success) {
                  result.image = imageResult.url
                }
              }
            }
          } catch (error) {
            console.error('Error fetching domain data for default domain:', error)
          }
        }
      } catch (error) {
        console.error('Error fetching default domain for address:', error)
      }
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input: must be a domain name or wallet address'
      })
    }

    return {
      success: true,
      data: result
    }

  } catch (error: any) {
    console.error('Profile metadata error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
