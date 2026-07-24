import "./DeleteSubjectModal.css";

const DeleteSubjectModal = ({
  subject,
  loading,
  onConfirm,
  onCancel,
}) => {
  if (!subject) return null;

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal">

        <h2>Delete Subject</h2>

        <p>
          Are you sure you want to delete
          <strong> {subject.name}</strong>?
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
            {loading
              ? "Deleting..."
              : "Delete"}
          </button>

        </div>

      </div>
    </div>
  );
};

export default DeleteSubjectModal;
