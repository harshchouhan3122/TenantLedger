import apiClient from "../api/client";

export default function DeleteUserModal({
  show,
  user,
  onClose,
  onSuccess,
}) {
  if (!show || !user) return null;

  const handleDelete = async () => {
    try {
      const response = await apiClient.delete(
        `/auth/users/${user.id}`
      );

      alert(response.data.message);

      onSuccess();
      onClose();

    } catch (err) {
      alert(
        err.response?.data?.error ||
        "Unable to delete user."
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

        <h2>Delete User</h2>

        <hr />

        <div className="modal-body">

          <p>
            Are you sure you want to delete
            <strong> {user.name}</strong>?
          </p>

          <p className="delete-warning">
            This action cannot be undone.
          </p>

          <div className="delete-actions">

            <button
              className="back-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="delete-btn"
              onClick={handleDelete}
            >
              Delete
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}