import { createTask } from "~/server/utils/tasks.js";

export default defineEventHandler(async (event) => {
  const hostname = getHeader(event, "x-appengine-default-version-hostname");
  const uniqueId = getQuery(event)['unique_id'] as string;

  if (!uniqueId) {
    return { error: "uniqueId is required", code: 400 };
  }

  const taskUrl = `https://${hostname}/api/task/find-collection?unique_id=${uniqueId}`;
  console.log(`Running the following task: ${taskUrl}`);
  
  if (!process.env.MYLOCALHOST) {
    createTask(taskUrl);
  }

  return { success: true, code: 200 };
});