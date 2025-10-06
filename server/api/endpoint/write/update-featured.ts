import { createTask } from "~/server/utils/tasks.js";

export default defineEventHandler(async (event) => {
  const hostname = getHeader(event, "x-appengine-default-version-hostname");

  const taskUrl = `https://${hostname}/api/task/update-featured`;
  console.log(`Running the following task: ${taskUrl}`);
  
  if (!process.env.MYLOCALHOST) {
    createTask(taskUrl);
  }

  return { success: true, code: 200 };
});
