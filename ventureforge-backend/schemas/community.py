"""Pydantic request/response schemas for the public idea board.

These sit on top of the raw-psycopg row records in core.models. Response
models set `from_attributes=True` so they can be built either from a dataclass
record (model_validate(record)) or from a psycopg dict row (model_validate(row)).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from core.models import ReactionType

__all__ = [
    "OwnerInfo",
    "ReactionCounts",
    "IdeaCreate",
    "IdeaResponse",
    "ForkSummary",
    "PublishFromRunRequest",
    "CommentCreate",
    "CommentResponse",
    "ReactionCreate",
    "ReactionResponse",
    "InterestCreate",
    "InterestResponse",
]


# --- Shared nested pieces ------------------------------------------------


class OwnerInfo(BaseModel):
    """Public-facing identity shown alongside ideas/comments. Deliberately
    excludes email so a public board doesn't leak contact addresses.
    `username` is the handle used to link to /users/:username."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str | None = None
    name: str | None = None
    picture: str | None = None


class ReactionCounts(BaseModel):
    """Aggregated reaction tallies for an idea, one field per reaction type."""

    upvote: int = 0
    would_use: int = 0
    have_this_problem: int = 0

    @classmethod
    def from_rows(cls, rows: list[dict[str, Any]]) -> "ReactionCounts":
        """Build from aggregate rows shaped like {"type": <ReactionType>,
        "count": <int>}, e.g. the result of GROUP BY type."""
        counts = cls()
        for row in rows:
            key = row.get("type")
            key = key.value if isinstance(key, ReactionType) else str(key)
            if hasattr(counts, key):
                setattr(counts, key, int(row.get("count", 0)))
        return counts


# --- Idea ----------------------------------------------------------------


class IdeaCreate(BaseModel):
    """Fields a client supplies when posting a new idea. `owner_id` comes from
    the authenticated session, and the AI fields are filled server-side, so
    none of those appear here."""

    title: str = Field(min_length=1, max_length=200)
    one_liner: str | None = Field(default=None, max_length=280)
    description: str | None = Field(default=None, max_length=10_000)
    domain: str | None = Field(default=None, max_length=100)
    is_public: bool = True


class PublishFromRunRequest(BaseModel):
    """Publish a completed generation run to the community board. The idea's
    fields are derived from the agent output; `title`/`domain` may override
    the derived values."""

    thread_id: str
    is_public: bool = True
    title: str | None = Field(default=None, max_length=200)
    domain: str | None = Field(default=None, max_length=100)


class IdeaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    one_liner: str | None = None
    description: str | None = None
    domain: str | None = None
    owner: OwnerInfo
    created_at: datetime
    is_public: bool
    ai_validation_score: float | None = None
    ai_summary_json: dict[str, Any] | None = None
    reaction_counts: ReactionCounts = Field(default_factory=ReactionCounts)
    comment_count: int = 0
    interest_count: int = 0
    forked_from_id: UUID | None = None
    fork_count: int = 0


class ForkSummary(BaseModel):
    """Compact row for the 'Forked by X people' list on an idea's detail page."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    owner: OwnerInfo
    created_at: datetime


# --- Comment -------------------------------------------------------------


class CommentCreate(BaseModel):
    """`idea_id` comes from the route path and `user_id` from the session, so
    the client only sends the body and an optional parent for threading."""

    content: str = Field(min_length=1, max_length=5_000)
    parent_comment_id: UUID | None = None


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    idea_id: UUID
    author: OwnerInfo
    content: str
    created_at: datetime
    parent_comment_id: UUID | None = None
    # Populated when building a threaded tree; empty for a flat list.
    replies: list["CommentResponse"] = Field(default_factory=list)


# --- Reaction ------------------------------------------------------------


class ReactionCreate(BaseModel):
    type: ReactionType


class ReactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    idea_id: UUID
    user_id: str
    type: ReactionType


# --- Interest ------------------------------------------------------------


class InterestCreate(BaseModel):
    message: str | None = Field(default=None, max_length=2_000)


class InterestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    idea_id: UUID
    user_id: str
    message: str | None = None
    created_at: datetime
    # Optional nested identity when the caller wants to show who's interested.
    user: OwnerInfo | None = None


# Resolve the forward reference in CommentResponse.replies.
CommentResponse.model_rebuild()
