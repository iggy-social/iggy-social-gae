export default defineNuxtPlugin(async () => {
  try {
    const { envVars } = await $fetch('/api/endpoint/read/public-env-vars')
    
    return {
      provide: {
        envVars
      }
    }
  } catch (error) {
    console.error('Failed to fetch environment variables:', error)
    return {
      provide: {
        envVars: {}
      }
    }
  }
})
