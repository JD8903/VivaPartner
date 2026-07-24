const express = require("express");

const {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassCount,
  getClassesByDepartment,
} = require("../controllers/classController");

const router = express.Router();

// Create
router.post("/", createClass);


// Count
router.get("/count/all", getClassCount);

//class by department
router.get("/department/:departmentId",getClassesByDepartment);

// Get All
router.get("/", getClasses);

// Get By ID
router.get("/:id", getClassById);

// Update
router.put("/:id", updateClass);

// Delete
router.delete("/:id", deleteClass);


module.exports = router;