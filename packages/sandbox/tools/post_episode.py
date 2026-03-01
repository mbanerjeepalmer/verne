from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import ClassVar

from pydantic import BaseModel, Field

from vibe.core.tools.base import (
    BaseTool,
    BaseToolConfig,
    BaseToolState,
    InvokeContext,
    ToolPermission,
)
from vibe.core.types import ToolStreamEvent


class PostEpisodeArgs(BaseModel):
    name: str = Field(description="Episode title")
    src: str = Field(description="Audio URL")
    duration: int = Field(description="Total duration in seconds")
    cover_image: str = Field(description="Cover art URL")
    start_time: int = Field(default=0, description="Clip start in seconds")
    end_time: int = Field(description="Clip end in seconds")
    description: str | None = Field(default=None, description="Episode description")
    pub_date_ms: int | None = Field(default=None, description="Publish date as Unix timestamp in milliseconds")
    podcast_title: str | None = Field(default=None, description="Name of the podcast show")
    publisher: str | None = Field(default=None, description="Publisher name")
    link: str | None = Field(default=None, description="Web link to the episode")


class PostEpisodeResult(BaseModel):
    message: str


class PostEpisodeConfig(BaseToolConfig):
    permission: ToolPermission = ToolPermission.ALWAYS


class PostEpisode(
    BaseTool[PostEpisodeArgs, PostEpisodeResult, PostEpisodeConfig, BaseToolState],
):
    description: ClassVar[str] = (
        "Post a podcast episode to the user's feed as a playable card. "
        "Call this once per episode you want to recommend."
    )

    async def run(
        self, args: PostEpisodeArgs, ctx: InvokeContext | None = None
    ) -> AsyncGenerator[ToolStreamEvent | PostEpisodeResult, None]:
        yield PostEpisodeResult(message=f"Posted '{args.name[:20]}…' to user")
