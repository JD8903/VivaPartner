const express = require("express");

const {
  createVivaSession,
  getVivaSession,
} = require("../controllers/vivaSessionController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create Viva Session
router.post("/", protect, createVivaSession);

// Get Viva Session
router.get("/:id", protect, getVivaSession);

module.exports = router;