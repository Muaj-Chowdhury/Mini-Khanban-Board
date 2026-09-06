import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import config from "./config/index.js";
import { prisma } from "./lib/prisma.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { boardRoutes } from "./modules/board/board.routes.js";
import { columnRoutes } from "./modules/column/column.routes.js";
import { taskRoutes } from "./modules/task/task.routes.js";

const app = express();

// Accept the configured APP_URL plus localhost dev origins. A single
// mis-set APP_URL env var should not take down CORS for every origin.
const allowedOrigins = [config.app_url, "http://localhost:3000"].filter(
  (origin): origin is string => Boolean(origin),
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header, e.g. curl/health checks).
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ success: true, data: { status: "ok", db: "ok" } });
  } catch (error) {
    console.error("[health] Database check failed:", error);
    response
      .status(503)
      .json({ success: false, data: { status: "degraded", db: "error" } });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/boards", columnRoutes);
app.use("/api/boards", taskRoutes);
app.get("/", (_request, response) => {
  response.json({
    success: true,
    message: "Welcome to the Mini Kanban Board API",
  });
});
app.use(notFound);
app.use(globalErrorHandler);

export { app };
