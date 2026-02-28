/**
 * Daytona sandbox orchestrator for the Vibe agent server.
 *
 * Creates a sandbox, uploads the FastAPI server, installs deps,
 * starts uvicorn, and verifies the agent responds.
 */

import "dotenv/config";
import { Daytona, Sandbox } from "@daytonaio/sdk";
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
// Sandbox helpers — every command gets full stdout/stderr visibility
// ---------------------------------------------------------------------------

async function run(sandbox: Sandbox, label: string, command: string): Promise<string> {
  console.log(`\n> [${label}] ${command}`);
  const session = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await sandbox.process.createSession(session);
  const result = await sandbox.process.executeSessionCommand(session, { command });
  const out = result.stdout || result.output || "";
  if (out.trim()) console.log(out.trimEnd());
  if (result.stderr?.trim()) console.log(`[stderr] ${result.stderr.trimEnd()}`);
  if (result.exitCode !== 0) {
    throw new Error(`[${label}] exited with code ${result.exitCode}`);
  }
  return out;
}

async function runAsync(
  sandbox: Sandbox,
  label: string,
  command: string,
  { pollMs = 3000, maxPolls = 60 } = {}
): Promise<string> {
  console.log(`\n> [${label}] ${command}  (async)`);
  const session = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await sandbox.process.createSession(session);
  const { cmdId } = await sandbox.process.executeSessionCommand(session, { command, runAsync: true });
  let lastLen = 0;
  for (let i = 0; i < maxPolls; i++) {
    await new Promise((r) => setTimeout(r, pollMs));
    const cmd = await sandbox.process.getSessionCommand(session, cmdId!);
    const logs = await sandbox.process.getSessionCommandLogs(session, cmdId!);
    const combined = logs.stdout || "";
    if (combined.length > lastLen) {
      process.stdout.write(combined.slice(lastLen));
      lastLen = combined.length;
    }
    if (cmd.exitCode !== undefined && cmd.exitCode !== null) {
      if (logs.stderr?.trim()) console.log(`[stderr] ${logs.stderr.trimEnd()}`);
      if (cmd.exitCode !== 0) throw new Error(`[${label}] exited with code ${cmd.exitCode}`);
      return combined;
    }
  }
  throw new Error(`[${label}] timed out after ${maxPolls * pollMs / 1000}s`);
}

async function getLogs(sandbox: Sandbox, sessionId: string, cmdId: string) {
  const logs = await sandbox.process.getSessionCommandLogs(sessionId, cmdId);
  return { stdout: logs.stdout || "", stderr: logs.stderr || "" };
}

function readLocal(relativePath: string): Buffer {
  return readFileSync(resolve(__dirname, "..", relativePath));
}

async function waitForServer(url: string, token: string, maxRetries = 30, delayMs = 2000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const resp = await fetch(`${url}/health`, { headers: { "x-daytona-preview-token": token } });
      if (resp.ok) { console.log("Health check passed."); return; }
    } catch { /* not ready */ }
    console.log(`Waiting for server... (${i + 1}/${maxRetries})`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Server failed to start");
}

async function cleanup(sandbox: Sandbox) {
  console.log(`\nDeleting sandbox ${sandbox.id}...`);
  try { await sandbox.delete(); console.log("Sandbox deleted."); }
  catch (e) { console.error("Failed to delete sandbox:", e); }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const daytona = new Daytona();
  let sandbox: Sandbox | undefined;

  try {
    // 1. Create sandbox
    console.log("Creating Daytona sandbox...");
    sandbox = await daytona.create({
      language: "python",
      envVars: { MISTRAL_API_KEY },
      networkBlockAll: false,
    });
    console.log(`Sandbox created: ${sandbox.id}  (networkBlockAll=${sandbox.networkBlockAll})`);

    // 2. Upload server files
    console.log("\nUploading server files...");
    await sandbox.fs.uploadFile(readLocal("packages/sandbox/server.py"), "/home/daytona/server.py");
    await sandbox.fs.uploadFile(readLocal("packages/sandbox/requirements.txt"), "/home/daytona/requirements.txt");
    console.log("Files uploaded.");

    // 3. Install dependencies
    await runAsync(sandbox, "pip", "pip install -r /home/daytona/requirements.txt");

    // 4. Smoke tests
    await run(sandbox, "python", "python --version");
    await run(sandbox, "import", "python -c 'from vibe.core.agent_loop import AgentLoop; print(\"AgentLoop OK\")'");
    await run(sandbox, "env", "echo MISTRAL_API_KEY=${MISTRAL_API_KEY:0:8}...");
    await run(sandbox, "net-http", "curl -sv http://api.mistral.ai/ 2>&1 | head -20");
    await run(sandbox, "net-https", "curl -sv https://api.mistral.ai/ 2>&1 | head -30");

    // 5. Start uvicorn
    const uvicornSession = "uvicorn";
    await sandbox.process.createSession(uvicornSession);
    const { cmdId: uvicornCmdId } = await sandbox.process.executeSessionCommand(uvicornSession, {
      command: `cd /home/daytona && uvicorn server:app --host 0.0.0.0 --port ${SERVER_PORT} 2>&1`,
      runAsync: true,
    });
    console.log(`\nUvicorn started (cmd=${uvicornCmdId}).`);

    // 6. Wait for server
    const preview = await sandbox.getPreviewLink(SERVER_PORT);
    console.log(`Public URL: ${preview.url}`);
    await waitForServer(preview.url, preview.token);

    // 7. Test message
    console.log('\nSending: "What is the capital of France?"');
    const resp = await fetch(`${preview.url}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-daytona-preview-token": preview.token },
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

    // Always dump uvicorn logs
    console.log("\n--- Uvicorn logs ---");
    const logs = await getLogs(sandbox, uvicornSession, uvicornCmdId!);
    if (logs.stdout) console.log(logs.stdout.trimEnd());
    if (logs.stderr) console.log(`[stderr] ${logs.stderr.trimEnd()}`);

  } finally {
    if (sandbox) await cleanup(sandbox);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
