import re
from typing import Any
from uuid import uuid4

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from core.config import settings

pool: AsyncConnectionPool | None = None


def _normalize_conninfo(conninfo: str) -> str:
    return conninfo.replace("postgresql+psycopg://", "postgresql://")


async def init_database() -> None:
    global pool
    if pool is None:
        pool = AsyncConnectionPool(conninfo=_normalize_conninfo(settings.DATABASE_URL), open=False)
        await pool.open()
        async with pool.connection() as conn:
            try:
                await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            except Exception as exc:
                # Some managed Postgres plans restrict CREATE EXTENSION for
                # non-superusers. Don't block startup — vector search is not
                # required for the app's core flow.
                print(f"[Database] Skipping pgvector extension setup: {exc}")
                await conn.rollback()
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS ventureforge_projects (
                    thread_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    idea TEXT NOT NULL,
                    status TEXT NOT NULL,
                    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            await _init_idea_board_schema(conn)


async def _init_idea_board_schema(conn: Any) -> None:
    """Create the public idea-board tables. Idempotent, run at startup —
    same bootstrap pattern used for ventureforge_projects (this project has
    no migration tool). gen_random_uuid() is a core function on PostgreSQL
    13+, so no extension is required."""

    # Minimal user identity table. Auth is Google-OAuth session based; this
    # persists the OAuth `sub` so board rows can reference an owner via FK.
    # `username` is the public, URL-safe handle used for /users/:username;
    # `bio` is user-editable profile text.
    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT,
            name TEXT,
            picture TEXT,
            username TEXT UNIQUE,
            bio TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    # Backfill the profile columns for databases created before this feature.
    await conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE")
    await conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT")
    # Give any pre-existing rows a unique handle (md5 of the immutable id keeps
    # it collision-free) so every user is reachable by username.
    await conn.execute(
        "UPDATE users SET username = 'user-' || left(md5(id), 10) WHERE username IS NULL"
    )

    # reaction_type enum. CREATE TYPE has no IF NOT EXISTS, so guard it.
    await conn.execute(
        """
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reaction_type') THEN
                CREATE TYPE reaction_type AS ENUM ('upvote', 'would_use', 'have_this_problem');
            END IF;
        END $$;
        """
    )

    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS ideas (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            one_liner TEXT,
            description TEXT,
            domain TEXT,
            owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            is_public BOOLEAN NOT NULL DEFAULT TRUE,
            ai_validation_score DOUBLE PRECISION,
            ai_summary_json JSONB,
            forked_from_id UUID REFERENCES ideas(id) ON DELETE SET NULL
        )
        """
    )
    # Backfill the fork column for databases created before this feature.
    # ON DELETE SET NULL keeps forks alive when the original is removed.
    await conn.execute(
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS forked_from_id UUID REFERENCES ideas(id) ON DELETE SET NULL"
    )

    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS comments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE
        )
        """
    )

    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS reactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type reaction_type NOT NULL,
            UNIQUE (idea_id, user_id, type)
        )
        """
    )

    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS interests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (idea_id, user_id)
        )
        """
    )

    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('upvote', 'comment', 'interest')),
            idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )

    # Indexes to support the common board queries (list by idea, by owner).
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_ideas_owner_id ON ideas(owner_id)")
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_ideas_is_public ON ideas(is_public)")
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_ideas_forked_from ON ideas(forked_from_id)")
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id)")
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id)")
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_reactions_idea_id ON reactions(idea_id)")
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_interests_idea_id ON interests(idea_id)")
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)")
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read, created_at)")


def _slugify_username(name: str | None) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", (name or "").lower()).strip("-")
    return base or "user"


async def _generate_unique_username(name: str | None) -> str:
    """Generate a URL-safe, unique username from the display name, appending a
    numeric suffix on collision, with a random fallback as a last resort."""
    base = _slugify_username(name)[:30]
    for candidate in (base, *(f"{base}-{i}" for i in range(1, 20))):
        row = await fetch_one("SELECT 1 FROM users WHERE username = %s", (candidate,))
        if not row:
            return candidate
    return f"{base}-{uuid4().hex[:8]}"


async def upsert_user(user_id: str, email: str | None, name: str | None, picture: str | None) -> None:
    """Persist (or refresh) a user identity from the OAuth session so that
    idea-board rows can reference it. Call this before inserting board rows
    for an authenticated user. `username`/`bio` are set once on creation and
    never overwritten here (username edits go through PATCH /users/me)."""
    existing = await fetch_one("SELECT id FROM users WHERE id = %s", (user_id,))
    if existing:
        await execute(
            "UPDATE users SET email = %s, name = %s, picture = %s WHERE id = %s",
            (email, name, picture, user_id),
        )
        return

    username = await _generate_unique_username(name)
    await execute(
        """
        INSERT INTO users (id, email, name, picture, username)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (id) DO NOTHING
        """,
        (user_id, email, name, picture, username),
    )


async def close_database() -> None:
    global pool
    if pool is not None:
        await pool.close()
        pool = None


async def fetch_one(query: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    assert pool is not None
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(query, params)
            return await cur.fetchone()


async def fetch_all(query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    assert pool is not None
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(query, params)
            return await cur.fetchall()


async def execute(query: str, params: tuple[Any, ...] = ()) -> None:
    assert pool is not None
    async with pool.connection() as conn:
        await conn.execute(query, params)
