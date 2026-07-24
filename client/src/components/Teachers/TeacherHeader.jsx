import { Link } from "react-router-dom";
import "./TeacherHeader.css";

const TeacherHeader = () => {
  return (
    <div className="teacher-header">
      <div>
        <h2>Teacher Management</h2>
        <p>Manage all teachers in the system.</p>
      </div>

      <Link to="/admin/teachers/add" className="add-btn">
        + Add Teacher
      </Link>
    </div>
  );
};

export default TeacherHeader;