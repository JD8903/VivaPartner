const express = require("express");

const router = express.Router();

const {
  getAssignedClasses,
} = require("../controllers/teacherDashboardController");

const { protect } = require("../middleware/authMiddleware");

router.get(
  "/assigned-classes",
  protect,
  getAssignedClasses
);

module.exports = router;