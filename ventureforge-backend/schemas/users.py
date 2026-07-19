"""Schemas for the public user profile page (/users/:username)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

__all__ = [
    "UserStats",
    "ProfileIdea",
    "ActivityItem",
    "UserProfileResponse",
    "UserUpdate",
]


class UserStats(BaseModel):
    ideas_published: int = 0
    upvotes_received: int = 0
    forks_received: int = 0


class ProfileIdea(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    one_liner: str | None = None
    domain: str | None = None
    upvotes: int = 0
    comment_count: int = 0


class ActivityItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # idea_posted | comment | idea_forked
    type: str
    timestamp: datetime
    idea_id: UUID | None = None
    idea_title: str | None = None
    content: str | None = None


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str
    name: str | None = None
    bio: str | None = None
    picture: str | None = None
    created_at: datetime
    stats: UserStats
    top_ideas: list[ProfileIdea] = []
    activity: list[ActivityItem] = []


class UserUpdate(BaseModel):
    bio: str | None = Field(default=None, max_length=500)
    username: str | None = Field(default=None, max_length=30)
