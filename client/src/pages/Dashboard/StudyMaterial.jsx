import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { extractPDF } from "../../services/pdfApi";
import { extractPPTX } from "../../services/pptxApi";
import { extractDOCX } from "../../services/docxApi";

import "./StudyMaterial.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".pptx",
  ".docx",
  ".txt",
];

const StudyMaterial = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [topic, setTopic] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState(false);

  // =====================================================
  // File Selection
  // =====================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    const extension =
      "." +
      file.name
        .split(".")
        .pop()
        .toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError(
        "Invalid file type. Please upload PDF, PPTX, DOCX or TXT."
      );

      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "File is too large. Maximum file size is 10 MB."
      );

      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // =====================================================
  // Remove File
  // =====================================================

  const handleRemoveFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setError("");
  };

  // =====================================================
  // Extract Current File
  // =====================================================

  const extractCurrentFile = async (file) => {
    const extension =
      "." +
      file.name
        .split(".")
        .pop()
        .toLowerCase();

    if (extension === ".pdf") {
      return await extractPDF(file);
    }

    if (extension === ".pptx") {
      return await extractPPTX(file);
    }

    if (extension === ".docx") {
      return await extractDOCX(file);
    }

    if (extension === ".txt") {
      return await file.text();
    }

    throw new Error(
      "Unsupported file type."
    );
  };

  // =====================================================
  // Extract Text From API Response
  // =====================================================

  const getExtractedText = (response) => {
    if (typeof response === "string") {
      return response;
    }

    if (!response) {
      return "";
    }

    if (typeof response.text === "string") {
      return response.text;
    }

    if (typeof response.extractedText === "string") {
      return response.extractedText;
    }

    if (typeof response.content === "string") {
      return response.content;
    }

    if (typeof response.data === "string") {
      return response.data;
    }

    if (
      response.data &&
      typeof response.data.text === "string"
    ) {
      return response.data.text;
    }

    if (
      response.data &&
      typeof response.data.extractedText === "string"
    ) {
      return response.data.extractedText;
    }

    return "";
  };

  // =====================================================
  // Continue
  // =====================================================

  const handleContinue = async () => {
    try {
      setError("");

      const cleanTopic = topic.trim();

      if (!selectedFile && !cleanTopic) {
        setError(
          "Please upload study material or enter a topic."
        );
        return;
      }

      setExtracting(true);

      // -------------------------------------------------
      // IMPORTANT:
      // Remove OLD study-material data first.
      // -------------------------------------------------

      localStorage.removeItem("studyMaterial");
      localStorage.removeItem("studyMaterialDraft");
      localStorage.removeItem("currentStudyMaterial");

      localStorage.removeItem("pdfText");
      localStorage.removeItem("pptxText");
      localStorage.removeItem("docxText");
      localStorage.removeItem("txtText");

      // -------------------------------------------------
      // Topic-only flow
      // -------------------------------------------------

      if (!selectedFile) {
        const currentMaterial = {
          sourceType: "topic",
          topic: cleanTopic,
          fileName: "",
          fileType: "",
          fileSize: 0,
          extractedText: cleanTopic,
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem(
          "currentStudyMaterial",
          JSON.stringify(currentMaterial)
        );

        localStorage.setItem(
          "studyMaterial",
          JSON.stringify({
            topic: cleanTopic,
            fileName: "",
            fileType: "",
            fileSize: 0,
          })
        );

        navigate(
          "/teacher/question-generation"
        );

        return;
      }

      // -------------------------------------------------
      // File flow
      // -------------------------------------------------

      const response =
        await extractCurrentFile(selectedFile);

      const extractedText =
        getExtractedText(response);

      if (
        !extractedText ||
        !extractedText.trim()
      ) {
        throw new Error(
          "No readable text was found in the uploaded file."
        );
      }

      const extension =
        "." +
        selectedFile.name
          .split(".")
          .pop()
          .toLowerCase();

      const currentMaterial = {
        sourceType: "file",
        topic: cleanTopic,
        fileName: selectedFile.name,
        fileType: extension
          .replace(".", "")
          .toUpperCase(),
        fileSize: selectedFile.size,
        extractedText: extractedText.trim(),
        createdAt: new Date().toISOString(),
      };

      // -------------------------------------------------
      // Save ONLY the CURRENT material
      // -------------------------------------------------

      localStorage.setItem(
        "currentStudyMaterial",
        JSON.stringify(currentMaterial)
      );

      localStorage.setItem(
        "studyMaterial",
        JSON.stringify({
          topic: cleanTopic,
          fileName: selectedFile.name,
          fileType:
            selectedFile.type || extension,
          fileSize: selectedFile.size,
        })
      );

      // Keep compatibility with older parts
      // of the project.
      if (extension === ".pdf") {
        localStorage.setItem(
          "pdfText",
          extractedText.trim()
        );
      }

      if (extension === ".pptx") {
        localStorage.setItem(
          "pptxText",
          extractedText.trim()
        );
      }

      if (extension === ".docx") {
        localStorage.setItem(
          "docxText",
          extractedText.trim()
        );
      }

      if (extension === ".txt") {
        localStorage.setItem(
          "txtText",
          extractedText.trim()
        );
      }

      navigate(
        "/teacher/question-generation"
      );
    } catch (err) {
      console.error(
        "Study Material Extraction Error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to process the study material."
      );
    } finally {
      setExtracting(false);
    }
  };

  // =====================================================
  // Back
  // =====================================================

  const handleBack = () => {
    navigate(-1);
  };

  // =====================================================
  // File Size
  // =====================================================

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 KB";
    }

    const mb =
      bytes / (1024 * 1024);

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }

    return `${Math.ceil(
      bytes / 1024
    )} KB`;
  };

  // =====================================================
  // File Extension
  // =====================================================

  const getFileExtension = (fileName) => {
    if (!fileName) {
      return "";
    }

    const parts =
      fileName.split(".");

    if (parts.length < 2) {
      return "";
    }

    return parts
      .pop()
      .toUpperCase();
  };

  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="study-page">
      <div className="study-header">
        <div>
          <h1>Study Material</h1>

          <p>
            Add study material or enter a
            topic for your viva question
            generation.
          </p>
        </div>
      </div>

      <div className="study-card">
        <div className="form-group">
          <label htmlFor="study-topic">
            Topic Name
            <span className="optional">
              Optional
            </span>
          </label>

          <input
            id="study-topic"
            type="text"
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value);
              setError("");
            }}
            placeholder="Example: Computer Networks"
          />

          <small>
            Enter a topic if you do not want
            to upload study material.
          </small>
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="form-group">
          <label>
            Upload Study Material
          </label>

          <div className="upload-box">
            <div className="upload-icon">
              📚
            </div>

            <h3>
              Upload Study Material
            </h3>

            <p>
              Upload your PDF, PPTX, DOCX
              or TXT file.
            </p>

            <input
              ref={fileInputRef}
              id="study-material-file"
              type="file"
              accept=".pdf,.pptx,.docx,.txt"
              onChange={handleFileChange}
            />

            <label
              htmlFor="study-material-file"
              className="choose-file-btn"
            >
              Choose File
            </label>

            <span className="file-help">
              Maximum file size: 10 MB
            </span>
          </div>
        </div>

        {selectedFile && (
          <div className="file-card">
            <div className="file-info">
              <div className="file-icon">
                📄
              </div>

              <div className="file-details">
                <h3>
                  {selectedFile.name}
                </h3>

                <p>
                  {getFileExtension(
                    selectedFile.name
                  )}{" "}
                  •{" "}
                  {formatFileSize(
                    selectedFile.size
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="remove-btn"
              onClick={handleRemoveFile}
              disabled={extracting}
            >
              Remove
            </button>
          </div>
        )}

        {error && (
          <div className="error-box">
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}

        <div className="actions">
          <button
            type="button"
            className="back-btn"
            onClick={handleBack}
            disabled={extracting}
          >
            ← Back
          </button>

          <button
            type="button"
            className="continue-btn"
            onClick={handleContinue}
            disabled={
              extracting ||
              (!selectedFile &&
                !topic.trim())
            }
          >
            {extracting
              ? "Processing..."
              : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyMaterial;