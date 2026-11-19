"""Inicialización de esquema y usuario administrador inicial."""

from sqlalchemy import select

from backend.app import models
from backend.app.auth import get_password_hash
from backend.app.config import ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME
from backend.app.database import Base, SessionLocal, engine


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        admin = db.scalar(
            select(models.User).where(
                (models.User.email == ADMIN_EMAIL.lower())
                | (models.User.username == ADMIN_USERNAME)
            )
        )
        if admin is None:
            db.add(
                models.User(
                    username=ADMIN_USERNAME,
                    email=ADMIN_EMAIL.lower(),
                    hashed_password=get_password_hash(ADMIN_PASSWORD),
                    is_active=True,
                    role="admin",
                )
            )
            db.commit()
        elif (
            admin.email != ADMIN_EMAIL.lower()
            or admin.username != ADMIN_USERNAME
        ):
            raise RuntimeError(
                "La cuenta de administrador configurada colisiona con un usuario existente."
            )
        elif admin.role != "admin" or not admin.is_active:
            admin.role = "admin"
            admin.is_active = True
            db.commit()
