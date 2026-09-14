const express = require("express");
const upload = require("../middleware/excelUpload");
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  uploadStudents,
  getStudents,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const router = express.Router();

// All student management routes require authentication and teacher/admin role
router.use(protect);
router.use(authorize("teacher", "admin"));

// Upload Students from Excel
router.post(
  "/upload",
  upload.single("excel"),
  uploadStudents
);

// Get All Students (Search + Filter + Pagination)
router.get("/", getStudents);

// Update Student
router.put("/:id", updateStudent);

// Delete Student
router.delete("/:id", deleteStudent);

module.exports = router;