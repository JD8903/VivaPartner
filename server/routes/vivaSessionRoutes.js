const express = require("express");

const {
  createVivaSession,
  getVivaSession,
  getTeacherVivaSessions,
  getSessionAnalytics,
  getStudentVivaLink,
  joinVivaSession,
  startVivaSession,
  getNextVivaQuestion,
  getPublicVivaSession,
  startPublicViva,
  submitPublicVivaAnswer,
  completePublicViva,
  evaluateSessionAttempts,
} = require("../controllers/vivaSessionController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// Teacher Routes
// ======================================================

// List all Teacher Viva Sessions (Phase 14)
// GET /api/viva-sessions
router.get(
  "/",
  protect,
  getTeacherVivaSessions
);

// Create Viva Session
// POST /api/viva-sessions
router.post(
  "/",
  protect,
  createVivaSession
);

// Get Teacher Viva Session Analytics (Phase 14)
// GET /api/viva-sessions/:sessionId/analytics
router.get(
  "/:sessionId/analytics",
  protect,
  getSessionAnalytics
);

// Get Student Share Link
// GET /api/viva-sessions/:sessionId/share-link
router.get(
  "/:sessionId/share-link",
  protect,
  getStudentVivaLink
);

// Trigger AI Evaluation for Session
// POST /api/viva-sessions/:sessionId/evaluate
router.post(
  "/:sessionId/evaluate",
  protect,
  evaluateSessionAttempts
);

// ======================================================
// Student Public Route
// ======================================================

// Join Viva
// POST /api/viva-sessions/:sessionId/join

router.post(
  "/:sessionId/join",
  joinVivaSession
);

// ======================================================
// Student Start Viva
// POST /api/viva-sessions/:sessionId/start
// ======================================================

router.post(
  "/:sessionId/start",
  startVivaSession
);

// ======================================================
// Get Current Viva Question
// ======================================================

router.get(
  "/:sessionId/question/:questionNumber",
  getNextVivaQuestion
);

// ======================================================
// Get Viva Session
// ======================================================

// GET /api/viva-sessions/:sessionId

router.get(
  "/:sessionId",
  protect,
  getVivaSession
);

router.get(
  "/public/:sessionId",
  getPublicVivaSession
);

router.post(
  "/public/:sessionId/start",
  startPublicViva
);

router.post(
  "/public/:sessionId/answer",
  submitPublicVivaAnswer
);

router.post(
  "/public/:sessionId/complete",
  completePublicViva
);

module.exports = router;