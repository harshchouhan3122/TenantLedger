import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // True only while we check "is there already a valid session cookie" on
  // app load. Separate from `submitting` below — this runs once at startup,
  // not on every login click.
  const [initializing, setInitializing] = useState(true);

  // True only while an actual login request is in flight — used to disable
  // the submit button and show a spinner on the login form.
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);

  // We never store the token ourselves (it's an httpOnly cookie we can't
  // even read), so on every app load we have to ask the backend directly
  // "is there a valid session right now?"
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await apiClient.get("/auth/me");
        setUser(response.data);
      } catch {
        setUser(null);
      } finally {
        setInitializing(false);
      }
    }
    checkSession();
  }, []);

  const login = useCallback(async (phone, password) => {
    setError(null);
    setSubmitting(true);
    try {
      const response = await apiClient.post("/auth/login", { phone, password });
      setUser(response.data.user);
      return true;
    } catch (err) {
      const message =
        err.response?.data?.error || "Something went wrong. Please try again.";
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      // Clear local state regardless of whether the request succeeded —
      // no point staying "logged in" on the frontend if something went
      // wrong clearing the cookie server-side.
      setUser(null);
    }
  }, []);

  const value = {
    user,
    setUser,
    isAuthenticated: !!user,
    initializing,
    submitting,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
