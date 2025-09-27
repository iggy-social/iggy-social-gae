import Arweave from 'arweave'
import { defineEventHandler, readBody } from 'h3'
import { getEnvVar } from '../utils/env-vars'

interface ArweaveKeyFile {
  kty: string
  n: string
  e: string
  d: string
  p: string
  q: string
  dp: string
  dq: string
  qi: string
}

interface UploadRequest {
  fileData: string
  fileName: string
  fileType: string
}

interface UploadResponse {
  message: string
  transactionId: string
}

interface ErrorResponse {
  error: string
  data: null
}

export default defineEventHandler(async (event): Promise<UploadResponse | ErrorResponse> => {
  try {
    // Parse the incoming request body
    const { fileData, fileName, fileType }: UploadRequest = await readBody(event)

    // Validate required fields
    if (!fileData || !fileName || !fileType) {
      return {
        error: 'Missing required fields: fileData, fileName, fileType',
        data: null,
      }
    }

    // Initialize Arweave
    const arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    })

    // Get environment variables using getEnvVar function
    const arweaveKty = await getEnvVar('ARWEAVE_KTY')
    const arweaveN = await getEnvVar('ARWEAVE_N')
    const arweaveE = await getEnvVar('ARWEAVE_E')
    const arweaveD = await getEnvVar('ARWEAVE_D')
    const arweaveP = await getEnvVar('ARWEAVE_P')
    const arweaveQ = await getEnvVar('ARWEAVE_Q')
    const arweaveDp = await getEnvVar('ARWEAVE_DP')
    const arweaveDq = await getEnvVar('ARWEAVE_DQ')
    const arweaveQi = await getEnvVar('ARWEAVE_QI')

    // Validate that all required environment variables are present
    const envVars = {
      ARWEAVE_KTY: arweaveKty,
      ARWEAVE_N: arweaveN,
      ARWEAVE_E: arweaveE,
      ARWEAVE_D: arweaveD,
      ARWEAVE_P: arweaveP,
      ARWEAVE_Q: arweaveQ,
      ARWEAVE_DP: arweaveDp,
      ARWEAVE_DQ: arweaveDq,
      ARWEAVE_QI: arweaveQi,
    }
    
    const missingEnvVars = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)
    
    if (missingEnvVars.length > 0) {
      console.error('Missing required environment variables:', missingEnvVars)
      return {
        error: 'Server configuration error: Missing Arweave credentials',
        data: null,
      }
    }

    // Construct the key file object from environment variables
    const keyFile: ArweaveKeyFile = {
      kty: arweaveKty || '',
      n: arweaveN || '',
      e: arweaveE || '',
      d: arweaveD || '',
      p: arweaveP || '',
      q: arweaveQ || '',
      dp: arweaveDp || '',
      dq: arweaveDq || '',
      qi: arweaveQi || '',
    }

    // Convert base64 file data to buffer
    const fileBuffer = Buffer.from(fileData, 'base64')

    // Create a transaction
    const transaction = await arweave.createTransaction({ data: new Uint8Array(fileBuffer) }, keyFile)

    // Add tags to the transaction
    transaction.addTag('Content-Type', fileType)
    transaction.addTag('File-Name', fileName)

    // Sign the transaction
    await arweave.transactions.sign(transaction, keyFile)

    // Submit the transaction
    const response = await arweave.transactions.post(transaction)

    if (response.status === 200) {
      return {
        message: 'File uploaded successfully',
        transactionId: transaction.id,
      }
    } else {
      throw new Error(`Failed to upload file to Arweave. Status: ${response.status}`)
    }
  } catch (error: any) {
    console.error('Arweave upload error:', error)
    return {
      error: error.message || 'Internal server error',
      data: null,
    }
  }
})
