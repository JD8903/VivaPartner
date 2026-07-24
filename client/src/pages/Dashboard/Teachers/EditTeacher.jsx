import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getTeacherById,
  updateTeacher,
} from "../../../services/teacherApi";

import "./EditTeacher.css";

const EditTeacher = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    status: "Active",
  });

  useEffect(() => {
    const loadTeacher = async () => {
      try {
        const data = await getTeacherById(id);

        setFormData({
          name: data.teacher.name,
          email: data.teacher.email,
          department: data.teacher.department,
          status: data.teacher.status,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTeacher();
  }, [id]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateTeacher(id, formData);

      alert("Teacher updated successfully!");

      navigate("/admin/teachers");
    } catch (err) {
      console.error(err);
      alert("Failed to update teacher.");
    }
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="edit-teacher-page">
      <div className="edit-card">
        <h2>Edit Teacher</h2>

        <form onSubmit={handleSubmit}>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Teacher Name"
            required
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />

          <input
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="Department"
            required
          />

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button type="submit">
            Update Teacher
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditTeacher;