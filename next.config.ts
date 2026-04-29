import type { NextConfig } from "next";

const config: NextConfig = {
  // Server-only env vars are read directly via process.env in lib/airtable.ts and lib/deepseek.ts.
  // We do NOT expose them via `env` here — that would inline them into the client bundle.
  experimental: {
    // Server Actions are stable in Next 16; no flag needed.
  },
};

export default config;
