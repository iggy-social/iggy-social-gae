<template>
  <Head>
    <Title>NFT Launchpad | {{ $config.public.projectMetadataTitle }}</Title>
    <Meta property="og:title" :content="'NFT Launchpad | ' + $config.public.projectMetadataTitle" />

    <Meta name="description" :content="'Check out these awesome NFT collections on ' + $config.public.projectName + '!'" />

    <Meta property="og:image" :content="$config.public.projectUrl + $config.public.previewImageNftLaunchpad" />
    <Meta
      property="og:description"
      :content="'Check out these awesome NFT collections on ' + $config.public.projectName + '!'"
    />

    <Meta name="twitter:image" :content="$config.public.projectUrl + $config.public.previewImageNftLaunchpad" />
    <Meta
      name="twitter:description"
      :content="'Check out these awesome NFT collections on ' + $config.public.projectName + '!'"
    />
  </Head>

  <div class="card border scroll-500">
    <div class="card-body">
      <p v-if="!hideBackButton" class="fs-3">
        <i class="bi bi-arrow-left-circle cursor-pointer" @click="$router.back()"></i>
      </p>

      <h3 class="d-flex flex-row flex-wrap mt-3">
        <div class="mb-3 me-auto">NFT Launchpad</div>

        <div class="mb-3">
          <NuxtLink class="btn btn-outline-primary btn-sm" to="/nft/create">
            <i class="bi bi-plus-circle"></i> Create
          </NuxtLink>
          <button class="btn btn-outline-primary btn-sm ms-2" data-bs-toggle="modal" data-bs-target="#searchNftModal">
            <i class="bi bi-search"></i> Find
          </button>
        </div>
      </h3>

      <NftListDropdown buttonText="New NFTs" />

      <LatestNftsApi v-if="currentComponent === 'LatestNftsApi'" :limit="limit" :nftsData="nftsData" :waiting="waitingData" />
      <LatestNftsBlockchain v-else-if="currentComponent === 'LatestNftsBlockchain'" />
    </div>
  </div>

  <!-- Search Modal -->
  <SearchNftModal />
</template>

<script>
import axios from 'axios';
import SearchNftModal from '@/components/nft/SearchNftModal.vue'
import LatestNftsApi from '@/components/nft/list/LatestNftsApi.vue'
import LatestNftsBlockchain from '@/components/nft/list/LatestNftsBlockchain.vue'
import NftListDropdown from '@/components/nft/list/NftListDropdown.vue';

export default {
  name: 'Nft',
  props: ['hideBackButton'],

  components: {
    LatestNftsApi,
    LatestNftsBlockchain,
    NftListDropdown,
    SearchNftModal
  },

  data() {
    return {
      currentComponent: null,
      limit: 8,
      nftsData: null,
      waitingData: false
    }
  },

  mounted() {
    if (this.$config.public.nftLaunchpadBondingAddress) {
      this.fetchNfts()
    }

    // set this component name as the current component in localStorage
    window.localStorage.setItem("currentNftPage", "/nft");
  },

  methods: {
    async fetchNfts() {
      this.waitingData = true;

      try {
        // Fetch NFTs from API
        const response = await axios.get(`/api/endpoint/read/nft-list-latest?limit=${this.limit}`);

        if (response.data.collections.length > 0) {
          this.nftsData = response.data;
          this.currentComponent = "LatestNftsApi";
          return this.waitingData = false;
        }
        
      } catch (error) {
        console.error("Cannot fetch latest NFTs from API. Trying blockchain...");
      }

      // FALLBACK TO BLOCKCHAIN (if no NFTs found in API or API is not working)

      console.log("Fetching latest NFTs from blockchain...");

      this.currentComponent = "LatestNftsBlockchain";
      this.waitingData = false;
    },
  }
}
</script>
