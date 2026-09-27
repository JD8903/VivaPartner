const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");

const os = require("os");

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const permanentDir = isServerless
  ? path.join(os.tmpdir(), "uploads", "study-material")
  : path.join(__dirname, "../uploads/study-material");

const moveToStudyMaterial = (filePath, fileName) => {
  try {
    if (!fs.existsSync(permanentDir)) {
      fs.mkdirSync(permanentDir, { recursive: true });
    }
    const destination = path.join(
      permanentDir,
      `${Date.now()}-${path.basename(fileName)}`
    );
    fs.renameSync(filePath, destination);
    return `/uploads/study-material/${path.basename(destination)}`;
  } catch (err) {
    console.warn("Move to study material warning:", err.message);
    return `/uploads/${path.basename(filePath)}`;
  }
};

const extractDOCX = async (req, res) => {
  let filePath = null;
  let moved = false;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No DOCX file uploaded.",
      });
    }

    filePath = req.file.path;

    const result = await mammoth.extractRawText({
      path: filePath,
    });

    const text = String(result.value || "")
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      return res.status(422).json({
        success: false,
        message: "Unable to extract text from this DOCX. Please upload another file.",
      });
    }

    const savedPath = moveToStudyMaterial(filePath, req.file.originalname);
    moved = true;

    return res.status(200).json({
      success: true,
      message: "DOCX text extracted successfully.",
      fileName: req.file.originalname,
      fileType: "DOCX",
      materialType: "DOCX",
      fileSize: req.file.size,
      filePath: savedPath,
      text,
      textLength: text.length,
      status: "Ready",
    });
  } catch (error) {
    console.error("DOCX Extraction Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to extract DOCX text.",
      error: error.message,
    });
  } finally {
    if (filePath && !moved && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
  }
};

module.exports = { extractDOCX };
