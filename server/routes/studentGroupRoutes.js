const express = require("express");

const {
  generateGroups,
} = require("../controllers/studentGroupController");

const router = express.Router();

// Generate Student Groups
router.post("/generate", generateGroups);

module.exports = router;