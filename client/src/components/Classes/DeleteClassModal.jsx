import "./DeleteClassModal.css";

const DeleteClassModal = ({
  classItem,
  loading,
  onConfirm,
  onCancel,
}) => {
  if (!classItem) return null;

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal">
        <h2>Delete Class</h2>

        <p>
          Are you sure you want to delete
          <strong> {classItem.name}</strong>?
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

export default DeleteClassModal;