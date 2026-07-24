import { Link } from "react-router-dom";
import "./DepartmentRow.css";

const DepartmentRow = ({
  department,
  onDelete,
}) => {
  return (
    <tr>
      <td>{department.name}</td>
      <td>{department.code}</td>
      <td>{department.description}</td>
      <td>{department.status}</td>

      <td className="actions">
        <Link
          to={`/admin/departments/view/${department._id}`}
          className="view-btn"
        >
          View
        </Link>

        <Link
          to={`/admin/departments/edit/${department._id}`}
          className="edit-btn"
        >
          Edit
        </Link>

        <button
          className="delete-btn"
          onClick={() => onDelete(department)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

export default DepartmentRow;