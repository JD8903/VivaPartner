import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDepartment } from "../../../services/departmentApi"
import "./AddDepartment.css";

const AddDepartment = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim())
      newErrors.name = "Department name is required.";

    if (!formData.code.trim())
      newErrors.code = "Department code is required.";

    if (!formData.description.trim())
      newErrors.description = "Description is required.";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      await createDepartment(formData);

      alert("Department added successfully!");

      navigate("/admin/departments");
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Failed to add department."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-department-container">
      <div className="add-department-card">
        <h1>Add Department</h1>
        <p>Create a new department in the system.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Department Name</label>

            <input
              type="text"
              name="name"
              placeholder="Enter department name"
              value={formData.name}
              onChange={handleChange}
            />

            {errors.name && (
              <span className="error">
                {errors.name}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Department Code</label>

            <input
              type="text"
              name="code"
              placeholder="Enter department code"
              value={formData.code}
              onChange={handleChange}
            />

            {errors.code && (
              <span className="error">
                {errors.code}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Description</label>

            <textarea
              rows="4"
              name="description"
              placeholder="Enter description"
              value={formData.description}
              onChange={handleChange}
            />

            {errors.description && (
              <span className="error">
                {errors.description}
              </span>
            )}
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

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() =>
                navigate("/admin/departments")
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
                : "Add Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDepartment;