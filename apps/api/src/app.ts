import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { type AppServices, createServices } from "./services.js";
import { createCreatorsRouter } from "./routes/creators.js";
import { createIdeasRouter } from "./routes/ideas.js";
import { createScriptsRouter } from "./routes/scripts.js";
import { createScenesRouter } from "./routes/scenes.js";
import { createRendersRouter } from "./routes/renders.js";
import { createRepurposeRouter } from "./routes/repurpose.js";

export function createApp(servicesOverride?: Partial<AppServices>) {
  const services = createServices(servicesOverride);
  const app = new Hono();

  // Middleware
  app.use("*", cors());
  app.use("*", prettyJSON());

  // Health check endpoint
  app.get("/health", (c) => {
    return c.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        memoryStore: "ready",
        modelRouter: "ready",
        council: "ready",
      },
    });
  });

  // API v1 routes
  const v1 = new Hono();
  v1.route("/creators", createCreatorsRouter(services));
  v1.route("/ideas", createIdeasRouter(services));
  v1.route("/scripts", createScriptsRouter(services));
  v1.route("/scenes", createScenesRouter(services));
  v1.route("/renders", createRendersRouter(services));
  v1.route("/repurpose", createRepurposeRouter(services));

  app.route("/api/v1", v1);

  // Fallback 404
  app.notFound((c) => {
    return c.json({ error: "Route not found", path: c.req.path }, 404);
  });

  // Global error handler
  app.onError((err, c) => {
    console.error("Unhandled error:", err);
    return c.json(
      {
        error: "Internal Server Error",
        message: err.message,
      },
      500
    );
  });

  return { app, services };
}
