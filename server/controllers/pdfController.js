const fs = require("fs");
const pdfParse = require("pdf-parse");

const extractPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF uploaded",
      });
    }

    const dataBuffer = fs.readFileSync(req.file.path);

    const data = await pdfParse(dataBuffer);

    res.json({
      success: true,
      pages: data.numpages,
      text: data.text,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "PDF extraction failed",
    });
  }
};

module.exports = {
  extractPDF,
};