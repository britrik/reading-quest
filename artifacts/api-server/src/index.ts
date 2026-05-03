import app from "./app";
import { logger } from "./lib/logger";
import { seed } from "./seed";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  try {
    const r = await seed();
    if (r.seeded) logger.info("Database seeded with initial Reading Quest content");
  } catch (err) {
    logger.error({ err }, "Seed failed");
    process.exit(1);
  }

  const server = app.listen(port);
  server.on("listening", () => logger.info({ port }, "Server listening"));
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.error({ port }, "Port already in use; aborting startup");
    } else {
      logger.error({ err }, "Server error");
    }
    process.exit(1);
  });
}

start();
