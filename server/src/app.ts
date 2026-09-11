import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import config from "./config/index.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { boardRoutes } from "./modules/board/board.routes.js";
import { columnRoutes } from "./modules/column/column.routes.js";
import { taskRoutes } from "./modules/task/task.routes.js";

const app = express();
const allowedOrigins = new Set(
  [config.app_url, "http://localhost:3000", "http://localhost:3001"].filter(
    (origin): origin is string => Boolean(origin),
  ),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (_request, response) => {
  response.json({ success: true, data: { status: "ok" } });
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
