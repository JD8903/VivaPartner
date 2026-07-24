import { Link } from "react-router-dom";
import "./AssignmentHeader.css";

const AssignmentHeader = ({ total }) => {
  return (
    <div className="assignment-header">
      <div>
        <h2>Teacher Assignments</h2>
        <p>Total Assignments : {total}</p>
      </div>

      <Link
        to="/admin/assignments/add"
        className="add-assignment-btn"
      >
        + Assign Teacher
      </Link>
    </div>
  );
};

export default AssignmentHeader;