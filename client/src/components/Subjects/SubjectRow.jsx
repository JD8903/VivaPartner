import { Link } from "react-router-dom";
import "./SubjectRow.css";

const SubjectRow = ({
  subject,
  onDelete,
}) => {
  return (
    <tr>
      <td>{subject.name}</td>
      <td>{subject.code}</td>
      <td>{subject.department?.name}</td>
      <td>{subject.semester}</td>
      <td>{subject.credits}</td>
      <td>{subject.status}</td>

      <td className="actions">
        <Link
          to={`/admin/subjects/view/${subject._id}`}
          className="view-btn"
        >
          View
        </Link>

        <Link
          to={`/admin/subjects/edit/${subject._id}`}
          className="edit-btn"
        >
          Edit
        </Link>

        <button
          className="delete-btn"
          onClick={() => onDelete(subject)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

export default SubjectRow;