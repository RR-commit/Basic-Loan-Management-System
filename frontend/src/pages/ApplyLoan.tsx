
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { applyLoan } from "../api/loans";
import { loadToken } from "../api/client";

interface LoanResponse {
  id: number;
  status: string;
  risk_score: number;
}

export default function ApplyLoan() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [income, setIncome] = useState("");
  const [credit_score, setCreditScore] = useState("");
  const [term_months, setTermMonths] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LoanResponse | null>(null);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [userLoans, setUserLoans] = useState<any[]>([]);
  const [loanLimitReached, setLoanLimitReached] = useState(false);

  useEffect(() => {
    checkUserLoans();
  }, []);

  const checkUserLoans = async () => {
    try {
      const token = loadToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://127.0.0.1:8080/loans/my-loans", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const loans = await response.json();
        setUserLoans(Array.isArray(loans) ? loans : []);
        // User can apply only if less than 2 PENDING loans exist
        const pendingLoans = Array.isArray(loans) ? loans.filter((l: any) => l.status === "PENDING") : [];
        if (pendingLoans.length >= 2) {
          setLoanLimitReached(true);
          setMsgType("error");
          setMsg("❌ You already have 2 pending loan applications. Please wait for approval or rejection before applying for another loan.");
        }
      }
    } catch (error) {
      console.error("Error fetching user loans:", error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const amountNum = Number(amount);
    if (!amount.trim()) {
      newErrors.amount = "Loan amount is required";
    } else if (amountNum <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    } else if (amountNum > 1000000) {
      newErrors.amount = "Amount cannot exceed $1,000,000";
    }

    const incomeNum = Number(income);
    if (!income.trim()) {
      newErrors.income = "Annual income is required";
    } else if (incomeNum <= 0) {
      newErrors.income = "Income must be greater than 0";
    }

    const scoreNum = Number(credit_score);
    if (!credit_score.trim()) {
      newErrors.credit_score = "Credit score is required";
    } else if (scoreNum < 300 || scoreNum > 850) {
      newErrors.credit_score = "Credit score must be between 300-850";
    }

    const termNum = Number(term_months);
    if (!term_months.trim()) {
      newErrors.term_months = "Loan term is required";
    } else if (termNum < 6 || termNum > 360) {
      newErrors.term_months = "Term must be between 6-360 months";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function submit() {
    if (loanLimitReached) {
      setMsgType("error");
      setMsg("You have reached the maximum loan limit.");
      return;
    }

    if (!validateForm()) {
      setMsgType("error");
      setMsg("Please fix the errors above");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        amount: Number(amount),
        income: Number(income),
        credit_score: Number(credit_score),
        term_months: Number(term_months),
      };

      const response = await applyLoan(payload);
      setResult(response);
      
      setMsgType("success");
      setMsg("✓ Loan application submitted successfully!");
      setErrors({});

      // Log to MongoDB with calculation details
      const debtRatio = payload.amount / payload.income;
      const creditFactor = (850 - payload.credit_score) / 550;
      const termFactor = payload.term_months / 360;
      const riskScore = (debtRatio * 0.5) + (creditFactor * 0.4) + (termFactor * 0.1);

      try {
        const token = loadToken();
        await fetch("http://127.0.0.1:8080/logs/calculation", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            loan_id: response.id,
            amount: payload.amount,
            income: payload.income,
            credit_score: payload.credit_score,
            term_months: payload.term_months,
            debt_ratio: debtRatio,
            credit_factor: creditFactor,
            term_factor: termFactor,
            risk_score: riskScore,
          }),
        });
      } catch (logError) {
        console.error("Error logging calculation:", logError);
      }

      setTimeout(() => {
        navigate("/my-loans");
      }, 2000);
    } catch (e: any) {
      setMsgType("error");
      setMsg(e?.response?.data?.detail || "Loan application failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isFormValid =
    !loanLimitReached &&
    amount.trim() &&
    income.trim() &&
    credit_score.trim() &&
    term_months.trim() &&
    Number(amount) > 0 &&
    Number(income) > 0 &&
    Number(credit_score) >= 300 &&
    Number(credit_score) <= 850 &&
    Number(term_months) >= 6 &&
    Number(term_months) <= 360;

  return (
    <div className="page-container">
      <div className="form-container" style={{ maxWidth: 600 }}>
        <h2>Apply for Loan</h2>
        <p className="subtitle">Fill in your details to apply for a loan</p>

        {loanLimitReached && (
          <div className="message message-error" style={{ marginBottom: "1.5rem" }}>
            ❌ Loan Limit Reached<br/>
            <small>You can only have 2 active loans. Please wait for approval/rejection on your pending loans.</small>
          </div>
        )}

        {!loanLimitReached && (
          <>
            <div className="form-group">
              <label>Loan Amount ($)</label>
              <input
                type="number"
                placeholder="e.g., 50000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className={errors.amount ? "input-error" : ""}
                disabled={loading}
              />
              {errors.amount && <span className="error-text">{errors.amount}</span>}
            </div>

            <div className="form-group">
              <label>Annual Income ($)</label>
              <input
                type="number"
                placeholder="e.g., 100000"
                value={income}
                onChange={e => setIncome(e.target.value)}
                className={errors.income ? "input-error" : ""}
                disabled={loading}
              />
              {errors.income && <span className="error-text">{errors.income}</span>}
            </div>

            <div className="form-group">
              <label>Credit Score (300-850)</label>
              <input
                type="number"
                placeholder="e.g., 750"
                value={credit_score}
                onChange={e => setCreditScore(e.target.value)}
                className={errors.credit_score ? "input-error" : ""}
                disabled={loading}
              />
              {errors.credit_score && <span className="error-text">{errors.credit_score}</span>}
            </div>

            <div className="form-group">
              <label>Loan Term (Months: 6-360)</label>
              <input
                type="number"
                placeholder="e.g., 60"
                value={term_months}
                onChange={e => setTermMonths(e.target.value)}
                className={errors.term_months ? "input-error" : ""}
                disabled={loading}
              />
              {errors.term_months && <span className="error-text">{errors.term_months}</span>}
            </div>

            {msg && (
              <div className={`message message-${msgType}`}>
                {msg}
              </div>
            )}

            <button
              onClick={submit}
              disabled={!isFormValid || loading}
              className={`btn btn-primary btn-large ${!isFormValid || loading ? "btn-disabled" : ""}`}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </>
        )}

        {result && (
          <div className="form-group" style={{ background: "#f0fdf4", padding: "1.5rem", borderRadius: "0.5rem" }}>
            <h3 style={{ color: "var(--success)", marginBottom: "1rem" }}>Application Submitted</h3>
            <div><strong>Loan ID:</strong> #{result.id}</div>
            <div><strong>Status:</strong> <span className="badge badge-pending">⏳ {result.status}</span></div>
            <div><strong>Risk Score:</strong> {Number(result.risk_score).toFixed(4)}</div>
            <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--gray-600)" }}>
              Redirecting to your loans in 2 seconds...
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
