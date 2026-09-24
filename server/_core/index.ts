import { createExpressMiddleware } from "@trpc/server/adapters/express";
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { registerAdminRoutes } from "../module/admin/adminRoutes";
import { registerClientRoutes } from "../module/client/clientRoutes";
import { appRouter } from "../routers";
import { createContext } from "../trcp/context";
import { ENV } from "./env";
import { logger } from "./logger";
import { registerOAuthRoutes } from "./oauth";
import { serveStatic, setupVite } from "./vite";
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  registerAdminRoutes(app);
  registerClientRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ path, type, error, ctx }) {
        logger.error("trpc.error", {
          path,
          type,
          code: error.code,
          message: error.message,
          userId: ctx?.user?.id ?? null,
        });
      },
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    logger.warn("server.port_fallback", { preferredPort, port });
  }

  server.listen(port, () => {
    logger.info("server.started", { host: ENV.host, port, environment: process.env.NODE_ENV ?? "development" });
  });
}

startServer().catch(error => {\n  logger.error("server.start_failed", { error: error instanceof Error ? error.message : String(error) });\n  process.exitCode = 1;\n});
