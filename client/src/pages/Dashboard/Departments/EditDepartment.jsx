import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDepartmentById,
  updateDepartment,
} from "../../../services/departmentApi";
import "./EditDepartment.css";

const EditDepartment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    status: "Active",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadDepartment();
  }, []);

  const loadDepartment = async () => {
    try {
      const data = await getDepartmentById(id);

      const department =
        data.department || data;

      setFormData({
        name: department.name || "",
        code: department.code || "",
        description:
          department.description || "",
        status:
          department.status || "Active",
      });
    } catch (error) {
      console.error(error);
      alert("Failed to load department.");
      navigate("/admin/departments");
    } finally {
      setLoading(false);
    }
  };

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
      newErrors.name =
        "Department name is required.";

    if (!formData.code.trim())
      newErrors.code =
        "Department code is required.";

    if (!formData.description.trim())
      newErrors.description =
        "Description is required.";

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      await updateDepartment(id, formData);

      alert(
        "Department updated successfully!"
      );

      navigate("/admin/departments");
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Failed to update department."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <h2>Loading Department...</h2>;

  return (
    <div className="edit-department-container">
      <div className="edit-department-card">
        <h1>Edit Department</h1>

        <p>
          Update department information.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Department Name</label>

            <input
              type="text"
              name="name"
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
                navigate(
                  "/admin/departments"
                )
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
                : "Update Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDepartment;