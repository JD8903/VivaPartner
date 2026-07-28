const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
  extractDOCX,
} = require("../controllers/docxController");

router.post(
  "/extract",
  upload.single("docx"),
  extractDOCX
);

module.exports = router;