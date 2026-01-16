"""
BACKEND PYTEST TESTING GUIDE
============================

This file contains comprehensive pytest tests for all backend endpoints.
Each test is explained line-by-line for beginners.

What is pytest?
- pytest is a testing framework for Python
- It helps us verify that our code works correctly
- Each test function starts with "test_"
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to path so we can import our app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app, db_users, db_loans

# Create a test client - this lets us test the API without running a server
client = TestClient(app)

# ============================================================================
# AUTHENTICATION TESTS
# ============================================================================

class TestAuthentication:
    """Test user registration and login"""
    
    def test_register_user_success(self):
        """
        Test: User can register successfully
        
        Explanation:
        1. Clear database before test (start fresh)
        2. Prepare user data (name, email, password)
        3. Send POST request to /auth/register endpoint
        4. Check response status is 200 (success)
        5. Verify response contains success message
        """
        # Step 1: Clear database
        db_users.clear()
        db_loans.clear()
        
        # Step 2: Prepare user registration data
        user_data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "password": "SecurePass123",
            "confirm_password": "SecurePass123"
        }
        
        # Step 3: Send registration request
        response = client.post("/auth/register", json=user_data)
        
        # Step 4: Verify response
        assert response.status_code == 200  # HTTP 200 = OK
        assert "success" in response.json()["message"].lower()
    
    def test_register_user_password_mismatch(self):
        """
        Test: Registration fails if passwords don't match
        
        Explanation:
        1. Clear database
        2. Create user data with mismatched passwords
        3. Send registration request
        4. Verify we get an error (400 = Bad Request)
        """
        db_users.clear()
        
        # Passwords don't match
        user_data = {
            "full_name": "Jane Doe",
            "email": "jane@example.com",
            "password": "Pass123",
            "confirm_password": "Pass456"  # Different password!
        }
        
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 400  # Error status
        assert "do not match" in response.json()["detail"].lower()
    
    def test_register_duplicate_email(self):
        """
        Test: Can't register with same email twice
        
        Explanation:
        1. Clear database
        2. Register first user
        3. Try to register with same email again
        4. Verify we get 400 error (email already exists)
        """
        db_users.clear()
        
        user_data = {
            "full_name": "User One",
            "email": "duplicate@example.com",
            "password": "Pass123",
            "confirm_password": "Pass123"
        }
        
        # Register first user - should work
        response1 = client.post("/auth/register", json=user_data)
        assert response1.status_code == 200
        
        # Try to register second user with same email - should fail
        response2 = client.post("/auth/register", json=user_data)
        assert response2.status_code == 400
        assert "already" in response2.json()["detail"].lower()
    
    def test_login_success(self):
        """
        Test: User can login after registration
        
        Explanation:
        1. Clear database
        2. Register a user first
        3. Login with correct credentials
        4. Verify we receive an access token
        """
        db_users.clear()
        
        # Register user
        client.post("/auth/register", json={
            "full_name": "Login Test",
            "email": "login@test.com",
            "password": "Pass123",
            "confirm_password": "Pass123"
        })
        
        # Login with correct credentials
        response = client.post("/auth/login", json={
            "email": "login@test.com",
            "password": "Pass123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data  # JWT token should be in response
        assert data["user_role"] == "USER"  # Default role should be USER
    
    def test_login_wrong_password(self):
        """
        Test: Login fails with wrong password
        
        Explanation:
        1. Register a user
        2. Try to login with wrong password
        3. Verify we get 401 (Unauthorized) error
        """
        db_users.clear()
        
        # Register user
        client.post("/auth/register", json={
            "full_name": "Test User",
            "email": "wrong@test.com",
            "password": "CorrectPass123",
            "confirm_password": "CorrectPass123"
        })
        
        # Try login with wrong password
        response = client.post("/auth/login", json={
            "email": "wrong@test.com",
            "password": "WrongPass123"
        })
        
        assert response.status_code == 401  # Unauthorized


# ============================================================================
# LOAN APPLICATION TESTS
# ============================================================================

class TestLoanApplication:
    """Test loan application creation and retrieval"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """
        Setup function that runs before each test
        - Clears database
        - Registers a test user
        - Logs in to get access token
        """
        db_users.clear()
        db_loans.clear()
        
        # Register test user
        client.post("/auth/register", json={
            "full_name": "Loan Applicant",
            "email": "applicant@test.com",
            "password": "Pass123",
            "confirm_password": "Pass123"
        })
        
        # Login to get token
        login_response = client.post("/auth/login", json={
            "email": "applicant@test.com",
            "password": "Pass123"
        })
        
        self.token = login_response.json()["access_token"]
    
    def test_apply_loan_success(self):
        """
        Test: User can apply for a loan
        
        Explanation:
        1. Prepare loan application data
        2. Create Authorization header with token
        3. Send POST request to /loans/apply endpoint
        4. Verify response status is 201 (Created)
        5. Check response contains loan details with risk score
        """
        loan_data = {
            "amount": 100000,          # Loan amount in rupees
            "annual_income": 500000,   # User's yearly income
            "credit_score": 750,       # Credit score (300-850)
            "term_months": 60          # Loan duration in months
        }
        
        # Create authorization header with token
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Send loan application
        response = client.post("/loans/apply", json=loan_data, headers=headers)
        
        # Verify success
        assert response.status_code == 201  # 201 = Created
        data = response.json()
        assert "id" in data  # Loan should have an ID
        assert "risk_score" in data  # Risk score should be calculated
        assert data["status"] == "PENDING"  # Initial status is pending
    
    def test_apply_loan_without_token(self):
        """
        Test: Loan application fails without authentication token
        
        Explanation:
        1. Try to apply for loan WITHOUT authorization header
        2. Verify we get 401 (Unauthorized) error
        """
        loan_data = {
            "amount": 50000,
            "annual_income": 300000,
            "credit_score": 650,
            "term_months": 36
        }
        
        # Send request WITHOUT token
        response = client.post("/loans/apply", json=loan_data)
        
        assert response.status_code == 401  # Unauthorized
    
    def test_apply_multiple_loans(self):
        """
        Test: User can't apply for more than 2 pending loans
        
        Explanation:
        1. Apply for first loan - should succeed
        2. Apply for second loan - should succeed
        3. Try to apply for third loan - should fail (max 2 pending)
        """
        headers = {"Authorization": f"Bearer {self.token}"}
        
        loan_data = {
            "amount": 100000,
            "annual_income": 500000,
            "credit_score": 750,
            "term_months": 60
        }
        
        # First loan
        response1 = client.post("/loans/apply", json=loan_data, headers=headers)
        assert response1.status_code == 201
        
        # Second loan
        response2 = client.post("/loans/apply", json=loan_data, headers=headers)
        assert response2.status_code == 201
        
        # Third loan - should fail
        response3 = client.post("/loans/apply", json=loan_data, headers=headers)
        assert response3.status_code == 400  # Error
        assert "already have" in response3.json()["detail"].lower()


# ============================================================================
# RISK CALCULATION TESTS
# ============================================================================

class TestRiskCalculation:
    """Test risk score calculations"""
    
    def test_risk_score_low_risk(self):
        """
        Test: Low debt ratio = low risk score
        
        Risk Formula: (Debt × 0.5) + (Credit × 0.4) + (Term × 0.1)
        
        Example:
        - Amount: 50000
        - Income: 1000000 (high income, low debt)
        - Credit: 800 (good credit)
        - Term: 60 months
        
        Calculation:
        - Debt = 50000/1000000 = 0.05 × 0.5 = 0.025
        - Credit = (850-800)/550 = 0.09 × 0.4 = 0.036
        - Term = 60/360 = 0.167 × 0.1 = 0.0167
        - Total: 0.025 + 0.036 + 0.0167 = 0.0777 (LOW RISK)
        """
        db_users.clear()
        db_loans.clear()
        
        # Register and login
        client.post("/auth/register", json={
            "full_name": "Low Risk",
            "email": "lowrisk@test.com",
            "password": "Pass123",
            "confirm_password": "Pass123"
        })
        
        login = client.post("/auth/login", json={
            "email": "lowrisk@test.com",
            "password": "Pass123"
        })
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Apply for loan with low risk
        response = client.post("/loans/apply", json={
            "amount": 50000,
            "annual_income": 1000000,
            "credit_score": 800,
            "term_months": 60
        }, headers=headers)
        
        risk_score = response.json()["risk_score"]
        assert risk_score < 0.35  # Should be auto-approved
    
    def test_risk_score_high_risk(self):
        """
        Test: High debt ratio = high risk score
        
        Example:
        - Amount: 500000 (high loan amount)
        - Income: 300000 (low income, high debt)
        - Credit: 400 (poor credit)
        - Term: 360 months (long term)
        
        Result: Risk score > 0.65 (AUTO-REJECTED)
        """
        db_users.clear()
        db_loans.clear()
        
        # Register and login
        client.post("/auth/register", json={
            "full_name": "High Risk",
            "email": "highrisk@test.com",
            "password": "Pass123",
            "confirm_password": "Pass123"
        })
        
        login = client.post("/auth/login", json={
            "email": "highrisk@test.com",
            "password": "Pass123"
        })
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Apply for loan with high risk
        response = client.post("/loans/apply", json={
            "amount": 500000,
            "annual_income": 300000,
            "credit_score": 400,
            "term_months": 360
        }, headers=headers)
        
        risk_score = response.json()["risk_score"]
        assert risk_score > 0.65  # Should be auto-rejected
    
    def test_risk_score_manual_review(self):
        """
        Test: Medium risk = manual review required (35-65%)
        
        Example: Risk score between 0.35 and 0.65
        - Requires admin to manually approve or reject
        """
        db_users.clear()
        db_loans.clear()
        
        # Register and login
        client.post("/auth/register", json={
            "full_name": "Medium Risk",
            "email": "mediumrisk@test.com",
            "password": "Pass123",
            "confirm_password": "Pass123"
        })
        
        login = client.post("/auth/login", json={
            "email": "mediumrisk@test.com",
            "password": "Pass123"
        })
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Apply for loan with medium risk
        response = client.post("/loans/apply", json={
            "amount": 200000,
            "annual_income": 500000,
            "credit_score": 650,
            "term_months": 120
        }, headers=headers)
        
        risk_score = response.json()["risk_score"]
        assert 0.35 <= risk_score <= 0.65  # Manual review needed


# ============================================================================
# HOW TO RUN TESTS
# ============================================================================

"""
Run tests from command line:

1. Run all tests:
   pytest backend/test_main.py -v

2. Run specific test:
   pytest backend/test_main.py::TestAuthentication::test_register_user_success -v

3. Run with output:
   pytest backend/test_main.py -v -s

4. Run with coverage report:
   pytest backend/test_main.py --cov

Flags explained:
- -v : verbose (shows each test)
- -s : show print statements
- --cov : shows code coverage percentage
"""
