import { Datastore } from '@google-cloud/datastore';

const datastore = new Datastore({
  projectId: 'iggy-social-gae' // TODO: change to your project ID
});

export default datastore;