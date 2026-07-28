import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { extractPDF } from "../../services/pdfApi";
import { extractDOCX } from "../../services/docxApi";
import { extractPPTX } from "../../services/pptxApi";

import "./StudyMaterial.css";

const StudyMaterial = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");
  const [txtPreview, setTxtPreview] = useState("");

  const allowedTypes = [
    "application/pdf",

    "application/msword",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/vnd.ms-powerpoint",

    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    "text/plain",
  ];

  // ============================================
  // Upload File
  // ============================================

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];

    if (!selected) return;

    if (!allowedTypes.includes(selected.type)) {
      setError(
        "Only PDF, DOC, DOCX, PPT, PPTX and TXT files are allowed."
      );
      return;
    }

    setError("");
    setFile(selected);

    // ============================================
    // PDF
    // ============================================

    if (selected.type === "application/pdf") {
      try {
        const data = await extractPDF(selected);

        localStorage.setItem(
          "pdfText",
          data.text
        );

        console.log(
          "PDF Extracted Successfully"
        );
      } catch (err) {
        console.error(err);

        setError(
          "Failed to extract PDF content."
        );
      }

      setTxtPreview("");

      return;
    }

    // ============================================
    // DOCX
    // ============================================

    if (
      selected.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        const data = await extractDOCX(
          selected
        );

        localStorage.setItem(
          "docxText",
          data.text
        );

        console.log(
          "DOCX Extracted Successfully"
        );
      } catch (err) {
        console.error(err);

        setError(
          "Failed to extract DOCX content."
        );
      }

      setTxtPreview("");

      return;
    }

    // ============================================
    // PPTX
    // ============================================

    if (
      selected.type ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      try {
        const data = await extractPPTX(
          selected
        );

        localStorage.setItem(
          "pptxText",
          data.text
        );

        console.log(
          "PPTX Extracted Successfully"
        );
      } catch (err) {
        console.error(err);

        setError(
          "Failed to extract PPTX content."
        );
      }

      setTxtPreview("");

      return;
    }

    // ============================================
    // TXT
    // ============================================

    if (selected.type === "text/plain") {
      const reader = new FileReader();

      reader.onload = (event) => {
        const text =
          event.target.result;

        setTxtPreview(text);

        localStorage.setItem(
          "txtText",
          text
        );
      };

      reader.readAsText(selected);
    } else {
      setTxtPreview("");
    }
  };

  // ============================================
  // Remove File
  // ============================================

  const removeFile = () => {
    setFile(null);

    setTxtPreview("");

    setError("");

    localStorage.removeItem(
      "pdfText"
    );

    localStorage.removeItem(
      "docxText"
    );

    localStorage.removeItem(
      "pptxText"
    );

    localStorage.removeItem(
      "txtText"
    );
  };

  // ============================================
  // Get File Type
  // ============================================

  const getFileType = () => {
    if (!file) return "";

    return file.name
      .split(".")
      .pop()
      .toUpperCase();
  };

  // ============================================
  // Continue
  // ============================================

  const handleContinue = () => {
    if (!file && topic.trim() === "") {
      setError(
        "Upload a study material file or enter a topic."
      );

      return;
    }

    localStorage.setItem(
      "studyMaterial",
      JSON.stringify({
        topic,
        fileName: file?.name || "",
        fileType: getFileType(),
        txtPreview,
      })
    );

    navigate(
      "/teacher/question-generation"
    );
  };
    return (
    <div className="study-page">
      <div className="study-header">
        <h1>Study Material</h1>

        <p>
          Upload study material or enter a topic for AI Question
          Generation.
        </p>
      </div>

      <div className="study-card">
        {/* Topic */}

        <div className="form-group">
          <label>Topic Name (Optional)</label>

          <input
            type="text"
            placeholder="Example: Cloud Computing"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="divider">OR</div>

        {/* Upload */}

        <div className="form-group">
          <label>Upload Study Material</label>

          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
            onChange={handleFileChange}
          />

          <small
            style={{
              color: "#666",
              display: "block",
              marginTop: "8px",
            }}
          >
            Supported files: PDF, DOC, DOCX, PPT, PPTX and TXT
          </small>
        </div>

        {/* Uploaded File */}

        {file && (
          <div className="file-card">
            <div>
              <h3>
                {file.name}

                <span className="file-type">
                  {getFileType()}
                </span>
              </h3>

              <small>
                Size: {(file.size / 1024).toFixed(2)} KB
              </small>
            </div>

            <button
              className="remove-btn"
              onClick={removeFile}
            >
              Remove
            </button>
          </div>
        )}

        {/* TXT Preview */}

        {file?.type === "text/plain" &&
          txtPreview && (
            <div className="txt-preview">
              <h4>TXT Preview</h4>

              <pre>
                {txtPreview.length > 700
                  ? txtPreview.substring(0, 700) +
                    "..."
                  : txtPreview}
              </pre>
            </div>
          )}

        {/* Success Messages */}

        {file?.type === "application/pdf" && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              borderRadius: "8px",
              background: "#e8f5e9",
              color: "#2e7d32",
            }}
          >
            ✅ PDF uploaded successfully.
          </div>
        )}

        {file?.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              borderRadius: "8px",
              background: "#e3f2fd",
              color: "#1565c0",
            }}
          >
            ✅ DOCX uploaded successfully.
          </div>
        )}

        {file?.type ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation" && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              borderRadius: "8px",
              background: "#fff3e0",
              color: "#ef6c00",
            }}
          >
            ✅ PPTX uploaded successfully.
          </div>
        )}

        {/* Error */}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* Buttons */}

        <div className="actions">
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

export default StudyMaterial;