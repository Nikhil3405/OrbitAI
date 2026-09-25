from fastapi import APIRouter

from app.auth.clerk import CurrentUser


router = APIRouter(
    prefix="/api",
    tags=["Authentication"],
)


@router.get("/me")
def get_current_user(
    current_user: CurrentUser,
):
    return {
        "authenticated": True,
        "user_id": current_user,
    }