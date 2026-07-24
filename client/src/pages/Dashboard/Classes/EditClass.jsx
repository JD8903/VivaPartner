import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getClassById,
  updateClass,
} from "../../../services/classApi";

import { getDepartments } from "../../../services/departmentApi";

import "./EditClass.css";

const EditClass = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    department: "",
    semester: "",
    academicYear: "",
    capacity: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classRes, deptRes] = await Promise.all([
        getClassById(id),
        getDepartments(),
      ]);

      const classData = classRes.class;

      setFormData({
        name: classData.name || "",
        code: classData.code || "",
        department: classData.department?._id || "",
        semester: classData.semester || "",
        academicYear: classData.academicYear || "",
        capacity: classData.capacity || "",
        status: classData.status || "Active",
      });

      setDepartments(deptRes.departments || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load class.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.code ||
      !formData.department ||
      !formData.semester ||
      !formData.academicYear ||
      !formData.capacity
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setSaving(true);

      await updateClass(id, formData);

      alert("Class updated successfully.");

      navigate("/admin/classes");
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to update class."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <h2>Loading Class...</h2>;
  }

  return (
    <div className="edit-class-container">
      <div className="edit-class-card">

        <h2>Edit Class</h2>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Class Name</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Class Code</label>

            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Department</label>

            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
            >
              <option value="">
                Select Department
              </option>

              {departments.map((dept) => (
                <option
                  key={dept._id}
                  value={dept._id}
                >
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Semester</label>

            <select
              name="semester"
              value={formData.semester}
              onChange={handleChange}
            >
              {[1,2,3,4,5,6,7,8].map((sem) => (
                <option
                  key={sem}
                  value={sem}
                >
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Academic Year</label>

            <input
              type="text"
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Capacity</label>

            <input
              type="number"
              name="capacity"
              min="1"
              value={formData.capacity}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Status</label>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>

          <div className="button-group">

            <button
              type="button"
              className="cancel-btn"
              onClick={() =>
                navigate("/admin/classes")
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
              disabled={saving}
            >
              {saving
                ? "Updating..."
                : "Update Class"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default EditClass;