<template>
  <Head>
    <Title>Shill and discuss projects | {{ $config.public.projectMetadataTitle }}</Title>
    <Meta property="og:title" :content="'Shill and discuss projects | ' + $config.public.projectMetadataTitle" />

    <Meta name="fc:miniapp" :content="JSON.stringify({
        version: '1',
        imageUrl: $config.public.previewImage,
        button: {
          title: 'Shill and discuss projects',
          action: {
            type: 'launch_miniapp',
            name: $config.public.projectName,
            url: `${$config.public.projectUrl}/shill`,
            splashImageUrl: $config.public.farcasterSplashImageUrl,
            splashBackgroundColor: $config.public.farcasterSplashBackgroundColor
          }
        }
      })" />
  </Head>

  <ChatFeed class="mt-1" :chatContext="$config.public.chat.contexts.shill" />
</template>

<script>
import ChatFeed from '@/components/chat/ChatFeed.vue'

export default {
  name: 'shill',

  components: {
    ChatFeed,
  },
}
</script>
