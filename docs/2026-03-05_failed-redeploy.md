Fix the Verne podcast agent — tool-calling queries
  hang in prod. There's an in-progress diff on the
  redeploy branch (3 files changed, not committed).
  Review git diff first.

  What's been diagnosed

  The Mistral Vibe SDK's AgentLoop.act() blocks the
  Python event loop when processing tool-calling
  queries (like "find me a podcast about Kafka").
  Simple queries work fine. The SDK silently retries
  on API errors with no timeout, blocking the async
  event loop — asyncio.timeout cannot interrupt it.
  This is a known Vibe SDK bug: https://github.com/mi
  stralai/mistral-vibe/issues/415

  Evidence from Langfuse: failed traces show 0 LLM
  calls, 0 tokens, latency = timeout ceiling.
  Successful traces (March 4) show 6+ LLM calls with
  ~8.5K input tokens each.

  What's already been changed (uncommitted)

  - packages/sandbox/server.py: SimpleSpanProcessor →
   BatchSpanProcessor, timeout 180→120s
  - backend/sandbox.ts: backend timeout 180→140s,
  template build cached via promise, template name
  bumped to vibe-agent-v2
  - packages/sandbox/template.ts: added forceUpload:
  true to .copy("server.py", ...)

  What still needs to be fixed

  The core problem: agent.act() blocks the event loop
   for tool-calling queries, and no async timeout can
   interrupt it. Approaches tried and failed:
  - asyncio.timeout / asyncio.wait_for — can't
  interrupt blocked event loop
  - Threading with asyncio.Queue — breaks because
  AgentLoop is tied to its creating event loop
  ("Event loop is closed" error on 2nd request)

  Possible approaches not yet tried:
  1. Upgrade mistral-vibe — check if latest version
  (2.3.0?) fixes the blocking/retry issue
  2. Run uvicorn with --workers 2 so a blocked worker
   doesn't prevent timeout responses from being
  served
  3. Use multiprocessing.Process per request with a
  hard kill timeout (loses session state but actually
   works)
  4. Patch the Vibe SDK's retry behavior at import
  time (monkey-patch the sync HTTP calls to add
  timeouts)

  Key files: packages/sandbox/server.py,
  backend/sandbox.ts, packages/sandbox/template.ts

  To test: make run-backend (frontend already
  running). Simple queries like "What is the capital
  of France?" work. Podcast queries like "Find me a
  podcast about Kafka" hang.
