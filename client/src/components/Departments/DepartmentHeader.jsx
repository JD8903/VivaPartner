import { Link } from "react-router-dom";
import "./DepartmentHeader.css";

const DepartmentHeader = () => {
  return (
    <div className="department-header">
      <div>
        <h1>Department Management</h1>
        <p>Manage all departments in the system.</p>
      </div>

      <Link
        to="/admin/departments/add"
        className="add-department-btn"
      >
        + Add Department
      </Link>
    </div>
  );
};

export default DepartmentHeader;