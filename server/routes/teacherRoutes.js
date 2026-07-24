const express = require("express");

const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherCount,
} = require("../controllers/teacherController");

const router = express.Router();

// Create Teacher
router.post("/", createTeacher);

// Get All Teachers
router.get("/", getTeachers);

//count teacher
router.get("/count/all", getTeacherCount);

// Get Teacher By ID
router.get("/:id", getTeacherById);

// Update Teacher
router.put("/:id", updateTeacher);

// Delete Teacher
router.delete("/:id", deleteTeacher);

module.exports = router;