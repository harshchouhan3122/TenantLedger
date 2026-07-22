import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";
import { Link } from "react-router-dom";
import { normalizePhone } from "../utils/validateData";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const { login, submitting, error } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    const success = await login(normalizePhone(phone), password);
    if (success) {
      navigate("/dashboard");
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Tenant Ledger</h1>
        <p className="subtitle">Sign in to manage your properties</p>

        <label htmlFor="phone">Phone number</label>
        <input
          id="phone"
          type="tel"
          placeholder="+91XXXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <div className="auth-footer">
          <span>Don't have an account?</span>

          <Link to="/signup">
            Create Account
          </Link>
        </div>

      </form>
    </div>
  );
}
