const express = require("express");

const router = express.Router();

const {
  getDashboardStatistics,
  getRecentActivities,
  getTeachersPerDepartment,
  getSubjectsPerDepartment,
  getClassesPerDepartment,
  getAssignmentsPerTeacher,
} = require("../controllers/reportsController");

// Dashboard
router.get("/dashboard", getDashboardStatistics);

// Recent Activity
router.get("/recent-activities", getRecentActivities);

// Analytics
router.get("/teachers-department", getTeachersPerDepartment);
router.get("/subjects-department", getSubjectsPerDepartment);
router.get("/classes-department", getClassesPerDepartment);
router.get("/assignments-teacher", getAssignmentsPerTeacher);

module.exports = router;