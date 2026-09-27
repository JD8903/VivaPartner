const fs = require("fs");
const path = require("path");
const officeParser = require("officeparser");

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

const extractPPTX = async (req, res) => {
  let filePath = null;
  let moved = false;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PowerPoint file uploaded.",
      });
    }

    filePath = req.file.path;

    const ext = path.extname(req.file.originalname).toLowerCase();

    if (ext !== ".pptx") {
      return res.status(400).json({
        success: false,
        message: "Only PPTX files are supported. Please upload a PPTX file.",
      });
    }

    if (
      !officeParser ||
      typeof officeParser.parseOffice !== "function"
    ) {
      throw new Error(
        "PowerPoint parser is not available. Run npm install in the server folder."
      );
    }

    const ast = await officeParser.parseOffice(filePath);
    const parsed = await ast.to("text");

    const text = String(
      parsed && typeof parsed === "object" && "value" in parsed
        ? parsed.value
        : parsed || ""
    )
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      return res.status(422).json({
        success: false,
        message: "Unable to extract text from this PowerPoint. Please upload another file.",
      });
    }

    const savedPath = moveToStudyMaterial(
      filePath,
      req.file.originalname
    );
    moved = true;

    return res.status(200).json({
      success: true,
      message: "PowerPoint text extracted successfully.",
      fileName: req.file.originalname,
      fileType: "PPTX",
      materialType: "PPTX",
      fileSize: req.file.size,
      filePath: savedPath,
      text,
      textLength: text.length,
      status: "Ready",
    });
  } catch (error) {
    console.error("PPTX Extraction Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to extract PowerPoint text.",
      error: error.message,
    });
  } finally {
    if (filePath && !moved && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
  }
};

module.exports = { extractPPTX };
