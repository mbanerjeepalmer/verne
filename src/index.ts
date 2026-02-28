import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Sandbox, Template, defaultBuildLogger } from "e2b";
import { vibeTemplate } from "../packages/sandbox/template.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = resolve(__dirname, "../listennotes-cli/podcast_search.py");

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
if (!MISTRAL_API_KEY) {
  console.error("MISTRAL_API_KEY is required");
  process.exit(1);
}

const LISTENNOTES_API_KEY = process.env.LISTENNOTES_API_KEY ?? "";

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
    envs: { MISTRAL_API_KEY, LISTENNOTES_API_KEY },
    timeoutMs: 300_000,
  });
  console.log(`Sandbox created: ${sandbox.sandboxId}`);

  // Write .env for the server's dotenv fallback (e2b envs may not reach start cmd)
  await sandbox.files.write(
    "/home/user/.env",
    `MISTRAL_API_KEY=${MISTRAL_API_KEY}\nLISTENNOTES_API_KEY=${LISTENNOTES_API_KEY}\n`
  );

  // Inject ListenNotes CLI into the sandbox
  const cliSource = readFileSync(CLI_PATH, "utf-8");
  await sandbox.files.write("/usr/local/bin/podcast-search", cliSource);
  await sandbox.commands.run("chmod +x /usr/local/bin/podcast-search");

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

    // Test: use ListenNotes CLI with real API key
    const testMessage =
      'Use the podcast-search CLI to search for "kafka" podcasts with --output summary. The LISTENNOTES_API_KEY env var is already set. Run: podcast-search "kafka" --output summary';
    console.log(`\nSending: "${testMessage}"`);
    const resp = await fetch(`${url}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: testMessage }),
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
