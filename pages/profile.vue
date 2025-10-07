<template>
  <Head>
    <Title>{{ metaTitle }} | {{ $config.public.projectMetadataTitle }}</Title>
    <Meta name="description" :content="metaDescription" />

    <Meta property="og:image" :content="metaImage" />
    <Meta property="og:description" :content="metaDescription" />

    <Meta name="twitter:image" :content="metaImage" />
    <Meta name="twitter:description" :content="metaDescription" />

    <Meta name="fc:miniapp" :content="JSON.stringify({
      version: '1',
      imageUrl: metaImage,
      button: {
        title: 'Profile: ' + metaTitle,
        action: {
          type: 'launch_miniapp',
          name: $config.public.projectName,
          url: $config.public.projectUrl + '/profile/?id=' + $route.query.id,
          splashImageUrl: $config.public.farcasterSplashImageUrl,
          splashBackgroundColor: $config.public.farcasterSplashBackgroundColor
        }
      }
    })" />
  </Head>

  <PunkProfile :key="$route.query.id" class="mt-1" />
</template>

<script>
import { isAddress } from 'viem'
import PunkProfile from '@/components/profile/PunkProfile.vue'
import { shortenAddress } from '@/utils/addressUtils'

export default {
  name: 'Profile',

  components: {
    PunkProfile,
  },

  computed: {
    metaDescription() {
      if (this.profileData?.domainName) {
        return "Profile page for " + this.profileData.domainName
      } else if (String(this.$route.query.id).includes('.')) {
        return "Profile page for " + this.$route.query.id
      } else {
        return 'Check out this profile on ' + this.$config.public.projectName + '!'
      }
    },
    
    metaImage() {
      if (this.profileData?.image) {
        return this.profileData.image
      } else {
        return this.$config.public.projectUrl + this.$config.public.previewImageProfile
      }
    },

    metaTitle() {
      if (this.profileData?.domainName) {
        return this.profileData.domainName
      } else if (String(this.$route.query.id).includes('.')) {
        return this.$route.query.id
      } else if (isAddress(this.$route.query.id)) {
        return shortenAddress(this.$route.query.id)
      }
      
      return null
    },
  },

  setup() {
    const route = useRoute()
    const profileId = route.query.id

    // fetch data for meta tags (link previews)
    const { data: profileData } = useAsyncData('profile', async () => {
      // important: use $fetch instead of axios otherwise it may not work properly
      const response = await $fetch(`/api/endpoint/read/profile-metadata?id=${profileId}`)
      return response.data
    })

    return { profileData }
  },
}
</script>
