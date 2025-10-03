import datastore from '~/server/utils/datastore';

export async function getStats(statskey: string) {
  if (process.env.MYLOCALHOST) {
    // if running locally, return "0"
    return "0"
  } else {
    // if running on Google App Engine, return the stats value from the datastore
    const query = datastore.createQuery('Stats');

    query.filter('statskey', statskey);

    const [results] = await datastore.runQuery(query);

    // Check if the results are empty
    if (results.length === 0) {
      console.log('No results found');
      return "0"
    } else {
      // Get the first result
      const result = results[0];

      // Get the varval value
      const statsValue = result['statsval'];

      return statsValue;
    }
  }
}

export async function setStats(statskey: string, statsval: string) {
  const entity = {
    key: datastore.key(['Stats', statskey]),
    data: {
      statskey: statskey,
      statsval: statsval
    }
  };

  await datastore.save(entity);
}
