import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div
        className="navbar-logo"
        onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
      >
        TenantLedger
      </div>

      <div className="navbar-right">
        {isAuthenticated ? (
          <>
            <span className="navbar-username">{user?.name}</span>
            <button className="navbar-logout-btn" onClick={() => logout()}>
              Log out
            </button>
          </>
        ) : (
          <button className="navbar-login-btn" onClick={() => navigate("/login")}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
