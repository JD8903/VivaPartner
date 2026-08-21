const express = require("express");

const router = express.Router();

const {
  extractDOCX,
} = require("../controllers/docxController");

const {
  uploadSingleFile,
} = require("../middleware/uploadMiddleware");

// ======================================================
// POST /api/docx/extract
// ======================================================

router.post(
  "/extract",
  uploadSingleFile,
  extractDOCX
);

module.exports = router;