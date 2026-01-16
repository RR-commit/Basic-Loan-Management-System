
# backend/tests/conftest.py
import os
import sys
import uuid
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure 'backend' directory (where 'app' package lives) is on sys.path
CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parent.parent  # .../backend
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# --- Use a dedicated test DB file to avoid locks with app.db ---
TEST_DB_NAME = f"test_db_{uuid.uuid4().hex}.db"
TEST_DB_URL = f"sqlite:///{(BACKEND_DIR / TEST_DB_NAME).as_posix()}"

# Set env var BEFORE importing the app so app.database reads it
os.environ["SQLALCHEMY_DATABASE_URL"] = TEST_DB_URL

from app.main import app  # import after env override
from app.database import Base, engine

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """
    Create a clean schema at start of test session.
    We do not delete the file during tests to avoid WinError 32 on Windows.
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    # Dispose engine at end so Windows can release file handles
    try:
        engine.dispose()
    except Exception:
        pass
    # Optionally remove the test DB file AFTER disposing engine
    db_path = BACKEND_DIR / TEST_DB_NAME
    if db_path.exists():
        try:
            db_path.unlink()
        except Exception:
            pass

@pytest.fixture
def client():
    """
    Sync TestClient bound to the FastAPI app.
    """
    with TestClient(app) as c:
        yield c
