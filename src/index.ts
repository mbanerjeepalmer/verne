/**
 * E2B sandbox orchestrator for the Vibe agent server.
 *
 * Creates a sandbox, uploads the FastAPI server, installs deps,
 * starts uvicorn, and verifies the agent responds.
 */

import "dotenv/config";
import { Sandbox } from "e2b";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
if (!MISTRAL_API_KEY) {
  console.error("MISTRAL_API_KEY is required");
  process.exit(1);
}

const SERVER_PORT = 8000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readLocal(relativePath: string): string {
  return readFileSync(resolve(__dirname, "..", relativePath), "utf-8");
}

async function run(sandbox: Sandbox, label: string, cmd: string, timeoutMs = 60_000) {
  console.log(`\n> [${label}] ${cmd}`);
  const result = await sandbox.commands.run(cmd, { timeoutMs });
  if (result.stdout.trim()) console.log(result.stdout.trimEnd());
  if (result.stderr.trim()) console.log(`[stderr] ${result.stderr.trimEnd()}`);
  if (result.exitCode !== 0) {
    throw new Error(`[${label}] exited with code ${result.exitCode}`);
  }
  return result;
}

async function waitForServer(url: string, maxRetries = 30, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const resp = await fetch(`${url}/health`);
      if (resp.ok) { console.log("Health check passed."); return; }
    } catch { /* not ready */ }
    console.log(`Waiting for server... (${i + 1}/${maxRetries})`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Server failed to start");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function createVibesSandbox() {
  console.log("Creating E2B sandbox...");
  const sandbox = await Sandbox.create({
    envs: { MISTRAL_API_KEY },
    timeoutMs: 300_000,
  });
  console.log(`Sandbox created: ${sandbox.sandboxId}`);

  // Upload server files
  console.log("\nUploading server files...");
  await sandbox.files.write("/home/user/server.py", readLocal("packages/sandbox/server.py"));
  await sandbox.files.write("/home/user/requirements.txt", readLocal("packages/sandbox/requirements.txt"));
  console.log("Files uploaded.");

  // Install dependencies
  await run(sandbox, "pip", "pip install -r /home/user/requirements.txt", 120_000);

  // Smoke tests
  await run(sandbox, "python", "python3 --version");
  await run(sandbox, "import", "python3 -c 'from vibe.core.agent_loop import AgentLoop; print(\"AgentLoop OK\")'");
  await run(sandbox, "net", "curl -s -o /dev/null -w '%{http_code}' https://api.mistral.ai/v1/models");

  // Start uvicorn in background
  const serverCmd = await sandbox.commands.run(
    `cd /home/user && python3 -m uvicorn server:app --host 0.0.0.0 --port ${SERVER_PORT}`,
    { background: true }
  );
  console.log(`\nUvicorn started (pid=${serverCmd.pid}).`);

  // Get public URL and wait
  const host = sandbox.getHost(SERVER_PORT);
  const url = `https://${host}`;
  console.log(`Public URL: ${url}`);
  await waitForServer(url);

  return { sandbox, url };
}

async function main() {
  let sandbox: Sandbox | undefined;
  try {
    const result = await createVibesSandbox();
    sandbox = result.sandbox;
    const { url } = result;

    // Test message
    console.log('\nSending: "What is the capital of France?"');
    const resp = await fetch(`${url}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What is the capital of France?" }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!resp.ok) {
      console.error(`Request failed: ${resp.status} ${resp.statusText}`);
      console.error(await resp.text());
    } else {
      console.log("\nResponse:");
      console.log(JSON.stringify(await resp.json(), null, 2));
    }
  } finally {
    if (sandbox) {
      console.log(`\nKilling sandbox ${sandbox.sandboxId}...`);
      await sandbox.kill();
      console.log("Sandbox killed.");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
