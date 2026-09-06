import "dotenv/config";
import { app } from "./app.js";

const port = Number(process.env.PORT ?? 4000);

const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_ACCESS_EXPIRES_IN",
  "JWT_REFRESH_EXPIRES_IN",
];

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(
    `[startup] Missing required environment variable(s): ${missingEnvVars.join(", ")}. ` +
      "The server may crash or misbehave until these are set.",
  );
}

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

server.on("error", (error) => {
  console.error("[server] Failed to start listening:", error);
  process.exit(1);
});

/**
 * Guard against a single bad request/promise silently crashing the whole
 * process (which, on Railway, surfaces to clients as an opaque 502 with
 * no CORS headers, looking like a CORS failure in the browser).
 */
process.on("unhandledRejection", (reason) => {
  console.error("[process] Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[process] Uncaught exception:", error);
});

function shutdown(signal: string) {
  console.log(`[process] Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log("[process] HTTP server closed.");
    process.exit(0);
  });

  // Force-exit if graceful shutdown hangs.
  setTimeout(() => {
    console.error("[process] Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

