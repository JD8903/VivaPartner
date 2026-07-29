const express = require("express");
const upload = require("../middleware/excelUpload");

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