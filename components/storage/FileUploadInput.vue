<template>
  <input
    @change="handleFileInput"
    type="file"
    class="form-control form-control-lg mb-3"
    :id="'file-input-' + componentId"
    :disabled="waitingUpload || disable"
  />

  <button type="button" :class="btnCls" @click="uploadFile" :disabled="waitingUpload || !file || disable">
    <span v-if="waitingUpload" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    Upload
  </button>
</template>

<script>
import axios from 'axios'
import ImageKit from 'imagekit-javascript'
import { resizeImage } from '@/utils/imageUtils'

export default {
  name: 'FileUploadInput',
  props: ['btnCls', 'disable', 'maxFileSize', 'storageType'],
  emits: ['processUploadedFileUrl'],

  data() {
    return {
      componentId: null,
      file: null,
      uploadedFileSize: null,
      uploadToken: null,
      waitingUpload: false,
    }
  },

  mounted() {
    this.componentId = this.$.uid
  },

  computed: {
    fileTooBig() {
      if (this.uploadedFileSize) {
        return this.maxFileSize && this.uploadedFileSize > this.maxFileSize
      }
    },
  },

  methods: {
    async arweaveUpload() {
      const thisAppUrl = window.location.origin

      let fetcherService
      if (this.$config.public.fileUploadTokenService === 'netlify') {
        fetcherService = thisAppUrl + '/.netlify/functions/arweaveUploader'
      } else if (this.$config.public.fileUploadTokenService === 'vercel') {
        fetcherService = thisAppUrl + '/api/arweaveUploader'
      } else if (this.$config.public.fileUploadTokenService === 'server') {
        fetcherService = thisAppUrl + '/api/endpoint/arweave-uploader'
      }

      // Convert file to base64
      const fileData = await this.fileToBase64(this.file)

      const fileType = this.file.type

      const resp = await axios.post(fetcherService, {
        fileData,
        fileName: this.file.name,
        fileType: this.file.type
      })

      const transactionId = resp.data.transactionId
      let fileUri = `ar://${transactionId}`

      // add file type to file uri so we can use it in the frontend
      if (fileType.startsWith('image/')) {
        fileUri += `?img`
      } else if (fileType.startsWith('video/') || fileType.startsWith('audio/')) {
        fileUri += `?${fileType}`
      } else if (fileType.startsWith('text/plain')) {
        fileUri += `?txt`
      }

      // emit file url
      this.$emit('processUploadedFileUrl', fileUri)
    },

    handleFileInput(event) {
      const uploadedFile = event.target.files[0]
      this.uploadedFileSize = uploadedFile.size

      // check file size
      if (this.fileTooBig && !this.isSupportedImage(uploadedFile)) {
        // if file is not an image, show error message if it's too large (images will get resized before upload)
        const maxSizeMb = this.maxFileSize / 1024 / 1024
        console.error('File is too large (max size is ' + maxSizeMb + ' MB)')
        return
      }

      // get file name
      const fileName = uploadedFile.name

      // change file name
      const fileExtension = fileName.split('.').pop()

      // select random alphanumeric string for name
      const newFileName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '.' + fileExtension

      // create new file with new name
      const newFile = new File([uploadedFile], newFileName, { type: uploadedFile.type })
      this.file = newFile
    },

    isSupportedImage(file) {
      // check if file is an image (of a supported format)
      const supported = ['image/jpeg', 'image/png', 'image/webp']
      return supported.includes(file.type)
    },

    async uploadFile() {
      this.waitingUpload = true

      if (this.isSupportedImage(this.file) && this.fileTooBig) {
        // if file is an image and too big, resize it before upload
        this.file = await resizeImage(this.file)
      }

      if (this.storageType === 'arweave') {
        try {
          await this.arweaveUpload()
        } catch (error) {
          console.error('Error uploading file to decentralized storage service', error)
        }
      } else {
        // No upload (or implement other storage types here)
      }

      this.waitingUpload = false
    },

    // Add this new method to convert file to base64
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = error => reject(error)
      })
    },
  },
}
</script>
