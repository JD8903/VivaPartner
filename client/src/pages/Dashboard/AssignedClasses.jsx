import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaGraduationCap,
  FaBookOpen,
} from "react-icons/fa";
import { getAssignedClasses } from "../../services/teacherApi";
import "./AssignedClasses.css";

const AssignedClasses = () => {
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAssignedClasses();
  }, []);

  const fetchAssignedClasses = async () => {
    try {
      const data = await getAssignedClasses();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching assigned classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const className = item.class?.name?.toLowerCase() || "";
      const subjectName = item.subject?.name?.toLowerCase() || "";
      const departmentName = item.department?.name?.toLowerCase() || "";

      return (
        className.includes(search.toLowerCase()) ||
        subjectName.includes(search.toLowerCase()) ||
        departmentName.includes(search.toLowerCase())
      );
    });
  }, [assignments, search]);

  const handleSelectClass = (assignment) => {
    localStorage.setItem(
      "selectedClass",
      JSON.stringify(assignment)
    );

    navigate("/teacher/start-viva");
  };

  const handleManageStudents = (assignment) => {
    localStorage.setItem(
      "selectedClass",
      JSON.stringify(assignment)
    );
    navigate(`/teacher/students?classId=${assignment.class?._id || ""}`);
  };

  const handleUploadExcel = (assignment) => {
    localStorage.setItem(
      "selectedClass",
      JSON.stringify(assignment)
    );
    navigate("/teacher/upload-students");
  };

  if (loading) {
    return (
      <div className="assigned-page">
        <h2>Assigned Classes</h2>

        <div className="assigned-grid">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="assigned-card skeleton-card"
            >
              <div className="skeleton title"></div>
              <div className="skeleton text"></div>
              <div className="skeleton text"></div>
              <div className="skeleton text"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="assigned-page">
      <div className="assigned-header">
        <h2>Assigned Classes</h2>

        <div className="search-box">
          <FaSearch />

          <input
            type="text"
            placeholder="Search class, subject or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="empty-state">
          <FaGraduationCap size={60} />

          <h3>No Assigned Classes</h3>

          <p>You don't have any active class assignments.</p>
        </div>
      ) : (
        <div className="assigned-grid">
          {filteredAssignments.map((item) => (
            <div
              key={item._id}
              className="assigned-card"
            >
              <div className="card-header">
                <h3>{item.class?.name}</h3>

                <span className="semester-chip">
                  Semester {item.class?.semester}
                </span>
              </div>

              <div className="badge-row">
                <span className="department-badge">
                  {item.department?.name}
                </span>

                <span className="subject-badge">
                  <FaBookOpen />
                  {item.subject?.name}
                </span>
              </div>

              <div className="class-details">
                <span>Academic Year</span>

                <strong>
                  {item.class?.academicYear}
                </strong>
              </div>

              <div className="class-details">
                <span>Enrolled Students</span>

                <strong>
                  {item.studentCount !== undefined ? item.studentCount : 0} Students
                </strong>
              </div>

              <div className="class-details">
                <span>Capacity</span>

                <strong>
                  {item.class?.capacity || 0} Students
                </strong>
              </div>

              <div className="class-details">
                <span>Status</span>

                <span className="status-badge">
                  {item.status}
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "15px", flexWrap: "wrap" }}>
                <button
                  className="select-class-btn"
                  style={{ flex: "1 1 100%" }}
                  onClick={() =>
                    handleSelectClass(item)
                  }
                >
                  Select & Start Viva
                </button>
                <button
                  style={{
                    flex: "1 1 calc(50% - 4px)",
                    padding: "9px 12px",
                    background: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                  onClick={() => handleManageStudents(item)}
                >
                  View Students
                </button>
                <button
                  style={{
                    flex: "1 1 calc(50% - 4px)",
                    padding: "9px 12px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                  onClick={() => handleUploadExcel(item)}
                >
                  Upload Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedClasses;