import dotenv from "dotenv";

// Load local .env for development only if SESSION_SECRET isn't already set.
// This avoids duplicate dotenv.config() calls in other modules (e.g. routes import 'dotenv/config').
if (!process.env.SESSION_SECRET && !process.env.__DOTENV_LOADED) {
  dotenv.config();
  // mark as loaded to avoid re-running config in other module loads
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  process.env.__DOTENV_LOADED = "1";
}

import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];
let initialPort = rawPort ? Number(rawPort) : 3000;

if (Number.isNaN(initialPort) || initialPort <= 0) {
  initialPort = 3000;
}

import { initDb } from "./lib/db-init";

async function startServer() {
  try {
    await initDb();
    
    function tryListen(port: number) {
      const server = app.listen(port);
      
      server.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          logger.info(`Port ${port} is in use, trying another port...`);
          tryListen(port + 1);
        } else {
          logger.error({ err }, "Error listening on port");
          process.exit(1);
        }
      });

      server.on("listening", () => {
        logger.info(`Server running on port ${port}`);
      });
    }

    tryListen(initialPort);
  } catch (err) {
    logger.error({ err }, "Fatal error during startup");
    process.exit(1);
  }
}

startServer();
