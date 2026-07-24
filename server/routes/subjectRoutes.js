const express = require("express");

const {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectCount,
  getSubjectsByDepartment,
} = require("../controllers/subjectController");

const router = express.Router();

// Create Subject
router.post("/", createSubject);

// Subject Count
router.get("/count/all", getSubjectCount);

// Get All Subjects
router.get("/", getSubjects);

// Get Subject By ID
router.get("/:id", getSubjectById);

// Update Subject
router.put("/:id", updateSubject);

//Subject by department
router.get(
  "/department/:departmentId",
  getSubjectsByDepartment
);

// Delete Subject
router.delete("/:id", deleteSubject);



module.exports = router;