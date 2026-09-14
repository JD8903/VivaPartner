/**
 * Phase 15 Automated Test Suite: Original Excel Sheet Population
 *
 * Verifies:
 * 1. Unit Test populateExistingExcel:
 *    - Preserves all original columns and data
 *    - Matches strictly by Enrollment Number
 *    - Injects Viva Marks, Viva Status, and Viva Percentage
 * 2. Unit Test generateVivaResultsExcel:
 *    - Creates standalone full Excel report with proper columns
 * 3. Integration Test GET /api/export/viva/:sessionId/excel:
 *    - Returns downloadable XLSX buffer
 * 4. Integration Test POST /api/export/viva/:sessionId/populate-excel:
 *    - Populates teacher's uploaded original Excel workbook
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const XLSX = require("xlsx");
dotenv.config();

const User = require("../models/User");
const Department = require("../models/Department");
const Subject = require("../models/Subject");
const Class = require("../models/Class");
const Student = require("../models/Student");
const Assignment = require("../models/Assignment");
const VivaSession = require("../models/VivaSession");
const VivaAttempt = require("../models/VivaAttempt");

const {
  populateExistingExcel,
  generateVivaResultsExcel,
  parseExcel,
} = require("../services/excelService");

const {
  exportVivaSessionExcel,
  populateUploadedExcel,
} = require("../controllers/exportController");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/vivapartner";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    buffer: null,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    send(buf) {
      this.buffer = buf;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

async function runPhase15Tests() {
  console.log("\n===================================================================");
  console.log("  PHASE 15 TEST SUITE: ORIGINAL EXCEL SHEET POPULATION");
  console.log("===================================================================\n");

  await mongoose.connect(MONGO_URI);

  // Clean test fixtures
  await User.deleteMany({ email: /p15_.*@test\.com/ });
  await Department.deleteMany({ code: "P15_DEPT" });
  await Subject.deleteMany({ code: "P15_SUBJ" });
  await Class.deleteMany({ code: "P15_CLASS" });
  await Student.deleteMany({ $or: [{ enrollment: /^P15_/ }, { enrollmentNumber: /^P15_/ }] });
  await Assignment.deleteMany({ title: "P15_ASSIGNMENT" });
  await VivaSession.deleteMany({ topic: "P15_TOPIC" });
  await VivaAttempt.deleteMany({});

  try {
    // -------------------------------------------------------------
    // TEST 1: populateExistingExcel Unit Test
    // -------------------------------------------------------------
    console.log("[Test 1] populateExistingExcel Unit Test (Preserve Original Columns & Match Strictly by Enrollment)");
    {
      // Create a dummy original Excel workbook with custom columns
      const originalData = [
        { "Roll No": "ENR101", "Student Name": "Alice Green", "Department": "CS", "Custom Notes": "Present" },
        { "Roll No": "ENR102", "Student Name": "Bob White", "Department": "CS", "Custom Notes": "Active" },
        { "Roll No": "ENR103", "Student Name": "Charlie Brown", "Department": "CS", "Custom Notes": "Medical Leave" },
      ];

      const ws = XLSX.utils.json_to_sheet(originalData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Students");
      const originalBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const marksMap = new Map([
        ["enr101", { marks: 19, status: "Completed", percentage: 95 }],
        ["enr102", { marks: 15, status: "Completed", percentage: 75 }],
        // enr103 was absent / did not attempt
      ]);

      const populatedBuffer = populateExistingExcel(originalBuffer, marksMap);
      assert(Buffer.isBuffer(populatedBuffer), "Returns valid populated Excel buffer");

      const rows = parseExcel(populatedBuffer);
      assert(rows.length === 3, "All 3 original rows preserved");

      // Verify Row 1
      assert(rows[0]["Roll No"] === "ENR101", "Row 1 Roll No preserved");
      assert(rows[0]["Student Name"] === "Alice Green", "Row 1 Student Name preserved");
      assert(rows[0]["Custom Notes"] === "Present", "Row 1 Custom Notes preserved");
      assert(rows[0]["Viva Marks"] === 19, "Row 1 Viva Marks populated with 19");
      assert(rows[0]["Viva Status"] === "Completed", "Row 1 Viva Status populated");
      assert(rows[0]["Viva Percentage"] === "95%", "Row 1 Viva Percentage populated");

      // Verify Row 2
      assert(rows[1]["Viva Marks"] === 15, "Row 2 Viva Marks populated with 15");
      assert(rows[1]["Viva Status"] === "Completed", "Row 2 Viva Status populated");

      // Verify Row 3 (Absent/Pending)
      assert(rows[2]["Roll No"] === "ENR103", "Row 3 Roll No preserved");
      assert(rows[2]["Viva Status"] === "Absent / Pending", "Row 3 status marked Absent / Pending");
      assert(rows[2]["Viva Marks"] === "—", "Row 3 marks marked dash");
    }

    // -------------------------------------------------------------
    // TEST 2: generateVivaResultsExcel Unit Test
    // -------------------------------------------------------------
    console.log("\n[Test 2] generateVivaResultsExcel Unit Test");
    {
      const sessionInfo = { totalMarks: 20 };
      const studentResults = [
        { enrollmentNumber: "ENR201", name: "Deepak Joshi", vivaStatus: "Completed", marks: 18, percentage: 90, completedAt: new Date() },
        { enrollmentNumber: "ENR202", name: "Meera Nair", vivaStatus: "Pending", marks: null, percentage: null },
      ];

      const reportBuffer = generateVivaResultsExcel(sessionInfo, studentResults);
      assert(Buffer.isBuffer(reportBuffer), "Report generated as valid buffer");

      const rows = parseExcel(reportBuffer);
      assert(rows.length === 2, "Report contains 2 student rows");
      assert(rows[0]["Enrollment Number"] === "ENR201", "Report row 1 enrollment matched");
      assert(rows[0]["Marks Obtained"] === 18, "Report row 1 marks obtained is 18");
      assert(rows[0]["Total Marks"] === 20, "Report total marks is 20");
      assert(rows[1]["Marks Obtained"] === "—", "Pending student has dash marks");
    }

    // -------------------------------------------------------------
    // TEST 3: DB Integration - Export Viva Session Excel
    // -------------------------------------------------------------
    console.log("\n[Test 3] DB Integration: GET /api/export/viva/:sessionId/excel");
    await User.deleteMany({ email: /p15_.*@test\.com/ });
    await Department.deleteMany({ code: "P15_DEPT" });
    await Subject.deleteMany({ code: "P15_SUBJ" });
    await Class.deleteMany({ code: "P15_CLASS" });
    await Student.deleteMany({ $or: [{ enrollment: /^P15_/ }, { enrollmentNumber: /^P15_/ }] });
    await Assignment.deleteMany({ title: "P15_ASSIGNMENT" });
    await VivaSession.deleteMany({ sessionId: "P15EXCEL" });

    const teacher = await User.create({
      name: "Phase15 Teacher",
      email: `p15_teacher_${Date.now()}@test.com`,
      password: "hashed_password",
      role: "teacher",
    });

    const department = await Department.create({
      name: "Phase15 Department",
      code: "P15_DEPT",
    });

    const subject = await Subject.create({
      name: "Phase15 Data Structures",
      code: "P15_SUBJ",
      department: department._id,
      semester: 4,
      credits: 4,
    });

    const classObj = await Class.create({
      name: "P15_CLASS",
      code: "P15_CLASS",
      department: department._id,
      semester: 4,
      academicYear: "2025-2026",
      capacity: 60,
    });

    const student1 = await Student.create({
      name: "Karan Johar",
      enrollment: "P15_ENR_001",
      enrollmentNumber: "P15_ENR_001",
      email: "karan@test.com",
      class: classObj._id,
      classId: classObj._id.toString(),
      department: department.name,
      semester: 4,
      marks: 17,
      vivaStatus: "Completed",
    });

    const assignment = await Assignment.create({
      title: "P15_ASSIGNMENT",
      teacher: teacher._id,
      department: department._id,
      subject: subject._id,
      class: classObj._id,
      status: "Active",
    });

    const session = await VivaSession.create({
      sessionId: "P15EXCEL",
      teacher: teacher._id,
      assignment: assignment._id,
      class: classObj._id,
      department: department._id,
      subject: subject._id,
      topic: "P15_TOPIC",
      numberOfQuestions: 2,
      totalMarks: 20,
      difficulty: "Medium",
      status: "Active",
      studentSelectionMode: "all",
    });

    await VivaAttempt.create({
      vivaSession: session._id,
      student: student1._id,
      status: "Completed",
      completedAt: new Date(),
      evaluated: true,
      totalMarks: 17,
    });

    {
      const req = {
        user: { _id: teacher._id, role: "teacher" },
        params: { sessionId: "P15EXCEL" },
      };
      const res = createMockRes();

      await exportVivaSessionExcel(req, res);

      assert(res.statusCode === 200, "Export returns HTTP 200");
      assert(res.headers["Content-Type"].includes("spreadsheetml"), "Content-Type is Excel spreadsheet");
      assert(res.headers["Content-Disposition"].includes("Viva_Results_P15EXCEL.xlsx"), "Filename is Viva_Results_P15EXCEL.xlsx");
      assert(Buffer.isBuffer(res.buffer), "Returns file buffer");

      const downloadedRows = parseExcel(res.buffer);
      assert(downloadedRows.length === 1, "Downloaded Excel has 1 student row");
      assert(downloadedRows[0]["Enrollment Number"] === "P15_ENR_001", "Enrollment matches");
      assert(downloadedRows[0]["Marks Obtained"] === 17, "Marks obtained is 17");
    }

    // -------------------------------------------------------------
    // TEST 4: DB Integration - Populate Uploaded Original Excel
    // -------------------------------------------------------------
    console.log("\n[Test 4] DB Integration: POST /api/export/viva/:sessionId/populate-excel");
    {
      // Prepare original excel sheet uploaded by teacher
      const teacherOriginalRows = [
        { "Enrollment Number": "P15_ENR_001", "Student Name": "Karan Johar", "Internal Marks": 45 },
      ];
      const ws = XLSX.utils.json_to_sheet(teacherOriginalRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "MasterSheet");
      const uploadBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const req = {
        user: { _id: teacher._id, role: "teacher" },
        params: { sessionId: "P15EXCEL" },
        file: {
          buffer: uploadBuffer,
          originalname: "Teacher_Internal_Marks.xlsx",
        },
      };
      const res = createMockRes();

      await populateUploadedExcel(req, res);

      assert(res.statusCode === 200, "Populate uploaded Excel returns HTTP 200");
      assert(res.headers["Content-Disposition"].includes("Populated_Teacher_Internal_Marks.xlsx"), "Filename reflects original filename");
      assert(Buffer.isBuffer(res.buffer), "Returns populated buffer");

      const populatedRows = parseExcel(res.buffer);
      assert(populatedRows.length === 1, "Row count unchanged");
      assert(populatedRows[0]["Internal Marks"] === 45, "Pre-existing 'Internal Marks' preserved intact");
      assert(populatedRows[0]["Viva Marks"] === 17, "Evaluated 'Viva Marks' populated as 17");
      assert(populatedRows[0]["Viva Status"] === "Completed", "Viva Status populated as Completed");
    }

  } finally {
    // Cleanup
    await User.deleteMany({ email: /p15_.*@test\.com/ });
    await Department.deleteMany({ code: "P15_DEPT" });
    await Subject.deleteMany({ code: "P15_SUBJ" });
    await Class.deleteMany({ code: "P15_CLASS" });
    await Student.deleteMany({ $or: [{ enrollment: /^P15_/ }, { enrollmentNumber: /^P15_/ }] });
    await Assignment.deleteMany({ title: "P15_ASSIGNMENT" });
    await VivaSession.deleteMany({ topic: "P15_TOPIC" });
    await VivaAttempt.deleteMany({});
    await mongoose.disconnect();
  }

  console.log("\n===================================================================");
  console.log(`  PHASE 15 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase15Tests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
