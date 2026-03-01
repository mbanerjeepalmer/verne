#!/usr/bin/env bun
/**
 * Quick test: fetch recent traces from LangFuse.
 * Usage: bun .claude/skills/langfuse/test-api.ts
 *
 * Reads LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY from backend/.env
 */

import { readFileSync } from "fs";

// Load keys from backend/.env
const envFile = readFileSync("backend/.env", "utf8");
const env: Record<string, string> = {};
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const publicKey = env.LANGFUSE_PUBLIC_KEY;
const secretKey = env.LANGFUSE_SECRET_KEY;

if (!publicKey || !secretKey) {
  console.error("Missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY in backend/.env");
  process.exit(1);
}

const baseUrl = env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com";
const auth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64");

async function get(path: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    console.error(`${res.status} ${res.statusText} — ${path}`);
    console.error(await res.text());
    process.exit(1);
  }
  return res.json();
}

// Fetch recent traces
const traces = await get("/api/public/traces?limit=5");
console.log(`Found ${traces.meta.totalItems} total traces. Showing last 5:\n`);

for (const t of traces.data) {
  console.log(`  ${t.id}  ${t.name ?? "(unnamed)"}  ${t.timestamp}`);
  if (t.sessionId) console.log(`    session: ${t.sessionId}`);
  if (t.tags?.length) console.log(`    tags: ${t.tags.join(", ")}`);
}

// Fetch observations for the most recent trace
if (traces.data.length > 0) {
  const traceId = traces.data[0].id;
  const obs = await get(`/api/public/observations?traceId=${traceId}&limit=20`);
  console.log(`\nObservations for trace ${traceId}: ${obs.data.length}`);
  for (const o of obs.data) {
    console.log(`  ${o.type.padEnd(12)} ${o.name ?? "(unnamed)"}  ${o.startTime}`);
  }
}
