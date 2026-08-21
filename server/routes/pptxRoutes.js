const express = require("express");

const router = express.Router();

const {
  extractPPTX,
} = require("../controllers/pptxController");

const {
  uploadSingleFile,
} = require("../middleware/uploadMiddleware");

// ======================================================
// POST /api/pptx/extract
// ======================================================

router.post(
  "/extract",
  uploadSingleFile,
  extractPPTX
);

module.exports = router;