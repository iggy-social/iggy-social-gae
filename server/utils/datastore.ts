import { Datastore } from '@google-cloud/datastore';
import { getProjectId } from '~/server/utils/project';

const datastore = new Datastore({
  projectId: getProjectId()
});

export default datastore;