import { useNavigate } from "react-router-dom";
import { useState, useEffect  } from "react";
import "./Users.css";
import apiClient from "../api/client";

import UsersTable from "../components/UsersTable";
import EditUserModal from "../components/EditUserModal";
import DeleteUserModal from "../components/DeleteUserModal";
import ResetPasswordModal from "../components/ResetPasswordModal";


export default function Users() {
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "admin",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();

  setError("");

  const name = formData.name.trim();
  const phone = formData.phone.trim();

  if (!name) {
    setError("Name is required.");
    return;
  }

  if (!phone) {
    setError("Phone number is required.");
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    setError("Phone number must contain exactly 10 digits.");
    return;
  }

  if (!formData.password) {
    setError("Password is required.");
    return;
  }

  if (formData.password.length < 6) {
    setError("Password must be at least 6 characters.");
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

//   console.log(formData);

try {
  const response = await apiClient.post("/auth/create-user", {
    name: formData.name.trim(),
    phone: formData.phone.trim(),
    password: formData.password,
    role: formData.role,
  });

  alert(response.data.message);

  setFormData({
    name: "",
    phone: "",
    role: "admin",
    password: "",
    confirmPassword: "",
  });

  setError("");
  setShowCreateModal(false);
  await fetchUsers();
  

} catch (err) {
  setError(
    err.response?.data?.error ||
      "Something went wrong. Please try again."
  );
}

};



const fetchUsers = async () => {
  setLoading(true);

  try {
    const response = await apiClient.get("/auth/users");
    setUsers(response.data);
    // console.log(response.data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

const handleEdit = (user) => {
  setSelectedUser(user);
  setShowEditModal(true);
};

const handleDelete = (user) => {
  setSelectedUser(user);
  setShowDeleteModal(true);
};

const handleResetPassword = (user) => {
  setSelectedUser(user);
  setShowResetPasswordModal(true);
};

useEffect(() => {
  fetchUsers();
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Users</h1>

        <div className="users-actions">
          <button
            className="create-user-btn"
            // onClick={() => setShowCreateModal(true)}
            onClick={() => {
              setError("");

              setFormData({
                name: "",
                phone: "",
                role: "admin",
                password: "",
                confirmPassword: "",
              });
          
              setShowCreateModal(true);
            }}
          >
            + Create User
          </button>

          <button
            className="back-btn"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* <div className="users-empty">
        No users found.
      </div> */}

        {loading ? (
          <div className="users-empty">
            Loading...
          </div>
        ) : users.length === 0 ? (
          <div className="users-empty">
            No users found.
          </div>
        ) : (
          // <table className="users-table">
          //   <thead>
          //     <tr>
          //       <th>Name</th>
          //       <th>Phone</th>
          //       <th>Role</th>
          //     </tr>
          //   </thead>
        
          //   <tbody>
          //     {users.map((user) => (
          //       <tr key={user.id}>
          //         <td>{user.name}</td>
          //         <td>{user.phone}</td>
          //         <td>{user.role}</td>
          //       </tr>
          //     ))}
          //   </tbody>
          // </table>
          <UsersTable
              users={users}
              onEdit={handleEdit}
              onResetPassword={handleResetPassword}
              onDelete={handleDelete}
          />

        )}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="create-user-modal">
            <button
              className="close-btn"
            //   onClick={() => setShowCreateModal(false)}
                onClick={() => {
                  setShowCreateModal(false);
                  setError("");
                }}
            >
              ✕
            </button>

            <h2>Create User</h2>

            <hr />

            <div className="modal-body">
              <form
                className="create-user-form"
                onSubmit={handleSubmit}
                >
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    // onChange={handleChange}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 10);

                      setFormData((prev) => ({
                        ...prev,
                        phone: value,
                      }));
                    }}
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

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
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
                  Create User
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <EditUserModal
          show={showEditModal}
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchUsers}
      />
          
      <DeleteUserModal
          show={showDeleteModal}
          user={selectedUser}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={fetchUsers}
      />

      <ResetPasswordModal
        show={showResetPasswordModal}
        user={selectedUser}
        onClose={() => setShowResetPasswordModal(false)}
      />

    </div>
  );
}