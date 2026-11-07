from fastapi import APIRouter, Depends, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.dependencies import get_db, get_current_user
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse, UserUpdate, RefreshResponse
from app.repositories.user_repository import UserRepository
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.register(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.login(data, response)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    refresh_token: Optional[str] = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    return await service.refresh(refresh_token)


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.logout(refresh_token, response)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    return await repo.update(current_user, **data.model_dump(exclude_none=True))
