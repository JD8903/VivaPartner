const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

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
const docxRoutes = require("./routes/docxRoutes");
const pptxRoutes = require("./routes/pptxRoutes");
const aiRoutes = require("./routes/aiRoutes");
const questionRoutes = require("./routes/questionRoutes");
const studentRoutes = require("./routes/studentRoutes");
const studentGroupRoutes = require("./routes/studentGroupRoutes");


// Connect Database
connectDB();

// Create Express App
const app = express();

// =======================
// Middleware
// =======================
app.use(cors());
app.use(express.json());

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
app.use("/api/pdf", pdfRoutes);
app.use("/api/docx", docxRoutes);
app.use("/api/pptx", pptxRoutes);
app.use("/api/ai", aiRoutes)
app.use("/api/questions", questionRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/student-groups",studentGroupRoutes);


// =======================
// Test Route
// =======================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to VivaPartner Backend 🚀",
  });
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

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});