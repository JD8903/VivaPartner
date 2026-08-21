// ============================================================
// VivaPartner - Public Viva Routes
// Phase 11.7 - Answer Submission API
// ============================================================

const express = require("express");

const {
  getPublicVivaSession,
  joinVivaSession,
  startPublicViva,
  getNextVivaQuestion,
  submitPublicVivaAnswer,
  completePublicViva,
} = require("../controllers/vivaSessionController");

const router = express.Router();

// =====================================================
// GET PUBLIC VIVA SESSION
// GET /api/viva/public/:sessionId
// =====================================================

router.get(
  "/:sessionId",
  getPublicVivaSession
);

// =====================================================
// STUDENT JOIN VIVA
// POST /api/viva/public/:sessionId/join
// =====================================================

router.post(
  "/:sessionId/join",
  joinVivaSession
);

// =====================================================
// START STUDENT VIVA
// POST /api/viva/public/:sessionId/start
// =====================================================

router.post(
  "/:sessionId/start",
  startPublicViva
);

// =====================================================
// GET CURRENT QUESTION
// GET /api/viva/public/:sessionId/question
// ?attemptId=...
// =====================================================

router.get(
  "/:sessionId/question",
  getNextVivaQuestion
);

// =====================================================
// 11.7 — SUBMIT STUDENT ANSWER
//
// POST /api/viva/public/:sessionId/answer
//
// Body:
//
// {
//   attemptId,
//   enrollmentNo,
//   questionId,
//   question,
//   answer,
//   questionNumber
// }
// =====================================================

router.post(
  "/:sessionId/answer",
  submitPublicVivaAnswer
);

// =====================================================
// COMPLETE VIVA
//
// POST /api/viva/public/:sessionId/complete
// =====================================================

router.post(
  "/:sessionId/complete",
  completePublicViva
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;