const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
  extractPDF,
} = require("../controllers/pdfController");

router.post(
  "/extract",
  upload.single("pdf"),
  extractPDF
);

module.exports = router;