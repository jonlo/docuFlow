import type { CreateEventBody, UpdateEventBody, ContactResult } from "@flowdocs/shared";
import type {
  GoogleCalendarEvent,
  GoogleCalendarEventsResponse,
  GoogleTokenResponse,
  GoogleUserInfo,
} from "./types";

export async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.statusText}`);
  const data = await res.json() as GoogleTokenResponse;
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token!,
    expiresAt:    Date.now() + data.expires_in * 1000,
  };
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresAt: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.statusText}`);
  const data = await res.json() as GoogleTokenResponse;
  return {
    accessToken: data.access_token,
    expiresAt:   Date.now() + data.expires_in * 1000,
  };
}

export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch user info");
  return res.json() as Promise<GoogleUserInfo>;
}

export async function createCalendarEvent(
  accessToken: string,
  body: CreateEventBody,
  calendarId = "primary"
): Promise<GoogleCalendarEvent> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: body.title,
        start:   { dateTime: body.start },
        end:     { dateTime: body.end },
        attendees: body.attendees?.map((a) => ({ email: a.email, displayName: a.name })),
      }),
    }
  );
  if (!res.ok) throw new Error(`Create event failed: ${res.statusText}`);
  return res.json() as Promise<GoogleCalendarEvent>;
}

export async function updateCalendarEvent(
  accessToken: string,
  googleEventId: string,
  body: UpdateEventBody,
  calendarId = "primary"
): Promise<GoogleCalendarEvent> {
  const patch: Record<string, unknown> = {};
  if (body.title     !== undefined) patch["summary"]   = body.title;
  if (body.start     !== undefined) patch["start"]     = { dateTime: body.start };
  if (body.end       !== undefined) patch["end"]       = { dateTime: body.end };
  if (body.attendees !== undefined) patch["attendees"] = body.attendees.map((a) => ({ email: a.email, displayName: a.name }));

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) throw new Error(`Update event failed: ${res.statusText}`);
  return res.json() as Promise<GoogleCalendarEvent>;
}

export async function deleteCalendarEvent(
  accessToken: string,
  googleEventId: string,
  calendarId = "primary"
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok && res.status !== 410) throw new Error(`Delete event failed: ${res.statusText}`);
}

export async function searchContacts(
  accessToken: string,
  query: string
): Promise<ContactResult[]> {
  const params = new URLSearchParams({ query, readMask: "names,emailAddresses", pageSize: "5" });
  const res = await fetch(
    `https://people.googleapis.com/v1/people:searchContacts?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = await res.json() as { results?: { person: { names?: { displayName: string }[]; emailAddresses?: { value: string }[] } }[] };
  return (data.results ?? []).flatMap((r) => {
    const email = r.person.emailAddresses?.[0]?.value;
    if (!email) return [];
    return [{ email, name: r.person.names?.[0]?.displayName }];
  });
}

export async function listCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  calendarId = "primary"
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Calendar fetch failed: ${res.statusText}`);
  const data = await res.json() as GoogleCalendarEventsResponse;
  return data.items ?? [];
}
