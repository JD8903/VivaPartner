const fs = require("fs");
const officeParser = require("officeparser");

const extractPPTX = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PPTX uploaded.",
      });
    }

    // Parse the PPTX file
    const ast = await officeParser.parseOffice(req.file.path);

    // Convert parsed content to plain text
    const result = await ast.to("text");

    // Delete uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error("Failed to delete uploaded PPTX:", err);
      }
    });

    return res.status(200).json({
      success: true,
      text: result.value || "",
    });

  } catch (error) {
    console.error("PPTX Extraction Error:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }

    return res.status(500).json({
      success: false,
      message: "Failed to extract PPTX.",
      error: error.message,
    });
  }
};

module.exports = {
  extractPPTX,
};