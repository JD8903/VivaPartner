import { Link } from "react-router-dom";
import "./SubjectHeader.css";

const SubjectHeader = () => {
  return (
    <div className="subject-header">
      <div>
        <h1>Subject Management</h1>
        <p>Manage all subjects in the system.</p>
      </div>

      <Link
        to="/admin/subjects/add"
        className="add-subject-btn"
      >
        + Add Subject
      </Link>
    </div>
  );
};

export default SubjectHeader;