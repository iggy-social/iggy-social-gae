import { createTask } from "~/server/utils/tasks.js";

export default defineEventHandler(async (event) => {
  // PRODUCTION: CHECK IF REQUEST COMES FROM GOOGLE CLOUD
  if (!process.env.MYLOCALHOST) {
    const isFromGoogleCloud = getHeader(event, 'x-appengine-cron');

    if (!isFromGoogleCloud) {
      console.log("This is NOT a request from Google Cloud!");
      throw createError({
        statusCode: 403,
        statusMessage: "Sorry, but you cannot call this URL directly!"
      });
    }
  }

  const hostname = getHeader(event, "x-appengine-default-version-hostname");

  const taskUrl = `https://${hostname}/api/task/update-featured`;
  console.log(`Running the following task: ${taskUrl}`);
  
  if (!process.env.MYLOCALHOST) {
    createTask(taskUrl);
  }

  return { success: true, code: 200 };
});