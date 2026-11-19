"""Rutas públicas de autenticación."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from backend.app.auth import authenticate_user, create_access_token

router = APIRouter(tags=["auth"])


@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> dict[str, str]:
    user = authenticate_user(form_data.username.strip(), form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {
        "access_token": create_access_token(user["username"]),
        "token_type": "bearer",
    }
