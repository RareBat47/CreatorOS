import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 3001;
const { app } = createApp();

console.log(`Starting @creatoros/api server on port ${port}...`);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`@creatoros/api server is running on http://localhost:${info.port}`);
  }
);
