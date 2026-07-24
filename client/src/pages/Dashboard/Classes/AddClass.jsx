import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createClass } from "../../../services/classApi";
import { getDepartments } from "../../../services/departmentApi";

import "./AddClass.css";

const AddClass = () => {
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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error(error);
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
      setLoading(true);

      await createClass(formData);

      alert("Class added successfully.");

      navigate("/admin/classes");
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-class-container">
      <div className="add-class-card">

        <h2>Add Class</h2>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Class Name</label>

            <input
              type="text"
              name="name"
              placeholder="Enter Class Name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Class Code</label>

            <input
              type="text"
              name="code"
              placeholder="Enter Class Code"
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
              <option value="">
                Select Semester
              </option>

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
              placeholder="2026-27"
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
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : "Save Class"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default AddClass;