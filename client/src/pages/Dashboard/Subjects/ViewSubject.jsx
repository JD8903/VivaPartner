import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getSubjectById } from "../../../services/subjectApi";

import "./ViewSubject.css";

const ViewSubject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubject();
  }, []);

  const loadSubject = async () => {
    try {
      const data = await getSubjectById(id);
      setSubject(data.subject);
    } catch (error) {
      console.error(error);
      alert("Failed to load subject.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading Subject...</h2>;
  }

  if (!subject) {
    return <h2>Subject not found.</h2>;
  }

  return (
    <div className="view-subject-container">
      <div className="view-subject-card">

        <div className="subject-avatar">
          {subject.name.charAt(0).toUpperCase()}
        </div>

        <h2>{subject.name}</h2>

        <div className="subject-info">

          <div className="info-item">
            <strong>Subject Code</strong>
            <span>{subject.code}</span>
          </div>

          <div className="info-item">
            <strong>Department</strong>
            <span>{subject.department?.name}</span>
          </div>

          <div className="info-item">
            <strong>Semester</strong>
            <span>{subject.semester}</span>
          </div>

          <div className="info-item">
            <strong>Credits</strong>
            <span>{subject.credits}</span>
          </div>

          <div className="info-item">
            <strong>Status</strong>

            <span
              className={
                subject.status === "Active"
                  ? "status-active"
                  : "status-inactive"
              }
            >
              {subject.status}
            </span>
          </div>

          <div className="info-item">
            <strong>Created At</strong>
            <span>
              {new Date(subject.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="info-item">
            <strong>Last Updated</strong>
            <span>
              {new Date(subject.updatedAt).toLocaleDateString()}
            </span>
          </div>

        </div>

        <div className="button-group">

          <button
            className="back-btn"
            onClick={() => navigate("/admin/subjects")}
          >
            Back
          </button>

          <Link
            to={`/admin/subjects/edit/${subject._id}`}
            className="edit-btn"
          >
            Edit Subject
          </Link>

        </div>

      </div>
    </div>
  );
};

export default ViewSubject;