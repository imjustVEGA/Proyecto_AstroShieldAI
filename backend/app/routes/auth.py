"""Rutas públicas de autenticación."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.app.auth import authenticate_user, create_access_token
from backend.app.database import get_db
from backend.app.schemas import UserRead

router = APIRouter(tags=["auth"])


@router.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    user = authenticate_user(db, form_data.username.strip(), form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {
        "access_token": create_access_token(str(user.id)),
        "token_type": "bearer",
        "user": UserRead.model_validate(user).model_dump(mode="json"),
    }
