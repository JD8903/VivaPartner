const fs = require("fs");
const pptx2json = require("pptx2json");

const extractPPTX = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PPTX uploaded",
      });
    }

    const presentation = await pptx2json.parse(req.file.path);

    let text = "";

    presentation.slides.forEach((slide) => {
      slide.elements.forEach((element) => {
        if (element.text) {
          text += element.text + "\n";
        }
      });
    });

    fs.unlink(req.file.path, () => {});

    res.json({
      success: true,
      text,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to extract PPTX",
    });
  }
};

module.exports = {
  extractPPTX,
};