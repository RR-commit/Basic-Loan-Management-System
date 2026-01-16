
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

export default function Register() {
  const navigate = useNavigate();
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm_password, setConfirmPassword] = useState("");
  const [agreed_to_terms, setAgreedToTerms] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    if (!agreed_to_terms) {
      newErrors.terms = "You must agree to the Terms & Conditions";
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
      // Automatically set role to "USER" - Admin role can only be set in database
      await registerUser({ full_name, email, password, confirm_password, role: "USER" });
      setMsgType("success");
      setMsg("✓ Registered successfully! Redirecting to login...");
      setErrors({});

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (e: any) {
      setMsgType("error");
      setMsg(e?.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isFormValid =
    full_name.trim() &&
    email.trim() &&
    password &&
    password === confirm_password &&
    password.length >= 6 &&
    agreed_to_terms;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join us to manage your loans</p>

        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="John Doe"
            value={full_name}
            onChange={e => setFullName(e.target.value)}
            className={errors.full_name ? "input-error" : ""}
          />
          {errors.full_name && <span className="error-text">{errors.full_name}</span>}
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={errors.email ? "input-error" : ""}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={errors.password ? "input-error" : ""}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👀" : "👁️‍🗨️"}
            </button>
          </div>
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirm_password}
              onChange={e => setConfirmPassword(e.target.value)}
              className={errors.confirm_password ? "input-error" : ""}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👀" : "👁️‍🗨️"}
            </button>
          </div>
          {errors.confirm_password && <span className="error-text">{errors.confirm_password}</span>}
        </div>

        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="terms"
            checked={agreed_to_terms}
            onChange={e => setAgreedToTerms(e.target.checked)}
          />
          <label htmlFor="terms">
            I agree to the <strong>Terms & Conditions</strong>
          </label>
          {errors.terms && <span className="error-text">{errors.terms}</span>}
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
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="auth-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
}
