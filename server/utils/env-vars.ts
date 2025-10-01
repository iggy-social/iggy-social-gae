import datastore from '~/server/utils/datastore';

export async function getEnvVar(varkey: string) {
  if (process.env.MYLOCALHOST) {
    // if running locally, return the environment variable from the .env file
    return process.env[varkey];
  } else {
    // if running on Google App Engine, return the environment variable from the datastore
    const query = datastore.createQuery('EnvVar');

    query.filter('envkey', varkey);

    const [results] = await datastore.runQuery(query);

    // Check if the results are empty
    if (results.length === 0) {
      console.log('No results found');
    } else {
      // Get the first result
      const result = results[0];

      // Get the varval value
      const varValue = result['envval'];

      return varValue;
    }
  }
}