// ─────────────────────────────────────────────────────────────
// Server-only Airtable client.
// Direct REST calls — small surface, no SDK needed.
// NEVER import this from a client component.
// ─────────────────────────────────────────────────────────────

import "server-only";

const API_BASE = "https://api.airtable.com/v0";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const tables = {
  meetingNotes: () => env("AIRTABLE_TABLE_MEETING_NOTES"),
  goalsTracker: () => env("AIRTABLE_TABLE_GOALS_TRACKER"),
  projects: () => env("AIRTABLE_TABLE_PROJECTS"),
};

export const baseId = () => env("AIRTABLE_BASE_ID");

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

async function airtableRequest<T>(
  path: string,
  init: RequestInit & { revalidate?: number | false } = {},
): Promise<T> {
  const url = `${API_BASE}/${baseId()}${path}`;
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
  opts: { revalidate?: number | false } = {},
): Promise<AirtableRecord<T>[]> {
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
  opts: { revalidate?: number | false } = { revalidate: false },
): Promise<AirtableRecord<T>> {
  return airtableRequest<AirtableRecord<T>>(
    `/${tableId}/${recordId}`,
    opts,
  );
}

// ─── Update record ──

export async function updateRecord<T>(
  tableId: string,
  recordId: string,
  fields: Partial<T>,
): Promise<AirtableRecord<T>> {
  return airtableRequest<AirtableRecord<T>>(`/${tableId}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
    revalidate: false,
  });
}

// ─── Create record ──

export async function createRecord<T>(
  tableId: string,
  fields: Partial<T>,
): Promise<AirtableRecord<T>> {
  return airtableRequest<AirtableRecord<T>>(`/${tableId}`, {
    method: "POST",
    body: JSON.stringify({ fields }),
    revalidate: false,
  });
}

// ─── Batch create ──

export async function createRecords<T>(
  tableId: string,
  records: { fields: Partial<T> }[],
): Promise<AirtableRecord<T>[]> {
  const data = await airtableRequest<{ records: AirtableRecord<T>[] }>(
    `/${tableId}`,
    {
      method: "POST",
      body: JSON.stringify({ records, typecast: true }),
      revalidate: false,
    },
  );
  return data.records;
}
