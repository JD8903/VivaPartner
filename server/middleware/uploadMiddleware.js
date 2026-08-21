const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =====================================================
// Upload Directory
// =====================================================

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// =====================================================
// Allowed File Configuration
// =====================================================

const ALLOWED_FILES = {
  ".pdf": {
    type: "PDF",
    mimeTypes: [
      "application/pdf",
    ],
  },

  ".pptx": {
    type: "PPTX",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
  },

  ".docx": {
    type: "DOCX",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },

  ".txt": {
    type: "TXT",
    mimeTypes: [
      "text/plain",
    ],
  },
};

// =====================================================
// Maximum File Size
// =====================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// =====================================================
// Storage
// =====================================================

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const originalBaseName = path
      .basename(
        file.originalname,
        extension
      );

    const safeBaseName = originalBaseName
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 80);

    const finalBaseName =
      safeBaseName || "study-material";

    const fileName =
      `${Date.now()}-${finalBaseName}${extension}`;

    cb(null, fileName);
  },
});

// =====================================================
// File Validation
// =====================================================

const fileFilter = (_req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const fileRule =
    ALLOWED_FILES[extension];

  // ---------------------------------------------------
  // Extension check
  // ---------------------------------------------------

  if (!fileRule) {
    const error = new Error(
      "Invalid file type. Only PDF, PPTX, DOCX and TXT files are allowed."
    );

    error.code = "INVALID_FILE_TYPE";

    return cb(error, false);
  }

  // ---------------------------------------------------
  // MIME check
  // ---------------------------------------------------

  /*
   * Some browsers may send an empty MIME type.
   * Extension validation is still mandatory.
   */

  if (
    file.mimetype &&
    !fileRule.mimeTypes.includes(
      file.mimetype
    )
  ) {
    const error = new Error(
      `Invalid ${fileRule.type} file. File extension and MIME type do not match.`
    );

    error.code = "INVALID_MIME_TYPE";

    return cb(error, false);
  }

  // ---------------------------------------------------
  // Valid
  // ---------------------------------------------------

  cb(null, true);
};

// =====================================================
// Multer Configuration
// =====================================================

const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
  },

  fileFilter,
});

// =====================================================
// Single File Upload
// =====================================================

const uploadSingleFile =
  upload.single("file");

// =====================================================
// Export
// =====================================================

module.exports = {
  upload,
  uploadSingleFile,
  uploadDir,
  MAX_FILE_SIZE,
  ALLOWED_FILES,
};