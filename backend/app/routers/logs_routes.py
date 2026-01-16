# app/routers/logs_routes.py

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..mongo import get_mongo_db

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("/calculation")
def log_calculation(
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Log calculation details for a loan application to MongoDB.
    
    Expected payload:
    {
        "loan_id": int,
        "amount": float,
        "income": float,
        "credit_score": int,
        "term_months": int,
        "debt_ratio": float,
        "credit_factor": float,
        "term_factor": float,
        "risk_score": float
    }
    """
    try:
        mongo_db = get_mongo_db()
        
        calculation_log = {
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "loan_id": payload.get("loan_id"),
            "amount": payload.get("amount"),
            "income": payload.get("income"),
            "credit_score": payload.get("credit_score"),
            "term_months": payload.get("term_months"),
            "debt_ratio": payload.get("debt_ratio"),
            "credit_factor": payload.get("credit_factor"),
            "term_factor": payload.get("term_factor"),
            "risk_score": payload.get("risk_score"),
            "timestamp": datetime.utcnow(),
            "action": "loan_calculation"
        }
        
        result = mongo_db.calculations.insert_one(calculation_log)
        
        return {
            "success": True,
            "log_id": str(result.inserted_id),
            "message": "Calculation logged successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to log calculation: {str(e)}"
        )


@router.post("/activity")
def log_activity(
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Log user activity (login, logout, apply, etc.) to MongoDB.
    
    Expected payload:
    {
        "action": "login" | "logout" | "apply_loan" | "approve_loan" | "reject_loan",
        "details": {} (optional additional details)
    }
    """
    try:
        mongo_db = get_mongo_db()
        
        activity_log = {
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "action": payload.get("action"),
            "details": payload.get("details", {}),
            "timestamp": datetime.utcnow(),
        }
        
        result = mongo_db.activities.insert_one(activity_log)
        
        return {
            "success": True,
            "log_id": str(result.inserted_id),
            "message": "Activity logged successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to log activity: {str(e)}"
        )


@router.get("/user/activities")
def get_user_activities(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Retrieve all activities for the current user from MongoDB.
    """
    try:
        mongo_db = get_mongo_db()
        
        activities = list(
            mongo_db.activities.find(
                {"user_id": user.id}
            ).sort("timestamp", -1).limit(100)
        )
        
        # Convert ObjectId to string for JSON serialization
        for activity in activities:
            activity["_id"] = str(activity["_id"])
            activity["timestamp"] = activity["timestamp"].isoformat()
        
        return {
            "success": True,
            "count": len(activities),
            "activities": activities
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve activities: {str(e)}"
        )


@router.get("/user/calculations")
def get_user_calculations(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Retrieve all calculation logs for the current user from MongoDB.
    """
    try:
        mongo_db = get_mongo_db()
        
        calculations = list(
            mongo_db.calculations.find(
                {"user_id": user.id}
            ).sort("timestamp", -1).limit(100)
        )
        
        # Convert ObjectId to string for JSON serialization
        for calc in calculations:
            calc["_id"] = str(calc["_id"])
            calc["timestamp"] = calc["timestamp"].isoformat()
        
        return {
            "success": True,
            "count": len(calculations),
            "calculations": calculations
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve calculations: {str(e)}"
        )
