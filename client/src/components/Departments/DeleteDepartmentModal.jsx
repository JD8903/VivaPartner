import "./DeleteDepartmentModal.css";

const DeleteDepartmentModal = ({
  department,
  loading,
  onConfirm,
  onCancel,
}) => {
  if (!department) return null;

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal">
        <h2>Delete Department</h2>

        <p>
          Are you sure you want to delete
          <strong> {department.name}</strong>?
        </p>

        <div className="delete-modal-actions">
          <button
            className="cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className="delete-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDepartmentModal;