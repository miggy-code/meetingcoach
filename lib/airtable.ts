// ─────────────────────────────────────────────────────────────
// Server-only Airtable client.
// Direct REST calls — small surface, no SDK needed.
// NEVER import this from a client component.
//
// Base split (2026-04-30):
//   AIRTABLE_BASE_ID          → ThrottlGTM  (outreach tables — legacy, kept for compatibility)
//   AIRTABLE_INTERNAL_BASE_ID → ThrottlInternal (Meeting Notes, Goals Tracker, Projects)
// ─────────────────────────────────────────────────────────────

import "server-only";

const API_BASE = "https://api.airtable.com/v0";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

// ─── Base ID helpers ──

/** ThrottlGTM base — outreach/lead tables (kept for future GTM routes). */
export const gtmBaseId = () => env("AIRTABLE_BASE_ID");

/** ThrottlInternal base — Meeting Notes, Goals Tracker, Projects. */
export const internalBaseId = () => env("AIRTABLE_INTERNAL_BASE_ID");

/**
 * @deprecated Use `internalBaseId()` or `gtmBaseId()` directly.
 * Kept as an alias for `internalBaseId()` so any legacy callers don't break.
 */
export const baseId = internalBaseId;

// ─── Table ID helpers ──

export const tables = {
  meetingNotes: () => env("AIRTABLE_TABLE_MEETING_NOTES"),
  goalsTracker: () => env("AIRTABLE_TABLE_GOALS_TRACKER"),
  projects: () => env("AIRTABLE_TABLE_PROJECTS"),
  offers: () => env("AIRTABLE_TABLE_OFFERS"),
};

// ─── Airtable types ──

interface AirtableListResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

export interface AirtableRecord<T = Record<string, unknown>> {
  id: string;
  fields: T;
  createdTime: string;
}

interface ListOptions {
  filterByFormula?: string;
  sort?: { field: string; direction?: "asc" | "desc" }[];
  fields?: string[];
  maxRecords?: number;
  pageSize?: number;
  view?: string;
}

// ─── Core request helper ──

async function airtableRequest<T>(
  baseIdValue: string,
  path: string,
  init: RequestInit & { revalidate?: number | false } = {},
): Promise<T> {
  const url = `${API_BASE}/${baseIdValue}${path}`;
  const { revalidate = 60, ...rest } = init;
  const cacheOpts: RequestInit =
    revalidate === false
      ? { cache: "no-store" }
      : { next: { revalidate } as RequestInit["next"] };
  const res = await fetch(url, {
    ...rest,
    ...cacheOpts,
    headers: {
      Authorization: `Bearer ${env("AIRTABLE_API_KEY")}`,
      "Content-Type": "application/json",
      ...rest.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Airtable ${rest.method ?? "GET"} ${path} failed: ${res.status} ${text}`,
    );
  }
  return res.json() as Promise<T>;
}

// ─── List records (paginated) ──

export async function listRecords<T>(
  tableId: string,
  options: ListOptions = {},
  opts: { revalidate?: number | false; baseId?: string } = {},
): Promise<AirtableRecord<T>[]> {
  const base = opts.baseId ?? internalBaseId();
  const all: AirtableRecord<T>[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams();
    if (options.filterByFormula) params.set("filterByFormula", options.filterByFormula);
    if (options.maxRecords) params.set("maxRecords", String(options.maxRecords));
    if (options.pageSize) params.set("pageSize", String(options.pageSize));
    if (options.view) params.set("view", options.view);
    if (offset) params.set("offset", offset);
    options.sort?.forEach((s, i) => {
      params.set(`sort[${i}][field]`, s.field);
      if (s.direction) params.set(`sort[${i}][direction]`, s.direction);
    });
    options.fields?.forEach((f) => params.append("fields[]", f));

    const data = await airtableRequest<AirtableListResponse<T>>(
      base,
      `/${tableId}?${params.toString()}`,
      opts,
    );
    all.push(...data.records);
    offset = data.offset;
    if (options.maxRecords && all.length >= options.maxRecords) break;
  } while (offset);
  return all;
}

// ─── Get single record ──

export async function getRecord<T>(
  tableId: string,
  recordId: string,
  opts: { revalidate?: number | false; baseId?: string } = { revalidate: false },
): Promise<AirtableRecord<T>> {
  const base = opts.baseId ?? internalBaseId();
  return airtableRequest<AirtableRecord<T>>(
    base,
    `/${tableId}/${recordId}`,
    opts,
  );
}

// ─── Update record ──

export async function updateRecord<T>(
  tableId: string,
  recordId: string,
  fields: Partial<T>,
  opts: { baseId?: string } = {},
): Promise<AirtableRecord<T>> {
  const base = opts.baseId ?? internalBaseId();
  return airtableRequest<AirtableRecord<T>>(base, `/${tableId}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
    revalidate: false,
  });
}

// ─── Create record ──

export async function createRecord<T>(
  tableId: string,
  fields: Partial<T>,
  opts: { baseId?: string } = {},
): Promise<AirtableRecord<T>> {
  const base = opts.baseId ?? internalBaseId();
  return airtableRequest<AirtableRecord<T>>(base, `/${tableId}`, {
    method: "POST",
    body: JSON.stringify({ fields }),
    revalidate: false,
  });
}

// ─── Batch create ──

export async function createRecords<T>(
  tableId: string,
  records: { fields: Partial<T> }[],
  opts: { baseId?: string } = {},
): Promise<AirtableRecord<T>[]> {
  const base = opts.baseId ?? internalBaseId();
  const data = await airtableRequest<{ records: AirtableRecord<T>[] }>(
    base,
    `/${tableId}`,
    {
      method: "POST",
      body: JSON.stringify({ records, typecast: true }),
      revalidate: false,
    },
  );
  return data.records;
}
