"""Public user profile endpoints (/users/:username)."""

import re
from typing import Any

from fastapi import APIRouter, HTTPException, Request

from core.database import execute, fetch_all, fetch_one
from schemas.users import (
    ActivityItem,
    ProfileIdea,
    UserProfileResponse,
    UserStats,
    UserUpdate,
)

router = APIRouter()

# 2-30 chars, lowercase alphanumerics and hyphens, no leading/trailing hyphen.
USERNAME_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$")


async def _build_profile(user_row: dict[str, Any]) -> UserProfileResponse:
    uid = user_row["id"]

    stats_row = await fetch_one(
        """
        SELECT
          (SELECT COUNT(*) FROM ideas WHERE owner_id = %s AND is_public = TRUE) AS ideas_published,
          (SELECT COUNT(*) FROM reactions r JOIN ideas i ON i.id = r.idea_id
             WHERE i.owner_id = %s AND r.type = 'upvote') AS upvotes_received,
          (SELECT COUNT(*) FROM ideas f
             WHERE f.is_public = TRUE
               AND f.forked_from_id IN (SELECT id FROM ideas WHERE owner_id = %s)) AS forks_received
        """,
        (uid, uid, uid),
    )
    stats = UserStats(**(stats_row or {}))

    top_rows = await fetch_all(
        """
        SELECT i.id, i.title, i.one_liner, i.domain,
               (SELECT COUNT(*) FROM reactions r WHERE r.idea_id = i.id AND r.type = 'upvote') AS upvotes,
               (SELECT COUNT(*) FROM comments c WHERE c.idea_id = i.id) AS comment_count
        FROM ideas i
        WHERE i.owner_id = %s AND i.is_public = TRUE
        ORDER BY upvotes DESC, i.created_at DESC
        LIMIT 6
        """,
        (uid,),
    )
    top_ideas = [ProfileIdea(**r) for r in top_rows]

    # Chronological activity: ideas posted, ideas forked, comments made.
    activity_rows = await fetch_all(
        """
        SELECT * FROM (
            SELECT 'idea_posted' AS type, i.created_at AS timestamp,
                   i.id AS idea_id, i.title AS idea_title, NULL::text AS content
            FROM ideas i
            WHERE i.owner_id = %s AND i.is_public = TRUE AND i.forked_from_id IS NULL
            UNION ALL
            SELECT 'idea_forked' AS type, i.created_at AS timestamp,
                   i.id AS idea_id, i.title AS idea_title, NULL::text AS content
            FROM ideas i
            WHERE i.owner_id = %s AND i.is_public = TRUE AND i.forked_from_id IS NOT NULL
            UNION ALL
            SELECT 'comment' AS type, c.created_at AS timestamp,
                   c.idea_id AS idea_id, i.title AS idea_title, c.content AS content
            FROM comments c
            JOIN ideas i ON i.id = c.idea_id
            WHERE c.user_id = %s AND i.is_public = TRUE
        ) a
        ORDER BY a.timestamp DESC
        LIMIT 20
        """,
        (uid, uid, uid),
    )
    activity = [ActivityItem(**r) for r in activity_rows]

    return UserProfileResponse(
        username=user_row["username"],
        name=user_row["name"],
        bio=user_row["bio"],
        picture=user_row["picture"],
        created_at=user_row["created_at"],
        stats=stats,
        top_ideas=top_ideas,
        activity=activity,
    )


@router.get("/users/{username}", response_model=UserProfileResponse)
async def get_profile(username: str):
    user = await fetch_one(
        "SELECT id, username, name, bio, picture, created_at FROM users WHERE username = %s",
        (username,),
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return await _build_profile(user)


@router.patch("/users/me", response_model=UserProfileResponse)
async def update_me(payload: UserUpdate, request: Request):
    session_user = request.session.get("user")
    if not session_user or not session_user.get("sub"):
        raise HTTPException(status_code=401, detail="Authentication required.")
    uid = session_user["sub"]

    user = await fetch_one("SELECT id FROM users WHERE id = %s", (uid,))
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found. Post to the community first.")

    if payload.username is not None:
        uname = payload.username.strip().lower()
        if not USERNAME_RE.match(uname):
            raise HTTPException(
                status_code=422,
                detail="Username must be 2-30 chars: lowercase letters, numbers, or hyphens.",
            )
        taken = await fetch_one("SELECT 1 FROM users WHERE username = %s AND id <> %s", (uname, uid))
        if taken:
            raise HTTPException(status_code=409, detail="That username is already taken.")
        await execute("UPDATE users SET username = %s WHERE id = %s", (uname, uid))

    if payload.bio is not None:
        await execute("UPDATE users SET bio = %s WHERE id = %s", (payload.bio, uid))

    updated = await fetch_one(
        "SELECT id, username, name, bio, picture, created_at FROM users WHERE id = %s",
        (uid,),
    )
    return await _build_profile(updated)
