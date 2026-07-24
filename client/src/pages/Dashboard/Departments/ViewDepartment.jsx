import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDepartmentById } from "../../../services/departmentApi";
import "./ViewDepartment.css";

const ViewDepartment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartment();
  }, []);

  const loadDepartment = async () => {
    try {
      const data = await getDepartmentById(id);

      setDepartment(data.department || data);
    } catch (error) {
      console.error(error);
      alert("Failed to load department.");
      navigate("/admin/departments");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <h2>Loading Department...</h2>;

  if (!department)
    return <h2>Department not found.</h2>;

  return (
    <div className="view-department-container">
      <div className="department-card">

        <div className="department-avatar">
          {department.name?.charAt(0).toUpperCase()}
        </div>

        <div className="department-info">
          <h1>{department.name}</h1>

          <p>
            <strong>Department Code:</strong>{" "}
            {department.code}
          </p>

          <p>
            <strong>Description:</strong>{" "}
            {department.description}
          </p>

          <p>
            <strong>Status:</strong>

            <span
              className={`status ${department.status.toLowerCase()}`}
            >
              {department.status}
            </span>
          </p>
        </div>

        <div className="button-group">

          <button
            className="back-btn"
            onClick={() =>
              navigate("/admin/departments")
            }
          >
            ← Back
          </button>

          <Link
            to={`/admin/departments/edit/${department._id}`}
            className="edit-btn"
          >
            Edit Department
          </Link>

        </div>

      </div>
    </div>
  );
};

export default ViewDepartment;