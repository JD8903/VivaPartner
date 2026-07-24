import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getTeacherById } from "../../../services/teacherApi";

import "./ViewTeacher.css";

const ViewTeacher = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeacher = async () => {
      try {
        const data = await getTeacherById(id);
        setTeacher(data.teacher);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadTeacher();
  }, [id]);

  if (loading) {
    return <div className="loading">Loading Teacher...</div>;
  }

  if (!teacher) {
    return <div className="loading">Teacher not found.</div>;
  }

  return (
    <div className="view-teacher-container">
      <h1 className="view-title">Teacher Profile</h1>

      <div className="teacher-card">
        <div className="teacher-avatar">
          {teacher.name.charAt(0).toUpperCase()}
        </div>

        <div className="teacher-info">
          <label>Name</label>
          <p>{teacher.name}</p>

          <label>Email</label>
          <p>{teacher.email}</p>

          <label>Department</label>
          <p>{teacher.department}</p>

          <label>Status</label>
          <p>
            <span
              className={`status ${
                teacher.status?.toLowerCase() === "active"
                  ? "active"
                  : "inactive"
              }`}
            >
              {teacher.status}
            </span>
          </p>

          <label>Role</label>
          <p>{teacher.role}</p>
        </div>

        <div className="button-group">
          <button
            className="back-btn"
            onClick={() => navigate("/admin/teachers")}
          >
            Back
          </button>

          <Link
            to={`/admin/teachers/edit/${teacher._id}`}
            className="edit-btn"
          >
            Edit Teacher
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ViewTeacher;