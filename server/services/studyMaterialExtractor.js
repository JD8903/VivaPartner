const fs = require("fs");
const path = require("path");

// =====================================================
// Extract PDF
// =====================================================

const extractPDF = async (filePath) => {
  const pdfParse = require("pdf-parse");

  const buffer = fs.readFileSync(filePath);

  const data = await pdfParse(buffer);

  return (data.text || "").trim();
};

// =====================================================
// Extract DOCX
// =====================================================

const extractDOCX = async (filePath) => {
  const mammoth = require("mammoth");

  const result = await mammoth.extractRawText({
    path: filePath,
  });

  return (result.value || "").trim();
};

// =====================================================
// Extract TXT
// =====================================================

const extractTXT = async (filePath) => {
  return fs
    .readFileSync(filePath, "utf8")
    .trim();
};

// =====================================================
// Extract PPTX
// =====================================================

const extractPPTX = async (filePath) => {
  /*
   * PPTX is a ZIP/XML based format.
   * We extract text directly from slide XML.
   */

  const AdmZip = require("adm-zip");

  const zip = new AdmZip(filePath);

  const entries = zip
    .getEntries()
    .filter((entry) =>
      /^ppt\/slides\/slide\d+\.xml$/i.test(
        entry.entryName
      )
    )
    .sort((a, b) => {
      const aNumber = parseInt(
        a.entryName.match(/\d+/)?.[0] || "0",
        10
      );

      const bNumber = parseInt(
        b.entryName.match(/\d+/)?.[0] || "0",
        10
      );

      return aNumber - bNumber;
    });

  const slides = [];

  for (const entry of entries) {
    const xml = entry.getData().toString("utf8");

    const texts = [];

    const regex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/gi;

    let match;

    while ((match = regex.exec(xml)) !== null) {
      const text = match[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      if (text) {
        texts.push(text);
      }
    }

    if (texts.length > 0) {
      slides.push(texts.join(" "));
    }
  }

  return slides.join("\n\n").trim();
};

// =====================================================
// Main Extractor
// =====================================================

const extractStudyMaterial = async (
  filePath,
  materialType
) => {
  if (!filePath) {
    throw new Error(
      "File path is required for extraction."
    );
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(
      "Uploaded file was not found on the server."
    );
  }

  switch (materialType) {
    case "PDF":
      return await extractPDF(filePath);

    case "PPTX":
      return await extractPPTX(filePath);

    case "DOCX":
      return await extractDOCX(filePath);

    case "TXT":
      return await extractTXT(filePath);

    default:
      throw new Error(
        `Unsupported material type: ${materialType}`
      );
  }
};

module.exports = {
  extractStudyMaterial,
};