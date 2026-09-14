const axios = require("axios");
const XLSX = require("xlsx");
const FormData = require("form-data");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Student = require("../models/Student");
const Class = require("../models/Class");
const Assignment = require("../models/Assignment");

const BASE_URL = "http://localhost:5000/api";

const createTestExcelBuffer = (rows) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
};

async function runTests() {
  console.log("==================================================");
  console.log("   PHASE 6 VERIFICATION TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // Connect to DB directly for state check
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vivapartner");
  console.log("MongoDB connected for test verification.");

  let teacherToken = "";
  let teacherUser = null;
  let testClass = null;

  // ----------------------------------------------------
  // TEST 1: Teacher Login
  // ----------------------------------------------------
  console.log("\n--- TEST 1: Teacher Authentication ---");
  try {
    // Find an active teacher in DB
    const User = mongoose.model("User");
    teacherUser = await User.findOne({ role: "teacher", status: "Active" });

    if (!teacherUser) {
      throw new Error("No active teacher found in database.");
    }

    // Set a known password hash or login using test credentials
    const bcrypt = require("bcryptjs");
    const testPassword = "password123";
    teacherUser.password = await bcrypt.hash(testPassword, 10);
    await teacherUser.save();

    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: teacherUser.email,
      password: testPassword,
    });

    assert(loginRes.status === 200, "Teacher login status 200");
    assert(!!loginRes.data.token, "JWT token received in login response");
    assert(loginRes.data.user.role === "teacher", "User role is 'teacher'");

    teacherToken = loginRes.data.token;
  } catch (err) {
    assert(false, `Teacher login failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST 2: Dashboard Statistics Endpoint
  // ----------------------------------------------------
  console.log("\n--- TEST 2: GET /api/teacher/dashboard-stats ---");
  try {
    const statsRes = await axios.get(`${BASE_URL}/teacher/dashboard-stats`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });

    assert(statsRes.status === 200, "Dashboard stats status 200");
    assert(statsRes.data.success === true, "Dashboard stats success is true");
    assert(typeof statsRes.data.stats.classes === "number", "stats.classes is a number");
    assert(typeof statsRes.data.stats.subjects === "number", "stats.subjects is a number");
    assert(typeof statsRes.data.stats.students === "number", "stats.students is a number");
    assert(typeof statsRes.data.stats.sessions === "number", "stats.sessions is a number");
    console.log("    Live stats returned:", statsRes.data.stats);
  } catch (err) {
    assert(false, `Dashboard stats failed: ${err.response?.data?.message || err.message}`);
  }

  // ----------------------------------------------------
  // TEST 3: Assigned Classes with Student Counts
  // ----------------------------------------------------
  console.log("\n--- TEST 3: GET /api/teacher/assigned-classes ---");
  try {
    const assignedRes = await axios.get(`${BASE_URL}/teacher/assigned-classes`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });

    assert(assignedRes.status === 200, "Assigned classes status 200");
    assert(Array.isArray(assignedRes.data.assignments), "Assignments is an array");
    assert(assignedRes.data.assignments.length > 0, "Teacher has active assigned classes");

    const firstAssign = assignedRes.data.assignments[0];
    assert(!!firstAssign.class, "Assignment has populated class");
    assert(!!firstAssign.subject, "Assignment has populated subject");
    assert(typeof firstAssign.studentCount === "number", "Assignment includes studentCount");

    testClass = firstAssign.class;
    console.log(`    First assigned class: ${testClass.name} (Code: ${testClass.code}), Students: ${firstAssign.studentCount}`);
  } catch (err) {
    assert(false, `Assigned classes failed: ${err.response?.data?.message || err.message}`);
  }

  // ----------------------------------------------------
  // TEST 4: Student Excel Upload with Flexible Headers
  // ----------------------------------------------------
  console.log("\n--- TEST 4: POST /api/students/upload (Flexible Headers & Upsert) ---");
  try {
    // 4A. Standard headers: "Enrollment Number" & "Student Name"
    const testStudentsBatch1 = [
      { "Enrollment Number": "TEST_P6_01", "Student Name": "Aarav Sharma" },
      { "Enrollment Number": "TEST_P6_02", "Student Name": "Bhavna Patel" },
      { "Enrollment Number": "TEST_P6_03", "Student Name": "Chirag Joshi" },
    ];

    const buf1 = createTestExcelBuffer(testStudentsBatch1);
    const form1 = new FormData();
    form1.append("excel", buf1, { filename: "students_batch1.xlsx" });
    form1.append("classId", testClass._id.toString());
    form1.append("teacher", teacherUser._id.toString());

    const uploadRes1 = await axios.post(`${BASE_URL}/students/upload`, form1, {
      headers: {
        ...form1.getHeaders(),
        Authorization: `Bearer ${teacherToken}`,
      },
    });

    assert(uploadRes1.status === 201, "Upload batch 1 status 201");
    assert(uploadRes1.data.success === true, "Upload batch 1 success true");
    assert(uploadRes1.data.summary.imported >= 3 || uploadRes1.data.summary.updated >= 3, "Batch 1 processed 3 students");

    // 4B. Alternative headers: "Roll No" & "Name" + duplicate row in sheet
    const testStudentsBatch2 = [
      { "Roll No": "TEST_P6_04", "Name": "Divya Rao" },
      { "Roll No": "TEST_P6_04", "Name": "Divya Rao" }, // duplicate within sheet
      { "Roll No": "TEST_P6_01", "Name": "Aarav Sharma Updated" }, // existing student -> should update
    ];

    const buf2 = createTestExcelBuffer(testStudentsBatch2);
    const form2 = new FormData();
    form2.append("excel", buf2, { filename: "students_batch2.xlsx" });
    form2.append("classId", testClass._id.toString());
    form2.append("teacher", teacherUser._id.toString());

    const uploadRes2 = await axios.post(`${BASE_URL}/students/upload`, form2, {
      headers: {
        ...form2.getHeaders(),
        Authorization: `Bearer ${teacherToken}`,
      },
    });

    assert(uploadRes2.status === 201, "Upload batch 2 status 201");
    assert(uploadRes2.data.summary.duplicateInExcel === 1, "Detected 1 duplicate in Excel sheet");
    assert(uploadRes2.data.summary.updated >= 1, "Updated existing student TEST_P6_01 name");

    // Verify DB state
    const Student = mongoose.model("Student");
    const s1 = await Student.findOne({ enrollment: "TEST_P6_01" });
    assert(s1 && s1.name === "Aarav Sharma Updated", "DB verified: student updated with new name");
    assert(s1 && s1.classId === testClass._id.toString(), "DB verified: student associated with correct classId");
  } catch (err) {
    assert(false, `Excel upload failed: ${err.response?.data?.message || err.message}`);
  }

  // ----------------------------------------------------
  // TEST 5: GET /api/students Filtered by Class
  // ----------------------------------------------------
  console.log("\n--- TEST 5: GET /api/students with Class Filter ---");
  try {
    const listRes = await axios.get(`${BASE_URL}/students`, {
      params: { classId: testClass._id.toString(), limit: 50 },
      headers: { Authorization: `Bearer ${teacherToken}` },
    });

    assert(listRes.status === 200, "Get students status 200");
    assert(Array.isArray(listRes.data.students), "Students is an array");
    const enrollments = listRes.data.students.map((s) => s.enrollment);
    assert(enrollments.includes("TEST_P6_01"), "Results include TEST_P6_01");
    assert(enrollments.includes("TEST_P6_02"), "Results include TEST_P6_02");
    assert(enrollments.includes("TEST_P6_03"), "Results include TEST_P6_03");
    assert(enrollments.includes("TEST_P6_04"), "Results include TEST_P6_04");
  } catch (err) {
    assert(false, `Get students failed: ${err.response?.data?.message || err.message}`);
  }

  // ----------------------------------------------------
  // TEST 6: Security & Authorization Protection
  // ----------------------------------------------------
  console.log("\n--- TEST 6: Security Checks ---");
  try {
    // 6A. Unauthenticated request to /api/teacher/dashboard-stats
    try {
      await axios.get(`${BASE_URL}/teacher/dashboard-stats`);
      assert(false, "Unauthenticated /api/teacher/dashboard-stats should have failed");
    } catch (err) {
      assert(err.response?.status === 401, "Unauthenticated stats returned 401 Unauthorized");
    }

    // 6B. Unauthenticated request to /api/students
    try {
      await axios.get(`${BASE_URL}/students`);
      assert(false, "Unauthenticated /api/students should have failed");
    } catch (err) {
      assert(err.response?.status === 401, "Unauthenticated /api/students returned 401 Unauthorized");
    }

    // 6C. Unauthenticated request to /api/students/upload
    try {
      const emptyForm = new FormData();
      await axios.post(`${BASE_URL}/students/upload`, emptyForm);
      assert(false, "Unauthenticated /api/students/upload should have failed");
    } catch (err) {
      assert(err.response?.status === 401, "Unauthenticated /api/students/upload returned 401 Unauthorized");
    }
  } catch (err) {
    assert(false, `Security test failed: ${err.message}`);
  }

  // Cleanup test students
  const Student = mongoose.model("Student");
  await Student.deleteMany({ enrollment: { $regex: /^TEST_P6_/ } });
  console.log("\nCleaned up temporary test students.");

  await mongoose.disconnect();

  console.log("\n==================================================");
  console.log(`   PHASE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error("Test execution fatal error:", e);
  process.exit(1);
});
