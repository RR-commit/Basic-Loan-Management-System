# Loan Management System (LMS) - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [Project Structure](#project-structure)
5. [How It Works](#how-it-works)
6. [Testing](#testing)

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

