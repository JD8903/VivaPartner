const express = require("express");

const router = express.Router();

const {
  generateQuestions,
} = require("../controllers/aiController");

// =====================================================
// Generate AI Viva Questions
// POST /api/ai/generate-questions
// =====================================================

router.post(
  "/generate-questions",
  generateQuestions
);

module.exports = router;