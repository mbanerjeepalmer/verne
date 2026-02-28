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

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

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
    sid = session_id or str(uuid.uuid4())
    config = VibeConfig(auto_approve=True, system_prompt_id="podcast-agent")
    agent = AgentLoop(config=config)
    sessions[sid] = agent
    return sid, agent


# TODO: SSE streaming endpoint that yields events as they arrive
@app.post("/message", response_model=MessageResponse)
async def message(req: MessageRequest):
    """Send a message to the agent and collect all response events."""
    try:
        sid, agent = _get_or_create_session(req.session_id)

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
            # Skip ReasoningEvent, CompactStartEvent, etc. — internal details

        return MessageResponse(session_id=sid, events=events)
    except Exception:
        logging.exception("Error in /message")
        return JSONResponse(status_code=500, content={"error": traceback.format_exc()})


@app.get("/health")
async def health():
    return {"status": "ok"}
