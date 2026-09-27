const os = require("os");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =====================================================
// Upload Directory (Serverless compatible)
// =====================================================

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const uploadDir = isServerless ? path.join(os.tmpdir(), "uploads") : path.join(__dirname, "../uploads");

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
      recursive: true,
    });
  }
} catch (err) {
  console.warn("Upload directory warning:", err.message);
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

  if (!fileRule) {
    const error = new Error(
      "Invalid file type. Only PDF, PPTX, DOCX and TXT files are allowed."
    );

    error.code = "INVALID_FILE_TYPE";

    return cb(error, false);
  }

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