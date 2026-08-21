const express = require("express");
const upload = require("../middleware/excelUpload");
const { protect } = require("../middleware/authMiddleware");

const {
  uploadStudents,
  getStudents,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const router = express.Router();

// Upload Students from Excel
router.post(
  "/upload",
  protect,
  upload.single("excel"),
  uploadStudents
);

// Get All Students (Search + Filter + Pagination)
router.get("/", protect, getStudents);

// Update Student
router.put("/:id", protect, updateStudent);

// Delete Student
router.delete("/:id", protect, deleteStudent);

module.exports = router;