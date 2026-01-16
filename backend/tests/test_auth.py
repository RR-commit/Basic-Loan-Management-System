
# backend/tests/test_auth.py
from fastapi import status

def test_register_user_success(client):
    r = client.post("/auth/register", json={
        "full_name": "Alice Johnson",
        "email": "alice@example.com",
        "password": "secret123",
        "confirm_password": "secret123",
        "role": "USER"
    })
    assert r.status_code == status.HTTP_200_OK, r.text
    data = r.json()
    assert data["full_name"] == "Alice Johnson"
    assert data["email"] == "alice@example.com"
    assert data["role"] == "USER"

def test_register_admin_success(client):
    r = client.post("/auth/register", json={
        "full_name": "Admin Person",
        "email": "admin@example.com",
        "password": "secret123",
        "confirm_password": "secret123",
        "role": "ADMIN"
    })
    assert r.status_code == status.HTTP_200_OK, r.text
    assert r.json()["role"] == "ADMIN"


def test_register_password_mismatch(client):
    r = client.post("/auth/register", json={
        "full_name": "Bob Mismatch",
        "email": "bob@example.com",
        "password": "secret123",
        "confirm_password": "notthesame",
        "role": "USER"
    })
    assert r.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT, r.text

def test_register_duplicate_email(client):
    # First register
    r1 = client.post("/auth/register", json={
        "full_name": "Carol One",
        "email": "dup@example.com",
        "password": "secret123",
        "confirm_password": "secret123",
        "role": "USER"
    })
    assert r1.status_code == status.HTTP_200_OK, r1.text

    # Second register with same email should 400
    r2 = client.post("/auth/register", json={
        "full_name": "Carol Two",
        "email": "dup@example.com",
        "password": "secret123",
        "confirm_password": "secret123",
        "role": "USER"
    })
    assert r2.status_code == status.HTTP_400_BAD_REQUEST, r2.text
    assert r2.json()["detail"] == "Email already registered"

def test_login_success(client):
    # Register a user
    client.post("/auth/register", json={
        "full_name": "Login User",
        "email": "loginuser@example.com",
        "password": "secret123",
        "confirm_password": "secret123",
        "role": "USER"
    })
    # Login
    r = client.post("/auth/login", json={
        "email": "loginuser@example.com",
        "password": "secret123"
    })
    assert r.status_code == status.HTTP_200_OK, r.text
    token = r.json().get("access_token")
    assert token and isinstance(token, str)
