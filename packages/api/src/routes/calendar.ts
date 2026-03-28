import { Hono } from "hono";
import type { Env } from "../types";
import { getSession } from "../middleware/session";
import { fetchCalendarEvents, fetchCalendarList } from "../services/google";

export const calendarRoutes = new Hono<{ Bindings: Env }>();

calendarRoutes.get("/lists", async (c) => {
  const result = await getSession(c);
  if (!result?.session.googleAccessToken) return c.json({ error: "Not connected", code: "NOT_CONNECTED" }, 401);
  const lists = await fetchCalendarList(result.session.googleAccessToken);
  return c.json(lists);
});

calendarRoutes.get("/events", async (c) => {
  const result = await getSession(c);
  if (!result?.session.googleAccessToken) return c.json({ error: "Not connected", code: "NOT_CONNECTED" }, 401);
  const { timeMin, timeMax, calendarId } = c.req.query();
  if (!timeMin || !timeMax) return c.json({ error: "timeMin and timeMax required", code: "BAD_REQUEST" }, 400);
  const events = await fetchCalendarEvents(result.session.googleAccessToken, timeMin, timeMax, calendarId);
  return c.json(events);
});
