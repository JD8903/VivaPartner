import { Link } from "react-router-dom";
import "./TeacherRow.css";

const TeacherRow = ({ teacher, onDelete }) => {
  return (
    <tr>
      <td>{teacher.name}</td>
      <td>{teacher.email}</td>
      <td>{teacher.department}</td>
      <td>{teacher.status}</td>

      <td className="actions">

        <Link
            to={`/admin/teachers/view/${teacher._id}`}
            className="view-btn"
          >
            View
        </Link>

        <Link
          to={`/admin/teachers/edit/${teacher._id}`}
          className="edit-btn"
        >
          Edit
        </Link>

        <button
          className="delete-btn"
          onClick={() => onDelete(teacher)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

export default TeacherRow;