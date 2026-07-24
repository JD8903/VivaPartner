import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getClassById } from "../../../services/classApi";
import "./ViewClass.css";

const ViewClass = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClass();
  }, []);

  const loadClass = async () => {
    try {
      const data = await getClassById(id);
      setClassData(data.class);
    } catch (error) {
      console.error(error);
      alert("Failed to load class.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading Class...</h2>;
  }

  if (!classData) {
    return <h2>Class Not Found</h2>;
  }

  return (
    <div className="view-class-container">
      <div className="view-class-card">

        <div className="view-header">
          <div className="class-avatar">
            {classData.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h2>{classData.name}</h2>
            <p>{classData.code}</p>
          </div>
        </div>

        <div className="view-details">

          <div className="detail-item">
            <span>Department</span>
            <strong>{classData.department?.name}</strong>
          </div>

          <div className="detail-item">
            <span>Semester</span>
            <strong>{classData.semester}</strong>
          </div>

          <div className="detail-item">
            <span>Academic Year</span>
            <strong>{classData.academicYear}</strong>
          </div>

          <div className="detail-item">
            <span>Capacity</span>
            <strong>{classData.capacity}</strong>
          </div>

          <div className="detail-item">
            <span>Status</span>

            <strong
              className={
                classData.status === "Active"
                  ? "active"
                  : "inactive"
              }
            >
              {classData.status}
            </strong>
          </div>

          <div className="detail-item">
            <span>Created At</span>

            <strong>
              {new Date(
                classData.createdAt
              ).toLocaleString()}
            </strong>
          </div>

          <div className="detail-item">
            <span>Updated At</span>

            <strong>
              {new Date(
                classData.updatedAt
              ).toLocaleString()}
            </strong>
          </div>

        </div>

        <div className="button-group">

          <button
            className="back-btn"
            onClick={() => navigate("/admin/classes")}
          >
            Back
          </button>

          <Link
            to={`/admin/classes/edit/${classData._id}`}
            className="edit-btn"
          >
            Edit Class
          </Link>

        </div>

      </div>
    </div>
  );
};

export default ViewClass;