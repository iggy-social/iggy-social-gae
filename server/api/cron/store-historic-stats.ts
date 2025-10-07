import axios from 'axios';
import datastore from '~/server/utils/datastore';
import { getPreviousWeek, getYesterdayDate } from '~/server/utils/datetime';
import { getKindTradingVolumeDaily, getKindTradingVolumeWeekly, getNativeTokenCoingeckoId } from '~/server/utils/project';
import { getStats, setStats } from '~/server/utils/stats';

const kindTradingVolumeDaily = getKindTradingVolumeDaily();
const kindTradingVolumeWeekly = getKindTradingVolumeWeekly();

const envVarTotalVolumeYesterday = "totalVolumeYesterday";
const envVarTotalVolumePrevWeek = "totalVolumePrevWeek";
const envVarTotalVolumeOverall = "totalVolumeOverall";

// CRON: STORE HISTORIC VOLUME DATA
export default defineEventHandler(async (event) => {
  // check if request is from Google Scheduler
  if (!process.env.MYLOCALHOST) {
    const isCronRequest = getHeader(event, 'x-appengine-cron'); 

    if (!isCronRequest) {
      console.log("This is NOT a request from Google Scheduler");
      throw createError({
        statusCode: 403,
        statusMessage: "Sorry, but you cannot call this URL directly!"
      });
    }
  }

  console.log("START CRON: store historic volume data");

  if (!process.env.MYLOCALHOST) {
    const yesterday = getYesterdayDate();
    const previousWeek = getPreviousWeek();
    const timestamp = Math.floor(new Date().getTime() / 1000);

    const totalVolumeYesterday = await getStats(envVarTotalVolumeYesterday);
    const totalVolumePrevWeek = await getStats(envVarTotalVolumePrevWeek);
    const totalVolumeOverall = await getStats(envVarTotalVolumeOverall);

    let tokenPrice = 0;
    let volumeUsdYesterday = 0;
    let volumeUsdPrevWeek = 0;

    // create keys
    const keyYesterday = datastore.key([kindTradingVolumeDaily, yesterday]);
    const keyPrevWeek = datastore.key([kindTradingVolumeWeekly, previousWeek]);

    // tokenPrice and volumeUsd (fetch from Coingecko API)
    try {
      const currencyCoingecko = getNativeTokenCoingeckoId();  
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${currencyCoingecko}&vs_currencies=usd`);
      //console.log("response:", response);

      tokenPrice = Number(response.data[currencyCoingecko]["usd"]);
      volumeUsdYesterday = Number(totalVolumeYesterday) * tokenPrice;
      volumeUsdPrevWeek = Number(totalVolumePrevWeek) * tokenPrice;
      console.log("tokenPrice", tokenPrice);
      console.log("volumeUsd", volumeUsdYesterday);
      console.log("volumeUsdPrevWeek", volumeUsdPrevWeek);
    } catch (error) {
      console.error("Error fetching token price and volume in USD", error);
    }

    // check if keyYesterday exists in TradingVolumeDaily (if it doesn't exist yet, add yesterday volume to totalVolumeOverall)
    const [entityYesterdayExists] = await datastore.get(keyYesterday);

    if (!entityYesterdayExists) {
      const totalVolumeOverallUpdated = Number(totalVolumeOverall) + Number(totalVolumeYesterday);
      await setStats(envVarTotalVolumeOverall, totalVolumeOverallUpdated.toString());
    }

    // store yesterday's volume in TradingVolumeDaily
    const entityYesterday = {
      key: keyYesterday,
      data: {
        date: yesterday,
        tokenPrice: Number(tokenPrice),
        timestamp: Number(timestamp),
        volumeToken: Number(totalVolumeYesterday),
        volumeUsd: Number(volumeUsdYesterday)
      }
    };

    await datastore.save(entityYesterday);
    
    // check if keyPrevWeek exists in TradingVolumeWeekly (if it doesn't, add it)
    const [entityPrevWeekExists] = await datastore.get(keyPrevWeek);

    if (!entityPrevWeekExists) {
      const entityPrevWeek = {
        key: keyPrevWeek,
        data: {
          date: previousWeek,
          tokenPrice: Number(tokenPrice),
          timestamp: Number(timestamp),
          volumeToken: Number(totalVolumePrevWeek),
          volumeUsd: Number(volumeUsdPrevWeek)
        }
      };

      await datastore.save(entityPrevWeek);
    }
  }

  return { success: true, code: 200 };
});

