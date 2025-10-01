import { defineEventHandler } from 'h3'
import { getEnvVar } from '~/server/utils/env-vars'

export default defineEventHandler(async (event) => {
  const envVars = {
    ARWEAVE_ADDRESS: await getEnvVar('ARWEAVE_ADDRESS'),
    TENOR_KEY: await getEnvVar('TENOR_KEY'),
    // add other env vars here (note, they will be publicly available, so don't add any sensitive ones)
  }

  // serve the env vars as JSON
  return {
    success: true,
    envVars,
  }
})