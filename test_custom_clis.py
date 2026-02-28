"""
Proof-of-concept: Preloading a Daytona sandbox with custom CLIs and files.

Two approaches demonstrated:
  1. Runtime injection — create sandbox, upload files, install tools via exec
  2. Declarative Builder — bake everything into a snapshot at image build time
"""

import os
from dotenv import load_dotenv

load_dotenv()

from daytona import (
    Daytona,
    DaytonaConfig,
    CreateSandboxFromSnapshotParams,
    CreateSandboxFromImageParams,
    Image,
)

daytona = Daytona(DaytonaConfig(api_key=os.environ["DAYTONA_API_KEY"]))

CLI_SCRIPT = (
    '#!/usr/bin/env python3\n'
    'import sys, json\n'
    '\n'
    'def main():\n'
    '    if len(sys.argv) < 2:\n'
    '        print(json.dumps({"error": "Usage: recommend <genre>"}))\n'
    '        sys.exit(1)\n'
    '    genre = sys.argv[1]\n'
    '    recommendations = {\n'
    '        "sci-fi": ["Dune", "Neuromancer", "Foundation"],\n'
    '        "fantasy": ["Name of the Wind", "Mistborn", "Earthsea"],\n'
    '    }\n'
    '    result = recommendations.get(genre, [f"No recs for {genre}"])\n'
    '    print(json.dumps({"genre": genre, "recommendations": result}))\n'
    '\n'
    'if __name__ == "__main__":\n'
    '    main()\n'
)

TOOL_DEF = '{"name": "recommend", "description": "Get media recommendations by genre", "usage": "recommend <genre>"}'

# ---------------------------------------------------------------------------
# Approach 1: Runtime injection
# Create a default sandbox, then upload custom CLI scripts + files after boot.
# ---------------------------------------------------------------------------

print("=== Approach 1: Runtime injection ===")
sandbox = daytona.create()
print(f"Sandbox created: {sandbox.id}")

try:
    # Upload CLI to home dir, then move to /usr/local/bin via exec
    sandbox.fs.upload_file(CLI_SCRIPT.encode(), "recommend")
    sandbox.process.exec("chmod +x ~/recommend && sudo mv ~/recommend /usr/local/bin/recommend")

    # Upload a tools directory
    sandbox.fs.create_folder("tools", "755")
    sandbox.fs.upload_file(TOOL_DEF.encode(), "tools/recommend.json")

    # Test the custom CLI
    result = sandbox.process.exec("recommend sci-fi")
    print(f"CLI output: {result.result}")

    # Test that tools directory is there
    result2 = sandbox.process.exec("ls -la ~/tools/")
    print(f"Tools dir:\n{result2.result}")
finally:
    sandbox.delete()
    print("Sandbox deleted.\n")


# ---------------------------------------------------------------------------
# Approach 2: Declarative Builder — bake tools into the image
# ---------------------------------------------------------------------------

print("=== Approach 2: Declarative Builder ===")

# Write the CLI script locally so we can bake it into the image
LOCAL_CLI_PATH = "/tmp/daytona_recommend_cli.py"
with open(LOCAL_CLI_PATH, "w") as f:
    f.write(CLI_SCRIPT)

LOCAL_TOOL_DEF = "/tmp/daytona_recommend_tool.json"
with open(LOCAL_TOOL_DEF, "w") as f:
    f.write(TOOL_DEF)

# Build a custom image with tools baked in
custom_image = (
    Image.debian_slim("3.12")
    .pip_install(["httpx", "pydantic"])
    .run_commands("mkdir -p /home/daytona/tools")
    .add_local_file(LOCAL_CLI_PATH, "/usr/local/bin/recommend")
    .add_local_file(LOCAL_TOOL_DEF, "/home/daytona/tools/recommend.json")
    .run_commands("chmod +x /usr/local/bin/recommend")
    .workdir("/home/daytona")
)

print("Creating sandbox from declarative image (this may take a minute)...")
sandbox2 = daytona.create(
    CreateSandboxFromImageParams(image=custom_image),
    timeout=300,
    on_snapshot_create_logs=lambda chunk: print(f"  [build] {chunk}", end=""),
)
print(f"\nSandbox created: {sandbox2.id}")

try:
    result3 = sandbox2.process.exec("recommend fantasy")
    print(f"CLI output: {result3.result}")

    result4 = sandbox2.process.exec("cat /home/daytona/tools/recommend.json")
    print(f"Tool def: {result4.result}")

    result5 = sandbox2.process.exec("python3 -c 'import httpx; print(httpx.__version__)'")
    print(f"httpx version: {result5.result}")
finally:
    sandbox2.delete()
    print("Sandbox deleted.\n")

print("=== Done ===")
