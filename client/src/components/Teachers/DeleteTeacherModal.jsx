import "./DeleteTeacherModal.css";

const DeleteTeacherModal = ({
  teacher,
  onConfirm,
  onCancel,
  loading,
}) => {
  if (!teacher) return null;

  return (
    <div className="delete-overlay">
      <div className="delete-modal">
        <h2>Delete Teacher</h2>

        <p>
          Are you sure you want to delete
          <strong> {teacher.name}</strong>?
        </p>

        <p className="warning">
          This action cannot be undone.
        </p>

        <div className="delete-actions">
          <button
            className="cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className="confirm-btn"
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

export default DeleteTeacherModal;