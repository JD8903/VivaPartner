const express = require("express");

const {
  getPublicVivaSession,
  joinPublicViva,
  startPublicViva,
  getCurrentVivaQuestion,
  saveStudentAnswer,
  nextVivaQuestion,
  completePublicViva,
} = require("../controllers/publicVivaController");

const router = express.Router();

// =====================================================
// PUBLIC VIVA ROUTES
// =====================================================

// GET /api/viva/public/:sessionId
router.get(
  "/:sessionId",
  getPublicVivaSession
);

// POST /api/viva/public/:sessionId/join
router.post(
  "/:sessionId/join",
  joinPublicViva
);

// POST /api/viva/public/:sessionId/start
router.post(
  "/:sessionId/start",
  startPublicViva
);

// =====================================================
// 10.7.2
// GET CURRENT QUESTION
// =====================================================

// GET /api/viva/public/:sessionId/question?attemptId=...
router.get(
  "/:sessionId/question",
  getCurrentVivaQuestion
);

// =====================================================
// 10.7.5
// SAVE STUDENT ANSWER
// =====================================================

// POST /api/viva/public/:sessionId/answer
router.post(
  "/:sessionId/answer",
  saveStudentAnswer
);

// =====================================================
// 10.7.6
// MOVE TO NEXT QUESTION
// =====================================================

// POST /api/viva/public/:sessionId/next
router.post(
  "/:sessionId/next",
  nextVivaQuestion
);

// =====================================================
// 10.7.7
// COMPLETE VIVA
// =====================================================

// POST /api/viva/public/:sessionId/complete
router.post(
  "/:sessionId/complete",
  completePublicViva
);

module.exports = router;