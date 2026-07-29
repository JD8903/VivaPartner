import { useRef, useState } from "react";
import { uploadStudents } from "../../services/studentApi";

const Students = () => {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState(null);

  const MAX_SIZE = 5 * 1024 * 1024;

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;

    const extension = selectedFile.name
      .split(".")
      .pop()
      .toLowerCase();

    if (!["xlsx", "xls"].includes(extension)) {
      setError("Only .xlsx and .xls files are allowed.");
      return false;
    }

    if (selectedFile.size > MAX_SIZE) {
      setError("Maximum file size is 5 MB.");
      return false;
    }

    setError("");
    return true;
  };

  const handleFile = (selectedFile) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleInputChange = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setProgress(0);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async () => {
    if (!file) {
      setError("Please select an Excel file.");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      setError("");
      setMessage("");
      setSummary(null);

      const formData = new FormData();

      formData.append("excel", file);

      // Replace with actual values later
      formData.append("classId", "CE-6A");
      formData.append("teacher", "687ac4xxxxxxxx");

      const response = await uploadStudents(
        formData,
        (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );

          setProgress(percent);
        }
      );

      setMessage(response.data.message);
      setSummary(response.data.summary);

      removeFile();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to upload students."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "30px",
        fontFamily: "Arial",
      }}
    >
      <h1>Upload Student Excel</h1>

      <p>
        Upload an Excel (.xlsx or .xls) file containing student details.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        style={{
          marginTop: "30px",
          border: `2px dashed ${
            dragActive ? "#2563eb" : "#cccccc"
          }`,
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
          background: dragActive ? "#eef5ff" : "#fafafa",
          cursor: "pointer",
        }}
      >
        <h3>Drag & Drop Excel File Here</h3>

        <p>or</p>

        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          style={{
            padding: "12px 25px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Browse File
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleInputChange}
        />
      </div>

      <div style={{ marginTop: "20px", color: "#666" }}>
        <div>✔ Supported: .xlsx, .xls</div>
        <div>✔ Maximum Size: 5 MB</div>
      </div>

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#ffe6e6",
            color: "#d10000",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      {file && (
        <div
          style={{
            marginTop: "25px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <h3>Selected File</h3>

          <p>
            <strong>Name:</strong> {file.name}
          </p>

          <p>
            <strong>Size:</strong>{" "}
            {(file.size / 1024).toFixed(2)} KB
          </p>

          <button
            type="button"
            onClick={removeFile}
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Remove File
          </button>
        </div>
      )}

      {uploading && (
        <div style={{ marginTop: "25px" }}>
          <h3>Uploading...</h3>

          <div
            style={{
              width: "100%",
              height: "20px",
              background: "#ddd",
              borderRadius: "20px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#16a34a",
                transition: "0.3s",
              }}
            />
          </div>

          <p>{progress}%</p>
        </div>
      )}

      <button
        type="button"
        onClick={uploadFile}
        disabled={uploading}
        style={{
          marginTop: "35px",
          width: "100%",
          padding: "15px",
          background: uploading ? "#94a3b8" : "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          fontSize: "16px",
          cursor: uploading ? "not-allowed" : "pointer",
        }}
      >
        {uploading ? "Uploading..." : "Upload Excel"}
      </button>

      {message && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "10px",
            border: "1px solid #86efac",
          }}
        >
          <h3>✅ {message}</h3>

          {summary && (
            <>
              <p>
                <strong>Total Rows:</strong> {summary.totalRows}
              </p>

              <p>
                <strong>Imported:</strong> {summary.imported}
              </p>

              <p>
                <strong>Skipped:</strong> {summary.skipped}
              </p>

              <p>
                <strong>Duplicate in Excel:</strong>{" "}
                {summary.duplicateInExcel}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Students;