const fs = require("fs");
const mammoth = require("mammoth");

const extractDOCX = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No DOCX uploaded",
      });
    }

    const result = await mammoth.extractRawText({
      path: req.file.path,
    });

    fs.unlink(req.file.path, () => {});

    res.json({
      success: true,
      text: result.value,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "DOCX extraction failed",
    });
  }
};

module.exports = {
  extractDOCX,
};