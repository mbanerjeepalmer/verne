# Mistral Prompt


## What we're building

A media recommendation app. The backend agent is Mistral Vibe running in a
Docker sandbox. Vibe has bash, file I/O, can install packages and write
scripts. We give it a custom system prompt that says "you're a media
discovery agent" and point it at a workspace with starter search tools.

## Phase 1: Figure out how to drive Vibe headlessly

Two questions. Three options. Try in order, use whichever works first.

**Q1: How do we start Vibe?**

| Option | What | How to test |
|--------|------|-------------|
| A. `vibe-acp` subprocess | Shipped binary, JSON-RPC over stdio | `pip install mistral-vibe && which vibe-acp` |
| B. Import `AgentLoop` | Python class in `vibe.core.agent_loop` | `python -c "from vibe.core.agent_loop import AgentLoop"` |
| C. `vibe --prompt` CLI | One-shot per turn | `vibe --help` |

**Q2: How do we talk to it?**

Follows from Q1. A → JSON-RPC stdin/stdout. B → Python async generator. C → parse stdout + read files.

In all cases, Vibe handles tool execution internally. We don't implement bash/file tools.

**Discovery procedure (run before writing any app code):**

```bash
pip install mistral-vibe

# --- Option A ---
which vibe-acp
python -c "import inspect; from vibe.acp import acp_agent; print(inspect.getsource(acp_agent))" 2>/dev/null | head -200
python -c "import inspect; from vibe.acp import entrypoint; print(inspect.getsource(entrypoint))" 2>/dev/null | head -200
# Spawn vibe-acp, send initialize + session/create + session/message over stdin, read stdout.

# --- Option B (if A is too complex) ---
python -c "import inspect; from vibe.core.agent_loop import AgentLoop; print(inspect.signature(AgentLoop.__init__))"
# Read how ACP instantiates it — that's the reference implementation.

# --- Option C (if B fails) ---
vibe --help
vibe --prompt "say hello" --auto-approve 2>&1 | head -50
```

Write findings to DISCOVERY.md (method names, constructor args, event schemas). Then proceed.

## Phase 2: Sandbox server

`packages/sandbox/server.py` — FastAPI WebSocket server using whichever approach worked.

- `/ws/{session_id}` — receives `{"type":"text","content":"..."}`, streams back NDJSON events
- After each turn, check `/workspace/output/results.json`, emit `structured_output` if present
- `/health` endpoint
- Dockerfile, agent config, system prompt, starter tools (all in spec.md)
- Test standalone with wscat before building anything else.

## Phase 3: Backend

`packages/backend/` — Node.js Express + ws. Relays WebSocket between frontend and sandbox. Single sandbox for now, no auth.

## Phase 4: Frontend

`packages/frontend/` — Next.js. Chat bubbles, RecommendationCard, AgentActivity panel, text input. No voice yet.

## Phase 5: Wire up

docker-compose.yml. `.env` with `MISTRAL_API_KEY`. End-to-end test.

## Principles

- Don't mock Vibe. Get the real agent running.
- Don't skip Phase 1.
- Text first. Voice later.
- Model: `devstral-small-2501`. Auto-approve all tools.
