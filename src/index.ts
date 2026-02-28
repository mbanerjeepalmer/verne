import "dotenv/config";
import { Sandbox, Template, defaultBuildLogger } from "e2b";
import { vibeTemplate } from "../packages/sandbox/template.js";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
if (!MISTRAL_API_KEY) {
  console.error("MISTRAL_API_KEY is required");
  process.exit(1);
}

const SERVER_PORT = 8000;

export async function createVibesSandbox() {
  // Build template (cached after first run)
  console.log("Building template...");
  const template = await Template.build(vibeTemplate, "vibe-agent", {
    onBuildLogs: defaultBuildLogger(),
  });

  // Create sandbox from template
  console.log("Creating sandbox...");
  const sandbox = await Sandbox.create("vibe-agent", {
    envs: { MISTRAL_API_KEY },
    timeoutMs: 300_000,
  });
  console.log(`Sandbox created: ${sandbox.sandboxId}`);

  // Write .env for the server's dotenv fallback (e2b envs may not reach start cmd)
  await sandbox.files.write(
    "/home/user/.env",
    `MISTRAL_API_KEY=${MISTRAL_API_KEY}\n`
  );

  const host = sandbox.getHost(SERVER_PORT);
  const url = `https://${host}`;
  console.log(`Public URL: ${url}`);

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
