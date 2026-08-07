const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads folder if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },

  filename(req, file, cb) {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    // PDF
    "application/pdf",

    // DOCX
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // DOC (Old Word)
    "application/msword",

    // PPTX
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // PPT (Old PowerPoint)
    "application/vnd.ms-powerpoint",

    // TXT
    "text/plain",

    // Excel XLSX
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    // Excel XLS
    "application/vnd.ms-excel",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log("Blocked MIME Type:", file.mimetype);

    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

module.exports = upload;