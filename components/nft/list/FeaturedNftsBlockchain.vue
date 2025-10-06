<template>
  <div class="row" v-if="featuredNfts.length > 0">
    <NuxtLink v-for="nft in featuredNfts" :key="nft.address" class="col-md-3 text-decoration-none" :to="'/nft/collection?id=' + nft.address">
      <div class="card border mb-3">
        <Image :url="nft.image" :cls="'card-img-top'" :alt="nft.name" />
        <div class="card-body rounded-bottom-3">
          <p class="card-text mb-1"><strong>{{ nft.name }}</strong></p>
          <small class="card-text">{{ formatPrice(nft.price) }} {{ $config.public.tokenSymbol }}</small>
        </div>
      </div>
    </NuxtLink>
  </div>

  <div class="d-flex justify-content-center mb-3" v-if="waitingData">
    <span class="spinner-border spinner-border-lg" role="status" aria-hidden="true"></span>
  </div>
</template>

<script>
import { formatEther } from 'viem'
import { useAccount, useConfig } from '@wagmi/vue'
import { readContract } from '@wagmi/core'

import Image from '@/components/Image.vue'
import { fetchCollection, storeCollection } from '@/utils/browserStorageUtils'
import { getLessDecimals } from '@/utils/numberUtils'

export default {
  name: "FeaturedNftsBlockchain",

  data() {
    return {
      featuredNfts: [],
      waitingData: false
    }
  },

  components: {
    Image
  },

  mounted() {
    if (this.$config.public.nftLaunchpadBondingAddress) {
      this.fetchFeaturedNfts()
    }
  },

  methods: {
    async fetchFeaturedNfts() {
      this.waitingData = true

      try {
        // Get featured NFT contracts from launchpad
        const launchpadContractConfig = {
          address: this.$config.public.nftLaunchpadBondingAddress,
          abi: [
            {
              "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
              "name": "getFeaturedNftContracts",
              "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
              "stateMutability": "view",
              "type": "function"
            }
          ],
          functionName: 'getFeaturedNftContracts',
          args: [8]
        }

        const featuredContracts = await readContract(this.config, launchpadContractConfig)
        await this.parseNftsArray(featuredContracts, this.featuredNfts)
      } catch (error) {
        console.error('Error fetching featured NFTs:', error)
      } finally {
        this.waitingData = false
      }
    },

    formatPrice(priceWei) {
      if (priceWei === null || priceWei === undefined) {
        return null
      }

      const price = Number(formatEther(priceWei))
      return getLessDecimals(price)
    },

    async parseNftsArray(inputArray, outputArray) {
      const nftAbi = [
        {
          "inputs": [],
          "name": "collectionPreview",
          "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "getMintPrice",
          "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "name",
          "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
          "stateMutability": "view",
          "type": "function"
        }
      ]

      // Process each NFT contract
      for (let i = 0; i < inputArray.length; i++) {
        try {
          const nftAddress = inputArray[i]

          // Fetch collection object from storage
          let collection = fetchCollection(window, nftAddress)
          
          if (!collection) {
            collection = {
              address: nftAddress
            }
          }

          // Get collection name
          let cName
          if (collection?.name) {
            cName = collection.name
          } else {
            const nameContractConfig = {
              address: nftAddress,
              abi: nftAbi,
              functionName: 'name'
            }
            cName = await readContract(this.config, nameContractConfig)
            collection["name"] = cName
          }

          // Get price
          const mintPriceContractConfig = {
            address: nftAddress,
            abi: nftAbi,
            functionName: 'getMintPrice'
          }
          const mintPriceWei = await readContract(this.config, mintPriceContractConfig)

          // Get image
          let cImage
          if (collection?.image) {
            cImage = collection.image
          } else {
            const imageContractConfig = {
              address: nftAddress,
              abi: nftAbi,
              functionName: 'collectionPreview'
            }
            cImage = await readContract(this.config, imageContractConfig)
            collection["image"] = cImage
          }

          // Check if collection image uses Spheron IPFS gateway and replace it
          if (collection.image && collection.image.includes(".ipfs.sphn.link/")) {
            const linkParts = collection.image.split(".ipfs.sphn.link/")
            const cid = linkParts[0].replace("https://", "")
            const newImageLink = this.$config.public.ipfsGateway + cid + "/" + linkParts[1]
            collection["image"] = newImageLink
            cImage = newImageLink
          }

          // Store collection object in storage
          storeCollection(window, nftAddress, collection)

          outputArray.push({
            address: nftAddress,
            image: cImage,
            name: cName,
            price: mintPriceWei
          })
        } catch (error) {
          console.error(`Error processing NFT at index ${i}:`, error)
        }
      }
    }
  },

  setup() {
    const config = useConfig()
    const { address, chainId, isConnected } = useAccount({ config })

    return { 
      config,
      address, 
      chainId, 
      isConnected
    }
  }
}
</script>
