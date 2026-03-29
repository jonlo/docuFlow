export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleCalendarEventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface GoogleCalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: GoogleCalendarEventDateTime;
  end: GoogleCalendarEventDateTime;
  htmlLink?: string;
  colorId?: string;
  attendees?: GoogleCalendarAttendee[];
}

export interface GoogleCalendarEventsResponse {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
}
