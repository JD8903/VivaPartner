const fs = require("fs");
const path = require("path");

/**
 * Extract text from PDF.
 *
 * This controller supports pdf-parse v1.x.
 *
 * Install:
 * npm install pdf-parse@1.1.1
 */
const extractPDF = async (req, res) => {
  try {
    // =====================================================
    // Validate uploaded file
    // =====================================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file was uploaded.",
      });
    }

    const filePath = req.file.path;

    console.log("======================================");
    console.log("PDF EXTRACTION STARTED");
    console.log("File:", req.file.originalname);
    console.log("Stored:", filePath);
    console.log("Size:", req.file.size);
    console.log("======================================");

    // =====================================================
    // Check file exists
    // =====================================================

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Uploaded PDF file could not be found.",
      });
    }

    // =====================================================
    // Read PDF
    // =====================================================

    const pdfBuffer = fs.readFileSync(filePath);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: "The uploaded PDF file is empty.",
      });
    }

    // =====================================================
    // Load pdf-parse
    // =====================================================

    let pdfParse;

    try {
      pdfParse = require("pdf-parse");

      // Handle unusual module export structures
      if (
        pdfParse &&
        typeof pdfParse !== "function" &&
        typeof pdfParse.default === "function"
      ) {
        pdfParse = pdfParse.default;
      }
    } catch (loadError) {
      console.error("pdf-parse loading error:", loadError);

      return res.status(500).json({
        success: false,
        message:
          "PDF extraction library is not installed correctly. Run: npm install pdf-parse@1.1.1",
        error: loadError.message,
      });
    }

    if (typeof pdfParse !== "function") {
      return res.status(500).json({
        success: false,
        message:
          "Invalid pdf-parse installation. Please install pdf-parse@1.1.1.",
      });
    }

    // =====================================================
    // Extract
    // =====================================================

    const result = await pdfParse(pdfBuffer);

    let text = result?.text || "";

    // =====================================================
    // Clean extracted text
    // =====================================================

    text = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // =====================================================
    // Validate extracted content
    // =====================================================

    if (!text) {
      return res.status(422).json({
        success: false,
        message:
          "No readable text was found in this PDF. The PDF may contain scanned images instead of selectable text.",
      });
    }

    console.log("======================================");
    console.log("PDF EXTRACTION SUCCESS");
    console.log("Pages:", result?.numpages || "Unknown");
    console.log("Characters:", text.length);
    console.log("Preview:", text.substring(0, 500));
    console.log("======================================");

    // =====================================================
    // Delete temporary uploaded file
    // =====================================================

    try {
      fs.unlinkSync(filePath);
    } catch (deleteError) {
      console.warn(
        "Could not delete temporary PDF:",
        deleteError.message
      );
    }

    // =====================================================
    // Response
    // =====================================================

    return res.status(200).json({
      success: true,
      message: "PDF text extracted successfully.",
      fileName: req.file.originalname,
      fileType: "PDF",
      fileSize: req.file.size,
      pages: result?.numpages || 0,
      text,
      textLength: text.length,
    });
  } catch (error) {
    console.error("======================================");
    console.error("PDF EXTRACTION ERROR");
    console.error(error);
    console.error("======================================");

    // Try deleting temporary file
    if (req.file?.path) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (deleteError) {
        console.warn(
          "Temporary PDF cleanup failed:",
          deleteError.message
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to extract PDF text.",
      error: error.message || "Unknown PDF extraction error.",
    });
  }
};

module.exports = {
  extractPDF,
};