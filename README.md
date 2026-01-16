# Loan Management System (LMS) - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [Project Structure](#project-structure)
5. [How It Works](#how-it-works)
6. [Database Conditions & Rules](#database-conditions--rules)
7. [API Endpoints](#api-endpoints)
8. [User Flows](#user-flows)
9. [Code Explanations](#code-explanations)
10. [Testing](#testing)

---

## Project Overview

### What is LMS?
The **Loan Management System (LMS)** is a full-stack web application that enables:
- **Users**: To apply for loans with automated risk assessment
- **Admins**: To review, approve, or reject loan applications based on risk scores

### Why This Project?
- **Automated Risk Assessment**: Eliminates manual evaluation delays
- **Fair & Transparent**: Risk calculation shown step-by-step to users
- **Scalable**: Handles multiple applications with status tracking
- **Role-Based Access**: Different dashboards for users and admins

### How It Works (High Level)
```
User Application → Risk Calculation → Admin Review → Approval/Rejection
    ↓                  ↓                    ↓              ↓
Web Form      Algorithm (4 steps)    Dashboard     Database Update
```

---

## Features

### 👤 User Features
| Feature | Description |
|---------|-------------|
| **Register** | Create account as a regular user |
| **Login** | Authenticate with email/password |
| **Apply Loan** | Submit loan application with details |
| **View Calculations** | See risk score broken down in 4 steps |
| **Track Loans** | View application status and history |
| **Max 2 Pending** | Can have up to 2 applications pending at once |
| **Dashboard** | Personal loan summary with filters |

### 🛡️ Admin Features
| Feature | Description |
|---------|-------------|
| **Auto-Redirect** | Dashboard appears on login |
| **Review Pending** | See all pending applications |
| **Risk Analysis** | View complete risk calculation for each loan |
| **Approve/Reject** | Make decisions on applications |
| **Auto-Decide** | System makes decision based on risk threshold |
| **Filter** | View by Pending, Approved, or Rejected |
| **Statistics** | Real-time count of all application statuses |

### 🔐 Security & Validation
- JWT-based authentication
- Password strength validation (min 6 characters)
- Role-based access control (USER/ADMIN)
- Email validation
- Loan application validation
- Credit score range check (300-850)

---

## Installation & Setup

### Prerequisites
- **Node.js** 16+ (for frontend)
- **Python** 3.9+ (for backend)
- **npm** or **yarn** (package manager)
- **pip** (Python package manager)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create SQLite database (if not exists)
# Database auto-creates on first run

# Run server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8080
```

**Backend runs on**: `http://127.0.0.1:8080`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs on**: `http://localhost:5173`

### 3. Access the Application

- **User Registration**: http://localhost:5173/register
- **User Login**: http://localhost:5173/login
- **Admin Dashboard**: http://localhost:5173/admin (auto-redirects on admin login)
- **Home Page**: http://localhost:5173

---

## Project Structure

```
Project Basic LMS/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app initialization
│   │   ├── schemas.py           # Data validation (Pydantic)
│   │   ├── database.py          # Database connection
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── routers/
│   │   │   ├── auth_routes.py   # Login/Register endpoints
│   │   │   └── loan_routes.py   # Loan application endpoints
│   │   └── services/
│   │       └── risk_service.py  # Risk calculation logic
│   └── requirements.txt         # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.tsx         # Landing page
    │   │   ├── Register.tsx     # User registration
    │   │   ├── Login.tsx        # User login
    │   │   ├── ApplyLoan.tsx    # Loan application form
    │   │   ├── MyLoans.tsx      # User dashboard
    │   │   └── Admin.tsx        # Admin dashboard
    │   ├── components/
    │   │   └── Nav.tsx          # Navigation bar
    │   ├── api/
    │   │   ├── client.ts        # Axios setup & token management
    │   │   └── auth.ts          # Auth API calls
    │   ├── types/
    │   │   └── index.ts         # TypeScript types
    │   ├── index.css            # Global styles (300 lines)
    │   └── App.tsx              # Main app component
    └── package.json
```

---

## How It Works

### 1. Risk Calculation Algorithm

Risk Score = (Debt Ratio × 0.5) + (Credit Factor × 0.4) + (Term Factor × 0.1)

**Step 1: Debt Ratio** (Weight: 50%)
```
Debt Ratio = Loan Amount ÷ Annual Income
Example: ₹500,000 ÷ ₹1,000,000 = 0.5
```

**Step 2: Credit Factor** (Weight: 40%)
```
Credit Factor = (850 - Credit Score) ÷ 550
Example: (850 - 650) ÷ 550 = 0.3636
Range: Better credit → Lower factor → Lower risk
```

**Step 3: Term Factor** (Weight: 10%)
```
Term Factor = Loan Term ÷ 360 months
Example: 60 months ÷ 360 = 0.1667
Longer term = Higher risk (more payments = more default risk)
```

**Step 4: Final Risk Score**
```
Risk = (0.5 × 0.5) + (0.3636 × 0.4) + (0.1667 × 0.1) = 0.367
Range: 0 (Lowest Risk) → 1 (Highest Risk)
```

### 2. Approval Logic

| Risk Score | Decision |
|------------|----------|
| **< 0.35** | ✅ **AUTO APPROVED** - Safe to approve |
| **0.35-0.65** | ⚠️ **MANUAL REVIEW** - Requires admin decision |
| **> 0.65** | ❌ **AUTO REJECTED** - Too risky |

### 3. User Loan Limits

- **Maximum Pending Loans**: 2 at a time
- **Application States**:
  - PENDING: Waiting for admin decision
  - APPROVED: Loan granted
  - REJECTED: Application denied
- **New Applications**: Can apply again after approval or rejection, but max 2 PENDING at once

### 4. Authentication Flow

```
User Input (Email/Password)
         ↓
Backend Validation & Hashing
         ↓
Create JWT Token
         ↓
Return: {access_token, user_id, email, full_name, role}
         ↓
Store in localStorage (frontend)
         ↓
Auto-sync every 500ms via Nav.tsx polling
```

---

## Database Conditions & Rules

### Users Table Conditions
```sql
-- Unique email constraint
UNIQUE (email)

-- Password stored as bcrypt hash
-- Never stored in plaintext

-- Role: 'USER' or 'ADMIN'
-- Default: 'USER' for registration
-- Change to 'ADMIN' manually in database only
```

### Loans Table Conditions
```sql
-- User can have multiple loans
-- Foreign Key: user_id → users.id

-- Status: 'PENDING', 'APPROVED', 'REJECTED'
-- Initial: 'PENDING' on creation

-- Amount: Must be > 0
-- Income: Must be > 0
-- Credit Score: 300-850 (standard FICO range)
-- Term: 6-360 months

-- Risk calculated and stored automatically
```

### Business Rules
| Rule | Condition | Action |
|------|-----------|--------|
| **Duplicate Email** | Email already exists | Registration fails |
| **Max Pending** | User has 2+ PENDING loans | Cannot apply new loan |
| **Auto Approve** | Risk < 0.35 | Status → APPROVED |
| **Auto Reject** | Risk > 0.65 | Status → REJECTED |
| **Manual Review** | 0.35 ≤ Risk ≤ 0.65 | Admin must decide |
| **Invalid Score** | Score < 300 or > 850 | Application fails |
| **Invalid Term** | Term < 6 or > 360 | Application fails |
| **Invalid Amount** | Amount ≤ 0 | Application fails |
| **Invalid Income** | Income ≤ 0 | Application fails |

---

## API Endpoints

### Authentication Endpoints

**POST** `/users/register`
```json
Request:
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirm_password": "password123",
  "role": "USER"
}

Response (201):
{
  "id": 1,
  "email": "john@example.com",
  "full_name": "John Doe",
  "role": "USER"
}
```

**POST** `/users/login`
```json
Request:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user_id": 1,
  "email": "john@example.com",
  "full_name": "John Doe",
  "role": "USER"
}
```

### Loan Endpoints

**POST** `/loans/apply`
```json
Request (Headers: Authorization: Bearer {token}):
{
  "amount": 500000,
  "income": 1000000,
  "credit_score": 650,
  "term_months": 60
}

Response (201):
{
  "id": 1,
  "amount": 500000,
  "status": "PENDING",
  "risk_score": 0.367,
  "created_at": "2025-01-15T10:30:00"
}
```

**GET** `/loans/my-loans`
```json
Response (200):
[
  {
    "id": 1,
    "amount": 500000,
    "income": 1000000,
    "credit_score": 650,
    "term_months": 60,
    "status": "PENDING",
    "risk_score": 0.367,
    "user_id": 1,
    "user_email": "john@example.com",
    "user_name": "John Doe"
  }
]
```

**GET** `/loans/all` (Admin only)
```json
Response (200):
[
  {
    "id": 1,
    "user_id": 1,
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "amount": 500000,
    "income": 1000000,
    "credit_score": 650,
    "term_months": 60,
    "status": "PENDING",
    "risk_score": 0.367
  }
]
```

**PUT** `/loans/{loan_id}/decide`
```json
Request (Admin only):
{
  "decision": "APPROVED"  // or "REJECTED"
}

Response (200):
{
  "id": 1,
  "status": "APPROVED",
  "message": "Loan approved successfully"
}
```

---

## User Flows

### 🔄 User Registration & Loan Application Flow

```
1. REGISTER
   Input: Name, Email, Password
   ↓
   Backend validates email uniqueness & password length
   ↓
   Stores user with role='USER' (encrypted password)
   ↓
   ✓ Success → Redirect to Login

2. LOGIN
   Input: Email, Password
   ↓
   Backend validates credentials
   ↓
   Creates JWT token + returns user info
   ↓
   Frontend stores in localStorage
   ↓
   ✓ Success → Redirect to Home (or Auto to Dashboard if Admin)

3. APPLY FOR LOAN
   Input: Amount, Income, Credit Score (300-850), Term (6-360 months)
   ↓
   Frontend validates all inputs
   ↓
   Sends to backend with JWT token
   ↓
   Backend calculates risk score in 4 steps
   ↓
   Checks if user has < 2 PENDING loans
   ↓
   Creates loan record with status='PENDING'
   ↓
   ✓ Success → Redirect to My Loans Dashboard

4. VIEW LOANS
   Frontend fetches /loans/my-loans
   ↓
   Displays with status filters
   ↓
   Shows 4-step risk calculation for each
   ✓ Can see: Status, Amount, Risk, Approval Chance

5. WAIT FOR ADMIN DECISION
   User sees loan status updates
   ↓
   Admin reviews and approves/rejects
   ↓
   Status auto-updates on frontend (every 500ms polling)
   ↓
   User can apply new loan after decision (not blocked by old loans)
```

### 🛡️ Admin Decision Flow

```
1. ADMIN LOGIN
   Email: admin@example.com, Password: ***
   ↓
   Backend validates, returns role='ADMIN'
   ↓
   Frontend detects role='ADMIN'
   ↓
   ✓ Auto-redirect to /admin dashboard

2. VIEW PENDING LOANS
   Fetches /loans/all with filter (PENDING tab)
   ↓
   Shows all pending applications
   ↓
   Displays: Applicant, Amount, Risk Score, Income, Credit Score

3. REVIEW LOAN
   Click on loan card
   ↓
   Shows detailed view:
     - Applicant info (Name, Email, ID)
     - Loan details (Amount, Income, Credit, Term)
     - Risk breakdown (4-step calculation)
     - Approval probability (%)
     - Decision buttons
     - ⚠️ Warning if 35-65% risk (manual review required)

4. MAKE DECISION
   Option A: ✅ APPROVE
     → Recommended if Risk < 0.35
     → Loan status → APPROVED
   
   Option B: ❌ REJECT
     → Recommended if Risk > 0.65
     → Loan status → REJECTED
   
   Option C: 🤖 AUTO DECIDE
     → If Risk < 0.35: Auto-approve
     → If Risk > 0.65: Auto-reject
     → If 0.35-0.65: Shows warning (manual review required)

5. CONFIRMATION
   ✓ Decision recorded with timestamp
   ✓ Status updated in database
   ✓ User can see new status on their dashboard
```

---

## Code Explanations

### Frontend: React Components

#### 1. **Nav.tsx** - Navigation & Auth Sync
```typescript
// Polling mechanism: Every 500ms, check if auth state changed
const interval = setInterval(syncAuth, 500);

// Why 500ms? 
// - Fast enough to detect logout (feels instant to user)
// - Not too fast to cause performance issues
// - Standard for real-time UI updates in web apps

// Counts PENDING loans only (not total or approved)
const pendingCount = loans.filter(l => l.status === "PENDING").length;
const remainingLoans = 2 - pendingCount;

// This updates every time loan status changes anywhere
// User sees: "Remaining: 1" updates automatically
```

**Concepts Used**: 
- React Hooks (useState, useEffect, setInterval)
- localStorage API (key-value browser storage)
- Polling pattern (check state repeatedly)
- Array filter & count
- Conditional rendering (show/hide based on user role)

#### 2. **ApplyLoan.tsx** - Risk Calculation
```typescript
// Risk Formula (4 steps weighted average)
const debtRatio = amount / income;           
// Step 1: How much of yearly income is the loan?
// Example: Loan 500k / Income 1M = 0.5 (50% of income)

const creditFactor = (850 - creditScore) / 550;  
// Step 2: How good is the credit score?
// 850 = Perfect score, 300 = Worst
// Example: (850 - 650) / 550 = 0.3636
// Better credit = Smaller number = Less risk

const termFactor = termMonths / 360;         
// Step 3: How long to repay?
// More time = More default risk
// Example: 60 months / 360 = 0.1667

// Final calculation (weighted combination)
const riskScore = 
  (debtRatio * 0.5) +      // 50% weight to debt ratio
  (creditFactor * 0.4) +   // 40% weight to credit factor  
  (termFactor * 0.1);      // 10% weight to term factor

// Why these weights?
// - Debt Ratio (50%): Most important - can they afford it?
// - Credit Factor (40%): History of payments
// - Term Factor (10%): Loan duration (least important)
```

**Concepts Used**:
- Form validation (check inputs before submission)
- Mathematical calculations
- Data validation (score 300-850, term 6-360)
- Error handling (try-catch)
- Async/await for API calls

#### 3. **Admin.tsx** - Risk-Based Decisions
```typescript
// Auto-decide logic based on risk thresholds
if (riskScore < 0.35) {
  // APPROVE - Low risk
  // Interpretation: Low debt, good credit, short term
  status = "APPROVED";
} else if (riskScore > 0.65) {
  // REJECT - High risk
  // Interpretation: High debt, poor credit, long term
  status = "REJECTED";
} else {
  // MANUAL - Middle ground (0.35 - 0.65)
  // Can't auto-decide - show warning
  // "⚠️ Risk score in middle range (35-65%) - requires manual review"
  showWarning = true;  // Display below buttons
}

// Show warning below action buttons
// Helps admin understand why auto-decide isn't available
```

**Concepts Used**:
- Conditional logic (if-else statements)
- Array operations (filter, map, find)
- Grid layouts (responsive grid for loans)
- Modal/detail views (show more info when clicked)
- Date formatting and display

#### 4. **MyLoans.tsx** - User Dashboard
```typescript
// Show 4-step calculation for complete transparency
// This builds user trust - no "black box" decisions

// Step 1
Debt Ratio = ₹500,000 ÷ ₹1,000,000 = 0.5
Weight: 50%

// Step 2  
Credit Factor = (850 - 650) ÷ 550 = 0.3636
Weight: 40%

// Step 3
Term Factor = 60 ÷ 360 = 0.1667
Weight: 10%

// Step 4
Final = (0.5 × 0.5) + (0.3636 × 0.4) + (0.1667 × 0.1) = 0.367
Risk Level: MEDIUM

// Why show all this?
// - Transparency: Users understand how decisions are made
// - Trust: Not hiding the algorithm
// - Education: Users learn what affects approval
// - Appeal: User can explain if they disagree
```

**Concepts Used**:
- Component state management
- Array filtering (by status)
- Conditional rendering
- Responsive grid layouts
- Currency formatting (Indian Rupees)

## Testing

### Manual Testing Checklist

#### User Flow Testing
- [ ] Register with valid email & password
- [ ] Login with correct credentials
- [ ] Apply for loan with valid inputs
- [ ] View loan in My Loans dashboard
- [ ] See 4-step risk calculation
- [ ] Filter loans by status
- [ ] Logout and verify redirect to home

#### Admin Flow Testing
- [ ] Login as admin (role='ADMIN' in database)
- [ ] Auto-redirect to /admin dashboard
- [ ] See all pending applications
- [ ] Click to view loan details
- [ ] See risk warning for 35-65% range
- [ ] Approve a loan
- [ ] Reject a loan
- [ ] Auto-decide a loan
- [ ] Filter by Approved/Rejected tabs

#### Edge Cases & Validation
- [ ] Apply with 2 PENDING loans (3rd should fail)
- [ ] Credit score < 300 (should fail)
- [ ] Credit score > 850 (should fail)
- [ ] Loan term < 6 months (should fail)
- [ ] Loan term > 360 months (should fail)
- [ ] Income = 0 (should fail)
- [ ] Negative amount (should fail)
- [ ] Duplicate email registration (should fail)
- [ ] Password < 6 characters (should fail)
- [ ] Passwords don't match (should fail)
- [ ] Invalid email format (should fail)

#### Performance Testing
- [ ] Page loads without blank screen
- [ ] Navigation updates within 500ms
- [ ] Loan calculations display instantly
- [ ] Admin dashboard loads with 50+ loans

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| **Blank frontend page** | JavaScript error | Check browser console (F12) for errors |
| | Corrupted localStorage | Clear browser cache, delete localStorage |
| **Login fails** | Backend not running | Start backend: `uvicorn app.main:app --reload` |
| | Wrong credentials | Verify email/password are correct |
| **Cannot apply loan** | Max 2 PENDING | Wait for admin decision on existing loans |
| | Invalid inputs | Check: amount>0, income>0, score 300-850, term 6-360 |
| **Admin auto-redirect not working** | Wrong role in database | Set role='ADMIN' in users table |
| | Stale localStorage | Logout, clear browser cache, re-login |
| **Risk calculation wrong** | Formula mismatch | Verify formula in ApplyLoan.tsx = backend risk_service.py |
| **Remaining count stuck** | Polling issue | Refresh page or wait 500ms |

---

## Deployment

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
# Creates optimized files in dist/ folder
# Upload dist/ to web server (Netlify, Vercel, etc.)
```

**Backend:**
```bash
cd backend
# Production server command
uvicorn app.main:app --host 0.0.0.0 --port 8080
# Or use Gunicorn for better performance
gunicorn -w 4 -b 0.0.0.0:8080 app.main:app
```

---

## Future Enhancements

1. **Email Notifications**: Send approval/rejection emails to users
2. **Loan Amortization**: Show payment schedule breakdown
3. **Document Upload**: Upload income proof, government ID
4. **Multi-Language**: Support Hindi, Marathi, other languages
5. **Mobile App**: React Native or Flutter version
6. **Analytics Dashboard**: Trends and statistics for admins
7. **API Rate Limiting**: Prevent abuse and brute-force attacks
8. **Two-Factor Authentication**: Enhanced security
9. **Loan Refinancing**: Modify or extend existing loans
10. **Dynamic Interest Rates**: Calculate based on risk score

---

## Quick Reference

### Important Thresholds
- **Min Password Length**: 6 characters
- **Credit Score Range**: 300-850
- **Loan Term Range**: 6-360 months
- **Max Pending Loans**: 2
- **Risk Thresholds**: <0.35 (approve), 0.35-0.65 (manual), >0.65 (reject)
- **Auth Polling Interval**: 500ms

### Database Tables
- **users**: id, email, password_hash, full_name, role, created_at
- **loans**: id, user_id, amount, income, credit_score, term_months, status, risk_score, created_at
- **audit_logs**: id, action, user_id, details, timestamp

### Key Files to Understand
1. **Frontend Auth**: `frontend/src/api/client.ts` (token management)
2. **Frontend Form**: `frontend/src/pages/ApplyLoan.tsx` (risk calculation)
3. **Backend Calc**: `backend/app/services/risk_service.py` (algorithm)
4. **Backend Auth**: `backend/app/routers/auth_routes.py` (security)

---

