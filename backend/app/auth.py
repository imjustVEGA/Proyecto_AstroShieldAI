"""Autenticación y emisión de tokens JWT."""

from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from backend.app.config import JWT_ALGORITHM, JWT_EXPIRE_MINUTES, JWT_SECRET

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

DEMO_PASSWORD_HASH = pwd_context.hash("admin123")
DEMO_USER = {"username": "admin", "disabled": False}


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def authenticate_user(username: str, password: str) -> dict | None:
    if username != DEMO_USER["username"] or not verify_password(password, DEMO_PASSWORD_HASH):
        return None
    if DEMO_USER["disabled"]:
        return None
    return DEMO_USER


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales no válidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise credentials_exception
    except JWTError as error:
        raise credentials_exception from error
    if username != DEMO_USER["username"]:
        raise credentials_exception
    return DEMO_USER
