import { runTask } from "~/server/utils/tasks.js";

export default defineEventHandler(async (event) => {
  const hostname = getHeader(event, "x-appengine-default-version-hostname");
  const uniqueId = getQuery(event).uniqueId as string;

  if (!uniqueId) {
    return { error: "uniqueId is required", code: 400 };
  }

  const taskUrl = `https://${hostname}/api/task/find-collection?uniqueId=${uniqueId}`;
  console.log(`Running the following task: ${taskUrl}`);
  
  if (!process.env.MYLOCALHOST) {
    runTask(taskUrl);
  }

  return { success: true, code: 200 };
});