"""Modelos Pydantic del contrato público."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator


class PredictionRequest(BaseModel):
    """Features numéricas necesarias para una predicción."""

    est_diameter_min: float = Field(ge=0)
    est_diameter_max: float = Field(ge=0)
    relative_velocity: float = Field(ge=0)
    miss_distance: float = Field(ge=0)
    absolute_magnitude: float


class PredictionResponse(BaseModel):
    """Resultado normalizado de los modelos persistidos."""

    hazardous: bool
    probability: float
    anomaly_score: float
    model_version: str


Username = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=64)]
UserRole = Literal["admin", "user"]


class UserCreate(BaseModel):
    username: Username
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    role: UserRole = "user"

    @field_validator("password")
    @classmethod
    def bcrypt_password_length(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("La contraseña no puede superar 72 bytes")
        return password


class UserUpdate(BaseModel):
    username: Username | None = None
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6, max_length=72)
    is_active: bool | None = None
    role: UserRole | None = None

    @field_validator("password")
    @classmethod
    def bcrypt_password_length(cls, password: str | None) -> str | None:
        if password is not None and len(password.encode("utf-8")) > 72:
            raise ValueError("La contraseña no puede superar 72 bytes")
        return password


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    is_active: bool
    role: UserRole
