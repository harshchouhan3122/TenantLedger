import { useEffect, useState } from "react";
import apiClient from "../api/client";

export default function ResetPasswordModal({
  show,
  user,
  onClose,
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [show]);

  if (!show || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await apiClient.put(
        `/auth/users/${user.id}/reset-password`,
        {
          password,
        }
      );

      alert(response.data.message);

      onClose();

    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Unable to reset password."
      );
    }
  };

  return (
    <div className="modal-overlay">

      <div className="create-user-modal">

        <button
          className="close-btn"
          onClick={onClose}
        >
          ✕
        </button>

        <h2>Reset Password</h2>

        <hr />

        <form
          className="create-user-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">
            <label>User</label>

            <input
              value={user.name}
              disabled
            />
          </div>

          <div className="form-group">
            <label>New Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
            />
          </div>

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <button
            className="submit-btn"
            type="submit"
          >
            Reset Password
          </button>

        </form>

      </div>

    </div>
  );
}