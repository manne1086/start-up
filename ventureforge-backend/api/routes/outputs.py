from fastapi import APIRouter

router = APIRouter()


@router.get("/outputs/{thread_id}")
async def outputs(thread_id: str):
    return {"thread_id": thread_id}

