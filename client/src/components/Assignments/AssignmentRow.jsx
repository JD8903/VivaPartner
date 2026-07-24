import { Link } from "react-router-dom";
import "./AssignmentRow.css";

const AssignmentRow = ({ assignment, onDelete }) => {
  return (
    <tr>
      <td>{assignment.teacher?.name || "-"}</td>

      <td>{assignment.department?.name || "-"}</td>

      <td>{assignment.subject?.name || "-"}</td>

      <td>{assignment.class?.name || "-"}</td>

      <td>
        <span
          className={`status-badge ${
            assignment.status === "Active"
              ? "active"
              : "inactive"
          }`}
        >
          {assignment.status}
        </span>
      </td>

      <td>
        <div className="assignment-actions">

          <Link
            to={`/admin/assignments/view/${assignment._id}`}
            className="action-btn view-btn"
          >
            View
          </Link>

          <Link
            to={`/admin/assignments/edit/${assignment._id}`}
            className="action-btn edit-btn"
          >
            Edit
          </Link>

          <button
            className="action-btn delete-btn"
            onClick={() => onDelete(assignment)}
          >
            Delete
          </button>

        </div>
      </td>
    </tr>
  );
};

export default AssignmentRow;