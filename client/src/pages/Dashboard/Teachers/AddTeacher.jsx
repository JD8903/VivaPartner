import { useState } from "react";
import { createTeacher } from "../../../services/teacherApi";
import "./AddTeacher.css";

const AddTeacher = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await createTeacher(formData);

      setMessage(res.message);

      setFormData({
        name: "",
        email: "",
        password: "",
        department: "",
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Something went wrong."
      );
    }

    setLoading(false);
  };

  return (
    <div className="add-teacher-page">
      <div className="teacher-card">
        <h2>Add New Teacher</h2>
        <p>Create a new teacher account.</p>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Teacher Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter teacher name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              placeholder="Enter department"
              value={formData.department}
              onChange={handleChange}
              required
            />
          </div>

          <button
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Creating..." : "Add Teacher"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTeacher;