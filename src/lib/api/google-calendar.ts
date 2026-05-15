import type { Category, Recurrence } from "@/lib/db";
import { getToken } from "./google-auth";

export interface CalendarEvent {
  id: string;
  summary?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
}

const BASE = "https://www.googleapis.com/calendar/v3";

async function authFetch(path: string): Promise<unknown> {
  const token = getToken("calendar");
  if (!token) throw new Error("Calendar not authenticated");

  const response = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Calendar API error: ${response.status}`);
  return response.json();
}

export async function fetchUpcomingEvents(): Promise<CalendarEvent[]> {
  const timeMin = encodeURIComponent(new Date().toISOString());
  const data = (await authFetch(
    `/calendars/primary/events?timeMin=${timeMin}&maxResults=30&singleEvents=true&orderBy=startTime`
  )) as { items?: CalendarEvent[] };
  return data.items ?? [];
}

export function calendarEventToTaskData(event: CalendarEvent) {
  let dueDate: string;
  let dueTime: string | null;

  if (event.start.dateTime) {
    const date = new Date(event.start.dateTime);
    dueDate = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    dueTime = [
      String(date.getHours()).padStart(2, "0"),
      String(date.getMinutes()).padStart(2, "0"),
    ].join(":");
  } else {
    dueDate = event.start.date ?? "";
    dueTime = null;
  }

  return {
    title: event.summary ?? "(無題)",
    dueDate,
    dueTime,
    category: "life" as Category,
    recurrence: "none" as Recurrence,
  };
}
