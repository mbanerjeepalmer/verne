"""Anthropic-backed agent loop that mimics the Vibe AgentLoop event interface.

Drop-in replacement: yields AssistantEvent, ToolCallEvent, ToolResultEvent,
and ReasoningEvent so server.py can stay unchanged.
"""

import asyncio
import json
import os
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, AsyncGenerator

import anthropic


# ---------------------------------------------------------------------------
# Event types (same attributes server.py inspects)
# ---------------------------------------------------------------------------

@dataclass
class AssistantEvent:
    content: str


@dataclass
class ToolCallEvent:
    tool_name: str
    args: Any  # has .model_dump()


@dataclass
class ToolResultEvent:
    tool_name: str
    result: str | None = None
    error: str | None = None


@dataclass
class ReasoningEvent:
    content: str


class _ArgBag:
    """Minimal wrapper so server.py can call event.args.model_dump()."""

    def __init__(self, d: dict):
        self._d = d

    def model_dump(self) -> dict:
        return self._d


# ---------------------------------------------------------------------------
# Tool definitions (Anthropic format)
# ---------------------------------------------------------------------------

BASH_TOOL = {
    "name": "bash",
    "description": (
        "Execute a bash command in the sandbox. Use this for running CLI tools "
        "like podcast-search, podcast-get, episode-get, jq, etc."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "command": {
                "type": "string",
                "description": "The bash command to run",
            }
        },
        "required": ["command"],
    },
}

POST_EPISODE_TOOL = {
    "name": "post_episode",
    "description": (
        "Post a podcast episode to the user's feed as a playable card. "
        "Call this once per episode you want to recommend."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Episode title"},
            "src": {"type": "string", "description": "Audio URL"},
            "duration": {"type": "integer", "description": "Total duration in seconds"},
            "cover_image": {"type": "string", "description": "Cover art URL"},
            "start_time": {"type": "integer", "description": "Clip start in seconds", "default": 0},
            "end_time": {"type": "integer", "description": "Clip end in seconds"},
            "description": {"type": "string", "description": "Episode description"},
            "pub_date_ms": {"type": "integer", "description": "Publish date as Unix timestamp in ms"},
            "podcast_title": {"type": "string", "description": "Name of the podcast show"},
            "publisher": {"type": "string", "description": "Publisher name"},
            "link": {"type": "string", "description": "Web link to the episode"},
        },
        "required": ["name", "src", "duration", "cover_image", "end_time"],
    },
}

TOOLS = [BASH_TOOL, POST_EPISODE_TOOL]

# ---------------------------------------------------------------------------
# Tool execution
# ---------------------------------------------------------------------------


def _run_bash(command: str) -> str:
    """Run a bash command and return combined stdout+stderr."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60,
            env={**os.environ},
        )
        output = ""
        if result.stdout:
            output += result.stdout
        if result.stderr:
            output += ("\n" if output else "") + result.stderr
        if result.returncode != 0 and not output:
            output = f"Command exited with code {result.returncode}"
        return output or "(no output)"
    except subprocess.TimeoutExpired:
        return "Command timed out after 60 seconds"
    except Exception as e:
        return f"Error running command: {e}"


def _run_post_episode(args: dict) -> str:
    """Handle post_episode — just acknowledge (the event itself carries the data to the UI)."""
    name = args.get("name", "unknown")
    return f"Posted '{name[:40]}' to user"


TOOL_RUNNERS = {
    "bash": lambda args: _run_bash(args["command"]),
    "post_episode": _run_post_episode,
}

# ---------------------------------------------------------------------------
# Agent loop
# ---------------------------------------------------------------------------


class AgentLoop:
    """Anthropic-backed agent loop with tool-use support."""

    def __init__(self, system_prompt: str, model: str = "claude-sonnet-4-20250514"):
        self.client = anthropic.Anthropic()  # uses ANTHROPIC_API_KEY env var
        self.model = model
        self.system_prompt = system_prompt
        self.messages: list[dict] = []

    async def act(self, user_message: str) -> AsyncGenerator:
        """Send a message and yield events, handling tool calls in a loop."""
        self.messages.append({"role": "user", "content": user_message})

        while True:
            # Call Anthropic API (sync client, run in thread to not block)
            response = await asyncio.to_thread(
                self.client.messages.create,
                model=self.model,
                max_tokens=4096,
                system=self.system_prompt,
                tools=TOOLS,
                messages=self.messages,
            )

            # Collect assistant content blocks for conversation history
            assistant_content = []
            tool_uses = []

            for block in response.content:
                if block.type == "thinking":
                    yield ReasoningEvent(content=block.thinking)
                elif block.type == "text":
                    if block.text:
                        yield AssistantEvent(content=block.text)
                    assistant_content.append(block)
                elif block.type == "tool_use":
                    tool_uses.append(block)
                    assistant_content.append(block)

            # Add assistant message to history
            self.messages.append({"role": "assistant", "content": response.content})

            # If no tool calls, we're done
            if not tool_uses:
                break

            # Execute tools and yield events
            tool_results = []
            for tool_use in tool_uses:
                tool_name = tool_use.name
                tool_input = tool_use.input

                yield ToolCallEvent(
                    tool_name=tool_name,
                    args=_ArgBag(tool_input),
                )

                runner = TOOL_RUNNERS.get(tool_name)
                if runner:
                    try:
                        result = await asyncio.to_thread(runner, tool_input)
                        yield ToolResultEvent(tool_name=tool_name, result=result)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use.id,
                            "content": result,
                        })
                    except Exception as e:
                        error_msg = str(e)
                        yield ToolResultEvent(tool_name=tool_name, error=error_msg)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use.id,
                            "content": f"Error: {error_msg}",
                            "is_error": True,
                        })
                else:
                    error_msg = f"Unknown tool: {tool_name}"
                    yield ToolResultEvent(tool_name=tool_name, error=error_msg)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use.id,
                        "content": error_msg,
                        "is_error": True,
                    })

            # Add tool results to conversation
            self.messages.append({"role": "user", "content": tool_results})

            # Continue loop — model will respond to tool results
