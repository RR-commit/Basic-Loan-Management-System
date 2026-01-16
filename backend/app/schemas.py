
# app/schemas.py
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from pydantic import model_validator
from enum import Enum

class Role(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class LoanStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

# ----- Auth -----
class UserRegister(BaseModel):
    full_name: str = Field(min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)
    confirm_password: str = Field(min_length=6)
    role: Role = Role.USER  # user can choose USER or ADMIN

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: Role
    model_config = ConfigDict(from_attributes=True)

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    role: str

# ----- Loans -----
class LoanCreate(BaseModel):
    amount: float = Field(gt=0)
    income: float = Field(gt=0)
    credit_score: int = Field(ge=300, le=850)
    term_months: int = Field(ge=6, le=360)

class LoanOut(BaseModel):
    id: int
    user_id: int
    amount: float
    income: float
    credit_score: int
    term_months: int
    status: LoanStatus
    risk_score: float
    model_config = ConfigDict(from_attributes=True)

class LoanOutWithUser(BaseModel):
    id: int
    user_id: int
    user_email: str = ""
    user_name: str = ""
    amount: float
    income: float
    credit_score: int
    term_months: int
    status: LoanStatus
    risk_score: float
    model_config = ConfigDict(from_attributes=True)

class DecisionRequest(BaseModel):
    action: str | None = Field(default=None, description="APPROVED or REJECTED")
