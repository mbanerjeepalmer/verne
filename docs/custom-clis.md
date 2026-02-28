# Custom CLIs in Daytona Sandboxes

**Question:** How can we instantiate a Daytona sandbox preloaded with our tools and perhaps some other files (e.g. tools/skills directory)?

**Answer:** Two approaches, both verified working. See `test_custom_clis.py` for a runnable proof-of-concept.

---

## Approach 1: Runtime Injection

Create a default sandbox, then upload files and install tools post-boot.

```python
sandbox = daytona.create()

# Upload a CLI script to the home dir (relative paths resolve from ~)
sandbox.fs.upload_file(cli_script_bytes, "recommend")

# Move to PATH and make executable
sandbox.process.exec("chmod +x ~/recommend && sudo mv ~/recommend /usr/local/bin/recommend")

# Upload a tools directory
sandbox.fs.create_folder("tools", "755")
sandbox.fs.upload_file(tool_def_bytes, "tools/recommend.json")

# Use it
result = sandbox.process.exec("recommend sci-fi")
```

**Pros:** Fast sandbox boot, dynamic content, no image build step.
**Cons:** Setup overhead on every sandbox creation, files aren't cached.

**Gotcha:** `upload_file` paths are relative to `~/` (the sandbox home dir). Uploading directly to system paths like `/usr/local/bin` returns 400. Upload to home first, then `sudo mv`.

---

## Approach 2: Declarative Builder (Snapshot)

Bake tools into a custom image at build time using the SDK's `Image` builder.

```python
custom_image = (
    Image.debian_slim("3.12")
    .pip_install(["httpx", "pydantic"])
    .run_commands("mkdir -p /home/daytona/tools")
    .add_local_file("/tmp/recommend_cli.py", "/usr/local/bin/recommend")
    .add_local_file("/tmp/recommend.json", "/home/daytona/tools/recommend.json")
    .run_commands("chmod +x /usr/local/bin/recommend")
    .workdir("/home/daytona")
)

sandbox = daytona.create(
    CreateSandboxFromImageParams(image=custom_image),
    timeout=300,
    on_snapshot_create_logs=print,
)
```

**Pros:** Reproducible, cached for 24h, tools available instantly on boot.
**Cons:** First build takes ~30s. Local files must exist at build time.

For persistent reuse, save as a named snapshot:

```python
daytona.snapshot.create(
    CreateSnapshotParams(name="vibe-with-tools", image=custom_image),
    on_logs=print,
)
# Then create sandboxes from it instantly:
sandbox = daytona.create(CreateSandboxFromSnapshotParams(snapshot="vibe-with-tools"))
```

---

## Other Useful Methods

| Method | Purpose |
|--------|---------|
| `Image.add_local_dir(src, dst)` | Bake an entire directory into the image |
| `Image.from_dockerfile(path)` | Use an existing Dockerfile |
| `Image.pip_install_from_requirements(path)` | Install from requirements.txt |
| `Image.run_commands(*cmds)` | Run arbitrary shell commands in the image |
| `Image.env({"KEY": "VAL"})` | Set environment variables |
| `sandbox.fs.upload_file(bytes, path)` | Upload bytes to sandbox (relative to ~) |
| `sandbox.fs.upload_file(local_path, path)` | Stream a local file to sandbox |
| `sandbox.fs.create_folder(path, mode)` | Create a directory |
| `sandbox.process.exec(cmd)` | Run a shell command |
| `sandbox.git.clone(url, path)` | Clone a repo into the sandbox |

---

## Recommendation for Vibe

Use **Approach 2** (Declarative Builder) to create a `vibe-with-tools` snapshot that includes:
- Mistral Vibe and its Python dependencies
- Custom CLI tools in `/usr/local/bin/`
- Tool/skill definitions in `/home/daytona/tools/`
- Any config files the agent needs

Then spin up sandboxes from that snapshot — they'll boot instantly with everything pre-installed.
