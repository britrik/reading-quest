import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || ['http://localhost:3000'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env["NODE_ENV"] === "production") {
  // In the preferred production setup reading-quest is served as a static
  // artifact by the Replit router. This block is a fallback for single-process
  // deployments where the API server also needs to serve the frontend.
  const candidates = [
    path.resolve(__dirname, "../../reading-quest/dist/public"),
    path.resolve(process.cwd(), "artifacts/reading-quest/dist/public"),
  ];
  const staticDir = candidates.find((p) => fs.existsSync(p));

  if (!staticDir) {
    logger.warn(
      { candidates },
      "Reading Quest static assets not found — frontend will be served by the static artifact router",
    );
  } else {
    const indexHtml = path.join(staticDir, "index.html");
    logger.info({ staticDir }, "Serving Reading Quest static frontend");
    app.use(express.static(staticDir));
    app.get(/^\/(?!api(\/|$)).*/, (_req, res) => {
      res.sendFile(indexHtml);
    });
  }
}

// Global error-handling middleware (must be last).
// Express 5 natively catches rejected promises from async route handlers.
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
    res.status(500).json({ error: "Internal server error" });
  },
);

export default app;
