import "./DeleteAssignmentModal.css";

const DeleteAssignmentModal = ({
  isOpen,
  assignment,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !assignment) return null;

  return (
    <div className="delete-assignment-overlay">
      <div className="delete-assignment-modal">

        <h2>Delete Assignment</h2>

        <p>
          Are you sure you want to delete this assignment?
        </p>

        <div className="assignment-details">
          <p>
            <strong>Teacher:</strong>{" "}
            {assignment.teacher?.name}
          </p>

          <p>
            <strong>Department:</strong>{" "}
            {assignment.department?.name}
          </p>

          <p>
            <strong>Subject:</strong>{" "}
            {assignment.subject?.name}
          </p>

          <p>
            <strong>Class:</strong>{" "}
            {assignment.class?.name}
          </p>
        </div>

        <div className="delete-assignment-actions">

          <button
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="delete-btn"
            onClick={() => onConfirm(assignment._id)}
          >
            Delete
          </button>

        </div>

      </div>
    </div>
  );
};

export default DeleteAssignmentModal;