import datastore from '~/server/utils/datastore';
import { getCollectionDataFromBlockchain } from '~/server/utils/collection';
import { getTodayDate, getCurrentWeek } from '~/server/utils/datetime';
import { getKindNftCollection } from '~/server/utils/project';
import { getStats, setStats } from '~/server/utils/stats';

export default defineEventHandler(async (event) => {
  const nftAddress = getQuery(event)['nft_address'] as string;
  let scope = getQuery(event).scope as string;
  
  if (!scope) {
    scope = "all"; // fetch all collection data from blockchain
  }

  // CHECK IF NFT ADDRESS IS PROVIDED
  if (!nftAddress) {
    console.log("nft_address is required");
    return "nft_address is required";
  }

  // PRODUCTION: CHECK IF REQUEST COMES FROM GOOGLE CLOUD
  if (!process.env.MYLOCALHOST) {
    const isFromGoogleCloud = getHeader(event, 'x-cloudtasks-queuename');

    if (!isFromGoogleCloud) {
      console.log("This is NOT a request from Google Cloud!");
      throw createError({
        statusCode: 403,
        statusMessage: "Sorry, but you cannot call this task directly!"
      });
    }
  }

  const kindNftCollection = getKindNftCollection();

  // SAVE TO DATASTORE
  if (!process.env.MYLOCALHOST) {
    const key = datastore.key([kindNftCollection, nftAddress]);

    // check if NFT collection is already stored
    const [entity] = await datastore.get(key);

    if (!entity) {
      // if entity does not exist, stop the task
      console.log("NFT collection does not exist");
      return "NFT collection does not exist";
    }

    // fetch NFT collection data from the blockchain
    const collData = await getCollectionDataFromBlockchain(nftAddress, scope) as any;

    // update daily and weekly volume of a given NFT collection
    try {
      if (scope == "mint" || scope == "burn") {
        let volumeToday = entity["volumeToday"] ? entity["volumeToday"] : 0;
        let volumeThisWeek = entity["volumeThisWeek"] ? entity["volumeThisWeek"] : 0;

        // check if volumeToday is number
        if (isNaN(volumeToday)) {
          volumeToday = 0;
        }

        // check if volumeThisWeek is number
        if (isNaN(volumeThisWeek)) {
          volumeThisWeek = 0;
        }

        // if not current date, reset daily volume
        if (entity["volumeTodayDate"] != getTodayDate()) {
          collData["volumeYesterday"] = volumeToday;
          collData["volumeToday"] = 0;
          collData["volumeTodayDate"] = getTodayDate();

          // set total daily volume in stats
          try {
            const totalVolumeTodayDate = await getStats("volumeTodayDate");

            if (totalVolumeTodayDate != getTodayDate()) {
              const totalVolumeToday = Number(await getStats("totalVolumeToday"));
              await setStats("totalVolumeYesterday", String(totalVolumeToday));
              await setStats("totalVolumeToday", "0");
              await setStats("volumeTodayDate", getTodayDate());
            }
          } catch (error) {
            console.error("Error setting totalVolumeYesterday: ", error);
          }
        }

        // if not current week, reset weekly volume
        if (entity["volumeThisWeekDate"] != getCurrentWeek()) {
          collData["volumePrevWeek"] = volumeThisWeek;
          collData["volumeThisWeek"] = 0;
          collData["volumeThisWeekDate"] = getCurrentWeek();

          try {
            const totalVolumeThisWeekDate = await getStats("volumeThisWeekDate");

            if (totalVolumeThisWeekDate != getCurrentWeek()) {
              const totalVolumeThisWeek = Number(await getStats("totalVolumeThisWeek"));
              await setStats("totalVolumePrevWeek", String(totalVolumeThisWeek));
              await setStats("totalVolumeThisWeek", "0");
              await setStats("volumeThisWeekDate", getCurrentWeek());
            }
          } catch (error) {
            console.error("Error setting totalVolumePrevWeek: ", error);
          }
        }

        if (scope == "mint" || Number(entity["mintPrice"]) != Number(collData["mintPrice"])) {
          collData["volumeToday"] = Number(volumeToday) + Number(entity["mintPrice"]);
          collData["volumeThisWeek"] = Number(volumeThisWeek) + Number(entity["mintPrice"]);

          try {
            const totalVolumeToday = Number(await getStats("totalVolumeToday"));
            await setStats("totalVolumeToday", String(totalVolumeToday + Number(entity["mintPrice"])));

            const totalVolumeThisWeek = Number(await getStats("totalVolumeThisWeek"));
            await setStats("totalVolumeThisWeek", String(totalVolumeThisWeek + Number(entity["mintPrice"])));
          } catch (error) {
            console.error("Mint - Error setting totalVolumeToday & totalVolumeThisWeek: ", error);
          }
        }

        if (scope == "burn" || Number(entity["burnPrice"]) != Number(collData["burnPrice"])) {
          collData["volumeToday"] = Number(volumeToday) + Number(entity["burnPrice"]);
          collData["volumeThisWeek"] = Number(volumeThisWeek) + Number(entity["burnPrice"]);

          try {
            const totalVolumeToday = Number(await getStats("totalVolumeToday"));
            await setStats("totalVolumeToday", String(totalVolumeToday + Number(entity["burnPrice"])));

            const totalVolumeThisWeek = Number(await getStats("totalVolumeThisWeek"));
            await setStats("totalVolumeThisWeek", String(totalVolumeThisWeek + Number(entity["burnPrice"])));
          } catch (error) {
            console.error("Burn - Error setting totalVolumeToday & totalVolumeThisWeek: ", error);
          }
        }
      }
    } catch (error) {
      console.error("Error updating volume: ", error);
    }

    // update just the certain fields in the entity
    console.log("updating entity...");
    for (const [key, value] of Object.entries(collData)) {
      entity[key] = value;
    }

    // save the updated entity
    await datastore.update(entity);
  }

  console.log("Task completed!");
  return "ok";
});