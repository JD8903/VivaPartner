import { Link } from "react-router-dom";
import "./ClassRow.css";

const ClassRow = ({
  classItem,
  onDelete,
}) => {
  return (
    <tr>
      <td>{classItem.name}</td>
      <td>{classItem.code}</td>
      <td>{classItem.department?.name}</td>
      <td>{classItem.semester}</td>
      <td>{classItem.academicYear}</td>
      <td>{classItem.capacity}</td>
      <td>{classItem.status}</td>

      <td className="actions">
        <Link
          to={`/admin/classes/view/${classItem._id}`}
          className="view-btn"
        >
          View
        </Link>

        <Link
          to={`/admin/classes/edit/${classItem._id}`}
          className="edit-btn"
        >
          Edit
        </Link>

        <button
          className="delete-btn"
          onClick={() => onDelete(classItem)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

export default ClassRow;