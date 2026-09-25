from typing import Annotated

from clerk_backend_api import (
    AuthenticateRequestOptions,
    authenticate_request,
)
from clerk_backend_api.security.types import RequestState
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings


http_bearer = HTTPBearer(auto_error=False)


def get_current_auth_state(
    request: Request,
    _credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(http_bearer),
    ] = None,
) -> RequestState:
    state = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=settings.CLERK_SECRET_KEY,
            jwt_key=settings.CLERK_JWT_KEY,
            authorized_parties=[
                settings.CLERK_AUTHORIZED_PARTIES
            ],
            accepts_token=["session_token"],
        ),
    )

    if not state.is_signed_in:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    return state


def get_current_user_id(
    request: Request,
) -> str:
    # Development mode:
    # skip Clerk authentication and use a fixed user.
    if not settings.AUTH_REQUIRED:
        return settings.DEV_USER_ID

    # Production mode:
    # verify the Clerk session token.
    state = get_current_auth_state(
        request=request,
    )

    user_id = state.payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    return user_id


CurrentUser = Annotated[
    str,
    Depends(get_current_user_id),
]