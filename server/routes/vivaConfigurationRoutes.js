const express = require("express");

const {
  createConfiguration,
  getConfiguration,
  updateConfiguration,
  deleteConfiguration,
} = require("../controllers/vivaConfigurationController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create Viva Configuration
router.post(
  "/",
  protect,
  createConfiguration
);

// Get Viva Configuration
router.get(
  "/:id",
  protect,
  getConfiguration
);

// Update Viva Configuration
router.put(
  "/:id",
  protect,
  updateConfiguration
);

// Delete Viva Configuration
router.delete(
  "/:id",
  protect,
  deleteConfiguration
);

module.exports = router;