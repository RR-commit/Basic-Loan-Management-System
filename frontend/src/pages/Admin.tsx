
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadToken } from "../api/client";

interface AdminLoan {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  amount: number;
  income: number;
  credit_score: number;
  term_months: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  risk_score: number;
}

type TabType = "pending" | "approved" | "rejected";

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [allLoans, setAllLoans] = useState<AdminLoan[]>([]);
  const [msg, setMsg] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<AdminLoan | null>(null);
  const [loading, setLoading] = useState(false);
  const [deciding, setDeciding] = useState(false);

  // Check if user is admin and monitor auth state
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = loadToken();
      const role = localStorage.getItem("user_role");
      
      // If logged out (no token) or not admin, redirect to home
      if (!token || role !== "ADMIN") {
        navigate("/", { replace: true });
        return;
      }
    };
    
    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 500);
    return () => clearInterval(interval);
  }, [navigate]);

  // Load all loans on mount
  useEffect(() => {
    loadLoans();
  }, []);

  async function loadLoans() {
    setLoading(true);
    try {
      const token = loadToken();
      if (!token) return;
      const response = await fetch("http://127.0.0.1:8080/loans/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const loans = await response.json();
        setAllLoans(Array.isArray(loans) ? loans : []);
        setMsg("");
      } else {
        setMsg("❌ Failed to load loans");
      }
    } catch (error) {
      console.error("Error loading loans:", error);
      setMsg("❌ Error loading loans");
    } finally {
      setLoading(false);
    }
  }

  const getRiskColor = (risk: number): "low" | "medium" | "high" => {
    if (risk < 0.35) return "low";
    if (risk < 0.65) return "medium";
    return "high";
  };

  const getRiskLabel = (risk: number): string => {
    const color = getRiskColor(risk);
    if (color === "low") return "LOW RISK";
    if (color === "medium") return "MEDIUM RISK";
    return "HIGH RISK";
  };

  const getApprovalChance = (risk: number): number => {
    return Math.round((1 - risk) * 100);
  };

  const stats = {
    pending: allLoans.filter((l) => l.status === "PENDING").length,
    approved: allLoans.filter((l) => l.status === "APPROVED").length,
    rejected: allLoans.filter((l) => l.status === "REJECTED").length,
  };

  async function makeDecision(loanId: number, action: "APPROVED" | "REJECTED") {
    setDeciding(true);
    try {
      const token = loadToken();
      if (!token) return;

      const response = await fetch(`http://127.0.0.1:8080/loans/${loanId}/decision`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        setMsg(`✅ Loan #${loanId} ${action}`);
        setSelectedLoan(null);
        loadLoans();
        setTimeout(() => setMsg(""), 3000);
      } else {
        setMsg("❌ Failed to make decision");
      }
    } catch (error) {
      console.error("Error making decision:", error);
      setMsg("❌ Error making decision");
    } finally {
      setDeciding(false);
    }
  }

  async function autoDecide(loanId: number, riskScore: number) {
    const action = riskScore < 0.35 ? "APPROVED" : riskScore > 0.65 ? "REJECTED" : null;
    if (!action) {
      setMsg("⚠️ Risk score in middle range (35-65%) - requires manual review");
      setTimeout(() => setMsg(""), 3000);
      return;
    }
    await makeDecision(loanId, action);
  }

  if (selectedLoan) {
    return (
      <div className="page-container">
        <div className="admin-container">
          <button
            className="btn-back"
            onClick={() => setSelectedLoan(null)}
          >
            Back to List
          </button>

          {msg && (
            <div className={`message message-${msg.includes("✅") ? "success" : "error"}`}>
              {msg}
            </div>
          )}

          <div className="loan-detail-admin">
            <h2>Loan #{selectedLoan.id} - Detailed Review</h2>

            {/* Applicant Info Section */}
            <div className="admin-section">
              <h3>📋 Applicant Information</h3>
              <div className="admin-details-grid">
                <div className="detail-item">
                  <label>User ID</label>
                  <p>#{selectedLoan.user_id}</p>
                </div>
                <div className="detail-item">
                  <label>Full Name</label>
                  <p>{selectedLoan.user_name}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{selectedLoan.user_email}</p>
                </div>
              </div>
            </div>

            {/* Loan Application Details */}
            <div className="admin-section">
              <h3>💰 Loan Application Details</h3>
              <div className="admin-details-grid">
                <div className="detail-item">
                  <label>Loan Amount</label>
                  <p className="amount">₹{selectedLoan.amount.toLocaleString()}</p>
                </div>
                <div className="detail-item">
                  <label>Annual Income</label>
                  <p>₹{selectedLoan.income.toLocaleString()}</p>
                </div>
                <div className="detail-item">
                  <label>Credit Score</label>
                  <p>{selectedLoan.credit_score}</p>
                </div>
                <div className="detail-item">
                  <label>Loan Term</label>
                  <p>{selectedLoan.term_months} months</p>
                </div>
              </div>
            </div>

            {/* Calculation Breakdown */}
            <div className="admin-section">
              <h3>📊 Risk Calculation Breakdown</h3>
              <div className="calculation-centered">
                <div className="calc-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <div className="step-label">Debt Ratio Calculation</div>
                    <div className="step-formula">Loan Amount ÷ Annual Income</div>
                    <div className="step-values">
                      ₹{selectedLoan.amount.toLocaleString()} ÷ ₹{selectedLoan.income.toLocaleString()} =
                      <span className="step-result">{(selectedLoan.amount / selectedLoan.income).toFixed(4)}</span>
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
                      (850 - {selectedLoan.credit_score}) ÷ 550 =
                      <span className="step-result">{((850 - selectedLoan.credit_score) / 550).toFixed(4)}</span>
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
                      {selectedLoan.term_months} ÷ 360 =
                      <span className="step-result">{(selectedLoan.term_months / 360).toFixed(4)}</span>
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
                      ({(selectedLoan.amount / selectedLoan.income).toFixed(4)} × 0.5) +
                      ({((850 - selectedLoan.credit_score) / 550).toFixed(4)} × 0.4) +
                      ({(selectedLoan.term_months / 360).toFixed(4)} × 0.1)
                    </div>
                    <div className="step-result-large">{selectedLoan.risk_score.toFixed(4)}</div>
                    <div className={`risk-level risk-${getRiskColor(selectedLoan.risk_score)}`}>
                      {getRiskLabel(selectedLoan.risk_score)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Probability */}
            <div className="admin-section">
              <h3>🎯 Approval Probability</h3>
              <div className="probability-box-centered">
                <div className="prob-item prob-approval">
                  <span className="prob-label">Approval Chance</span>
                  <span className="prob-value">{getApprovalChance(selectedLoan.risk_score)}%</span>
                </div>
                <div className="prob-item prob-rejection">
                  <span className="prob-label">Rejection Chance</span>
                  <span className="prob-value">{Math.round(selectedLoan.risk_score * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {selectedLoan.status === "PENDING" ? (
              <div className="admin-section">
                {selectedLoan.risk_score >= 0.35 && selectedLoan.risk_score <= 0.65 ? (
                  <div>
                    <div className="risk-warning">
                      ⚠️ Risk score in middle range (35-65%) - requires manual review
                    </div>
                    <div className="admin-actions">
                      <button
                        className="btn btn-success"
                        onClick={() => makeDecision(selectedLoan.id, "APPROVED")}
                        disabled={deciding}
                      >
                        ✅ Approve Loan
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => makeDecision(selectedLoan.id, "REJECTED")}
                        disabled={deciding}
                      >
                        ❌ Reject Loan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="admin-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => makeDecision(selectedLoan.id, "APPROVED")}
                      disabled={deciding}
                    >
                      ✅ Approve Loan
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => makeDecision(selectedLoan.id, "REJECTED")}
                      disabled={deciding}
                    >
                      ❌ Reject Loan
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => autoDecide(selectedLoan.id, selectedLoan.risk_score)}
                      disabled={deciding}
                    >
                      🤖 Auto Decide
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="admin-section">
                <div className={`decision-badge status-${selectedLoan.status.toLowerCase()}`}>
                  {selectedLoan.status === "APPROVED" ? "✅ APPROVED" : "❌ REJECTED"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="admin-dashboard-container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p className="subtitle">Manage and review loan applications</p>
        </div>

        {msg && (
          <div className={`message message-${msg.includes("✅") ? "success" : "error"}`}>
            {msg}
          </div>
        )}

        {/* Dashboard Status Cards */}
        <div className="dashboard-stats">
          <div className="stat-card pending">
            <div className="stat-label">⏳ Pending Review</div>
            <div className="stat-number">{stats.pending}</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-label">✅ Approved</div>
            <div className="stat-number">{stats.approved}</div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-label">❌ Rejected</div>
            <div className="stat-number">{stats.rejected}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">📊 Total</div>
            <div className="stat-number">{allLoans.length}</div>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            ⏳ Pending ({stats.pending})
          </button>
          <button
            className={`tab-button ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            ✅ Approved ({stats.approved})
          </button>
          <button
            className={`tab-button ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            ❌ Rejected ({stats.rejected})
          </button>
        </div>

        {/* Pending Loans - Card Grid */}
        {activeTab === "pending" && stats.pending > 0 && (
          <div className="loans-display-section">
            <div className="section-title">
              <span className="section-title-icon">⏳</span>
              Pending Loan Applications ({stats.pending})
            </div>
            {!loading && allLoans.filter((l) => l.status === "PENDING").length > 0 ? (
              <div className="pending-loans-grid">
                {allLoans
                  .filter((loan) => loan.status === "PENDING")
                  .map((loan) => (
                    <div
                      key={loan.id}
                      className="pending-loan-card"
                      onClick={() => setSelectedLoan(loan)}
                    >
                      <div className="pending-card-header">
                        <h3>Loan Application #{loan.id}</h3>
                      </div>
                      <div className="pending-card-body">
                        <div className="pending-card-row">
                          <span className="pending-card-label">Applicant</span>
                          <span className="pending-card-value">{loan.user_name}</span>
                        </div>
                        <div className="pending-card-row">
                          <span className="pending-card-label">Loan Amount</span>
                          <span className="pending-card-value">₹{loan.amount.toLocaleString()}</span>
                        </div>
                        <div className="pending-card-row">
                          <span className="pending-card-label">Income</span>
                          <span className="pending-card-value">₹{loan.income.toLocaleString()}</span>
                        </div>
                        <div className="pending-card-row">
                          <span className="pending-card-label">Credit Score</span>
                          <span className="pending-card-value">{loan.credit_score}</span>
                        </div>
                        <div className="pending-card-row">
                          <span className="pending-card-label">Risk Score</span>
                          <span className="pending-card-value">
                            <span className={`risk-badge risk-${getRiskColor(loan.risk_score)}`}>
                              {(loan.risk_score * 100).toFixed(1)}%
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="pending-card-footer">🔍 Click to review details and decide</div>
                    </div>
                  ))}
              </div>
            ) : loading ? (
              <div className="empty-state">⏳ Loading pending applications...</div>
            ) : (
              <div className="empty-state">🎉 No pending applications</div>
            )}
          </div>
        )}

        {/* Approved Loans - List Style */}
        {activeTab === "approved" && stats.approved > 0 && (
          <div className="loans-display-section">
            <div className="section-title">
              <span className="section-title-icon">✅</span>
              Approved Loans ({stats.approved})
            </div>
            {!loading && allLoans.filter((l) => l.status === "APPROVED").length > 0 ? (
              <div className="approved-loans-list">
                {allLoans
                  .filter((loan) => loan.status === "APPROVED")
                  .map((loan) => (
                    <div
                      key={loan.id}
                      className="approved-loan-item"
                      onClick={() => setSelectedLoan(loan)}
                    >
                      <div className="approved-item-icon">✅</div>
                      <div className="approved-item-content">
                        <div className="approved-item-title">Loan #{loan.id} - {loan.user_name}</div>
                        <div className="approved-item-info">
                          <span>💰 Amount: ₹{loan.amount.toLocaleString()}</span>
                          <span>📊 Risk: {(loan.risk_score * 100).toFixed(1)}%</span>
                          <span>⏱️ Term: {loan.term_months} months</span>
                        </div>
                      </div>
                      <div className="approved-item-badge">APPROVED ✓</div>
                    </div>
                  ))}
              </div>
            ) : loading ? (
              <div className="empty-state">⏳ Loading approved loans...</div>
            ) : (
              <div className="empty-state">No approved loans yet</div>
            )}
          </div>
        )}

        {/* Rejected Loans - Warning Style */}
        {activeTab === "rejected" && stats.rejected > 0 && (
  <div className="loans-display-section">
    <div className="section-title rejected-title">
      <span className="section-title-icon">❌</span>
      Rejected Loans ({stats.rejected})
    </div>

    {!loading && allLoans.filter((l) => l.status === "REJECTED").length > 0 ? (
      <div className="rejected-loans-list">
        {allLoans
          .filter((loan) => loan.status === "REJECTED")
          .map((loan) => (
            <div
              key={loan.id}
              className="rejected-loan-item"
              onClick={() => setSelectedLoan(loan)}
            >
              <div className="rejected-item-icon">❌</div>

              <div className="rejected-item-content">
                <div className="rejected-item-title">
                  Loan #{loan.id} - {loan.user_name}
                </div>

                <div className="rejected-item-info">
                  <span>💰 Amount: ₹{loan.amount.toLocaleString()}</span>
                  <span>📊 Risk: {(loan.risk_score * 100).toFixed(1)}%</span>
                  <span>⏱️ Term: {loan.term_months} months</span>
                </div>
              </div>

              <div className="rejected-item-badge">REJECTED ✗</div>
            </div>
          ))}
      </div>
    ) : loading ? (
      <div className="empty-state">⏳ Loading rejected loans...</div>
    ) : (
      <div className="empty-state">No rejected loans</div>
    )}
  </div>
)}


        {/* Show all tabs if no specific tab selected */}
        {allLoans.length === 0 && !loading && (
          <div className="empty-state">
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📋</div>
            <p>No loan applications to review</p>
          </div>
        )}
      </div>
    </div>
  );
}
