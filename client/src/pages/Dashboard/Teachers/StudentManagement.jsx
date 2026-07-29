import { useEffect, useState } from "react";
import {
  getStudents,
  updateStudent,
} from "../../../services/studentApi";

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

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

      setStudents(res.data.students);
      setTotalPages(res.data.pagination.totalPages);
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

      alert(res.data.message);

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
      }}
    >
      <select
        value={classFilter}
        onChange={(e) => {
          setClassFilter(e.target.value);
          setCurrentPage(1);
        }}
      >
        <option value="">All Classes</option>
        <option value="CE-6A">CE-6A</option>
        <option value="CE-6B">CE-6B</option>
        <option value="IT-6A">IT-6A</option>
        <option value="IT-6B">IT-6B</option>
      </select>

      <select
        value={departmentFilter}
        onChange={(e) => {
          setDepartmentFilter(e.target.value);
          setCurrentPage(1);
        }}
      >
        <option value="">All Departments</option>
        <option value="CE">Computer Engineering</option>
        <option value="IT">Information Technology</option>
        <option value="EC">Electronics</option>
        <option value="ME">Mechanical</option>
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
        No students found.
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
          }}
        >
          <thead
            style={{
              background: "#2563eb",
              color: "#fff",
            }}
          >
            <tr>
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
              <tr key={student._id}>
                <td>
                  {(currentPage - 1) * rowsPerPage + index + 1}
                </td>

                <td>{student.enrollment}</td>
                <td>{student.name}</td>
                <td>{student.department}</td>
                <td>{student.semester}</td>
                <td>{student.classId}</td>
                <td>{student.vivaStatus}</td>
                <td>{student.marks}</td>

                <td>
                  <button
                    onClick={() => handleEdit(student)}
                    style={{
                      background: "#f59e0b",
                      color: "#fff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
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