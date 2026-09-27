const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const classRoutes = require("./routes/classRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const exportRoutes = require("./routes/exportRoutes");
const teacherDashboardRoutes = require("./routes/teacherDashboardRoutes");
const vivaSessionRoutes = require("./routes/vivaSessionRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const pptxRoutes = require("./routes/pptxRoutes");
const docxRoutes = require("./routes/docxRoutes");
const aiRoutes = require("./routes/aiRoutes");
const questionRoutes = require("./routes/questionRoutes");
const studentRoutes = require("./routes/studentRoutes");
const studentGroupRoutes = require("./routes/studentGroupRoutes");
const vivaConfigurationRoutes = require("./routes/vivaConfigurationRoutes");
const studyMaterialRoutes = require("./routes/studyMaterialRoutes");
const publicVivaRoutes = require("./routes/publicVivaRoutes");
const resultsRoutes = require("./routes/resultsRoutes");

// Create Express App
const app = express();

// =======================
// CORS & Preflight
// =======================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);
app.options("*", cors());

// =======================
// Body Parsing Middleware
// =======================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =======================
// Database Connection Middleware
// =======================
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (error) {
    console.error("Database connection warning:", error.message);
  }
  next();
});

// =======================
// Test & Health Routes
// =======================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to VivaPartner Backend 🚀",
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VivaPartner API is running 🚀",
  });
});

// =======================
// API Routes
// =======================
app.use("/api/auth", authRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/teacher", teacherDashboardRoutes);
app.use("/api/viva-sessions", vivaSessionRoutes);
app.use("/api/viva/public", publicVivaRoutes);
app.use("/api/docx", docxRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/pptx", pptxRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/student-groups", studentGroupRoutes);
app.use("/api/study-material", studyMaterialRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/viva/configure", vivaConfigurationRoutes);

// =======================
// Upload / Multer errors
// =======================
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File is too large. Maximum file size is 10 MB.",
        code: "LIMIT_FILE_SIZE",
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file upload. Please use the file field.",
        code: "LIMIT_UNEXPECTED_FILE",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid file upload.",
      code: err.code,
    });
  }

  if (err && err.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({
      success: false,
      message: "Invalid file type. Only PDF, PPTX, DOCX and TXT files are allowed.",
      code: "INVALID_FILE_TYPE",
    });
  }

  if (err && err.code === "INVALID_MIME_TYPE") {
    return res.status(400).json({
      success: false,
      message: "Invalid file. The file extension and file type do not match.",
      code: "INVALID_MIME_TYPE",
    });
  }

  if (err && (err.type === "entity.too.large" || err.status === 413)) {
    return res.status(413).json({
      success: false,
      message: "Request payload is too large. Maximum allowed size is 50 MB.",
      code: "ENTITY_TOO_LARGE",
    });
  }

  if (err) {
    console.error("Unhandled Server Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error.",
    });
  }

  next();
});

// =======================
// 404 Route
// =======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
  });
});

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;