const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

const {
  getDashboardExport,
  exportVivaSessionExcel,
  populateUploadedExcel,
} = require("../controllers/exportController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Admin Dashboard Export
router.get("/dashboard", getDashboardExport);

// Export Generated Viva Results Excel (Phase 15)
// GET /api/export/viva/:sessionId/excel
router.get("/viva/:sessionId/excel", protect, authorize("teacher", "admin"), exportVivaSessionExcel);

// Populate Original Uploaded Excel Sheet (Phase 15)
// POST /api/export/viva/:sessionId/populate-excel
router.post(
  "/viva/:sessionId/populate-excel",
  protect,
  authorize("teacher", "admin"),
  upload.single("file"),
  populateUploadedExcel
);

module.exports = router;