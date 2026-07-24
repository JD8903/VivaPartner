import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getSubjectById,
  updateSubject,
} from "../../../services/subjectApi";

import { getDepartments } from "../../../services/departmentApi";

import "./EditSubject.css";

const EditSubject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    department: "",
    semester: "",
    credits: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subjectRes, deptRes] = await Promise.all([
        getSubjectById(id),
        getDepartments(),
      ]);

      const subject = subjectRes.subject;

      setFormData({
        name: subject.name || "",
        code: subject.code || "",
        department: subject.department?._id || "",
        semester: subject.semester || "",
        credits: subject.credits || "",
        status: subject.status || "Active",
      });

      setDepartments(deptRes.departments || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load subject.");
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
      !formData.credits
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setSaving(true);

      await updateSubject(id, formData);

      alert("Subject updated successfully.");

      navigate("/admin/subjects");
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "Failed to update subject."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <h2>Loading Subject...</h2>;
  }

  return (
    <div className="edit-subject-container">
      <div className="edit-subject-card">

        <h2>Edit Subject</h2>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Subject Name</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Subject Code</label>

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
            <label>Credits</label>

            <input
              type="number"
              name="credits"
              value={formData.credits}
              onChange={handleChange}
              min="1"
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
                navigate("/admin/subjects")
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
                : "Update Subject"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default EditSubject;