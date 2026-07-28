const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
  extractPPTX,
} = require("../controllers/pptxController");

router.post(
  "/extract",
  upload.single("pptx"),
  extractPPTX
);

module.exports = router;