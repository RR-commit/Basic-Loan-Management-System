
# app/config.py
from pydantic import BaseModel, ConfigDict
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

class Settings(BaseModel):
    model_config = ConfigDict(
        extra="ignore"  # safely ignore unexpected env vars
    )

    SECRET_KEY: str = os.getenv("SECRET_KEY", "change_me")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    SQLALCHEMY_DATABASE_URL: str = os.getenv("SQLALCHEMY_DATABASE_URL", "sqlite:///./app.db")
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB: str = os.getenv("MONGODB_DB", "loan_risk")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

settings = Settings()
