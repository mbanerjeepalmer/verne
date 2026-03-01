import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Sandbox, Template, defaultBuildLogger } from "e2b";
import { vibeTemplate } from "../packages/sandbox/template.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from backend/ directory
config({ path: resolve(__dirname, ".env") });

const CLI_PATH = resolve(__dirname, "../listennotes-cli/podcast_search.py");
const API_MODULE_PATH = resolve(__dirname, "../listennotes-cli/listennotes_api.py");

const SERVER_PORT = 8000;

let cachedSandbox: Sandbox | null = null;
let cachedUrl: string | null = null;

async function createSandbox(): Promise<{ sandbox: Sandbox; url: string }> {
  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
  const LISTENNOTES_API_KEY = process.env.LISTENNOTES_API_KEY ?? "";
  const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY ?? "";
  const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY ?? "";

  if (!MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is required in .env");
  }

  // Build OTEL auth header for Langfuse (Base64 of public:secret)
  const langfuseOtelAuth = LANGFUSE_PUBLIC_KEY && LANGFUSE_SECRET_KEY
    ? Buffer.from(`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`).toString("base64")
    : "";

  console.log("Building template...");
  await Template.build(vibeTemplate, "vibe-agent", {
    onBuildLogs: defaultBuildLogger(),
  });

  console.log("Creating sandbox...");
  const sandbox = await Sandbox.create("vibe-agent", {
    envs: {
      MISTRAL_API_KEY,
      LISTENNOTES_API_KEY,
      ...(langfuseOtelAuth && {
        OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: "https://cloud.langfuse.com/api/public/otel/v1/traces",
        OTEL_EXPORTER_OTLP_TRACES_HEADERS: `Authorization=Basic ${langfuseOtelAuth}`,
      }),
    },
    timeoutMs: 300_000,
  });
  console.log(`Sandbox created: ${sandbox.sandboxId}`);

  const envLines = [
    `MISTRAL_API_KEY=${MISTRAL_API_KEY}`,
    `LISTENNOTES_API_KEY=${LISTENNOTES_API_KEY}`,
    ...(langfuseOtelAuth ? [
      `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://cloud.langfuse.com/api/public/otel/v1/traces`,
      `OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Basic ${langfuseOtelAuth}`,
    ] : []),
  ];
  await sandbox.files.write("/home/user/.env", envLines.join("\n") + "\n");

  const cliSource = readFileSync(CLI_PATH, "utf-8");
  await sandbox.files.write("/usr/local/bin/podcast-search", cliSource);
  await sandbox.commands.run("chmod +x /usr/local/bin/podcast-search");

  const apiModuleSource = readFileSync(API_MODULE_PATH, "utf-8");
  await sandbox.files.write("/usr/local/bin/listennotes_api.py", apiModuleSource);

  const systemPrompt = readFileSync(
    resolve(__dirname, "../packages/sandbox/prompts/podcast-agent.md"),
    "utf-8"
  );
  await sandbox.commands.run("mkdir -p /home/user/.vibe/prompts");
  await sandbox.files.write(
    "/home/user/.vibe/prompts/podcast-agent.md",
    systemPrompt
  );

  await sandbox.commands.run("mkdir -p /home/user/.vibe/tools");
  const toolSource = readFileSync(
    resolve(__dirname, "../packages/sandbox/tools/post_episode.py"),
    "utf-8"
  );
  await sandbox.files.write("/home/user/.vibe/tools/post_episode.py", toolSource);

  const host = sandbox.getHost(SERVER_PORT);
  const url = `https://${host}`;
  console.log(`Sandbox URL: ${url}`);

  return { sandbox, url };
}

export function getSandboxStatus(): { ready: boolean; sandboxId: string | null; url: string | null } {
  return {
    ready: cachedSandbox !== null && cachedUrl !== null,
    sandboxId: cachedSandbox?.sandboxId ?? null,
    url: cachedUrl,
  };
}

export async function initSandbox(): Promise<string> {
  if (cachedSandbox && cachedUrl) {
    const alive = await cachedSandbox.isRunning().catch(() => false);
    if (alive) {
      return cachedUrl;
    }
    console.log("Cached sandbox expired, creating new one...");
    cachedSandbox = null;
    cachedUrl = null;
  }

  const { sandbox, url } = await createSandbox();
  cachedSandbox = sandbox;
  cachedUrl = url;
  return url;
}

export interface SandboxEvent {
  type: string;
  content: string | null;
  tool_name?: string;
  args?: Record<string, any>;
  result?: string | null;
  error?: string | null;
}

export interface SandboxResponse {
  session_id: string;
  events: SandboxEvent[];
}

export async function killSandbox(): Promise<void> {
  if (cachedSandbox) {
    console.log(`Killing sandbox ${cachedSandbox.sandboxId}...`);
    await cachedSandbox.kill().catch((err: unknown) =>
      console.error("Error killing sandbox:", err)
    );
    cachedSandbox = null;
    cachedUrl = null;
    console.log("Sandbox killed.");
  }
}

// Kill sandbox on server shutdown
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down sandbox...`);
    await killSandbox();
    process.exit(0);
  });
}

export async function sendQuery(
  query: string,
  sessionId?: string
): Promise<SandboxResponse> {
  const url = await initSandbox();

  // Keep the sandbox alive on each query
  if (cachedSandbox) {
    await cachedSandbox.setTimeout(300_000).catch(() => {});
  }

  const body: Record<string, string> = { message: query };
  if (sessionId) {
    body.session_id = sessionId;
  }

  const resp = await fetch(`${url}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Sandbox request failed: ${resp.status} — ${text}`);
  }

  return (await resp.json()) as SandboxResponse;
}

export async function sendQueryStream(
  query: string,
  onEvent: (event: SandboxEvent) => void,
  sessionId?: string,
  context?: Record<string, unknown>
): Promise<{ session_id: string }> {
  const url = await initSandbox();

  if (cachedSandbox) {
    await cachedSandbox.setTimeout(300_000).catch(() => {});
  }

  const payload = {
    message: query,
    ...(sessionId && { session_id: sessionId }),
    ...(context && { context }),
  };

  const resp = await fetch(`${url}/message/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120_000),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Sandbox stream request failed: ${resp.status} — ${text}`);
  }

  let sessionIdOut = "";
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop()!;

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as SandboxEvent & { session_id?: string };
      if (event.type === "session") {
        sessionIdOut = event.session_id ?? "";
      } else if (event.type !== "done") {
        onEvent(event);
      }
    }
  }

  return { session_id: sessionIdOut };
}
