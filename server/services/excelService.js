const XLSX = require("xlsx");

/**
 * Parse Excel file buffer into JSON rows
 */
const parseExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
  });
  return rows;
};

/**
 * Normalize an enrollment string for matching
 */
const normalizeEnrollment = (val) => {
  if (val === null || val === undefined) return "";
  return String(val).trim().toLowerCase();
};

/**
 * Populate evaluated marks into an original provided Excel buffer.
 * Preserves all original columns, existing headers, and other rows.
 *
 * @param {Buffer} buffer - Original Excel file buffer
 * @param {Map<string, Object>|Object} studentMarksMap - Map of normalized enrollment -> { marks, status, percentage }
 * @returns {Buffer} - Populated Excel buffer
 */
const populateExistingExcel = (buffer, studentMarksMap) => {
  const workbook = XLSX.read(buffer, { type: "buffer", cellStyles: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet || !worksheet["!ref"]) {
    throw new Error("Invalid or empty Excel worksheet.");
  }

  // Convert map if passed as plain object
  const marksMap =
    studentMarksMap instanceof Map
      ? studentMarksMap
      : new Map(
          Object.entries(studentMarksMap).map(([k, v]) => [
            normalizeEnrollment(k),
            v,
          ])
        );

  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  // Find header row and enrollment column index
  let headerRow = -1;
  let enrollmentCol = -1;
  let marksCol = -1;
  let statusCol = -1;
  let percentageCol = -1;

  const enrollmentRegex = /enrollment|roll|reg(istration)?/i;
  const marksRegex = /^(viva\s*)?(marks|score)$/i;
  const statusRegex = /^(viva\s*)?status$/i;
  const percentageRegex = /^(viva\s*)?percentage$/i;

  for (let r = range.s.r; r <= Math.min(range.e.r, 10); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];
      if (cell && cell.v && typeof cell.v === "string") {
        const val = cell.v.trim();
        if (enrollmentRegex.test(val)) {
          headerRow = r;
          enrollmentCol = c;
          break;
        }
      }
    }
    if (headerRow !== -1) break;
  }

  if (headerRow === -1 || enrollmentCol === -1) {
    // Fallback: search row 0
    headerRow = 0;
    enrollmentCol = 0;
  }

  // Check if Marks, Status, or Percentage columns already exist in header row
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c });
    const cell = worksheet[cellAddress];
    if (cell && cell.v && typeof cell.v === "string") {
      const val = cell.v.trim();
      if (marksRegex.test(val) && marksCol === -1) marksCol = c;
      if (statusRegex.test(val) && statusCol === -1) statusCol = c;
      if (percentageRegex.test(val) && percentageCol === -1) percentageCol = c;
    }
  }

  // If columns do not exist, append them to the right
  let nextCol = range.e.c + 1;
  if (marksCol === -1) {
    marksCol = nextCol++;
    worksheet[XLSX.utils.encode_cell({ r: headerRow, c: marksCol })] = {
      t: "s",
      v: "Viva Marks",
    };
  }
  if (statusCol === -1) {
    statusCol = nextCol++;
    worksheet[XLSX.utils.encode_cell({ r: headerRow, c: statusCol })] = {
      t: "s",
      v: "Viva Status",
    };
  }
  if (percentageCol === -1) {
    percentageCol = nextCol++;
    worksheet[XLSX.utils.encode_cell({ r: headerRow, c: percentageCol })] = {
      t: "s",
      v: "Viva Percentage",
    };
  }

  // Update range to encompass newly added columns
  range.e.c = Math.max(range.e.c, marksCol, statusCol, percentageCol);
  worksheet["!ref"] = XLSX.utils.encode_range(range);

  // Populate student rows
  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const enrCellAddress = XLSX.utils.encode_cell({ r, c: enrollmentCol });
    const enrCell = worksheet[enrCellAddress];

    if (!enrCell || enrCell.v === undefined || enrCell.v === null || String(enrCell.v).trim() === "") {
      continue;
    }

    const normEnr = normalizeEnrollment(enrCell.v);
    const studentData = marksMap.get(normEnr);

    if (studentData) {
      // Write Viva Marks
      const marksAddress = XLSX.utils.encode_cell({ r, c: marksCol });
      if (typeof studentData.marks === "number") {
        worksheet[marksAddress] = { t: "n", v: studentData.marks };
      } else {
        worksheet[marksAddress] = { t: "s", v: String(studentData.marks || "—") };
      }

      // Write Viva Status
      const statusAddress = XLSX.utils.encode_cell({ r, c: statusCol });
      worksheet[statusAddress] = {
        t: "s",
        v: studentData.status || (typeof studentData.marks === "number" ? "Completed" : "Pending"),
      };

      // Write Viva Percentage
      const pctAddress = XLSX.utils.encode_cell({ r, c: percentageCol });
      if (typeof studentData.percentage === "number") {
        worksheet[pctAddress] = { t: "s", v: `${studentData.percentage}%` };
      } else {
        worksheet[pctAddress] = { t: "s", v: "—" };
      }
    } else {
      // Unattempted student
      const marksAddress = XLSX.utils.encode_cell({ r, c: marksCol });
      worksheet[marksAddress] = { t: "s", v: "—" };

      const statusAddress = XLSX.utils.encode_cell({ r, c: statusCol });
      worksheet[statusAddress] = { t: "s", v: "Absent / Pending" };

      const pctAddress = XLSX.utils.encode_cell({ r, c: percentageCol });
      worksheet[pctAddress] = { t: "s", v: "—" };
    }
  }

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

/**
 * Generate a new complete Excel workbook from session analytics data.
 *
 * @param {Object} session - VivaSession details
 * @param {Array} students - Array of evaluated student records
 * @returns {Buffer} - Excel workbook buffer
 */
const generateVivaResultsExcel = (session, students) => {
  const rows = (students || []).map((st, idx) => ({
    "Sr No": idx + 1,
    "Enrollment Number": st.enrollmentNumber || "—",
    "Student Name": st.name || "—",
    "Viva Status": st.vivaStatus || (st.marks !== null ? "Completed" : "Pending"),
    "Marks Obtained": st.marks !== null ? st.marks : "—",
    "Total Marks": session?.totalMarks || 20,
    "Percentage": st.percentage !== null ? `${st.percentage}%` : "—",
    "Completion Time": st.completedAt
      ? new Date(st.completedAt).toLocaleString()
      : "—",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for readability
  worksheet["!cols"] = [
    { wch: 8 },  // Sr No
    { wch: 20 }, // Enrollment Number
    { wch: 25 }, // Student Name
    { wch: 15 }, // Viva Status
    { wch: 16 }, // Marks Obtained
    { wch: 14 }, // Total Marks
    { wch: 14 }, // Percentage
    { wch: 24 }, // Completion Time
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Viva Results");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

module.exports = {
  parseExcel,
  populateExistingExcel,
  generateVivaResultsExcel,
};