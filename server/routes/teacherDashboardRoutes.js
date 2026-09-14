const express = require("express");

const router = express.Router();

const {
  getAssignedClasses,
  getTeacherDashboardStats,
} = require("../controllers/teacherDashboardController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get(
  "/assigned-classes",
  protect,
  authorize("teacher", "admin"),
  getAssignedClasses
);

router.get(
  "/dashboard-stats",
  protect,
  authorize("teacher", "admin"),
  getTeacherDashboardStats
);

module.exports = router;