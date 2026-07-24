import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getAssignmentById,
  updateAssignment,
} from "../../../services/assignmentApi";

import { getTeachers } from "../../../services/teacherApi";
import { getDepartments } from "../../../services/departmentApi";
import { getSubjectsByDepartment } from "../../../services/subjectApi";
import { getClassesByDepartment } from "../../../services/classApi";

import "./EditAssignment.css";

const EditAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    teacher: "",
    department: "",
    subject: "",
    class: "",
    status: "Active",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teacherRes, departmentRes, assignmentRes] =
        await Promise.all([
          getTeachers(),
          getDepartments(),
          getAssignmentById(id),
        ]);

      setTeachers(teacherRes.teachers || []);
      setDepartments(departmentRes.departments || []);

      const assignment = assignmentRes.assignment;

      const departmentId =
        assignment.department?._id ||
        assignment.department;

      const [subjectRes, classRes] =
        await Promise.all([
          getSubjectsByDepartment(departmentId),
          getClassesByDepartment(departmentId),
        ]);

      setSubjects(subjectRes.subjects || []);
      setClasses(classRes.classes || []);

      setFormData({
        teacher:
          assignment.teacher?._id ||
          assignment.teacher,
        department: departmentId,
        subject:
          assignment.subject?._id ||
          assignment.subject,
        class:
          assignment.class?._id ||
          assignment.class,
        status: assignment.status,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === "department") {
      setFormData((prev) => ({
        ...prev,
        department: value,
        subject: "",
        class: "",
      }));

      try {
        const [subjectRes, classRes] =
          await Promise.all([
            getSubjectsByDepartment(value),
            getClassesByDepartment(value),
          ]);

        setSubjects(subjectRes.subjects || []);
        setClasses(classRes.classes || []);
      } catch (error) {
        console.error(error);
      }

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.teacher ||
      !formData.department ||
      !formData.subject ||
      !formData.class
    ) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);

      await updateAssignment(id, formData);

      alert("Assignment updated successfully.");

      navigate("/admin/assignments");
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to update assignment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-assignment-container">
      <div className="edit-assignment-card">

        <h2>Edit Assignment</h2>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Teacher</label>

            <select
              name="teacher"
              value={formData.teacher}
              onChange={handleChange}
            >
              <option value="">Select Teacher</option>

              {teachers.map((teacher) => (
                <option
                  key={teacher._id}
                  value={teacher._id}
                >
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Department</label>

            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
            >
              <option value="">Select Department</option>

              {departments.map((department) => (
                <option
                  key={department._id}
                  value={department._id}
                >
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subject</label>

            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
            >
              <option value="">Select Subject</option>

              {subjects.map((subject) => (
                <option
                  key={subject._id}
                  value={subject._id}
                >
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Class</label>

            <select
              name="class"
              value={formData.class}
              onChange={handleChange}
            >
              <option value="">Select Class</option>

              {classes.map((classItem) => (
                <option
                  key={classItem._id}
                  value={classItem._id}
                >
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="button-group">

            <button
              type="button"
              className="cancel-btn"
              onClick={() =>
                navigate("/admin/assignments")
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
                ? "Updating..."
                : "Update Assignment"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default EditAssignment;