import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadToken } from "../api/client";

export default function Home() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<"USER" | "ADMIN" | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasLoans, setHasLoans] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncAuthState = () => {
      const token = loadToken();
      const role = localStorage.getItem("user_role") as "USER" | "ADMIN" | null;
      
      // If no token, user is logged out
      if (!token) {
        setIsLoggedIn(false);
        setUserRole(null);
        setLoading(false);
        return;
      }
      
      // Auto-redirect admin to admin panel only if they're logged in
      if (token && role === "ADMIN") {
        navigate("/admin", { replace: true });
        return;
      }
      
      if (token && role === "USER") {
        setIsLoggedIn(true);
        setUserRole(role);
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
      setLoading(false);
    };
    
    syncAuthState();
    const interval = setInterval(syncAuthState, 500);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleApplyLoan = () => {
    const token = loadToken();
    if (!token) {
      navigate("/login");
    } else {
      navigate("/apply");
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">Loan Management System</h1>
          <p className="hero-subtitle">
            Fast, Secure, and Transparent Loan Processing
          </p>
          <p className="hero-description">
            Apply for loans, track your applications, and get instant decisions
            with our advanced risk scoring system.
          </p>
        </div>

        {/* Apply Loan Button - Center */}
        <div className="apply-button-section">
          <button className="btn-apply-center" onClick={handleApplyLoan}>
            💼 Apply for Loan
          </button>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Quick Application</h3>
            <p>Apply for a loan in minutes with our simple process</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Safe</h3>
            <p>Your data is encrypted and protected with industry standards</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Decisions</h3>
            <p>Get loan approval decisions within seconds</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track Progress</h3>
            <p>Monitor your loan applications in real-time</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-item">
            <div className="stat-number">10,000+</div>
            <div className="stat-label">Happy Customers</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">$500M</div>
            <div className="stat-label">Loans Approved</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Support Available</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Uptime</div>
          </div>
        </div>

        {/* How It Works */}
        <div className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h4>Create Account</h4>
              <p>Sign up with your email and basic information</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h4>Apply for Loan</h4>
              <p>Fill in your loan amount, income, and credit score</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h4>Risk Assessment</h4>
              <p>Our system calculates your risk score instantly</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h4>Get Decision</h4>
              <p>Receive approval or rejection decision immediately</p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="footer-info">
          <p>
            🔐 We use enterprise-grade security to protect your personal and
            financial information.
          </p>
        </div>
      </div>
    </div>
  );
}