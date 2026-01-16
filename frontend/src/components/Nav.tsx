
import { Link, useNavigate } from "react-router-dom";
import { clearToken, loadToken } from "../api/client";
import { logout } from "../api/auth";
import { useState, useEffect } from "react";

export default function Nav() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [remainingLoans, setRemainingLoans] = useState(2);

  useEffect(() => {
    const syncAuth = () => {
      const currentToken = loadToken();
      const role = localStorage.getItem("user_role");
      const name = localStorage.getItem("full_name");
      setToken(currentToken);
      setUserRole(role);
      setFullName(name);
      if (currentToken && role === "USER") fetchLoanCount();
    };
    syncAuth();
    const interval = setInterval(syncAuth, 500);
    return () => clearInterval(interval);
  }, []);

  const fetchLoanCount = async () => {
    try {
      const token = loadToken();
      if (!token) return;

      const response = await fetch("http://127.0.0.1:8080/loans/my-loans", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const loans = await response.json();
        // Count only PENDING loans for remaining calculation
        const pendingCount = Array.isArray(loans) ? loans.filter((l: any) => l.status === "PENDING").length : 0;
        setRemainingLoans(Math.max(0, 2 - pendingCount));
      }
    } catch (error) {
      console.error("Error fetching loan count:", error);
    }
  };

  function handleLogout() {
    logout();
    setToken(null);
    setUserRole(null);
    setFullName(null);
    setRemainingLoans(2);
    navigate("/");
  }

  return (
    <nav className="nav-container">
      <div className="nav-left">
        <Link to="/" className="nav-logo">
          🏠 Home
        </Link>
        {token && fullName && (
          <div className="nav-welcome">
            Welcome, {fullName}
          </div>
        )}
      </div>

      <div className="nav-right">
        {token ? (
          <>
            {/* Show these only for USER role */}
            {userRole === "USER" && (
              <>
                <Link to="/apply" className="nav-link">
                  Apply Loan
                </Link>
                <Link to="/my-loans" className="nav-link">
                  My Loans
                </Link>
                <div className="nav-remaining">
                  Remaining: <span className="remaining-count">{remainingLoans}</span>
                </div>
              </>
            )}
            {/* Show admin link only for ADMIN role */}
            {userRole === "ADMIN" && (
              <Link to="/" className="nav-link nav-admin">
                Dashboard
              </Link>
            )}
            <button onClick={handleLogout} className="nav-logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/register" className="nav-logo">
              Register
            </Link>
            <Link to="/login" className="nav-logo">
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
