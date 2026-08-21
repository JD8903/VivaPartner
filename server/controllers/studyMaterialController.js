const fs = require("fs");
const path = require("path");

const StudyMaterial = require("../models/StudyMaterial");
const VivaSession = require("../models/VivaSession");

const {
  extractStudyMaterial,
} = require("../services/studyMaterialExtractor");

// =====================================================
// Helper: Remove Uploaded File
// =====================================================

const removeUploadedFile = (filePath) => {
  try {
    if (
      filePath &&
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      "File cleanup error:",
      error.message
    );
  }
};

// =====================================================
// Helper: Detect Material Type
// =====================================================

const getMaterialType = (fileName = "") => {
  const extension = path
    .extname(fileName)
    .toLowerCase();

  switch (extension) {
    case ".pdf":
      return "PDF";

    case ".pptx":
      return "PPTX";

    case ".docx":
      return "DOCX";

    case ".txt":
      return "TXT";

    default:
      return null;
  }
};

// =====================================================
// POST /api/study-material
// Upload + Extract + Save
// =====================================================

const saveStudyMaterial = async (
  req,
  res
) => {
  let uploadedFilePath = null;

  try {
    // ---------------------------------------------------
    // Check uploaded file
    // ---------------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload a study material file.",
      });
    }

    uploadedFilePath = req.file.path;

    // ---------------------------------------------------
    // Determine file type
    // ---------------------------------------------------

    const materialType =
      getMaterialType(
        req.file.originalname
      );

    if (!materialType) {
      removeUploadedFile(
        uploadedFilePath
      );

      return res.status(400).json({
        success: false,
        message:
          "Unsupported study material type.",
      });
    }

    // ---------------------------------------------------
    // Request information
    // ---------------------------------------------------

    const {
      vivaSession,
      vivaConfigurationId,
      teacher,
      teacherId,
      class: classId,
      department,
      subject,
      subjectId,
      topic,
    } = req.body;

    // ---------------------------------------------------
    // Required session
    // ---------------------------------------------------

    if (!vivaSession) {
      removeUploadedFile(
        uploadedFilePath
      );

      return res.status(400).json({
        success: false,
        message:
          "Viva session is required.",
      });
    }

    // ---------------------------------------------------
    // Verify session
    // ---------------------------------------------------

    const session =
      await VivaSession.findById(
        vivaSession
      );

    if (!session) {
      removeUploadedFile(
        uploadedFilePath
      );

      return res.status(404).json({
        success: false,
        message:
          "Viva session not found.",
      });
    }

    // ---------------------------------------------------
    // Extract CURRENT uploaded file
    // ---------------------------------------------------

    let extractedText = "";

    try {
      extractedText =
        await extractStudyMaterial(
          uploadedFilePath,
          materialType
        );
    } catch (extractError) {
      console.error(
        "Study material extraction error:",
        extractError
      );

      removeUploadedFile(
        uploadedFilePath
      );

      return res.status(422).json({
        success: false,
        message:
          "The uploaded file could not be processed.",
        error:
          extractError.message,
      });
    }

    // ---------------------------------------------------
    // Check extracted content
    // ---------------------------------------------------

    if (!extractedText.trim()) {
      removeUploadedFile(
        uploadedFilePath
      );

      return res.status(422).json({
        success: false,
        message:
          "No readable text was found in the uploaded file.",
      });
    }

    // ---------------------------------------------------
    // Create database record
    // ---------------------------------------------------

    const material =
      await StudyMaterial.create({
        vivaSession,

        vivaConfigurationId:
          vivaConfigurationId || null,

        teacher:
          teacher ||
          session.teacher,

        teacherId:
          teacherId ||
          session.teacher,

        class:
          classId ||
          session.class,

        classId:
          classId ||
          session.class,

        department:
          department ||
          session.department,

        subject:
          subject ||
          session.subject,

        subjectId:
          subjectId ||
          session.subject,

        materialType,

        topic:
          typeof topic === "string"
            ? topic.trim()
            : "",

        fileName:
          req.file.originalname,

        filePath:
          req.file.path,

        fileType:
          materialType,

        fileSize:
          req.file.size,

        extractedText,

        status: "Ready",
      });

    // ---------------------------------------------------
    // Success
    // ---------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Study material uploaded and processed successfully.",

      material: {
        id: material._id,

        fileName:
          material.fileName,

        fileType:
          material.fileType,

        fileSize:
          material.fileSize,

        extractedText:
          material.extractedText,

        status:
          material.status,
      },
    });
  } catch (error) {
    console.error(
      "Save Study Material Error:",
      error
    );

    if (uploadedFilePath) {
      removeUploadedFile(
        uploadedFilePath
      );
    }

    // Duplicate file
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This file has already been uploaded for this viva session.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to save study material.",
      error:
        error.message,
    });
  }
};

// =====================================================
// POST /api/study-material/topic
// =====================================================

const saveTopic = async (
  req,
  res
) => {
  try {
    const {
      vivaSession,
      vivaConfigurationId,
      teacher,
      teacherId,
      class: classId,
      department,
      subject,
      subjectId,
      topic,
    } = req.body;

    const cleanTopic =
      typeof topic === "string"
        ? topic.trim()
        : "";

    if (!cleanTopic) {
      return res.status(400).json({
        success: false,
        message:
          "Topic is required.",
      });
    }

    if (!vivaSession) {
      return res.status(400).json({
        success: false,
        message:
          "Viva session is required.",
      });
    }

    const session =
      await VivaSession.findById(
        vivaSession
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Viva session not found.",
      });
    }

    const material =
      await StudyMaterial.create({
        vivaSession,

        vivaConfigurationId:
          vivaConfigurationId || null,

        teacher:
          teacher ||
          session.teacher,

        teacherId:
          teacherId ||
          session.teacher,

        class:
          classId ||
          session.class,

        classId:
          classId ||
          session.class,

        department:
          department ||
          session.department,

        subject:
          subject ||
          session.subject,

        subjectId:
          subjectId ||
          session.subject,

        materialType: "Topic",

        topic: cleanTopic,

        fileName: "",

        filePath: "",

        fileType: "",

        fileSize: 0,

        extractedText:
          cleanTopic,

        status: "Ready",
      });

    return res.status(201).json({
      success: true,

      message:
        "Topic saved successfully.",

      material: {
        id: material._id,

        topic:
          material.topic,

        extractedText:
          material.extractedText,

        status:
          material.status,
      },
    });
  } catch (error) {
    console.error(
      "Save Topic Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to save topic.",
      error:
        error.message,
    });
  }
};

// =====================================================
// GET Materials by Session
// =====================================================

const getStudyMaterials = async (
  req,
  res
) => {
  try {
    const {
      vivaSessionId,
    } = req.params;

    const materials =
      await StudyMaterial.find({
        vivaSession:
          vivaSessionId,
      }).sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      materials,
    });
  } catch (error) {
    console.error(
      "Get Study Materials Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch study materials.",
    });
  }
};

// =====================================================
// GET Materials by Configuration
// =====================================================

const getStudyMaterialsByConfig =
  async (req, res) => {
    try {
      const {
        configId,
      } = req.params;

      const materials =
        await StudyMaterial.find({
          vivaConfigurationId:
            configId,
        }).sort({
          createdAt: -1,
        });

      return res.json({
        success: true,
        materials,
      });
    } catch (error) {
      console.error(
        "Get Materials By Config Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch study materials.",
      });
    }
  };

// =====================================================
// GET Single Material
// =====================================================

const getStudyMaterial = async (
  req,
  res
) => {
  try {
    const material =
      await StudyMaterial.findById(
        req.params.id
      );

    if (!material) {
      return res.status(404).json({
        success: false,
        message:
          "Study material not found.",
      });
    }

    return res.json({
      success: true,
      material,
    });
  } catch (error) {
    console.error(
      "Get Study Material Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch study material.",
    });
  }
};

// =====================================================
// DELETE Material
// =====================================================

const deleteStudyMaterial = async (
  req,
  res
) => {
  try {
    const material =
      await StudyMaterial.findById(
        req.params.id
      );

    if (!material) {
      return res.status(404).json({
        success: false,
        message:
          "Study material not found.",
      });
    }

    if (material.filePath) {
      removeUploadedFile(
        material.filePath
      );
    }

    await StudyMaterial.findByIdAndDelete(
      req.params.id
    );

    return res.json({
      success: true,
      message:
        "Study material deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Study Material Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete study material.",
    });
  }
};

// =====================================================
// Exports
// =====================================================

module.exports = {
  saveStudyMaterial,
  saveTopic,
  getStudyMaterials,
  getStudyMaterial,
  getStudyMaterialsByConfig,
  deleteStudyMaterial,
};