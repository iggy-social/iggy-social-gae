<template>
  <div class="d-flex justify-content-center mb-3" v-if="waitingData && !nftsList">
    <span class="spinner-border spinner-border-lg" role="status" aria-hidden="true"></span>
  </div>

  <NftCollectionsList v-if="nftsList" :nftsList="nftsList" />

  <div class="d-flex justify-content-center" v-if="moreResults">
    <button :disabled="waitingData" class="btn btn-primary" @click="fetchNfts">
      <span v-if="waitingData" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Load More
    </button>
  </div>
</template>

<script>
import axios from 'axios';
import NftCollectionsList from '@/components/nft/list/NftCollectionsList.vue';

export default {
  name: "FeaturedNftsApi",
  props: ["limit", "nftsData", "waiting"],

  components: {
    NftCollectionsList
  },

  data() {
    return {
      cursor: null,
      moreResults: false,
      nftsList: [],
      waitingData: false
    };
  },

  mounted() {
    this.waitingData = this.waiting;

    this.nftsList = this.nftsData?.collections;

    if (this.nftsData?.cursor) {
      this.cursor = this.nftsData?.cursor?.endCursor;

      if (this.nftsData?.cursor?.moreResults) {
        if (this.nftsData?.cursor?.moreResults === "MORE_RESULTS_AFTER_LIMIT") {
          this.moreResults = true;
        } else {
          this.moreResults = false;
        }
      }
    }

    this.fetchNfts();
  },

  methods: {
    async fetchNfts() {
      this.waitingData = true;

      if (!this.limit) {
        this.limit = 12;
      }

      // Fetch NFTs
      try {
        let url = `/api/endpoint/read/nft-list-featured?limit=${this.limit}`;

        if (this.cursor && this.moreResults) {
          url += `&cursor=${this.cursor}`;
        }

        const response = await axios.get(url);

        // append response.data.collections to nftsList
        this.nftsList = this.nftsList.concat(response.data.collections);

        if (response.data?.cursor) {
          this.cursor = response.data.cursor.endCursor;

          if (response.data.cursor?.moreResults) {
            if (response.data.cursor?.moreResults === "MORE_RESULTS_AFTER_LIMIT") {
              this.moreResults = true;
            } else {
              this.moreResults = false;
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.waitingData = false;
      }
    },
  }
}
</script>