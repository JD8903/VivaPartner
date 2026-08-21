const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
  evaluateAttempt,
  getVivaResults,
  getStudentResult,
  getTeacherVivas,
  evaluateAllAttempts,
} = require("../controllers/resultsController");

const router = express.Router();

// Evaluate a single attempt
router.post("/evaluate/:attemptId", protect, evaluateAttempt);

// Evaluate ALL unevaluated attempts for a session
router.post("/evaluate-all/:sessionId", protect, evaluateAllAttempts);

// Get aggregated viva results
router.get("/viva/:sessionId", protect, getVivaResults);

// Get individual student attempt result
router.get("/student/:attemptId", protect, getStudentResult);

// Get all viva sessions for the authenticated teacher
router.get("/teacher/vivas", protect, getTeacherVivas);

module.exports = router;
