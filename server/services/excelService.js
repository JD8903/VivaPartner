const XLSX = require("xlsx");

const parseExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const sheetName = workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
  });

  return rows;
};

module.exports = {
  parseExcel,
};