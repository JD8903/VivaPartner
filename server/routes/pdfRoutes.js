const express = require("express");

const router = express.Router();

const { extractPDF } = require("../controllers/pdfController");

const {
  uploadSingleFile,
} = require("../middleware/uploadMiddleware");

// =====================================================
// POST /api/pdf/extract
// =====================================================

router.post(
  "/extract",
  uploadSingleFile,
  extractPDF
);

module.exports = router;