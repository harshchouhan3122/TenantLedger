import "./UsersTable.css";

export default function UsersTable({
    users,
    onEdit,
    onResetPassword,
    onDelete,
}) {
  return (
    <table className="users-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Role</th>
          <th width="300">Actions</th>
        </tr>
      </thead>

      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>

            <td>{user.phone}</td>

            <td>
              <span className={`role-badge ${user.role}`}>
                {user.role}
              </span>
            </td>

            <td>
                <button
                    className="edit-btn"
                    onClick={() => onEdit(user)}
                >
                    ✏ Edit
                </button>

                <button
                    className="reset-btn"
                    onClick={() => onResetPassword(user)}
                >
                    🔑 Reset
                </button>

                <button
                    className="delete-btn"
                    onClick={() => onDelete(user)}
                >
                    🗑 Delete
                </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}