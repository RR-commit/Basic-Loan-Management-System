
# app/main.py
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers.auth_routes import router as auth_router
from .routers.loan_routes import router as loan_router
from .routers.logs_routes import router as logs_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger("loan-app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured")
    yield
    # Shutdown: dispose engine (helps on Windows file locks)
    try:
        engine.dispose()
        logger.info("Database engine disposed")
    except Exception as e:
        logger.warning(f"Engine dispose failed: {e}")

app = FastAPI(title="Loan Management System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(loan_router)
app.include_router(logs_router)
