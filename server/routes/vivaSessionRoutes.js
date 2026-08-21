const express = require("express");

const {
  createVivaSession,
  getVivaSession,
  getStudentVivaLink,
  joinVivaSession,
  startVivaSession,
  getNextVivaQuestion,
  getPublicVivaSession,
  startPublicViva,
  submitPublicVivaAnswer,
  completePublicViva,
} = require("../controllers/vivaSessionController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// Teacher Routes
// ======================================================

// Create Viva Session
// POST /api/viva-sessions

router.post(
  "/",
  protect,
  createVivaSession
);

// Get Student Share Link
// GET /api/viva-sessions/:sessionId/share-link

router.get(
  "/:sessionId/share-link",
  protect,
  getStudentVivaLink
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