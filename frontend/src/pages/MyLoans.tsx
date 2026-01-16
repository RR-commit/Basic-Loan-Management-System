
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyLoans } from "../api/loans";
import { Loan, LoanStatus } from "../types";

interface LoanDetail extends Loan {
  calculations?: {
    debt_ratio: number;
    credit_factor: number;
    term_factor: number;
    risk_score: number;
  };
}

export default function MyLoans() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<LoanDetail[]>([]);
  const [allLoans, setAllLoans] = useState<LoanDetail[]>([]);
  const [status, setStatus] = useState<LoanStatus | "">("");
  const [msg, setMsg] = useState("");
  const [expandedLoan, setExpandedLoan] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetch(statusFilter?: LoanStatus) {
    try {
      const data = await getMyLoans(statusFilter);
      setLoans(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMsg(e?.response?.data?.detail || "Failed to load loans");
    }
  }

  useEffect(() => {
    setLoading(true);
    // Fetch all loans on mount
    async function fetchAll() {
      try {
        const data = await getMyLoans();
        const loansArray = Array.isArray(data) ? data : [];
        setAllLoans(loansArray);
        setLoans(loansArray);
      } catch (e: any) {
        setMsg(e?.response?.data?.detail || "Failed to load loans");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  useEffect(() => {
    if (status) fetch(status);
    else setLoans(allLoans);
  }, [status]);

  // Calculate statistics
  const totalLoans = allLoans.length;
  const approvedCount = allLoans.filter(l => l.status === "APPROVED").length;
  const pendingCount = allLoans.filter(l => l.status === "PENDING").length;
  const rejectedCount = allLoans.filter(l => l.status === "REJECTED").length;
  const totalAmount = allLoans.reduce((sum, l) => sum + l.amount, 0);
  const approvedAmount = allLoans.filter(l => l.status === "APPROVED").reduce((sum, l) => sum + l.amount, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "✅";
      case "REJECTED":
        return "❌";
      case "PENDING":
        return "⏳";
      default:
        return "•";
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 0.35) return "low";
    if (riskScore < 0.65) return "medium";
    return "high";
  };

  return (
    <div className="page-container">
      <div className="loans-container">
        <h2>My Loans</h2>
        <p className="subtitle">Track and manage your loan applications</p>

        {msg && (
          <div className="message message-error" style={{ marginBottom: "1.5rem" }}>
            {msg}
          </div>
        )}

        {/* Summary Statistics */}
        <div className="summary-stats">
          <div className="summary-card">
            <div className="summary-label">Total Applications</div>
            <div className="summary-value">{totalLoans}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Approved</div>
            <div className="summary-value" style={{ color: "var(--success)" }}>
              {approvedCount}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Pending</div>
            <div className="summary-value" style={{ color: "var(--pending)" }}>
              {pendingCount}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Rejected</div>
            <div className="summary-value" style={{ color: "var(--danger)" }}>
              {rejectedCount}
            </div>
          </div>
        </div>

        {/* Total Loan Amount */}
        <div className="amount-card">
          <p className="amount-label">Total Amount Applied</p>
          <p className="amount-value">₹{totalAmount.toLocaleString()}</p>
          <p className="amount-approved">
            Approved: <strong>₹{approvedAmount.toLocaleString()}</strong>
          </p>
        </div>

        {/* Filter */}
        <div className="filter-section">
          <select
            value={status}
            onChange={e => setStatus(e.target.value as LoanStatus | "")}
            className="select-input"
          >
            <option value="">(All Applications)</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <span className="filter-count">
            Showing {loans.length} loan{loans.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Loans List */}
        {!loading && loans.length > 0 ? (
          <div className="loans-list">
            {loans.map(loan => (
              <div key={loan.id} className="loan-card">
                <div className="loan-header" onClick={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}>
                  <div className="loan-header-left">
                    <h3>Loan #{loan.id}</h3>
                    <span className="loan-amount">₹{loan.amount.toLocaleString()}</span>
                  </div>
                  <div className="loan-header-right">
                    <span className={`loan-status status-${loan.status.toLowerCase()}`}>
                      {getStatusIcon(loan.status)} {loan.status}
                    </span>
                    <span className="expand-icon">
                      {expandedLoan === loan.id ? "▼" : "▶"}
                    </span>
                  </div>
                </div>

                {expandedLoan === loan.id && (
                  <div className="loan-details">
                    <div className="detail-row">
                      <span className="detail-label">Income:</span>
                      <span className="detail-value">₹{loan.income.toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Credit Score:</span>
                      <span className="detail-value">{loan.credit_score}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Term:</span>
                      <span className="detail-value">{loan.term_months} months</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Risk Score:</span>
                      <span className={`detail-value risk-${getRiskColor(loan.risk_score)}`}>
                        {(loan.risk_score * 100).toFixed(2)}%
                      </span>
                    </div>

                    {loan.status === "PENDING" && (
                      <div className="calculation-section">
                        <h4>📊 Calculation Breakdown</h4>
                        
                        <div className="calculation-centered">
                          <div className="calc-step">
                            <div className="step-number">1</div>
                            <div className="step-content">
                              <div className="step-label">Debt Ratio Calculation</div>
                              <div className="step-formula">Loan Amount ÷ Annual Income</div>
                              <div className="step-values">
                                ₹{loan.amount.toLocaleString()} ÷ ₹{loan.income.toLocaleString()} = <span className="step-result">{(loan.amount / loan.income).toFixed(4)}</span>
                              </div>
                              <div className="step-weight">Weight: 50%</div>
                            </div>
                          </div>

                          <div className="calc-step">
                            <div className="step-number">2</div>
                            <div className="step-content">
                              <div className="step-label">Credit Factor Calculation</div>
                              <div className="step-formula">(Max Score - Your Score) ÷ Score Range</div>
                              <div className="step-values">
                                (850 - {loan.credit_score}) ÷ 550 = <span className="step-result">{((850 - loan.credit_score) / 550).toFixed(4)}</span>
                              </div>
                              <div className="step-weight">Weight: 40%</div>
                            </div>
                          </div>

                          <div className="calc-step">
                            <div className="step-number">3</div>
                            <div className="step-content">
                              <div className="step-label">Term Factor Calculation</div>
                              <div className="step-formula">Loan Term ÷ Max Term (360 months)</div>
                              <div className="step-values">
                                {loan.term_months} ÷ 360 = <span className="step-result">{(loan.term_months / 360).toFixed(4)}</span>
                              </div>
                              <div className="step-weight">Weight: 10%</div>
                            </div>
                          </div>

                          <div className="calc-step final">
                            <div className="step-number">4</div>
                            <div className="step-content">
                              <div className="step-label">Final Risk Score</div>
                              <div className="step-formula">(Debt × 0.5) + (Credit × 0.4) + (Term × 0.1)</div>
                              <div className="step-values">
                                ({(loan.amount / loan.income).toFixed(4)} × 0.5) + ({((850 - loan.credit_score) / 550).toFixed(4)} × 0.4) + ({(loan.term_months / 360).toFixed(4)} × 0.1)
                              </div>
                              <div className="step-result-large">{loan.risk_score.toFixed(4)}</div>
                              <div className={`risk-level risk-${getRiskColor(loan.risk_score)}`}>
                                {getRiskColor(loan.risk_score).toUpperCase()} RISK
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="approval-probability">
                          <h4>🎯 Approval Probability</h4>
                          <div className="probability-box-centered">
                            <div className="prob-item prob-approval">
                              <span className="prob-label">Approval Chance</span>
                              <span className="prob-value">
                                {((1 - loan.risk_score) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="prob-item prob-rejection">
                              <span className="prob-label">Rejection Chance</span>
                              <span className="prob-value">
                                {(loan.risk_score * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loans.length < 2 && (
              <button
                onClick={() => navigate("/apply")}
                className="btn btn-primary btn-apply-more"
              >
                ➕ Apply for Another Loan
              </button>
            )}
          </div>
        ) : loading ? (
          <div className="empty-state">Loading loans...</div>
        ) : (
          <div className="empty-state">
            <p>No loans yet</p>
            <button onClick={() => navigate("/apply")} className="btn btn-primary">
              Start by applying for a loan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
