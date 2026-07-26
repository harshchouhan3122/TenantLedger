import { useEffect, useState } from "react";
import apiClient from "../api/client";

export default function EditUserModal({
  show,
  user,
  onClose,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "admin",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone,
        role: user.role,
      });
      setError("");
    }
  }, [user]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Phone must contain exactly 10 digits.");
      return;
    }

    try {
      const response = await apiClient.put(
        `/auth/users/${user.id}`,
        {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
        }
      );

      alert(response.data.message);

      onSuccess();
      onClose();

    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Unable to update user."
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

        <h2>Edit User</h2>

        <hr />

        <form
          className="create-user-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">
            <label>Name</label>

            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Phone</label>

            <input
              name="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  phone: e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10),
                }))
              }
            />
          </div>

          <div className="form-group">
            <label>Role</label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="master">Master</option>
              <option value="admin">Admin</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="submit-btn"
          >
            Save Changes
          </button>

        </form>

      </div>

    </div>
  );
}