import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaEdit,
  FaUserTie,
  FaBuilding,
  FaBook,
  FaChalkboardTeacher,
} from "react-icons/fa";
import { getAssignmentById } from "../../../services/assignmentApi";
import "./ViewAssignment.css";

const ViewAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const res = await getAssignmentById(id);

      console.log("Assignment Response:", res);

      if (res.success) {
        setAssignment(res.assignment);
      } else {
        setAssignment(null);
      }
    } catch (error) {
      console.error("Fetch Assignment Error:", error);
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="view-assignment-loading">
        Loading Assignment...
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="view-assignment-loading">
        Assignment Not Found
      </div>
    );
  }

  return (
    <div className="view-assignment-page">
      <div className="view-header">
        <button
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          Back
        </button>

        <h2>Assignment Details</h2>

        <Link
          to={`/admin/assignments/edit/${assignment._id}`}
          className="edit-btn"
        >
          <FaEdit />
          Edit Assignment
        </Link>
      </div>

      <div className="details-grid">
        {/* Teacher */}
        <div className="detail-card">
          <h3>
            <FaUserTie />
            Teacher Information
          </h3>

          <div className="detail-row">
            <span>Name</span>
            <p>{assignment.teacher?.name || "-"}</p>
          </div>

          <div className="detail-row">
            <span>Email</span>
            <p>{assignment.teacher?.email || "-"}</p>
          </div>

          <div className="detail-row">
            <span>Status</span>

            <span
              className={`status ${
                assignment.status === "Active"
                  ? "active"
                  : "inactive"
              }`}
            >
              {assignment.status}
            </span>
          </div>
        </div>

        {/* Department */}
        <div className="detail-card">
          <h3>
            <FaBuilding />
            Department
          </h3>

          <div className="detail-row">
            <span>Name</span>
            <p>{assignment.department?.name || "-"}</p>
          </div>
        </div>

        {/* Subject */}
        <div className="detail-card">
          <h3>
            <FaBook />
            Subject
          </h3>

          <div className="detail-row">
            <span>Name</span>
            <p>{assignment.subject?.name || "-"}</p>
          </div>

          <div className="detail-row">
            <span>Code</span>
            <p>{assignment.subject?.code || "-"}</p>
          </div>
        </div>

        {/* Class */}
        <div className="detail-card">
          <h3>
            <FaChalkboardTeacher />
            Class
          </h3>

          <div className="detail-row">
            <span>Name</span>
            <p>{assignment.class?.name || "-"}</p>
          </div>

          <div className="detail-row">
            <span>Code</span>
            <p>{assignment.class?.code || "-"}</p>
          </div>
        </div>
      </div>

      <div className="date-card">
        <div className="detail-row">
          <span>Created At</span>
          <p>
            {assignment.createdAt
              ? new Date(
                  assignment.createdAt
                ).toLocaleString()
              : "-"}
          </p>
        </div>

        <div className="detail-row">
          <span>Updated At</span>
          <p>
            {assignment.updatedAt
              ? new Date(
                  assignment.updatedAt
                ).toLocaleString()
              : "-"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ViewAssignment;