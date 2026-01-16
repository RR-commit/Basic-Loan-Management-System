
# app/services/risk.py
from typing import Dict
from ..mongo import risk_logs

def compute_risk(amount: float, income: float, credit_score: int, term_months: int) -> float:
    """
    Simple rule-based risk model:
    - Higher amount vs income => higher risk
    - Lower credit_score => higher risk
    - Longer term => slightly higher risk
    """
    debt_ratio = amount / max(income, 1.0)
    credit_factor = (850 - credit_score) / 550
    term_factor = min(term_months / 360, 1.0)

    raw = (debt_ratio * 0.5) + (credit_factor * 0.4) + (term_factor * 0.1)
    score = float(min(max(raw, 0.0), 1.0))


    try:
        risk_logs.insert_one({
            "amount": amount,
            "income": income,
            "credit_score": credit_score,
            "term_months": term_months,
            "risk_score": score
        })
    except Exception:
        pass  # don't break API if Mongo isn't running in dev


    return score

def approval_decision(risk_score: float) -> str:
    return "APPROVED" if risk_score < 0.5 else "REJECTED"
