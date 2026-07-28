import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { validateStudents } from "../../utils/studentValidation";
import "./StudentUpload.css";

const StudentUpload = () => {
  const navigate = useNavigate();

  const [selectedClass, setSelectedClass] = useState(null);
  const [file, setFile] = useState(null);
  const [students, setStudents] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedClass = localStorage.getItem("selectedClass");

    if (storedClass) {
      setSelectedClass(JSON.parse(storedClass));
    }
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a valid Excel (.xlsx or .xls) file.");
      setFile(null);
      setStudents([]);
      return;
    }

    setError("");
    setFile(selectedFile);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);

        const workbook = XLSX.read(data, {
          type: "array",
        });

        const sheetName = workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        });

        const result = validateStudents(jsonData);

        setStudents(result.students);
        setValidationErrors(result.errors);

        if (result.errors.length > 0) {
        setError("Excel validation failed. Please check the errors below.");
        } else {
        setError("");
        }
      } catch (err) {
        console.error(err);
        setError("Unable to read Excel file.");
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

    const handleRemove = () => {
    setFile(null);
    setStudents([]);
    setValidationErrors([]);
    setError("");
    };

  const handleContinue = () => {
    if (!file) {
      setError("Please upload an Excel file first.");
      return;
    }

    if (students.length === 0) {
      setError("No student records found.");
      return;
    }

    localStorage.setItem(
      "studentExcel",
      JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })
    );

    localStorage.setItem(
      "students",
      JSON.stringify(students)
    );

    navigate("/teacher/study-material");
  };

  return (
    <div className="student-upload-page">
      <div className="upload-header">
        <h1>Student Excel Upload</h1>

        <p>
          Upload the student Excel sheet for the selected class before
          continuing.
        </p>
      </div>

      {selectedClass && (
        <div className="selected-class-card">
          <h3>{selectedClass.class?.name}</h3>

          <p>
            <strong>Department:</strong>{" "}
            {selectedClass.department?.name}
          </p>

          <p>
            <strong>Subject:</strong>{" "}
            {selectedClass.subject?.name}
          </p>

          <p>
            <strong>Semester:</strong>{" "}
            {selectedClass.class?.semester}
          </p>
        </div>
      )}

      <div className="upload-card">
        <label className="upload-label">
          Select Student Excel File
        </label>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
        />

        {file && (
          <div className="file-preview">
            <div>
              <h3>{file.name}</h3>

              <small>
                {(file.size / 1024).toFixed(2)} KB
              </small>
            </div>

            <button
              className="remove-btn"
              onClick={handleRemove}
            >
              Remove
            </button>
          </div>
        )}

        {students.length > 0 && (
          <>
            <h2
              style={{
                marginTop: "30px",
                marginBottom: "15px",
              }}
            >
              Student Preview ({students.length})
            </h2>

            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table className="student-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Enrollment Number</th>
                        <th>Student Name</th>
                    </tr>
                    </thead>

                    <tbody>
                    {students.map((student, index) => (
                        <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{student.enrollmentNo}</td>
                        <td>{student.studentName}</td>
                        </tr>
                    ))}
                    </tbody>
              </table>
            </div>
          </>
        )}

        {validationErrors.length > 0 && (
            <div className="validation-box">
                <h3>Validation Errors</h3>

                <ul>
                {validationErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                ))}
                </ul>
            </div>
        )}

        {error && (
          <div className="upload-error">
            {error}
          </div>
        )}

        <div className="upload-actions">
          <button
            className="back-btn"
            onClick={() => navigate("/teacher/viva-setup")}
          >
            ← Back
          </button>

          <button
            className="continue-btn"
            onClick={handleContinue}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentUpload;