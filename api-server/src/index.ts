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
