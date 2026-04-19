import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from database import SessionLocal
from models.user import User
from schemas.user import UserCreate, UserLogin
from utils.security import create_token, get_current_user, hash_password, verify_password


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate):
    db = SessionLocal()

    try:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists.",
            )

        user = User(
            email=user_data.email,
            password=hash_password(user_data.password),
        )

        db.add(user)
        db.commit()

        return {"message": "User created successfully."}
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists.",
        ) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Failed to create user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user.",
        ) from exc
    finally:
        db.close()


@router.post("/login")
def login(user_data: UserLogin):
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.email == user_data.email).first()
        if user is None or not verify_password(user_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        access_token = create_token({"user_id": user.id})

        return {"access_token": access_token}
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        logger.exception("Failed to authenticate user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to authenticate user.",
        ) from exc
    finally:
        db.close()


@router.get("/me")
def me(user_id: int = Depends(get_current_user)):
    return {"user_id": user_id}
