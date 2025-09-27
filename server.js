// server.js
import { createServer } from "http";
import { handler } from "./.output/server/index.mjs";

const port = process.env.NITRO_PORT || 8080;

createServer(handler).listen(port, () => {
  console.log(`Nuxt SSR server running on port ${port}`);
});
