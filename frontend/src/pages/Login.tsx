
import { useState } from "react";
import { login } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function submit() {
    if (!validateForm()) {
      setMsgType("error");
      setMsg("Please fix the errors above");
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      setMsgType("success");
      setMsg("✓ Logged in successfully!");
      setErrors({});

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (e: any) {
      setMsgType("error");
      setMsg(e?.response?.data?.detail || "Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = email.trim() && password && email.includes("@");

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      submit();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="login-logo" data-testid="login-logo">
          <span role="img" aria-label="logo" style={{ color: 'var(--primary)', fontSize: '2.2rem', fontWeight: 700, marginRight: '0.5rem', verticalAlign: 'middle' }}>🏦</span>
          <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.5rem', verticalAlign: 'middle', letterSpacing: '1px' }}>Loan Management System</span>
        </div>
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Login to your account</p>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            className={errors.email ? "input-error" : ""}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className={errors.password ? "input-error" : ""}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        {msg && (
          <div className={`message message-${msgType}`}>
            {msg}
          </div>
        )}

        <button
          onClick={submit}
          onKeyPress={handleKeyPress}
          disabled={!isFormValid || loading}
          className={`btn btn-primary btn-large ${!isFormValid || loading ? "btn-disabled" : ""}`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
