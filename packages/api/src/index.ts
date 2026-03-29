import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { googleRoutes } from "./google/routes";
import { authRoutes } from "./routes/auth";
import { documentRoutes } from "./routes/documents";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:5173", "https://flowdocs.pages.dev"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type"],
  credentials: true,
}));

// Google domain: /api/auth/google/*, /api/events
app.route("/api", googleRoutes);

// Auth: /api/auth/status, /api/auth/notion, /api/auth/:provider
app.route("/api/auth", authRoutes);

// Documents: /api/documents/*
app.route("/api/documents", documentRoutes);

app.get("/api/health", (c) => c.json({ status: "ok", ts: new Date().toISOString() }));

app.notFound((c) => c.json({ error: "Not found", code: "NOT_FOUND" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal error", code: "INTERNAL_ERROR" }, 500);
});

export default app;
