<template>
  <Head>
    <Title>Memes & Images | {{ $config.public.projectMetadataTitle }}</Title>
    <Meta property="og:title" :content="'Memes & Images | ' + $config.public.projectMetadataTitle" />
    <Meta name="fc:miniapp" :content="JSON.stringify({
        version: '1',
        imageUrl: $config.public.previewImage,
        button: {
          title: 'Memes & Images',
          action: {
            type: 'launch_miniapp',
            name: $config.public.projectName,
            url: `${$config.public.projectUrl}/memes-images`,
            splashImageUrl: $config.public.farcasterSplashImageUrl,
            splashBackgroundColor: $config.public.farcasterSplashBackgroundColor
          }
        }
      })" />
  </Head>

  <ChatFeed
    class="mt-1"
    :chatContext="$config.public.chat.contexts.memesImages"
  />
</template>

<script>
import ChatFeed from '@/components/chat/ChatFeed.vue'

export default {
  name: 'MemesImages',

  components: {
    ChatFeed,
  },
}
</script>
