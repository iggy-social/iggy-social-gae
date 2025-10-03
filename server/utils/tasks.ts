import { CloudTasksClient } from '@google-cloud/tasks';
import { getProjectId } from '~/server/utils/project';

const tasksClient = new CloudTasksClient({
  projectId: getProjectId()
});

export async function createTask(url: string) {
  const parent = tasksClient.queuePath(
    getProjectId(),
    "europe-west1", // TODO: change to the region you selected for your GAE app
    "default"
  );

  const task = {
    httpRequest: {
      httpMethod: 'GET' as const,
      url: url
    }
  };

  const request = {
    parent: parent,
    task: task
  };

  const response = await tasksClient.createTask(request);
  console.log(`Created task ${response[0].name}`);
}