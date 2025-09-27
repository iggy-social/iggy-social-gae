import ImageKit from 'imagekit'
import { defineEventHandler } from 'h3'
import { getEnvVar } from '../utils/env-vars'

interface ImageKitAuthParams {
  token: string
  signature: string
  expire: number
}

interface ImageKitResponse {
  data: ImageKitAuthParams
}

interface ErrorResponse {
  error: string
  data: null
}

export default defineEventHandler(async (event): Promise<ImageKitResponse | ErrorResponse> => {
  try {
    // Get environment variables using getEnvVar function
    const imagekitEndpoint = await getEnvVar('IMAGEKIT_ENDPOINT')
    const imagekitPublicKey = await getEnvVar('IMAGEKIT_PUBLIC_KEY')
    const imagekitPrivateKey = await getEnvVar('IMAGEKIT_PRIVATE_KEY')

    // Validate that all required environment variables are present
    const envVars = {
      IMAGEKIT_ENDPOINT: imagekitEndpoint,
      IMAGEKIT_PUBLIC_KEY: imagekitPublicKey,
      IMAGEKIT_PRIVATE_KEY: imagekitPrivateKey,
    }
    
    const missingEnvVars = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)
    
    if (missingEnvVars.length > 0) {
      console.error('Missing required environment variables:', missingEnvVars)
      return {
        error: 'Server configuration error: Missing ImageKit credentials',
        data: null,
      }
    }

    // Initialize ImageKit with environment variables
    const imagekit = new ImageKit({
      urlEndpoint: imagekitEndpoint!,
      publicKey: imagekitPublicKey!,
      privateKey: imagekitPrivateKey!,
    })

    // Get authentication parameters
    const authParams = imagekit.getAuthenticationParameters()

    return {
      data: authParams,
    }
  } catch (error: any) {
    console.error('ImageKit authentication error:', error)
    return {
      error: error.message || 'Internal server error',
      data: null,
    }
  }
})
