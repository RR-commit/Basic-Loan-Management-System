
# backend/tests/test_loans.py
from fastapi import status
from typing import Dict

def _register_and_login(client, full_name: str, email: str, password: str, role: str = "USER") -> Dict[str, str]:
    """
    Helper: registers a user (or admin) and returns headers with Authorization bearer token.
    """
    r = client.post("/auth/register", json={
        "full_name": full_name,
        "email": email,
        "password": password,
        "confirm_password": password,
        "role": role
    })
    assert r.status_code == status.HTTP_200_OK, f"Register failed: {r.text}"

    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == status.HTTP_200_OK, f"Login failed: {r.text}"
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_user_apply_and_my_loans(client):
    user_headers = _register_and_login(client, "User One", "user1@example.com", "secret123", role="USER")

    # Apply loan
    payload = {"amount": 100000, "income": 50000, "credit_score": 720, "term_months": 60}
    r = client.post("/loans/", json=payload, headers=user_headers)
    assert r.status_code == status.HTTP_200_OK, r.text
    loan = r.json()
    assert loan["status"] == "PENDING"
    assert 0.0 <= loan["risk_score"] <= 1.0

    # My loans should show it
    r = client.get("/loans/my", headers=user_headers)
    assert r.status_code == status.HTTP_200_OK, r.text
    items = r.json()
    assert len(items) >= 1
    assert loan["id"] in [it["id"] for it in items]

    # My loans filter
    r = client.get("/loans/my", headers=user_headers, params={"status_filter": "PENDING"})
    assert r.status_code == status.HTTP_200_OK, r.text
    filtered = r.json()
    assert all(it["status"] == "PENDING" for it in filtered)


def test_admin_pending_and_decision(client):
    # User applies
    user_headers = _register_and_login(client, "User Two", "user2@example.com", "secret123", role="USER")
    r = client.post(
        "/loans/",
        json={"amount": 50000, "income": 45000, "credit_score": 700, "term_months": 24},
        headers=user_headers
    )
    assert r.status_code == status.HTTP_200_OK, r.text
    loan_id = r.json()["id"]

    # Admin login
    admin_headers = _register_and_login(client, "Admin One", "admin1@example.com", "secret123", role="ADMIN")

    # Admin sees pending
    r = client.get("/loans/pending", headers=admin_headers)
    assert r.status_code == status.HTTP_200_OK, r.text
    pending_ids = [it["id"] for it in r.json()]
    assert loan_id in pending_ids

    # Admin decides manually (approve) — body shape must be {"action": "APPROVED"}
    r = client.post(f"/loans/{loan_id}/decision", json={"action": "APPROVED"}, headers=admin_headers)
    assert r.status_code == status.HTTP_200_OK, r.text
    assert r.json()["status"] == "APPROVED"

    # Pending should no longer include this loan
    r = client.get("/loans/pending", headers=admin_headers)
    assert r.status_code == status.HTTP_200_OK, r.text
    assert loan_id not in [it["id"] for it in r.json()]


def test_users_cannot_see_others_loans(client):
    # Two users
    headers_a = _register_and_login(client, "User A", "ua@example.com", "secret123", role="USER")
    headers_b = _register_and_login(client, "User B", "ub@example.com", "secret123", role="USER")

    # A applies
    r = client.post(
        "/loans/",
        json={"amount": 20000, "income": 30000, "credit_score": 650, "term_months": 12},
        headers=headers_a
    )
    assert r.status_code == status.HTTP_200_OK, r.text
    loan_id = r.json()["id"]

    # A can see it
    r = client.get("/loans/my", headers=headers_a)
    assert loan_id in [it["id"] for it in r.json()]

    # B cannot fetch A's detail
    r = client.get(f"/loans/my/{loan_id}", headers=headers_b)
    assert r.status_code == status.HTTP_404_NOT_FOUND, r.text


def test_security_unauthorized_forbidden(client):
    # Unauthorized apply (no token)
    r = client.post(
        "/loans/",
        json={"amount": 10000, "income": 20000, "credit_score": 600, "term_months": 12}
    )
    assert r.status_code == status.HTTP_401_UNAUTHORIZED, r.text

    # User tries to access admin pending
    user_headers = _register_and_login(client, "User C", "userc@example.com", "secret123", role="USER")
    r = client.get("/loans/pending", headers=user_headers)
    assert r.status_code == status.HTTP_403_FORBIDDEN, r.text
