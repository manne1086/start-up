from authlib.integrations.starlette_client import OAuth
from authlib.integrations.base_client.errors import OAuthError, MismatchingStateError
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
import httpx

from core.config import settings

router = APIRouter()

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/auth/google/login")
async def google_login(request: Request):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        return {
            "detail": "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        }
    return await oauth.google.authorize_redirect(request, settings.GOOGLE_REDIRECT_URI)


@router.get("/auth/google/callback")
async def google_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except (MismatchingStateError, OAuthError):
        token_endpoint = oauth.google.server_metadata.get("token_endpoint")
        userinfo_endpoint = oauth.google.server_metadata.get("userinfo_endpoint")
        code = request.query_params.get("code")
        if not token_endpoint or not userinfo_endpoint or not code:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/?auth=error", status_code=302)

        async with httpx.AsyncClient(timeout=15) as client:
            token_response = await client.post(
                token_endpoint,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_response.raise_for_status()
            token = token_response.json()
            userinfo_response = await client.get(
                userinfo_endpoint,
                headers={"Authorization": f"Bearer {token['access_token']}"},
            )
            userinfo_response.raise_for_status()
            userinfo = userinfo_response.json()
    else:
        userinfo = token.get("userinfo")
        if not userinfo:
            userinfo = await oauth.google.parse_id_token(request, token)
    request.session["user"] = {
        "sub": userinfo.get("sub"),
        "email": userinfo.get("email"),
        "name": userinfo.get("name"),
        "picture": userinfo.get("picture"),
    }
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/?auth=success", status_code=302)


@router.get("/auth/me")
async def auth_me(request: Request):
    return {"authenticated": "user" in request.session, "user": request.session.get("user")}


@router.post("/auth/logout")
async def logout(request: Request):
    request.session.clear()
    return {"ok": True}
