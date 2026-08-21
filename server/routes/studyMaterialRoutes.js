const express = require("express");

const {
  saveStudyMaterial,
  getStudyMaterials,
  getStudyMaterial,
  getStudyMaterialsByConfig,
  deleteStudyMaterial,
  saveTopic,
} = require("../controllers/studyMaterialController");

const { protect } = require("../middleware/authMiddleware");

const {
  uploadSingleFile,
} = require("../middleware/uploadMiddleware");

const router = express.Router();

// =====================================================
// POST /api/study-material
// Upload and save study material
// =====================================================

router.post(
  "/",
  protect,
  uploadSingleFile,
  saveStudyMaterial
);

// =====================================================
// POST /api/study-material/topic
// Save manual topic
// =====================================================

router.post(
  "/topic",
  protect,
  saveTopic
);

// =====================================================
// GET /api/study-material/config/:configId
// =====================================================

router.get(
  "/config/:configId",
  protect,
  getStudyMaterialsByConfig
);

// =====================================================
// GET /api/study-material/session/:vivaSessionId
// =====================================================

router.get(
  "/session/:vivaSessionId",
  protect,
  getStudyMaterials
);

// =====================================================
// GET /api/study-material/:id
// =====================================================

router.get(
  "/:id",
  protect,
  getStudyMaterial
);

// =====================================================
// DELETE /api/study-material/:id
// =====================================================

router.delete(
  "/:id",
  protect,
  deleteStudyMaterial
);

module.exports = router;