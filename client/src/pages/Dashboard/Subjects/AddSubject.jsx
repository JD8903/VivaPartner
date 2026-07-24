import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createSubject } from "../../../services/subjectApi";
import { getDepartments } from "../../../services/departmentApi";

import "./AddSubject.css";

const AddSubject = () => {
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
      setLoading(true);

      await createSubject(formData);

      alert("Subject added successfully.");

      navigate("/admin/subjects");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-subject-container">
      <div className="add-subject-card">

        <h2>Add Subject</h2>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Subject Name</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter Subject Name"
            />
          </div>

          <div className="form-group">
            <label>Subject Code</label>

            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Enter Subject Code"
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
              <option value="">Select Semester</option>

              {[1,2,3,4,5,6,7,8].map((sem)=>(
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
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="button-group">

            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/admin/subjects")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Subject"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default AddSubject;