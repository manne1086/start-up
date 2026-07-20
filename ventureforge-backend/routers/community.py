"""Public idea board endpoints.

Built on the raw-psycopg helpers in core.database (no ORM), matching the rest
of the backend. Auth reuses the Google-OAuth session set in api.routes.auth —
`request.session["user"]` holds {sub, email, name, picture}.
"""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request
from psycopg.types.json import Json

from core.database import execute, fetch_all, fetch_one, upsert_user
from routers.notifications import create_notification
from graph.state import StartupState
from schemas.community import (
    CommentCreate,
    CommentResponse,
    ForkSummary,
    IdeaCreate,
    IdeaResponse,
    InterestCreate,
    InterestResponse,
    OwnerInfo,
    PublishFromRunRequest,
    ReactionCounts,
    ReactionCreate,
)
from services.run_manager import get_run_state

router = APIRouter()


# --- Auth helpers --------------------------------------------------------


def _require_user(request: Request) -> dict[str, Any]:
    user = request.session.get("user")
    if not user or not user.get("sub"):
        raise HTTPException(status_code=401, detail="Authentication required.")
    return user


def _optional_user(request: Request) -> dict[str, Any] | None:
    user = request.session.get("user")
    return user if user and user.get("sub") else None


async def _session_owner(user: dict[str, Any]) -> OwnerInfo:
    """OwnerInfo for the current session user, resolving their username from the
    users table (upsert_user must have been called first) so freshly-created
    comments/interests carry a linkable handle."""
    row = await fetch_one("SELECT username FROM users WHERE id = %s", (user["sub"],))
    return OwnerInfo(
        id=user["sub"],
        username=row["username"] if row else None,
        name=user.get("name"),
        picture=user.get("picture"),
    )


# --- Pipeline reuse ------------------------------------------------------


def _extract_validation(state: StartupState) -> tuple[float | None, dict[str, Any] | None]:
    """Distill a completed generation run into a validation score + a
    structured snapshot of the agent output (market analysis, ICP, business
    model, financials, MVP, legal) for storage in ideas.ai_summary_json.

    The agent pipeline has no single numeric "validation" metric, so the score
    is a transparent completeness heuristic (fraction of core artifacts the
    run produced). Swap this for a real model score later without touching the
    endpoint. Returns (None, None) when the run produced nothing usable — the
    idea is then stored as unvalidated."""
    artifacts = {
        "market": state.market,
        "business_plan": state.business_plan,
        "financials": state.financials,
        "legal": state.legal,
        "mvp": state.mvp,
    }
    present = [name for name, value in artifacts.items() if value is not None]
    if not present:
        return None, None

    score = round(100 * len(present) / len(artifacts), 1)
    summary: dict[str, Any] = {
        "startup_name": state.startup_name or None,
        "industry": state.industry or None,
        "idea": state.idea,
        "completed_steps": state.completed_steps,
    }

    bp = state.business_plan
    if bp:
        summary["business"] = {
            "problem": bp.problem_statement,
            "solution": bp.solution,
            "value_proposition": bp.value_proposition,
            "revenue_model": bp.revenue_model,
            "pricing": bp.pricing,
            "gtm_strategy": bp.gtm_strategy,
            "key_risks": bp.key_risks,
            "mitigation_steps": bp.mitigation_steps,
        }
        # target_market is the closest thing the pipeline produces to an ICP.
        summary["icp"] = bp.target_market

    if state.market:
        summary["market"] = {
            "tam": state.market.tam,
            "sam": state.market.sam,
            "som": state.market.som,
            "tam_source": state.market.tam_source,
            "market_gaps": state.market.market_gaps,
            "competitors": [
                {"name": c.name, "focus": c.focus, "threat_level": c.threat_level}
                for c in state.market.competitors[:8]
            ],
        }

    if state.financials:
        summary["financials"] = {
            "npv": state.financials.npv,
            "irr": state.financials.irr,
            "payback_months": state.financials.payback_months,
        }

    if state.mvp:
        summary["mvp"] = {
            "estimated_weeks": state.mvp.estimated_weeks,
            "estimated_cost_inr": state.mvp.estimated_cost_inr,
            "team_size": state.mvp.team_size,
        }

    if state.legal:
        summary["legal"] = {
            "gdpr_compliant": state.legal.gdpr_compliant,
            "entity_recommendation": state.legal.entity_recommendation,
        }

    return score, summary


# --- Shared queries ------------------------------------------------------


async def _require_visible_idea(idea_id: UUID, viewer_id: str | None) -> dict[str, Any]:
    """Return the idea's {owner_id, is_public} or raise 404 when it doesn't
    exist or is private and the viewer isn't its owner. Private ideas 404
    (rather than 403) so their existence isn't leaked."""
    row = await fetch_one("SELECT owner_id, is_public FROM ideas WHERE id = %s", (idea_id,))
    if not row or (not row["is_public"] and row["owner_id"] != viewer_id):
        raise HTTPException(status_code=404, detail="Idea not found.")
    return row


async def _reaction_counts(idea_id: UUID) -> ReactionCounts:
    rows = await fetch_all(
        "SELECT type, COUNT(*) AS count FROM reactions WHERE idea_id = %s GROUP BY type",
        (idea_id,),
    )
    return ReactionCounts.from_rows(rows)


async def _fetch_comment_rows(idea_id: UUID) -> list[dict[str, Any]]:
    return await fetch_all(
        """
        SELECT c.id, c.idea_id, c.content, c.created_at, c.parent_comment_id,
               u.id AS author_uid, u.username AS author_username, u.name AS author_name, u.picture AS author_picture
        FROM comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.idea_id = %s
        ORDER BY c.created_at ASC
        """,
        (idea_id,),
    )


# --- Response builders ---------------------------------------------------


async def _load_idea_response(idea_id: UUID, viewer_id: str | None = None) -> IdeaResponse | None:
    """Load one idea with owner info + aggregate counts. Returns None when the
    idea does not exist or is private and the viewer is not its owner."""
    row = await fetch_one(
        """
        SELECT i.id, i.title, i.one_liner, i.description, i.domain, i.owner_id,
               i.created_at, i.is_public, i.ai_validation_score, i.ai_summary_json,
               i.forked_from_id,
               u.id AS owner_uid, u.username AS owner_username, u.name AS owner_name, u.picture AS owner_picture,
               (SELECT COUNT(*) FROM comments c WHERE c.idea_id = i.id) AS comment_count,
               (SELECT COUNT(*) FROM interests it WHERE it.idea_id = i.id) AS interest_count,
               (SELECT COUNT(*) FROM ideas f WHERE f.forked_from_id = i.id AND f.is_public = TRUE) AS fork_count
        FROM ideas i
        JOIN users u ON u.id = i.owner_id
        WHERE i.id = %s
        """,
        (idea_id,),
    )
    if not row:
        return None
    if not row["is_public"] and row["owner_id"] != viewer_id:
        return None

    return IdeaResponse(
        id=row["id"],
        title=row["title"],
        one_liner=row["one_liner"],
        description=row["description"],
        domain=row["domain"],
        owner=OwnerInfo(id=row["owner_uid"], username=row["owner_username"], name=row["owner_name"], picture=row["owner_picture"]),
        created_at=row["created_at"],
        is_public=row["is_public"],
        ai_validation_score=row["ai_validation_score"],
        ai_summary_json=row["ai_summary_json"],
        reaction_counts=await _reaction_counts(row["id"]),
        comment_count=row["comment_count"],
        interest_count=row["interest_count"],
        forked_from_id=row["forked_from_id"],
        fork_count=row["fork_count"],
    )


def _build_comment_tree(rows: list[dict[str, Any]]) -> list[CommentResponse]:
    """Turn a flat, chronologically-ordered comment list into a threaded tree."""
    nodes: dict[Any, CommentResponse] = {}
    for r in rows:
        nodes[r["id"]] = CommentResponse(
            id=r["id"],
            idea_id=r["idea_id"],
            author=OwnerInfo(id=r["author_uid"], username=r["author_username"], name=r["author_name"], picture=r["author_picture"]),
            content=r["content"],
            created_at=r["created_at"],
            parent_comment_id=r["parent_comment_id"],
            replies=[],
        )

    roots: list[CommentResponse] = []
    for r in rows:
        node = nodes[r["id"]]
        parent_id = r["parent_comment_id"]
        if parent_id and parent_id in nodes:
            nodes[parent_id].replies.append(node)
        else:
            roots.append(node)
    return roots


# --- Endpoints -----------------------------------------------------------


@router.post("/ideas", response_model=IdeaResponse, status_code=201)
async def create_idea(payload: IdeaCreate, request: Request, thread_id: str | None = None):
    """Create an idea. If `thread_id` points at a completed generation run,
    reuse its AI output as the validation score/summary; otherwise the idea is
    stored unvalidated (ai_validation_score = NULL)."""
    user = _require_user(request)

    score: float | None = None
    summary: dict[str, Any] | None = None
    if thread_id:
        state = get_run_state(thread_id)
        if state is not None:
            score, summary = _extract_validation(state)

    # Ensure a users row exists so the owner FK is satisfiable.
    await upsert_user(user["sub"], user.get("email"), user.get("name"), user.get("picture"))

    row = await fetch_one(
        """
        INSERT INTO ideas (title, one_liner, description, domain, owner_id,
                           is_public, ai_validation_score, ai_summary_json)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            payload.title,
            payload.one_liner,
            payload.description,
            payload.domain,
            user["sub"],
            payload.is_public,
            score,
            Json(summary) if summary is not None else None,
        ),
    )
    idea = await _load_idea_response(row["id"], viewer_id=user["sub"])
    if idea is None:
        raise HTTPException(status_code=500, detail="Idea was created but could not be loaded.")
    return idea


@router.post("/ideas/from-run", response_model=IdeaResponse, status_code=201)
async def publish_from_run(payload: PublishFromRunRequest, request: Request):
    """Publish to Community: build a community Idea from a completed generation
    run. The full agent output (validation score, market analysis, ICP, etc.)
    is stored in ai_summary_json. This is opt-in — a run only becomes a
    community idea when the user explicitly publishes it — and the owner is the
    logged-in user, so it isn't wired into the pipeline itself (which runs for
    the anonymous generation user and shouldn't create DB rows per run)."""
    user = _require_user(request)

    state = get_run_state(payload.thread_id)
    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Generation run not found or has expired. Re-run generation before publishing.",
        )

    score, summary = _extract_validation(state)

    bp = state.business_plan
    title = (payload.title or state.startup_name or state.idea or "Untitled idea").strip()[:200]
    one_liner_src = (bp.value_proposition or bp.solution) if bp else state.idea
    one_liner = (one_liner_src or "").strip()[:280] or None
    description = (state.idea or (bp.problem_statement if bp else "") or "").strip() or None
    domain = (payload.domain or state.industry or None)

    await upsert_user(user["sub"], user.get("email"), user.get("name"), user.get("picture"))
    row = await fetch_one(
        """
        INSERT INTO ideas (title, one_liner, description, domain, owner_id,
                           is_public, ai_validation_score, ai_summary_json)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            title,
            one_liner,
            description,
            domain,
            user["sub"],
            payload.is_public,
            score,
            Json(summary) if summary is not None else None,
        ),
    )
    idea = await _load_idea_response(row["id"], viewer_id=user["sub"])
    if idea is None:
        raise HTTPException(status_code=500, detail="Idea was published but could not be loaded.")
    return idea


@router.get("/ideas")
async def list_ideas(
    request: Request,
    domain: str | None = None,
    sort: str = Query("newest"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List public ideas, optionally filtered by domain, sorted by newest or
    top (most reactions), paginated with limit/offset."""
    if sort not in {"newest", "top"}:
        raise HTTPException(status_code=400, detail="sort must be 'newest' or 'top'.")

    where = ["i.is_public = TRUE"]
    params: list[Any] = []
    if domain:
        where.append("i.domain = %s")
        params.append(domain)

    order_by = "total_reactions DESC, i.created_at DESC" if sort == "top" else "i.created_at DESC"
    params.extend([limit, offset])

    rows = await fetch_all(
        f"""
        SELECT i.id, i.title, i.one_liner, i.description, i.domain, i.owner_id,
               i.created_at, i.is_public, i.ai_validation_score, i.ai_summary_json,
               u.id AS owner_uid, u.username AS owner_username, u.name AS owner_name, u.picture AS owner_picture,
               (SELECT COUNT(*) FROM comments c WHERE c.idea_id = i.id) AS comment_count,
               (SELECT COUNT(*) FROM interests it WHERE it.idea_id = i.id) AS interest_count,
               (SELECT COUNT(*) FROM reactions r WHERE r.idea_id = i.id) AS total_reactions
        FROM ideas i
        JOIN users u ON u.id = i.owner_id
        WHERE {' AND '.join(where)}
        ORDER BY {order_by}
        LIMIT %s OFFSET %s
        """,
        tuple(params),
    )

    # Fetch reaction breakdowns for the returned ideas in one grouped query.
    reaction_map: dict[Any, list[dict[str, Any]]] = {}
    idea_ids = [r["id"] for r in rows]
    if idea_ids:
        breakdown = await fetch_all(
            "SELECT idea_id, type, COUNT(*) AS count FROM reactions WHERE idea_id = ANY(%s) GROUP BY idea_id, type",
            (idea_ids,),
        )
        for br in breakdown:
            reaction_map.setdefault(br["idea_id"], []).append(br)

    ideas = [
        IdeaResponse(
            id=r["id"],
            title=r["title"],
            one_liner=r["one_liner"],
            description=r["description"],
            domain=r["domain"],
            owner=OwnerInfo(id=r["owner_uid"], username=r["owner_username"], name=r["owner_name"], picture=r["owner_picture"]),
            created_at=r["created_at"],
            is_public=r["is_public"],
            ai_validation_score=r["ai_validation_score"],
            ai_summary_json=r["ai_summary_json"],
            reaction_counts=ReactionCounts.from_rows(reaction_map.get(r["id"], [])),
            comment_count=r["comment_count"],
            interest_count=r["interest_count"],
        )
        for r in rows
    ]
    return {"ideas": ideas, "limit": limit, "offset": offset, "count": len(ideas)}


@router.get("/ideas/mine")
async def my_ideas(request: Request):
    """Return all ideas owned by the current user, with reaction totals and
    interest lists (owner-only data). Used for the 'My Ideas' dashboard tab."""
    user = _require_user(request)
    uid = user["sub"]

    rows = await fetch_all(
        """
        SELECT i.id, i.title, i.one_liner, i.domain, i.is_public,
               i.ai_validation_score, i.created_at,
               (SELECT COUNT(*) FROM comments c WHERE c.idea_id = i.id) AS comment_count,
               (SELECT COUNT(*) FROM interests it WHERE it.idea_id = i.id) AS interest_count,
               (SELECT COUNT(*) FROM reactions r WHERE r.idea_id = i.id) AS total_reactions
        FROM ideas i
        WHERE i.owner_id = %s
        ORDER BY i.created_at DESC
        """,
        (uid,),
    )

    idea_ids = [r["id"] for r in rows]
    reaction_map: dict[Any, list[dict[str, Any]]] = {}
    interest_map: dict[Any, list[dict[str, Any]]] = {}

    if idea_ids:
        breakdown = await fetch_all(
            "SELECT idea_id, type, COUNT(*) AS count FROM reactions WHERE idea_id = ANY(%s) GROUP BY idea_id, type",
            (idea_ids,),
        )
        for br in breakdown:
            reaction_map.setdefault(br["idea_id"], []).append(br)

        interest_rows = await fetch_all(
            """
            SELECT it.id, it.idea_id, it.user_id, it.message, it.created_at,
                   u.id AS uid, u.username AS uusername, u.name AS uname, u.picture AS upic
            FROM interests it
            JOIN users u ON u.id = it.user_id
            WHERE it.idea_id = ANY(%s)
            ORDER BY it.created_at DESC
            """,
            (idea_ids,),
        )
        for ir in interest_rows:
            interest_map.setdefault(ir["idea_id"], []).append(ir)

    ideas = []
    for r in rows:
        rc = ReactionCounts.from_rows(reaction_map.get(r["id"], []))
        interests = [
            {
                "id": str(ir["id"]),
                "message": ir["message"],
                "created_at": ir["created_at"].isoformat() if ir["created_at"] else None,
                "user": {"id": ir["uid"], "username": ir["uusername"], "name": ir["uname"], "picture": ir["upic"]},
            }
            for ir in interest_map.get(r["id"], [])
        ]
        ideas.append({
            "id": str(r["id"]),
            "title": r["title"],
            "one_liner": r["one_liner"],
            "domain": r["domain"],
            "is_public": r["is_public"],
            "ai_validation_score": r["ai_validation_score"],
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            "comment_count": r["comment_count"],
            "interest_count": r["interest_count"],
            "reaction_counts": rc.model_dump(),
            "interests": interests,
        })

    return {"ideas": ideas}


@router.get("/ideas/{idea_id}")
async def get_idea(idea_id: UUID, request: Request):
    """Get a single idea with its threaded comments and reaction counts."""
    viewer = _optional_user(request)
    idea = await _load_idea_response(idea_id, viewer_id=viewer["sub"] if viewer else None)
    if idea is None:
        raise HTTPException(status_code=404, detail="Idea not found.")

    comment_rows = await _fetch_comment_rows(idea_id)
    return {"idea": idea, "comments": _build_comment_tree(comment_rows)}


@router.patch("/ideas/{idea_id}/publish", response_model=IdeaResponse)
async def toggle_publish(idea_id: UUID, request: Request):
    """Toggle an idea's is_public flag. Owner only."""
    user = _require_user(request)
    idea = await fetch_one("SELECT owner_id FROM ideas WHERE id = %s", (idea_id,))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found.")
    if idea["owner_id"] != user["sub"]:
        raise HTTPException(status_code=403, detail="Only the idea owner can change its visibility.")

    await execute("UPDATE ideas SET is_public = NOT is_public WHERE id = %s", (idea_id,))
    updated = await _load_idea_response(idea_id, viewer_id=user["sub"])
    if updated is None:
        raise HTTPException(status_code=500, detail="Idea visibility was updated but could not be loaded.")
    return updated


# --- Forks ---------------------------------------------------------------


@router.post("/ideas/{idea_id}/fork", response_model=IdeaResponse, status_code=201)
async def fork_idea(idea_id: UUID, request: Request):
    """Fork an idea: copy its content into a new idea owned by the current
    user, linked back to the original via forked_from_id. The fork starts
    public so it appears in the original's 'forked by' list; the new owner can
    edit or unpublish it afterwards."""
    user = _require_user(request)

    original = await fetch_one(
        """
        SELECT title, one_liner, description, domain, is_public,
               ai_validation_score, ai_summary_json, owner_id
        FROM ideas WHERE id = %s
        """,
        (idea_id,),
    )
    if not original or (not original["is_public"] and original["owner_id"] != user["sub"]):
        raise HTTPException(status_code=404, detail="Idea not found.")

    await upsert_user(user["sub"], user.get("email"), user.get("name"), user.get("picture"))
    row = await fetch_one(
        """
        INSERT INTO ideas (title, one_liner, description, domain, owner_id,
                           is_public, ai_validation_score, ai_summary_json, forked_from_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            original["title"],
            original["one_liner"],
            original["description"],
            original["domain"],
            user["sub"],
            True,
            original["ai_validation_score"],
            Json(original["ai_summary_json"]) if original["ai_summary_json"] is not None else None,
            idea_id,
        ),
    )
    fork = await _load_idea_response(row["id"], viewer_id=user["sub"])
    if fork is None:
        raise HTTPException(status_code=500, detail="Fork was created but could not be loaded.")
    return fork


@router.get("/ideas/{idea_id}/forks")
async def list_forks(idea_id: UUID, request: Request):
    """List the public forks of an idea (the 'Forked by X people' section)."""
    viewer = _optional_user(request)
    await _require_visible_idea(idea_id, viewer["sub"] if viewer else None)

    rows = await fetch_all(
        """
        SELECT i.id, i.title, i.created_at,
               u.id AS owner_uid, u.username AS owner_username, u.name AS owner_name, u.picture AS owner_picture
        FROM ideas i
        JOIN users u ON u.id = i.owner_id
        WHERE i.forked_from_id = %s AND i.is_public = TRUE
        ORDER BY i.created_at DESC
        """,
        (idea_id,),
    )
    forks = [
        ForkSummary(
            id=r["id"],
            title=r["title"],
            owner=OwnerInfo(id=r["owner_uid"], username=r["owner_username"], name=r["owner_name"], picture=r["owner_picture"]),
            created_at=r["created_at"],
        )
        for r in rows
    ]
    return {"forks": forks, "count": len(forks)}


# --- Comments ------------------------------------------------------------


@router.post("/ideas/{idea_id}/comments", response_model=CommentResponse, status_code=201)
async def add_comment(idea_id: UUID, payload: CommentCreate, request: Request):
    """Add a comment to an idea. Pass `parent_comment_id` to reply to another
    comment (which must belong to the same idea)."""
    user = _require_user(request)
    await _require_visible_idea(idea_id, user["sub"])

    if payload.parent_comment_id is not None:
        parent = await fetch_one(
            "SELECT idea_id FROM comments WHERE id = %s", (payload.parent_comment_id,)
        )
        if not parent or parent["idea_id"] != idea_id:
            raise HTTPException(status_code=400, detail="parent_comment_id does not belong to this idea.")

    await upsert_user(user["sub"], user.get("email"), user.get("name"), user.get("picture"))
    row = await fetch_one(
        """
        INSERT INTO comments (idea_id, user_id, content, parent_comment_id)
        VALUES (%s, %s, %s, %s)
        RETURNING id, idea_id, content, created_at, parent_comment_id
        """,
        (idea_id, user["sub"], payload.content, payload.parent_comment_id),
    )

    # Create notification for the idea owner (unless commenting on own idea)
    idea = await fetch_one("SELECT owner_id FROM ideas WHERE id = %s", (idea_id,))
    if idea and idea["owner_id"] != user["sub"]:
        actor_name = user.get("name") or "Someone"
        message = f"{actor_name} commented on your idea"
        await create_notification(
            user_id=idea["owner_id"],
            actor_id=user["sub"],
            notif_type="comment",
            idea_id=str(idea_id),
            message=message,
        )

    return CommentResponse(
        id=row["id"],
        idea_id=row["idea_id"],
        author=await _session_owner(user),
        content=row["content"],
        created_at=row["created_at"],
        parent_comment_id=row["parent_comment_id"],
        replies=[],
    )


@router.get("/ideas/{idea_id}/comments")
async def get_comments(idea_id: UUID, request: Request):
    """Get an idea's comments as a threaded tree."""
    viewer = _optional_user(request)
    await _require_visible_idea(idea_id, viewer["sub"] if viewer else None)
    rows = await _fetch_comment_rows(idea_id)
    return {"comments": _build_comment_tree(rows)}


# --- Reactions -----------------------------------------------------------


@router.post("/ideas/{idea_id}/react")
async def react(idea_id: UUID, payload: ReactionCreate, request: Request):
    """Toggle one reaction of the given type for the current user. Reacting
    with a type the user already has removes it; different types coexist
    (a user can both upvote and would_use the same idea)."""
    user = _require_user(request)
    await _require_visible_idea(idea_id, user["sub"])

    reaction_type = payload.type.value
    existing = await fetch_one(
        "SELECT id FROM reactions WHERE idea_id = %s AND user_id = %s AND type = %s::reaction_type",
        (idea_id, user["sub"], reaction_type),
    )
    if existing:
        await execute("DELETE FROM reactions WHERE id = %s", (existing["id"],))
        action = "removed"
    else:
        await upsert_user(user["sub"], user.get("email"), user.get("name"), user.get("picture"))
        await execute(
            "INSERT INTO reactions (idea_id, user_id, type) VALUES (%s, %s, %s::reaction_type)",
            (idea_id, user["sub"], reaction_type),
        )
        action = "added"

        # Create notification for the idea owner (unless reacting to own idea)
        idea = await fetch_one("SELECT owner_id, title FROM ideas WHERE id = %s", (idea_id,))
        if idea and idea["owner_id"] != user["sub"]:
            actor_name = user.get("name") or "Someone"
            reaction_label = reaction_type.replace("_", " ").title()
            message = f"{actor_name} {reaction_type}d your idea"
            await create_notification(
                user_id=idea["owner_id"],
                actor_id=user["sub"],
                notif_type="upvote" if reaction_type == "upvote" else "upvote",
                idea_id=str(idea_id),
                message=message,
            )

    user_rows = await fetch_all(
        "SELECT type FROM reactions WHERE idea_id = %s AND user_id = %s",
        (idea_id, user["sub"]),
    )
    return {
        "idea_id": str(idea_id),
        "action": action,
        "reaction_counts": await _reaction_counts(idea_id),
        "user_reactions": [r["type"] for r in user_rows],
    }


# --- Interest ------------------------------------------------------------


@router.post("/ideas/{idea_id}/interest", response_model=InterestResponse, status_code=201)
async def express_interest(idea_id: UUID, payload: InterestCreate, request: Request):
    """Signal interest in an idea, with an optional message. Re-posting
    updates the existing message (one interest signal per user per idea)."""
    user = _require_user(request)
    await _require_visible_idea(idea_id, user["sub"])

    await upsert_user(user["sub"], user.get("email"), user.get("name"), user.get("picture"))

    # Check if this is a new interest (not an update)
    existing = await fetch_one(
        "SELECT id FROM interests WHERE idea_id = %s AND user_id = %s",
        (idea_id, user["sub"]),
    )
    is_new = existing is None

    row = await fetch_one(
        """
        INSERT INTO interests (idea_id, user_id, message)
        VALUES (%s, %s, %s)
        ON CONFLICT (idea_id, user_id) DO UPDATE SET message = EXCLUDED.message
        RETURNING id, idea_id, user_id, message, created_at
        """,
        (idea_id, user["sub"], payload.message),
    )

    # Create notification only for new interests (not updates) and if not own idea
    if is_new:
        idea = await fetch_one("SELECT owner_id FROM ideas WHERE id = %s", (idea_id,))
        if idea and idea["owner_id"] != user["sub"]:
            actor_name = user.get("name") or "Someone"
            message = f"{actor_name} expressed interest in your idea"
            await create_notification(
                user_id=idea["owner_id"],
                actor_id=user["sub"],
                notif_type="interest",
                idea_id=str(idea_id),
                message=message,
            )

    return InterestResponse(
        id=row["id"],
        idea_id=row["idea_id"],
        user_id=row["user_id"],
        message=row["message"],
        created_at=row["created_at"],
        user=await _session_owner(user),
    )


@router.get("/ideas/{idea_id}/interest")
async def list_interest(idea_id: UUID, request: Request):
    """List the users who expressed interest in an idea. Owner only — these
    are lead signals not meant to be public."""
    user = _require_user(request)
    idea = await fetch_one("SELECT owner_id FROM ideas WHERE id = %s", (idea_id,))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found.")
    if idea["owner_id"] != user["sub"]:
        raise HTTPException(status_code=403, detail="Only the idea owner can view interested users.")

    rows = await fetch_all(
        """
        SELECT it.id, it.idea_id, it.user_id, it.message, it.created_at,
               u.id AS uid, u.username AS uusername, u.name AS uname, u.picture AS upic
        FROM interests it
        JOIN users u ON u.id = it.user_id
        WHERE it.idea_id = %s
        ORDER BY it.created_at DESC
        """,
        (idea_id,),
    )
    interests = [
        InterestResponse(
            id=r["id"],
            idea_id=r["idea_id"],
            user_id=r["user_id"],
            message=r["message"],
            created_at=r["created_at"],
            user=OwnerInfo(id=r["uid"], username=r["uusername"], name=r["uname"], picture=r["upic"]),
        )
        for r in rows
    ]
    return {"interests": interests, "count": len(interests)}


@router.delete("/ideas/{idea_id}", status_code=204)
async def delete_idea(idea_id: UUID, request: Request):
    """Delete an idea (owner only). Cascades to comments, reactions, interests, and notifications."""
    user = _require_user(request)
    idea = await fetch_one("SELECT owner_id FROM ideas WHERE id = %s", (idea_id,))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found.")
    if idea["owner_id"] != user["sub"]:
        raise HTTPException(status_code=403, detail="Only the idea owner can delete this idea.")

    # Delete cascades: comments → reactions → interests → notifications → idea
    await execute("DELETE FROM comments WHERE idea_id = %s", (idea_id,))
    await execute("DELETE FROM reactions WHERE idea_id = %s", (idea_id,))
    await execute("DELETE FROM interests WHERE idea_id = %s", (idea_id,))
    await execute("DELETE FROM notifications WHERE idea_id = %s", (idea_id,))
    await execute("DELETE FROM ideas WHERE id = %s", (idea_id,))

    return None
