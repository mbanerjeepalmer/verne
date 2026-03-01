"""FastAPI server wrapping Mistral Vibe's AgentLoop.

Runs inside a sandbox (E2B / local). Exposes POST /message to drive the agent
and GET /health for liveness checks.
"""

import os
import uuid
from pathlib import Path

from dotenv import load_dotenv


def _load_env():
    """Load .env from server dir (sandbox) or project root (local dev)."""
    for candidate in [
        Path(__file__).resolve().parent / ".env",           # sandbox: /home/user/.env
        Path(__file__).resolve().parent.parent.parent / ".env",  # local dev: project root
    ]:
        if candidate.exists():
            load_dotenv(candidate, override=True)
            return


import logging
import traceback

logging.basicConfig(level=logging.INFO)

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


# Lazy OTEL initialization — env vars are injected by E2B after the template
# snapshot is taken, so module-level checks would always miss them.
_otel_initialized = False


def _init_otel():
    """Configure OpenTelemetry instrumentation for Mistral → Langfuse (once)."""
    global _otel_initialized
    if _otel_initialized:
        return
    _otel_initialized = True

    endpoint = os.environ.get("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", "")
    if not endpoint:
        logging.info("OTEL not configured, skipping instrumentation")
        return

    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import SimpleSpanProcessor
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
    from opentelemetry.instrumentation.mistralai import MistralAiInstrumentor

    # Parse headers from env (format: "key=value,key2=value2")
    raw_headers = os.environ.get("OTEL_EXPORTER_OTLP_TRACES_HEADERS", "")
    headers = {}
    for pair in raw_headers.split(","):
        if "=" in pair:
            k, v = pair.split("=", 1)
            headers[k.strip()] = v.strip()

    logging.info(f"OTEL endpoint: {endpoint}")
    logging.info(f"OTEL headers configured: {list(headers.keys())}")

    from opentelemetry.processor.baggage import BaggageSpanProcessor, ALLOW_ALL_BAGGAGE_KEYS

    exporter = OTLPSpanExporter(endpoint=endpoint, headers=headers)
    provider = TracerProvider()
    provider.add_span_processor(BaggageSpanProcessor(ALLOW_ALL_BAGGAGE_KEYS))
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    trace.set_tracer_provider(provider)
    MistralAiInstrumentor().instrument()
    logging.info("MistralAI OpenTelemetry instrumentation enabled")

# Unlock config paths before importing AgentLoop (required by vibe SDK)
from vibe.core.paths.config_paths import unlock_config_paths

unlock_config_paths()

from vibe.core.agent_loop import AgentLoop  # noqa: E402
from vibe.core.config import VibeConfig  # noqa: E402

app = FastAPI(title="Vibe Agent Server")

# Session store: session_id → AgentLoop instance
sessions: dict[str, AgentLoop] = {}


class MessageRequest(BaseModel):
    message: str
    session_id: str | None = Field(default=None, description="Reuse an existing session")


class EventOut(BaseModel):
    type: str
    content: str | None = None
    tool_name: str | None = None
    args: dict | None = None
    result: str | None = None
    error: str | None = None


class MessageResponse(BaseModel):
    session_id: str
    events: list[EventOut]


def _get_or_create_session(session_id: str | None) -> tuple[str, AgentLoop]:
    """Return an existing session or create a new one."""
    if session_id and session_id in sessions:
        return session_id, sessions[session_id]

    _load_env()  # reload .env (may have been written after server start)
    _init_otel()  # configure tracing before creating Mistral client
    sid = session_id or str(uuid.uuid4())
    config = VibeConfig(auto_approve=True, system_prompt_id="podcast-agent")
    agent = AgentLoop(config=config)
    sessions[sid] = agent
    return sid, agent


@app.post("/message", response_model=MessageResponse)
async def message(req: MessageRequest):
    """Send a message to the agent and collect all response events."""
    try:
        sid, agent = _get_or_create_session(req.session_id)

        from opentelemetry import baggage, context
        ctx = baggage.set_baggage("session.id", sid)
        token = context.attach(ctx)

        events: list[EventOut] = []
        async for event in agent.act(req.message):
            etype = type(event).__name__

            if etype == "AssistantEvent":
                events.append(EventOut(type="assistant", content=event.content))
            elif etype == "ToolCallEvent":
                args_dict = event.args.model_dump() if event.args else None
                events.append(
                    EventOut(type="tool_call", tool_name=event.tool_name, args=args_dict)
                )
            elif etype == "ToolResultEvent":
                result_text = str(event.result) if event.result else None
                events.append(
                    EventOut(
                        type="tool_result",
                        tool_name=event.tool_name,
                        result=result_text,
                        error=event.error,
                    )
                )
            elif etype == "ReasoningEvent":
                events.append(EventOut(type="reasoning", content=event.content))

        context.detach(token)
        return MessageResponse(session_id=sid, events=events)
    except Exception:
        logging.exception("Error in /message")
        return JSONResponse(status_code=500, content={"error": traceback.format_exc()})


@app.post("/message/stream")
async def message_stream(req: MessageRequest):
    """Stream agent events as newline-delimited JSON (NDJSON)."""
    from fastapi.responses import StreamingResponse
    import json as _json

    try:
        sid, agent = _get_or_create_session(req.session_id)
    except Exception:
        logging.exception("Error creating session for /message/stream")
        return JSONResponse(status_code=500, content={"error": traceback.format_exc()})

    async def generate():
        from opentelemetry import baggage, context
        ctx = baggage.set_baggage("session.id", sid)
        token = context.attach(ctx)

        yield _json.dumps({"type": "session", "session_id": sid}) + "\n"
        try:
            async for event in agent.act(req.message):
                etype = type(event).__name__

                if etype == "AssistantEvent":
                    yield _json.dumps({"type": "assistant", "content": event.content}) + "\n"
                elif etype == "ToolCallEvent":
                    args_dict = event.args.model_dump() if event.args else None
                    yield _json.dumps({"type": "tool_call", "tool_name": event.tool_name, "args": args_dict}) + "\n"
                elif etype == "ToolResultEvent":
                    result_text = str(event.result) if event.result else None
                    yield _json.dumps({"type": "tool_result", "tool_name": event.tool_name, "result": result_text, "error": event.error}) + "\n"
                elif etype == "ReasoningEvent":
                    yield _json.dumps({"type": "reasoning", "content": event.content}) + "\n"
        except Exception:
            logging.exception("Error streaming agent events")
            yield _json.dumps({"type": "error", "content": traceback.format_exc()}) + "\n"
        finally:
            context.detach(token)
        yield _json.dumps({"type": "done"}) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")


@app.get("/health")
async def health():
    return {"status": "ok"}
