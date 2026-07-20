"""Notification endpoints for the authenticated user."""

from fastapi import APIRouter, HTTPException, Request
from core.database import execute, fetch_all, fetch_one
from schemas.notifications import NotificationResponse, NotificationListResponse

router = APIRouter()


@router.get("/notifications", response_model=NotificationListResponse)
async def get_notifications(request: Request, limit: int = 20):
    session_user = request.session.get("user")
    if not session_user or not session_user.get("sub"):
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = session_user["sub"]

    rows = await fetch_all(
        """
        SELECT id, user_id, actor_id, type, idea_id, message, is_read, created_at
        FROM notifications
        WHERE user_id = %s
        ORDER BY is_read ASC, created_at DESC
        LIMIT %s
        """,
        (user_id, limit),
    )
    notifications = [NotificationResponse(**row) for row in rows]

    unread_count_row = await fetch_one(
        "SELECT COUNT(*) as count FROM notifications WHERE user_id = %s AND is_read = FALSE",
        (user_id,),
    )
    unread_count = unread_count_row["count"] if unread_count_row else 0

    return NotificationListResponse(notifications=notifications, unread_count=unread_count)


@router.get("/notifications/unread-count")
async def get_unread_count(request: Request):
    session_user = request.session.get("user")
    if not session_user or not session_user.get("sub"):
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = session_user["sub"]

    row = await fetch_one(
        "SELECT COUNT(*) as count FROM notifications WHERE user_id = %s AND is_read = FALSE",
        (user_id,),
    )
    return {"unread_count": row["count"] if row else 0}


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    session_user = request.session.get("user")
    if not session_user or not session_user.get("sub"):
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = session_user["sub"]

    notif = await fetch_one(
        "SELECT id FROM notifications WHERE id = %s AND user_id = %s",
        (notification_id, user_id),
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    await execute(
        "UPDATE notifications SET is_read = TRUE WHERE id = %s",
        (notification_id,),
    )
    return {"ok": True}


@router.post("/notifications/mark-all-read")
async def mark_all_read(request: Request):
    session_user = request.session.get("user")
    if not session_user or not session_user.get("sub"):
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = session_user["sub"]

    await execute(
        "UPDATE notifications SET is_read = TRUE WHERE user_id = %s AND is_read = FALSE",
        (user_id,),
    )
    return {"ok": True}


async def create_notification(user_id: str, actor_id: str, notif_type: str, idea_id: str, message: str) -> None:
    """Helper to insert a notification. Call this from interaction endpoints."""
    await execute(
        """
        INSERT INTO notifications (user_id, actor_id, type, idea_id, message, is_read)
        VALUES (%s, %s, %s, %s, %s, FALSE)
        """,
        (user_id, actor_id, notif_type, idea_id, message),
    )
