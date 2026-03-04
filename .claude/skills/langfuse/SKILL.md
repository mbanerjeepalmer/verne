---
description: |
  Use when writing code that reads traces, observations, scores, or sessions from the LangFuse API.
  TRIGGER when: user asks about reading/querying LangFuse data, or code calls LangFuse REST endpoints.
  DO NOT TRIGGER for OpenTelemetry instrumentation or SDK tracing setup.
allowed-tools: Read, Grep, Glob, Bash, WebFetch
---

# LangFuse API — Reading Traces & Observations

Reference for querying LangFuse's REST API to read observability data.

## Authentication

Basic auth: `publicKey:secretKey` (base64-encoded).

```ts
const auth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64");
const headers = { Authorization: `Basic ${auth}` };
```

```bash
curl -u "pk-lf-...:sk-lf-..." https://cloud.langfuse.com/api/public/traces
```

Base URLs: `https://cloud.langfuse.com` (EU), `https://us.cloud.langfuse.com` (US).

## Data Model

**Trace** → contains **Observations** (nested hierarchically).

Observation types: `span`, `generation`, `tool`, `event`, `agent`, `chain`, `retriever`, `evaluator`, `embedding`, `guardrail`.

**Sessions** group multiple traces. **Scores** attach to traces or observations.

## Endpoints

### List Traces

```
GET /api/public/traces?page=1&limit=10
```

Query params: `page`, `limit`, `userId`, `sessionId`, `name`, `tags`, `release`, `version`, `environment`.

Response:
```json
{ "data": [{ "id": "...", "name": "...", "input": {...}, "output": {...}, "sessionId": "...", "userId": "...", "tags": [], "metadata": {} }], "meta": { "totalItems": 100, "page": 1 } }
```

### Get Single Trace

```
GET /api/public/traces/{traceId}
```

Returns the trace with all its observations inlined.

### List Observations

```
GET /api/public/observations?traceId=...&type=generation&limit=50
```

Query params: `name`, `userId`, `type`, `traceId`, `level`, `parentObservationId`, `environment`, `fromStartTime`, `toStartTime`.

### List Observations v2 (cursor-based, field selection)

```
GET /api/public/v2/observations?traceId=...&limit=50&fields=core,io,usage
```

Field groups: `core`, `basic`, `time`, `io`, `metadata`, `model`, `usage`, `prompt`, `metrics`.

Uses cursor pagination: pass `cursor` from previous response for next page. Max 1000 per page.

### Get Single Observation

```
GET /api/public/observations/{observationId}
```

### List Scores

```
GET /api/public/scores?traceId=...
```

Query params: `page`, `limit`, `name`, `observationId`, `traceId`, `userId`.

### Create Score

```
POST /api/public/scores
```

```json
{
  "traceId": "...",
  "observationId": "...",
  "name": "quality",
  "value": 0.9,
  "dataType": "NUMERIC"
}
```

`dataType`: `"NUMERIC"` | `"BOOLEAN"` | `"CATEGORICAL"`.

`observationId` is optional — omit to score the whole trace.

### List Sessions

```
GET /api/public/sessions?page=1&limit=10
```

Query params: `page`, `limit`, `userId`.

### Metrics

```
GET /api/public/v2/metrics
```

Query params for aggregations across observations. Supports views (`observations`, `scores-numeric`, `scores-categorical`), dimensions (group by `name`, `model`, `environment`, `tags`), and measures (`count`, `latency`, `cost`, `tokens` with aggregations like `sum`, `avg`, `p95`).

### Prompts

```
GET /api/public/prompts
GET /api/public/prompts/{promptName}
```

## TypeScript Client (alternative to raw HTTP)

```ts
import { LangfuseClient } from "@langfuse/client";
const langfuse = new LangfuseClient(); // reads LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASE_URL
```

The client wraps the REST API for scores, prompts, and datasets.

## This Project

LangFuse credentials are in `backend/.env` (not root `.env`). Env vars: `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY`.

**Host**: This project uses the **EU** host (`https://cloud.langfuse.com`). The US host returns "Invalid credentials".

**Auth from bash**: `curl -u` does NOT work reliably. Use explicit base64 encoding:

```bash
source /Users/mbp/Projects/verne_3/backend/.env
AUTH=$(echo -n "${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}" | base64)
curl -s -H "Authorization: Basic ${AUTH}" "https://cloud.langfuse.com/api/public/traces/{traceId}"
```

**Parsing traces**: Pipe through `python3 -c` for structured output. Key fields on a trace: `name`, `input`, `output`, `latency`, `sessionId`, `metadata.attributes.error.type`, and `observations[]` (each with `type`, `name`, `model`, `usageDetails`, `latency`).

See `backend/sandbox.ts` for the auth pattern used in application code.
