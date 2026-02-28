/**
 * Proof-of-concept: Preloading a Daytona sandbox with custom CLIs and files.
 *
 * Two approaches demonstrated:
 *   1. Runtime injection — create sandbox, upload files, install tools via exec
 *   2. Declarative Builder — bake everything into a snapshot at image build time
 */

import { Daytona, Image } from "@daytonaio/sdk";
import type { CreateSandboxFromImageParams } from "@daytonaio/sdk";
import { writeFileSync } from "fs";

const CLI_SCRIPT = `#!/usr/bin/env python3
import sys, json

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: recommend <genre>"}))
        sys.exit(1)
    genre = sys.argv[1]
    recommendations = {
        "sci-fi": ["Dune", "Neuromancer", "Foundation"],
        "fantasy": ["Name of the Wind", "Mistborn", "Earthsea"],
    }
    result = recommendations.get(genre, [f"No recs for {genre}"])
    print(json.dumps({"genre": genre, "recommendations": result}))

if __name__ == "__main__":
    main()
`;

const TOOL_DEF = JSON.stringify({
  name: "recommend",
  description: "Get media recommendations by genre",
  usage: "recommend <genre>",
});

// ---------------------------------------------------------------------------
// Approach 1: Runtime injection
// ---------------------------------------------------------------------------

async function approach1(daytona: Daytona) {
  console.log("=== Approach 1: Runtime injection ===");
  const sandbox = await daytona.create();
  console.log(`Sandbox created: ${sandbox.id}`);

  try {
    // Upload CLI to home dir, then move to /usr/local/bin via exec
    await sandbox.fs.uploadFile(Buffer.from(CLI_SCRIPT), "recommend");
    await sandbox.process.executeCommand(
      "chmod +x ~/recommend && sudo mv ~/recommend /usr/local/bin/recommend"
    );

    // Upload a tools directory
    await sandbox.fs.createFolder("tools", "755");
    await sandbox.fs.uploadFile(Buffer.from(TOOL_DEF), "tools/recommend.json");

    // Test the custom CLI
    const result = await sandbox.process.executeCommand("recommend sci-fi");
    console.log(`CLI output: ${result.result}`);

    // Test that tools directory is there
    const result2 = await sandbox.process.executeCommand("ls -la ~/tools/");
    console.log(`Tools dir:\n${result2.result}`);
  } finally {
    await sandbox.delete();
    console.log("Sandbox deleted.\n");
  }
}

// ---------------------------------------------------------------------------
// Approach 2: Declarative Builder
// ---------------------------------------------------------------------------

async function approach2(daytona: Daytona) {
  console.log("=== Approach 2: Declarative Builder ===");

  // Write CLI script and tool def locally so we can bake them into the image
  const localCliPath = "/tmp/daytona_recommend_cli.py";
  const localToolDef = "/tmp/daytona_recommend_tool.json";
  writeFileSync(localCliPath, CLI_SCRIPT);
  writeFileSync(localToolDef, TOOL_DEF);

  const customImage = Image.debianSlim("3.12")
    .pipInstall(["httpx", "pydantic"])
    .runCommands("mkdir -p /home/daytona/tools")
    .addLocalFile(localCliPath, "/usr/local/bin/recommend")
    .addLocalFile(localToolDef, "/home/daytona/tools/recommend.json")
    .runCommands("chmod +x /usr/local/bin/recommend")
    .workdir("/home/daytona");

  console.log(
    "Creating sandbox from declarative image (this may take a minute)..."
  );
  const sandbox = await daytona.create(
    { image: customImage } satisfies CreateSandboxFromImageParams,
    { timeout: 300, onSnapshotCreateLogs: (chunk) => process.stdout.write(`  [build] ${chunk}`) }
  );
  console.log(`\nSandbox created: ${sandbox.id}`);

  try {
    const result = await sandbox.process.executeCommand("recommend fantasy");
    console.log(`CLI output: ${result.result}`);

    const result2 = await sandbox.process.executeCommand(
      "cat /home/daytona/tools/recommend.json"
    );
    console.log(`Tool def: ${result2.result}`);

    const result3 = await sandbox.process.executeCommand(
      "python3 -c 'import httpx; print(httpx.__version__)'"
    );
    console.log(`httpx version: ${result3.result}`);
  } finally {
    await sandbox.delete();
    console.log("Sandbox deleted.\n");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const daytona = new Daytona();
  await approach1(daytona);
  await approach2(daytona);
  console.log("=== Done ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
