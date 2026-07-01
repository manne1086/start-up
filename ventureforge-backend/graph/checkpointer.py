from core.config import settings

checkpointer = None


async def init_checkpointer() -> None:
    global checkpointer
    if checkpointer is None:
        try:
            from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

            checkpointer = AsyncPostgresSaver.from_conn_string(settings.DATABASE_URL)
            await checkpointer.setup()
        except ModuleNotFoundError:
            checkpointer = None
