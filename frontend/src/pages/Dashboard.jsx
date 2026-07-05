import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Welcome, {user?.name}</h1>
      <p>Role: {user?.role}</p>
      <p style={{ color: "#6b7280" }}>
        This is a placeholder — the real Properties dashboard is next.
      </p>
      <button onClick={() => logout()}>Log out</button>
    </div>
  );
}
