import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getStudents,
  updateStudent,
  deleteStudent,
} from "../../../services/studentApi";
import { getAssignedClasses } from "../../../services/teacherApi";

const StudentManagement = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assigned classes from server
  const [assignedClasses, setAssignedClasses] = useState([]);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState(
    searchParams.get("classId") || ""
  );
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Student Selection state (Phase 6.6)
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Success Message
  const [successMessage, setSuccessMessage] = useState("");

  // Form Data
  const [formData, setFormData] = useState({
    enrollment: "",
    name: "",
    department: "",
    semester: "",
    classId: "",
    vivaStatus: "",
    marks: 0,
  });

  // Load teacher assigned classes once
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await getAssignedClasses();
        if (data && data.assignments) {
          setAssignedClasses(data.assignments);
        }
      } catch (err) {
        console.error("Failed to load assigned classes:", err);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [
    search,
    classFilter,
    departmentFilter,
    currentPage,
    rowsPerPage,
  ]);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const res = await getStudents(
        search,
        classFilter,
        departmentFilter,
        currentPage,
        rowsPerPage
      );

      setStudents(res.data.students || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setClassFilter("");
    setDepartmentFilter("");
    setCurrentPage(1);
  };

  // Student Selection handlers (Phase 6.6)
  const toggleSelectStudent = (id) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === students.length && students.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map((s) => s._id)));
    }
  };

  const handleTargetForViva = () => {
    const selected = students.filter((s) => selectedStudentIds.has(s._id));
    if (selected.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    localStorage.setItem("selectedStudents", JSON.stringify(selected));

    // If there is an active class assignment matching classFilter, save it as selectedClass
    if (classFilter) {
      const matching = assignedClasses.find(
        (a) => a.class?._id === classFilter || a.class?.code === classFilter
      );
      if (matching) {
        localStorage.setItem("selectedClass", JSON.stringify(matching));
      }
    }

    navigate("/teacher/viva-setup");
  };

  // Open Edit Modal
  const handleEdit = (student) => {
    setEditingStudent(student);

    setFormData({
      enrollment: student.enrollment,
      name: student.name,
      department: student.department,
      semester: student.semester,
      classId: student.classId,
      vivaStatus: student.vivaStatus,
      marks: student.marks,
    });

    setShowEditModal(true);
  };

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "semester" || name === "marks"
          ? Number(value)
          : value,
    }));
  };

  // Save Student
  const handleSave = async () => {
    if (
      !formData.enrollment ||
      !formData.name ||
      !formData.department ||
      !formData.semester ||
      !formData.classId
    ) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const res = await updateStudent(
        editingStudent._id,
        formData
      );

      setShowEditModal(false);

      setSuccessMessage("Student updated successfully.");

      fetchStudents();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to update student."
      );
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      await deleteStudent(studentId);
      setSuccessMessage("Student deleted successfully.");
      fetchStudents();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete student.");
    }
  };
  return (
  <div style={{ padding: "30px" }}>
    <h1>Student Management</h1>

    {successMessage && (
      <div
        style={{
          background: "#dcfce7",
          color: "#166534",
          padding: "12px",
          marginBottom: "20px",
          borderRadius: "8px",
          border: "1px solid #86efac",
        }}
      >
        {successMessage}
      </div>
    )}

    {/* Header Actions */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div>
        <p style={{ color: "#64748b", margin: 0 }}>
          Manage students enrolled in your assigned classes or upload new students via Excel.
        </p>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => navigate("/teacher/upload-students")}
          style={{
            padding: "10px 18px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          + Upload Students Excel
        </button>
      </div>
    </div>

    {/* Selection Action Toolbar (Phase 6.6) */}
    {selectedStudentIds.size > 0 && (
      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ color: "#1e40af", fontWeight: "600" }}>
          ☑ {selectedStudentIds.size} student(s) selected
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setSelectedStudentIds(new Set())}
            style={{
              padding: "8px 14px",
              background: "#fff",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Clear Selection
          </button>
          <button
            onClick={handleTargetForViva}
            style={{
              padding: "8px 16px",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Setup Viva for Selected ({selectedStudentIds.size}) →
          </button>
        </div>
      </div>
    )}

    {/* Search */}
    <div
      style={{
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
      }}
    >
      <input
        type="text"
        placeholder="Search by Enrollment or Name..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
        style={{
          flex: 1,
          padding: "12px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      />

      <button
        onClick={() => {
          setSearch("");
          setCurrentPage(1);
        }}
        style={{
          padding: "12px 20px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Clear
      </button>
    </div>

    {/* Filters */}
    <div
      style={{
        display: "flex",
        gap: "15px",
        marginBottom: "20px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <select
        value={classFilter}
        onChange={(e) => {
          setClassFilter(e.target.value);
          setCurrentPage(1);
        }}
        style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
      >
        <option value="">All Assigned Classes</option>
        {assignedClasses.map((item) => (
          <option key={item._id} value={item.class?._id}>
            {item.class?.name} — {item.subject?.name} (Sem {item.class?.semester})
          </option>
        ))}
      </select>

      <button
        onClick={resetFilters}
        style={{
          padding: "10px 20px",
          background: "#dc2626",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Reset Filters
      </button>

      <div style={{ marginLeft: "auto" }}>
        <label>Rows: </label>

        <select
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>

    {/* Loading */}
    {loading ? (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
        }}
      >
        Loading Students...
      </div>
    ) : students.length === 0 ? (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
        }}
      >
        <p style={{ fontSize: "18px", color: "#64748b" }}>No students found for this filter.</p>
        <button
          onClick={() => navigate("/teacher/upload-students")}
          style={{
            marginTop: "10px",
            padding: "10px 20px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Upload Students Excel Now
        </button>
      </div>
    ) : (
      <>
        <table
          width="100%"
          border="1"
          cellPadding="12"
          cellSpacing="0"
          style={{
            borderCollapse: "collapse",
            borderColor: "#e2e8f0",
          }}
        >
          <thead
            style={{
              background: "#2563eb",
              color: "#fff",
            }}
          >
            <tr>
              <th style={{ width: "40px", textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={
                    selectedStudentIds.size === students.length &&
                    students.length > 0
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th>#</th>
              <th>Enrollment</th>
              <th>Name</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Class</th>
              <th>Status</th>
              <th>Marks</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student, index) => (
              <tr
                key={student._id}
                style={{
                  background: selectedStudentIds.has(student._id)
                    ? "#eff6ff"
                    : "#fff",
                }}
              >
                <td style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.has(student._id)}
                    onChange={() => toggleSelectStudent(student._id)}
                  />
                </td>

                <td>
                  {(currentPage - 1) * rowsPerPage + index + 1}
                </td>

                <td><strong>{student.enrollment}</strong></td>
                <td>{student.name}</td>
                <td>{student.department}</td>
                <td>{student.semester}</td>
                <td>{student.classId}</td>
                <td>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background:
                        student.vivaStatus === "Completed"
                          ? "#dcfce7"
                          : "#fef3c7",
                      color:
                        student.vivaStatus === "Completed"
                          ? "#166534"
                          : "#b45309",
                    }}
                  >
                    {student.vivaStatus || "Pending"}
                  </span>
                </td>
                <td>{student.marks || 0}</td>

                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handleEdit(student)}
                      style={{
                        background: "#f59e0b",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student._id)}
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
                {/* Pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            marginTop: "25px",
            flexWrap: "wrap",
          }}
        >
          <button
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((prev) => prev - 1)
            }
            style={{
              padding: "8px 14px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => (
              <button
                key={index}
                onClick={() =>
                  setCurrentPage(index + 1)
                }
                style={{
                  background:
                    currentPage === index + 1
                      ? "#2563eb"
                      : "#fff",
                  color:
                    currentPage === index + 1
                      ? "#fff"
                      : "#000",
                  border: "1px solid #ccc",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                {index + 1}
              </button>
            )
          )}

          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => prev + 1)
            }
            style={{
              padding: "8px 14px",
              cursor:
                currentPage === totalPages
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Next
          </button>
        </div>
      </>
    )}

    {/* Edit Modal */}
    {showEditModal && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999,
        }}
      >
        <div
          style={{
            background: "#fff",
            width: "500px",
            maxWidth: "95%",
            padding: "25px",
            borderRadius: "10px",
          }}
        >
          <h2>Edit Student</h2>

          <div
            style={{
              display: "grid",
              gap: "12px",
              marginTop: "20px",
            }}
          >
            <input
              name="enrollment"
              placeholder="Enrollment"
              value={formData.enrollment}
              onChange={handleChange}
            />

            <input
              name="name"
              placeholder="Student Name"
              value={formData.name}
              onChange={handleChange}
            />

            <input
              name="department"
              placeholder="Department"
              value={formData.department}
              onChange={handleChange}
            />

            <input
              type="number"
              name="semester"
              placeholder="Semester"
              value={formData.semester}
              onChange={handleChange}
            />

            <input
              name="classId"
              placeholder="Class"
              value={formData.classId}
              onChange={handleChange}
            />

            <select
              name="vivaStatus"
              value={formData.vivaStatus}
              onChange={handleChange}
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Absent">Absent</option>
            </select>

            <input
              type="number"
              name="marks"
              placeholder="Marks"
              value={formData.marks}
              onChange={handleChange}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "25px",
            }}
          >
            <button
              onClick={() => setShowEditModal(false)}
              style={{
                background: "#6b7280",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

export default StudentManagement;