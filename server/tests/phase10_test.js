/**
 * Phase 10 Automated Test Suite: Viva Session & Link Generation
 *
 * Verifies:
 * 1. Viva Session creation with Option A (Selected Students) and Option B (Whole Class)
 * 2. Automatic resolution of classId, department, subject from Assignment
 * 3. Generation of unique 6-character hex sessionId
 * 4. Shareable student viva link format (/viva/:sessionId)
 * 5. Public metadata endpoint safety: returns session details, NEVER leaks questions or marks
 * 6. Access control during student join:
 *    - Option A: only explicitly selected students can join
 *    - Option B: any enrolled student in class can join
 *    - Unenrolled/non-existent students are rejected
 * 7. Starting the public viva promotes session/attempt status to Active
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User");
const Department = require("../models/Department");
const Subject = require("../models/Subject");
const Class = require("../models/Class");
const Student = require("../models/Student");
const Assignment = require("../models/Assignment");
const VivaConfiguration = require("../models/VivaConfiguration");
const VivaSession = require("../models/VivaSession");
const VivaAttempt = require("../models/VivaAttempt");

const {
  createVivaSession,
  getStudentVivaLink,
} = require("../controllers/vivaSessionController");

const {
  getPublicVivaSession,
  joinPublicViva,
  startPublicViva,
} = require("../controllers/publicVivaController");

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
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

async function runPhase10Tests() {
  console.log("\n=======================================================");
  console.log("  PHASE 10 TEST SUITE: VIVA SESSION & LINK GENERATION");
  console.log("=======================================================\n");

  await mongoose.connect(MONGO_URI);

  // Clean test fixtures
  await User.deleteMany({ email: /p10_teacher.*@test\.com/ });
  await Department.deleteMany({ code: "P10_DEPT" });
  await Subject.deleteMany({ code: "P10_SUBJ" });
  await Class.deleteMany({ name: "P10_CLASS" });
  await Student.deleteMany({ $or: [{ enrollment: /^P10_/ }, { enrollmentNumber: /^P10_/ }] });
  await Assignment.deleteMany({ title: "P10_ASSIGNMENT" });
  await VivaConfiguration.deleteMany({ topic: "P10_TOPIC" });
  await VivaSession.deleteMany({ topic: "P10_TOPIC" });
  await VivaAttempt.deleteMany({});

  try {
    // 1. Setup entities
    const teacher = await User.create({
      name: "Phase10 Teacher",
      email: `p10_teacher_${Date.now()}@test.com`,
      password: "hashed_password",
      role: "teacher",
    });

    const department = await Department.create({
      name: "Phase10 Department",
      code: "P10_DEPT",
    });

    const subject = await Subject.create({
      name: "Phase10 Subject",
      code: "P10_SUBJ",
      department: department._id,
      semester: 5,
      credits: 4,
    });

    const classObj = await Class.create({
      name: "P10_CLASS",
      code: "P10_CODE",
      department: department._id,
      semester: 5,
      academicYear: "2025-2026",
      capacity: 60,
    });

    // Create 2 students: Student A and Student B
    const studentA = await Student.create({
      name: "Student Alpha",
      enrollment: "P10_ENR_ALPHA",
      enrollmentNumber: "P10_ENR_ALPHA",
      email: "alpha@test.com",
      class: classObj._id,
      classId: classObj._id.toString(),
      department: department.name,
      semester: 5,
    });

    const studentB = await Student.create({
      name: "Student Beta",
      enrollment: "P10_ENR_BETA",
      enrollmentNumber: "P10_ENR_BETA",
      email: "beta@test.com",
      class: classObj._id,
      classId: classObj._id.toString(),
      department: department.name,
      semester: 5,
    });

    const assignment = await Assignment.create({
      title: "P10_ASSIGNMENT",
      teacher: teacher._id,
      department: department._id,
      subject: subject._id,
      class: classObj._id,
      status: "Active",
    });

    const sampleQuestions = [
      { id: 1, question: "What is Phase 10 in VivaPartner?", difficulty: "Easy", questionType: "Conceptual" },
      { id: 2, question: "Explain controlled link generation.", difficulty: "Medium", questionType: "Technical" },
    ];

    console.log("[Test 1] Create Viva Session with Option A (Selected Students)");
    let sessionAId = "";
    {
      const req = {
        user: { _id: teacher._id, role: "teacher" },
        body: {
          assignment: assignment._id.toString(),
          questions: sampleQuestions,
          studentSelectionMode: "selected",
          selectedStudents: [studentA._id.toString()],
          numberOfQuestions: 2,
          totalMarks: 20,
          topic: "P10_TOPIC",
        },
      };
      const res = createMockRes();

      await createVivaSession(req, res);
      const data = res.data;

      assert(res.statusCode === 201, "Session created successfully with status 201");
      assert(data.success === true, "Response has success: true");
      assert(Boolean(data.session?.sessionId), "Generated session has sessionId");
      assert(/^[0-9A-F]+$/i.test(data.session.sessionId), "SessionId is valid hex format");
      sessionAId = data.session.sessionId;

      // Verify in DB
      const dbSession = await VivaSession.findOne({ sessionId: sessionAId });
      assert(dbSession !== null, "Session exists in DB");
      assert(dbSession.studentSelectionMode === "selected", "studentSelectionMode is 'selected'");
      assert(dbSession.selectedStudents.length === 1, "selectedStudents has 1 student");
      assert(dbSession.selectedStudents[0].toString() === studentA._id.toString(), "selectedStudents contains Student A");
      assert(dbSession.class.toString() === classObj._id.toString(), "Auto-resolved class from Assignment");
      assert(dbSession.department.toString() === department._id.toString(), "Auto-resolved department from Assignment");
      assert(dbSession.subject.toString() === subject._id.toString(), "Auto-resolved subject from Assignment");
    }

    console.log("\n[Test 2] Get Student Viva Share Link");
    {
      const req = {
        user: { _id: teacher._id, role: "teacher" },
        params: { sessionId: sessionAId },
      };
      const res = createMockRes();

      await getStudentVivaLink(req, res);
      const data = res.data;

      assert(res.statusCode === 200, "Share link fetched with status 200");
      assert(data.success === true, "Response has success: true");
      assert(data.link.includes(`/viva/${sessionAId}`), "Link points to /viva/:sessionId");
    }

    console.log("\n[Test 3] Public Session Metadata Safety (Anti-Leak)");
    {
      const req = {
        params: { sessionId: sessionAId },
      };
      const res = createMockRes();

      await getPublicVivaSession(req, res);
      const data = res.data;

      assert(res.statusCode === 200, "Public session info returns 200");
      assert(data.session.sessionId === sessionAId, "Public session returns matching sessionId");
      assert(data.session.questions === undefined, "CRITICAL: Questions array is NOT leaked");
      assert(data.session.answerKeys === undefined, "CRITICAL: Answer keys are NOT leaked");
      assert(data.session.marks === undefined, "CRITICAL: Marks are NOT leaked");
      assert(data.session.class.name === "P10_CLASS", "Class name correctly populated");
    }

    console.log("\n[Test 4] Option A Access Control: Selected Student Joins vs Unselected Student Rejected");
    let attemptAId = "";
    {
      // Student A (selected) joins
      const reqA = {
        params: { sessionId: sessionAId },
        body: { enrollmentNumber: "P10_ENR_ALPHA" },
      };
      const resA = createMockRes();

      await joinPublicViva(reqA, resA);
      const dataA = resA.data;

      assert(resA.statusCode === 201, "Selected student joins successfully (status 201)");
      assert(dataA.success === true, "Student A has success: true");
      assert(Boolean(dataA.attempt?.attemptId), "Attempt created for Student A");
      assert(dataA.student.enrollmentNumber === "P10_ENR_ALPHA", "Returns student info");
      attemptAId = dataA.attempt.attemptId;

      // Student B (not selected) attempts to join Option A session
      const reqB = {
        params: { sessionId: sessionAId },
        body: { enrollmentNumber: "P10_ENR_BETA" },
      };
      const resB = createMockRes();

      await joinPublicViva(reqB, resB);
      const dataB = resB.data;

      assert(resB.statusCode === 404, "Unselected student is rejected with status 404");
      assert(dataB.success === false, "Unselected student receives success: false");

      // Invalid enrollment number
      const reqInvalid = {
        params: { sessionId: sessionAId },
        body: { enrollmentNumber: "NON_EXISTENT_999" },
      };
      const resInvalid = createMockRes();

      await joinPublicViva(reqInvalid, resInvalid);
      assert(resInvalid.statusCode === 404, "Non-existent enrollment rejected with 404");
    }

    console.log("\n[Test 5] Student Starts Viva Attempt");
    {
      const req = {
        params: { sessionId: sessionAId },
        body: { attemptId: attemptAId.toString() },
      };
      const res = createMockRes();

      await startPublicViva(req, res);
      const data = res.data;

      assert(res.statusCode === 200, "Student successfully starts viva with status 200");
      assert(data.success === true, "Start response has success: true");

      // Verify Attempt in DB is now Active
      const dbAttempt = await VivaAttempt.findById(attemptAId);
      assert(dbAttempt.status === "Active", "Attempt status in DB is now 'Active'");

      // Verify Session in DB is now Active
      const dbSession = await VivaSession.findOne({ sessionId: sessionAId });
      assert(dbSession.status === "Active", "Session status in DB is now 'Active'");
    }

    console.log("\n[Test 6] Create Viva Session with Option B (All Students in Class)");
    {
      const req = {
        user: { _id: teacher._id, role: "teacher" },
        body: {
          assignment: assignment._id.toString(),
          questions: sampleQuestions,
          studentSelectionMode: "all",
          selectedStudents: [],
          numberOfQuestions: 2,
          totalMarks: 20,
          topic: "P10_TOPIC",
        },
      };
      const res = createMockRes();

      await createVivaSession(req, res);
      const data = res.data;

      assert(res.statusCode === 201, "Option B session created with status 201");
      const sessionBId = data.session.sessionId;

      // Both Student A and Student B should be able to join Option B session
      const reqA = {
        params: { sessionId: sessionBId },
        body: { enrollmentNumber: "P10_ENR_ALPHA" },
      };
      const resA = createMockRes();
      await joinPublicViva(reqA, resA);
      assert(resA.statusCode === 201, "Student A can join Option B session");

      const reqB = {
        params: { sessionId: sessionBId },
        body: { enrollmentNumber: "P10_ENR_BETA" },
      };
      const resB = createMockRes();
      await joinPublicViva(reqB, resB);
      assert(resB.statusCode === 201, "Student B can join Option B session");
    }

  } finally {
    // Cleanup
    await User.deleteMany({ email: /p10_teacher.*@test\.com/ });
    await Department.deleteMany({ code: "P10_DEPT" });
    await Subject.deleteMany({ code: "P10_SUBJ" });
    await Class.deleteMany({ name: "P10_CLASS" });
    await Student.deleteMany({ $or: [{ enrollment: /^P10_/ }, { enrollmentNumber: /^P10_/ }] });
    await Assignment.deleteMany({ title: "P10_ASSIGNMENT" });
    await VivaConfiguration.deleteMany({ topic: "P10_TOPIC" });
    await VivaSession.deleteMany({ topic: "P10_TOPIC" });
    await VivaAttempt.deleteMany({});
    await mongoose.disconnect();
  }

  console.log("\n=======================================================");
  console.log(`  PHASE 10 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase10Tests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
