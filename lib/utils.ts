import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  format,
  isWithinInterval,
  parseISO,
} from "date-fns";
import clsx, { type ClassValue } from "clsx";

// ─── Class merging ──
export function cn(...classes: ClassValue[]): string {
  return clsx(classes);
}

// ─── Date helpers (Mon–Sun week per spec) ──
export function thisWeekRange(now = new Date()) {
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

export function thisMonthRange(now = new Date()) {
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

export function last14DaysRange(now = new Date()) {
  return {
    start: subDays(now, 14),
    end: now,
  };
}

export function isInRange(
  iso: string | null | undefined,
  range: { start: Date; end: Date },
): boolean {
  if (!iso) return false;
  try {
    return isWithinInterval(parseISO(iso), range);
  } catch {
    return false;
  }
}

// ─── Formatting ──
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "MMM d");
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return iso;
  }
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ─── Safe JSON parse ──
export function tryParseJSON<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
