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


class PostEpisodeResult(BaseModel):
    success: bool


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
        yield PostEpisodeResult(success=True)
