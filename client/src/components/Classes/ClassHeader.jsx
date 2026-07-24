import { Link } from "react-router-dom";
import "./ClassHeader.css";

const ClassHeader = () => {
  return (
    <div className="class-header">
      <div>
        <h1>Class Management</h1>
        <p>Manage all classes in the system.</p>
      </div>

      <Link
        to="/admin/classes/add"
        className="add-class-btn"
      >
        + Add Class
      </Link>
    </div>
  );
};

export default ClassHeader;