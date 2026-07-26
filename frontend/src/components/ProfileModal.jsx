import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./ProfileModal.css";

export default function ProfileModal({ open, onClose }) {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get("/auth/profile");

        setForm({
          name: response.data.name || "",
          phone: response.data.phone || "",
        });
      } catch (err) {
        setError(
          err.response?.data?.error || "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
        ...prev,
        [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await apiClient.patch("/auth/profile", form);

      setUser((prev) => ({
        ...prev,
        name: response.data.name,
        phone: response.data.phone,
      }));

      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    try {
        setSaving(true);
        setError("");

        const response = await apiClient.patch(
            "/auth/change-password",
            passwordForm
        );

        alert(response.data.message);

        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });

    } catch (err) {
        setError(
            err.response?.data?.error ||
            "Unable to update password."
        );
    } finally {
        setSaving(false);
    }
};

  if (!open) return null;

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        <div className="profile-modal-header">
          <h2>My Profile</h2>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                name="phone"
                type="text"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <input
                value={user?.role || ""}
                disabled
              />
            </div>

            <hr style={{ margin: "20px 0" }} />

            <h3>Change Password</h3>
                    
            <div className="form-group">
                <label>Current Password</label>
                    
                <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                />
            </div>
                    
            <div className="form-group">
                <label>New Password</label>
                    
                <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                />
            </div>
                    
            <div className="form-group">
                <label>Confirm Password</label>
                    
                <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                />
            </div>
                    
            <button
                type="button"
                className="btn-primary"
                onClick={handlePasswordSubmit}
                style={{ marginBottom: "20px" }}
            >
                Update Password
            </button>

            {error && (
              <p className="profile-error">{error}</p>
            )}

            <div className="profile-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}