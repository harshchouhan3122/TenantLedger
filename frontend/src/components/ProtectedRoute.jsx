import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();

  // While we're still checking "is there a valid session cookie" on app
  // load, don't redirect yet — that would incorrectly bounce a genuinely
  // logged-in user back to /login for a split second on every refresh.
  if (initializing) {
    return <div style={{ padding: "2rem" }}>Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
