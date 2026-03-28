import { Hono } from "hono";
import type { Env } from "../types";

export const documentRoutes = new Hono<{ Bindings: Env }>();

// TODO: implement document search for Notion and Confluence
documentRoutes.get("/search", (c) => {
  return c.json({ error: "Not implemented", code: "NOT_IMPLEMENTED" }, 501);
});
