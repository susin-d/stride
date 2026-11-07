from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import HTTPException, status, Response, Request
from app.repositories.user_repository import UserRepository
from app.models.refresh_token import RefreshToken
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from app.core.config import settings
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse
import uuid
import hashlib


def _hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def register(self, data: UserCreate) -> TokenResponse:
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        user = await self.user_repo.create(
            name=data.name,
            email=data.email,
            password_hash=hash_password(data.password),
            timezone=data.timezone,
        )
        access_token = create_access_token({"sub": str(user.id)})
        return TokenResponse(
            access_token=access_token,
            user=UserResponse.model_validate(user),
        )

    async def login(self, data: UserLogin, response: Response) -> TokenResponse:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        # Store hashed refresh token
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        rt = RefreshToken(
            user_id=user.id,
            token_hash=_hash_refresh_token(refresh_token),
            expires_at=expires_at,
        )
        self.db.add(rt)
        await self.db.commit()

        # Set as HttpOnly cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,  # Set True in production with HTTPS
            samesite="lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        )

        return TokenResponse(
            access_token=access_token,
            user=UserResponse.model_validate(user),
        )

    async def refresh(self, refresh_token: Optional[str]) -> dict:
        if not refresh_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        token_hash = _hash_refresh_token(refresh_token)
        result = await self.db.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.token_hash == token_hash,
                    RefreshToken.is_revoked == False,  # noqa: E712
                )
            )
        )
        db_token = result.scalar_one_or_none()
        if not db_token or db_token.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

        # Revoke old token
        db_token.is_revoked = True
        await self.db.commit()

        user_id = payload.get("sub")
        new_access = create_access_token({"sub": user_id})
        return {"access_token": new_access, "token_type": "bearer"}

    async def logout(self, refresh_token: Optional[str], response: Response) -> None:
        if refresh_token:
            token_hash = _hash_refresh_token(refresh_token)
            result = await self.db.execute(
                select(RefreshToken).where(RefreshToken.token_hash == token_hash)
            )
            db_token = result.scalar_one_or_none()
            if db_token:
                db_token.is_revoked = True
                await self.db.commit()
        response.delete_cookie("refresh_token")
