from typing import Any

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


async def close_database() -> None:
    global pool
    if pool is not None:
        await pool.close()
        pool = None


async def fetch_one(query: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    assert pool is not None
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict) as cur:
            await cur.execute(query, params)
            return await cur.fetchone()


async def execute(query: str, params: tuple[Any, ...] = ()) -> None:
    assert pool is not None
    async with pool.connection() as conn:
        await conn.execute(query, params)
