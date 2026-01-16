
# app/routers/loan_routes.py

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import LoanApplication
from ..schemas import LoanCreate, LoanOut, DecisionRequest
from ..deps import get_current_user, require_admin
from ..services.risk import compute_risk, approval_decision
from ..mongo import get_mongo_db

router = APIRouter(prefix="/loans", tags=["loans"])


@router.post("/", response_model=LoanOut)
def apply_loan(
    payload: LoanCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Create a new loan application for the current user.
    Computes a risk score and stores status='PENDING'.
    Also logs calculation details to MongoDB.
    """
    risk = compute_risk(
        payload.amount,
        payload.income,
        payload.credit_score,
        payload.term_months
    )
    loan = LoanApplication(
        user_id=user.id,
        amount=payload.amount,
        income=payload.income,
        credit_score=payload.credit_score,
        term_months=payload.term_months,
        risk_score=risk,
        status="PENDING"  # store as string in DB
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    
    # Calculate intermediate factors for logging
    debt_ratio = payload.amount / payload.income
    credit_factor = (850 - payload.credit_score) / 550
    term_factor = payload.term_months / 360
    
    # Log calculation details to MongoDB
    try:
        mongo_db = get_mongo_db()
        calculation_log = {
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "loan_id": loan.id,
            "amount": payload.amount,
            "income": payload.income,
            "credit_score": payload.credit_score,
            "term_months": payload.term_months,
            "debt_ratio": debt_ratio,
            "credit_factor": credit_factor,
            "term_factor": term_factor,
            "risk_score": risk,
            "timestamp": datetime.utcnow(),
            "action": "loan_calculation"
        }
        mongo_db.calculations.insert_one(calculation_log)
        
        # Also log as activity
        activity_log = {
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "action": "apply_loan",
            "details": {
                "loan_id": loan.id,
                "amount": payload.amount,
                "risk_score": risk
            },
            "timestamp": datetime.utcnow()
        }
        mongo_db.activities.insert_one(activity_log)
    except Exception as e:
        # Log error but don't fail loan creation
        print(f"Warning: Failed to log loan calculation to MongoDB: {str(e)}")
    
    return loan


@router.get("/pending", response_model=list[LoanOut])
def list_pending(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """
    Admin-only: list all PENDING loan applications.
    """
    items = (
        db.query(LoanApplication)
        .filter(LoanApplication.status == "PENDING")
        .order_by(LoanApplication.id.desc())
        .all()
    )
    return items


@router.post("/{loan_id}/decision", response_model=LoanOut)
def decide(
    loan_id: int,
    payload: DecisionRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    """
    Admin-only: decide a loan application.
    - If `payload.action` is provided (APPROVED/REJECTED), it forces that status.
    - Otherwise, auto-decides based on risk score via approval_decision().
    Prevent re-deciding an already decided loan.
    Also logs decision to MongoDB.
    """
    from ..models import User
    
    loan = db.query(LoanApplication).filter(LoanApplication.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found")

    if loan.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Loan already {loan.status}")

    if payload.action in ("APPROVED", "REJECTED"):
        loan.status = payload.action
    else:
        loan.status = approval_decision(loan.risk_score)  # returns "APPROVED"/"REJECTED"

    db.commit()
    db.refresh(loan)
    
    # Get user info to log decision
    user = db.query(User).filter(User.id == loan.user_id).first()
    
    # Log decision to MongoDB
    try:
        mongo_db = get_mongo_db()
        decision_log = {
            "admin_id": admin.id,
            "admin_email": admin.email,
            "user_id": loan.user_id,
            "user_email": user.email if user else "unknown",
            "loan_id": loan.id,
            "decision": loan.status,
            "risk_score": loan.risk_score,
            "timestamp": datetime.utcnow(),
            "action": "loan_decision"
        }
        mongo_db.activities.insert_one(decision_log)
    except Exception as e:
        # Log error but don't fail decision
        print(f"Warning: Failed to log loan decision to MongoDB: {str(e)}")
    
    return loan


@router.get("/my", response_model=list[LoanOut])
def my_loans(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    status_filter: Optional[str] = Query(
        default=None,
        description="Optional: filter by status (PENDING, APPROVED, REJECTED)"
    )
):
    """
    List loans belonging to the current user.
    Optional filter: status_filter (PENDING/APPROVED/REJECTED).
    """
    q = db.query(LoanApplication).filter(LoanApplication.user_id == user.id)
    if status_filter in ("PENDING", "APPROVED", "REJECTED"):
        q = q.filter(LoanApplication.status == status_filter)

    items = (
        q.order_by(LoanApplication.id.desc())
         .all()
    )
    return items


@router.get("/my/{loan_id}", response_model=LoanOut)
def my_loan_detail(
    loan_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Get a single loan for the current user by ID.
    Returns 404 if not found or doesn't belong to the user (no data leakage).
    """
    loan = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.id == loan_id,
            LoanApplication.user_id == user.id
        )
        .first()
    )
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found")
    return loan


@router.get("/my-loans", response_model=list[LoanOut])
def my_loans_alias(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    status_filter: Optional[str] = Query(
        default=None,
        description="Optional: filter by status (PENDING, APPROVED, REJECTED)"
    )
):
    """
    Alias for /loans/my endpoint.
    List loans belonging to the current user.
    Optional filter: status_filter (PENDING/APPROVED/REJECTED).
    """
    q = db.query(LoanApplication).filter(LoanApplication.user_id == user.id)
    if status_filter in ("PENDING", "APPROVED", "REJECTED"):
        q = q.filter(LoanApplication.status == status_filter)

    items = (
        q.order_by(LoanApplication.id.desc())
         .all()
    )
    return items


@router.get("/all", response_model=list[dict])
def all_loans(
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
    status_filter: Optional[str] = Query(
        default=None,
        description="Optional: filter by status (PENDING, APPROVED, REJECTED)"
    )
):
    """
    Admin-only: Get all loans in the system with user details and optional status filter.
    """
    from ..models import User
    
    q = db.query(LoanApplication)
    if status_filter in ("PENDING", "APPROVED", "REJECTED"):
        q = q.filter(LoanApplication.status == status_filter)

    loans = q.order_by(LoanApplication.id.desc()).all()
    
    # Build response with user info
    result = []
    for loan in loans:
        user = db.query(User).filter(User.id == loan.user_id).first()
        loan_dict = {
            "id": loan.id,
            "user_id": loan.user_id,
            "user_email": user.email if user else "unknown",
            "user_name": user.full_name if user else "unknown",
            "amount": loan.amount,
            "income": loan.income,
            "credit_score": loan.credit_score,
            "term_months": loan.term_months,
            "status": loan.status,
            "risk_score": loan.risk_score
        }
        result.append(loan_dict)
    
    return result
