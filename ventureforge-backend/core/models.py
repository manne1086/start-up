from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any


@dataclass
class ProjectRecord:
    thread_id: str
    user_id: str
    idea: str
    status: str
    created_at: datetime
    updated_at: datetime
    payload: dict[str, Any]


# --- Public idea board ---------------------------------------------------
# These mirror the tables created in core.database._init_idea_board_schema().
# The project uses raw psycopg (no ORM), so these are plain row records, not
# SQLAlchemy models.


class ReactionType(str, Enum):
    upvote = "upvote"
    would_use = "would_use"
    have_this_problem = "have_this_problem"


@dataclass
class UserRecord:
    # `id` is the Google OAuth `sub` (auth is otherwise session-based;
    # this table persists identities so board rows can reference an owner).
    id: str
    email: str | None
    name: str | None
    picture: str | None
    created_at: datetime


@dataclass
class IdeaRecord:
    id: str
    title: str
    one_liner: str | None
    description: str | None
    domain: str | None
    owner_id: str
    created_at: datetime
    is_public: bool
    ai_validation_score: float | None
    ai_summary_json: dict[str, Any] | None


@dataclass
class CommentRecord:
    id: str
    idea_id: str
    user_id: str
    content: str
    created_at: datetime
    parent_comment_id: str | None


@dataclass
class ReactionRecord:
    id: str
    idea_id: str
    user_id: str
    type: ReactionType


@dataclass
class InterestRecord:
    id: str
    idea_id: str
    user_id: str
    message: str | None
    created_at: datetime


@dataclass
class NotificationRecord:
    id: str
    user_id: str
    actor_id: str
    type: str  # 'upvote', 'comment', 'interest'
    idea_id: str
    message: str
    is_read: bool
    created_at: datetime

