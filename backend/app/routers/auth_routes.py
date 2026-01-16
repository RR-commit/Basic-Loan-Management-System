
# app/routers/auth_routes.py
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..models import User
from ..schemas import UserRegister, UserOut, TokenOut, LoginRequest, Role
from ..auth import hash_password, verify_password, create_access_token
from ..mongo import get_mongo_db
from ..deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user with full_name, email, password/confirm_password, and role (USER or ADMIN).
    NOTE: Allowing self-selected ADMIN is insecure for production; keep it only for learning/demo.
    Also stores user data in MongoDB for audit trail.
    """
    # Basic duplicate check; we also handle unique constraint on commit
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user in SQLite
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role.value  # store as string in DB
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    db.refresh(user)
    
    # Also store in MongoDB for audit trail
    try:
        mongo_db = get_mongo_db()
        user_doc = {
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "registration_timestamp": datetime.utcnow(),
            "registration_action": "user_registered"
        }
        mongo_db.users.insert_one(user_doc)
    except Exception as e:
        # Log MongoDB error but don't fail registration
        print(f"Warning: Failed to log user registration to MongoDB: {str(e)}")
    
    return user

@router.post("/login", response_model=TokenOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email + password. Returns a bearer JWT token.
    Also logs login activity to MongoDB.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    token = create_access_token(subject=user.email)
    
    # Log login activity to MongoDB
    try:
        mongo_db = get_mongo_db()
        activity_log = {
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "action": "login",
            "timestamp": datetime.utcnow()
        }
        mongo_db.activities.insert_one(activity_log)
    except Exception as e:
        # Log error but don't fail login
        print(f"Warning: Failed to log login activity to MongoDB: {str(e)}")
    
    return TokenOut(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role
    )


@router.post("/logout")
def logout(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Logout endpoint. Logs logout activity to MongoDB.
    Note: JWT tokens don't have server-side revocation, but we log the action.
    """
    try:
        mongo_db = get_mongo_db()
        activity_log = {
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "action": "logout",
            "timestamp": datetime.utcnow()
        }
        mongo_db.activities.insert_one(activity_log)
    except Exception as e:
        # Log error but don't fail logout
        print(f"Warning: Failed to log logout activity to MongoDB: {str(e)}")
    
    return {
        "success": True,
        "message": "Successfully logged out"
    }
