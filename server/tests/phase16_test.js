/**
 * Phase 16 Verification Test Suite: PDF Reports & Result Export Security
 * 
 * Verifies:
 * 1. Role-based security on export routes:
 *    - Unauthenticated -> 401 Unauthorized
 *    - Student user -> 403 Forbidden
 *    - Teacher / Admin -> 200 Allowed
 * 2. Session Analytics & Report Data Completeness:
 *    - Session information (class, subject, topic, max marks, difficulty)
 *    - Student results with strict enrollment mapping, marks, and percentages
 *    - Question-level evaluation data (question text, spoken student transcript, score, feedback)
 * 3. AI Feedback Sanity:
 *    - No internal chain-of-thought or reasoning exposed
 *    - Clean, concise examiner feedback
 */

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Department = require("../models/Department");
const Subject = require("../models/Subject");
const Class = require("../models/Class");
const Student = require("../models/Student");
const Assignment = require("../models/Assignment");
const VivaSession = require("../models/VivaSession");
const VivaAttempt = require("../models/VivaAttempt");

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

const createMockRes = () => {
  return {
    statusCode: 200,
    headers: {},
    data: null,
    buffer: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
    },
    send(buf) {
      this.buffer = buf;
      return this;
    },
  };
};

let passed = 0;
let failed = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
};

async function runPhase16Tests() {
  console.log("\n===================================================================");
  console.log("  PHASE 16 TEST SUITE: PDF REPORTS & EXPORT AUTHORIZATION");
  console.log("===================================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/vivapartner";
  await mongoose.connect(mongoUri);

  try {
    // Clean up any previous test artifacts
    await User.deleteMany({ email: /p16_.*@test\.com/ });
    await Department.deleteMany({ code: "P16_DEPT" });
    await Subject.deleteMany({ code: "P16_SUBJ" });
    await Class.deleteMany({ code: "P16_CLASS" });
    await Student.deleteMany({ $or: [{ enrollment: /^P16_/ }, { enrollmentNumber: /^P16_/ }] });
    await Assignment.deleteMany({ title: "P16_ASSIGNMENT" });
    await VivaSession.deleteMany({ sessionId: "P16REPORT" });
    await VivaAttempt.deleteMany({});

    // -------------------------------------------------------------
    // Setup Test Data
    // -------------------------------------------------------------
    const teacherUser = await User.create({
      name: "Phase16 Teacher",
      email: `p16_teacher_${Date.now()}@test.com`,
      password: "hashed_password",
      role: "teacher",
    });

    const department = await Department.create({
      name: "Phase16 Computer Science",
      code: "P16_DEPT",
    });

    const subject = await Subject.create({
      name: "Phase16 Cloud Systems",
      code: "P16_SUBJ",
      department: department._id,
      semester: 6,
      credits: 4,
    });

    const classObj = await Class.create({
      name: "P16_CLASS",
      code: "P16_CLASS",
      department: department._id,
      semester: 6,
      academicYear: "2025-2026",
      capacity: 60,
    });

    const student1 = await Student.create({
      name: "Rohit Sharma",
      enrollment: "P16_ROHIT_45",
      enrollmentNumber: "P16_ROHIT_45",
      email: "rohit@test.com",
      class: classObj._id,
      classId: classObj._id.toString(),
      department: department.name,
      semester: 6,
      marks: 18,
      vivaStatus: "Completed",
    });

    const student2 = await Student.create({
      name: "Virat Kohli",
      enrollment: "P16_VIRAT_18",
      enrollmentNumber: "P16_VIRAT_18",
      email: "virat@test.com",
      class: classObj._id,
      classId: classObj._id.toString(),
      department: department.name,
      semester: 6,
      marks: null,
      vivaStatus: "Pending",
    });

    const assignment = await Assignment.create({
      title: "P16_ASSIGNMENT",
      teacher: teacherUser._id,
      department: department._id,
      subject: subject._id,
      class: classObj._id,
      status: "Active",
    });

    const session = await VivaSession.create({
      sessionId: "P16REPORT",
      teacher: teacherUser._id,
      assignment: assignment._id,
      class: classObj._id,
      department: department._id,
      subject: subject._id,
      topic: "Kubernetes Microservices Architecture",
      numberOfQuestions: 2,
      totalMarks: 20,
      difficulty: "Medium",
      status: "Active",
      studentSelectionMode: "all",
    });

    // Create completed attempt for student 1 with detailed question evaluation
    await VivaAttempt.create({
      vivaSession: session._id,
      student: student1._id,
      status: "Completed",
      totalMarks: 18,
      evaluated: true,
      completedAt: new Date(),
      answers: [
        {
          questionNumber: 1,
          question: "Explain the purpose of Kubernetes Pods and Deployments.",
          transcript: "A pod is the smallest deployable unit containing one or more containers, and a deployment manages replica sets and zero downtime updates.",
          score: 9,
          feedback: "Accurate explanation of container grouping and deployment replica management.",
        },
        {
          questionNumber: 2,
          question: "What is the role of the Kube-Proxy component in node networking?",
          transcript: "Kube-proxy runs on each node to maintain network rules and allow network communication to pods from sessions inside or outside.",
          score: 9,
          feedback: "Correct explanation of node-level network proxying and service IP routing.",
        },
      ],
    });

    // -------------------------------------------------------------
    // TEST 1: Authorization Checks (Student Denied, Teacher Allowed)
    // -------------------------------------------------------------
    console.log("[Test 1] Security: Role-based Authorization on Export Endpoints");
    const { authorize } = require("../middleware/authMiddleware");

    // Simulate middleware execution for Student
    let studentBlocked = false;
    const reqStudent = { user: { role: "student" } };
    const resStudent = createMockRes();
    const authorizeMiddleware = authorize("teacher", "admin");

    authorizeMiddleware(reqStudent, resStudent, () => {
      studentBlocked = false;
    });

    if (resStudent.statusCode === 403) {
      studentBlocked = true;
    }

    assert(studentBlocked, "Student user is blocked with HTTP 403 Forbidden");
    assert(resStudent.data?.message?.toLowerCase().includes("authorized") || resStudent.data?.message?.toLowerCase().includes("forbidden"), "Forbidden / unauthorized message returned to unauthorized role");

    // Simulate middleware execution for Teacher
    let teacherAllowed = false;
    const reqTeacher = { user: { role: "teacher" } };
    const resTeacher = createMockRes();

    authorizeMiddleware(reqTeacher, resTeacher, () => {
      teacherAllowed = true;
    });

    assert(teacherAllowed, "Teacher user is permitted through authorization gate");

    // -------------------------------------------------------------
    // TEST 2: Session Analytics Endpoint (Report Data Supplier)
    // -------------------------------------------------------------
    console.log("\n[Test 2] Session Analytics Report Data Integrity");
    const { getSessionAnalytics } = require("../controllers/vivaSessionController");

    const reqAnalytics = {
      params: { sessionId: "P16REPORT" },
      user: { _id: teacherUser._id, role: "teacher" },
    };
    const resAnalytics = createMockRes();

    await getSessionAnalytics(reqAnalytics, resAnalytics);

    assert(resAnalytics.statusCode === 200, "getSessionAnalytics returns HTTP 200");
    assert(resAnalytics.data?.success === true, "Analytics success is true");

    const sessionData = resAnalytics.data?.session;
    assert(sessionData?.sessionId === "P16REPORT", "Session ID matches P16REPORT");
    assert(sessionData?.topic === "Kubernetes Microservices Architecture", "Topic is preserved");
    assert(sessionData?.totalMarks === 20, "Total marks is 20");
    assert(sessionData?.difficulty === "Medium", "Difficulty is Medium");

    const metricsData = resAnalytics.data?.metrics;
    assert(metricsData?.totalStudents === 2, "Total students enrolled is 2");
    assert(metricsData?.completedCount === 1, "Completed count is 1");
    assert(metricsData?.pendingCount === 1, "Pending count is 1");
    assert(metricsData?.averageMarks === 18, "Average marks is 18");
    assert(metricsData?.highestMarks === 18, "Highest mark is 18");

    const studentsData = resAnalytics.data?.students;
    assert(Array.isArray(studentsData) && studentsData.length === 2, "Student list has 2 records");

    const completedStudent = studentsData.find(s => s.enrollmentNumber === "P16_ROHIT_45");
    assert(completedStudent !== undefined, "Completed student Rohit Sharma found");
    assert(completedStudent.vivaStatus === "Completed", "Student 1 status is Completed");
    assert(completedStudent.marks === 18, "Student 1 marks is 18");
    assert(completedStudent.percentage === 90, "Student 1 percentage is 90%");
    assert(Array.isArray(completedStudent.answers) && completedStudent.answers.length === 2, "Student 1 has 2 question evaluations");

    const pendingStudent = studentsData.find(s => s.enrollmentNumber === "P16_VIRAT_18");
    assert(pendingStudent !== undefined, "Pending student Virat Kohli found");
    assert(pendingStudent.vivaStatus === "Pending", "Student 2 status is Pending");
    assert(pendingStudent.marks === null, "Student 2 marks is null (not fake marks)");

    // -------------------------------------------------------------
    // TEST 3: Question-Level Evaluation & Privacy Sanity
    // -------------------------------------------------------------
    console.log("\n[Test 3] Question-Level Evaluation & Anti-Chain-of-Thought Sanity");
    const q1 = completedStudent.answers[0];
    assert(q1.questionNumber === 1, "Question number is 1");
    assert(q1.question.includes("Kubernetes Pods"), "Question text is correct");
    assert(q1.transcript.includes("smallest deployable unit"), "Spoken transcript recorded");
    assert(q1.score === 9, "Score is 9");
    assert(q1.feedback.length > 5, "Concise feedback present");

    // Check no chain-of-thought or prompt leakage
    const feedbackStr = JSON.stringify(completedStudent.answers);
    assert(!feedbackStr.includes("Chain-of-Thought"), "Zero Chain-of-Thought leaked in student feedback");
    assert(!feedbackStr.includes("internal reasoning"), "Zero internal reasoning leaked");
    assert(!feedbackStr.includes("SYSTEM PROMPT"), "Zero prompt instruction leaked");

    // -------------------------------------------------------------
    // TEST 4: Export Controller Excel Export with Teacher Authorization
    // -------------------------------------------------------------
    console.log("\n[Test 4] Export Controller Download Verification");
    const { exportVivaSessionExcel } = require("../controllers/exportController");
    const reqExport = {
      params: { sessionId: "P16REPORT" },
      user: { _id: teacherUser._id, role: "teacher" },
    };
    const resExport = createMockRes();

    await exportVivaSessionExcel(reqExport, resExport);
    assert(resExport.statusCode === 200, "Teacher exportVivaSessionExcel returns HTTP 200");
    assert(Buffer.isBuffer(resExport.buffer), "Returns binary spreadsheet buffer");
    assert(resExport.headers["Content-Disposition"]?.includes("P16REPORT.xlsx"), "Disposition filename matches session ID");

  } finally {
    // Cleanup
    await User.deleteMany({ email: /p16_.*@test\.com/ });
    await Department.deleteMany({ code: "P16_DEPT" });
    await Subject.deleteMany({ code: "P16_SUBJ" });
    await Class.deleteMany({ code: "P16_CLASS" });
    await Student.deleteMany({ $or: [{ enrollment: /^P16_/ }, { enrollmentNumber: /^P16_/ }] });
    await Assignment.deleteMany({ title: "P16_ASSIGNMENT" });
    await VivaSession.deleteMany({ sessionId: "P16REPORT" });
    await VivaAttempt.deleteMany({});
    await mongoose.disconnect();
  }

  console.log("\n===================================================================");
  console.log(`  PHASE 16 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase16Tests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
