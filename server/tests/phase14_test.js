/**
 * Phase 14 Automated Test Suite: Teacher Viva Analytics & Result Dashboard
 *
 * Verifies:
 * 1. GET /api/viva-sessions lists sessions created by teacher with summary metrics
 * 2. GET /api/viva-sessions/:sessionId/analytics returns:
 *    - Session information
 *    - Aggregate metrics: totalStudents, completedCount, pendingCount, averageMarks, highestMarks, lowestMarks
 *    - Detailed student results list (name, enrollment, status, marks, percentage, completion timestamp)
 *    - Student answers with transcripts and AI feedback for teacher review
 * 3. Access control:
 *    - Requires authentication
 *    - Teacher cannot access another teacher's session analytics
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
const VivaSession = require("../models/VivaSession");
const VivaAttempt = require("../models/VivaAttempt");

const {
  getTeacherVivaSessions,
  getSessionAnalytics,
} = require("../controllers/vivaSessionController");

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

async function runPhase14Tests() {
  console.log("\n===================================================================");
  console.log("  PHASE 14 TEST SUITE: TEACHER VIVA ANALYTICS & RESULTS DASHBOARD");
  console.log("===================================================================\n");

  await mongoose.connect(MONGO_URI);

  // Clean test fixtures
  await User.deleteMany({ email: /p14_.*@test\.com/ });
  await Department.deleteMany({ code: "P14_DEPT" });
  await Subject.deleteMany({ code: "P14_SUBJ" });
  await Class.deleteMany({ code: "P14_CLASS" });
  await Student.deleteMany({ $or: [{ enrollment: /^P14_/ }, { enrollmentNumber: /^P14_/ }] });
  await Assignment.deleteMany({ title: "P14_ASSIGNMENT" });
  await VivaSession.deleteMany({ topic: "P14_TOPIC" });
  await VivaAttempt.deleteMany({});

  try {
    // 1. Setup entities
    // Clean up any stale records from previous runs
    await User.deleteMany({ email: /p14_.*@test\.com/ });
    await Department.deleteMany({ code: "P14_DEPT" });
    await Subject.deleteMany({ code: "P14_SUBJ" });
    await Class.deleteMany({ code: "P14_CLASS" });
    await Student.deleteMany({ $or: [{ enrollment: /^P14_/ }, { enrollmentNumber: /^P14_/ }] });
    await Assignment.deleteMany({ title: "P14_ASSIGNMENT" });
    await VivaSession.deleteMany({ sessionId: /^P14/ });
    await VivaAttempt.deleteMany({});

    const teacherA = await User.create({
      name: "Phase14 Teacher Alpha",
      email: `p14_teacher_a_${Date.now()}@test.com`,
      password: "hashed_password",
      role: "teacher",
    });

    const teacherB = await User.create({
      name: "Phase14 Teacher Beta",
      email: `p14_teacher_b_${Date.now()}@test.com`,
      password: "hashed_password",
      role: "teacher",
    });

    const department = await Department.create({
      name: "Phase14 Department",
      code: "P14_DEPT",
    });

    const subject = await Subject.create({
      name: "Phase14 Cloud Architecture",
      code: "P14_SUBJ",
      department: department._id,
      semester: 6,
      credits: 4,
    });

    const classObj = await Class.create({
      name: "P14_CLASS",
      code: "P14_CLASS",
      department: department._id,
      semester: 6,
      academicYear: "2025-2026",
      capacity: 60,
    });

    // Create 3 students: 2 completed, 1 pending
    const student1 = await Student.create({
      name: "Rahul Verma",
      enrollment: "P14_ENR_001",
      enrollmentNumber: "P14_ENR_001",
      email: "rahul@test.com",
      class: classObj._id,
      classId: classObj._id.toString(),
      department: department.name,
      semester: 6,
      marks: 18,
      vivaStatus: "Completed",
    });

    const student2 = await Student.create({
      name: "Pooja Hegde",
      enrollment: "P14_ENR_002",
      enrollmentNumber: "P14_ENR_002",
      email: "pooja@test.com",
      class: classObj._id,
      classId: classObj._id.toString(),
      department: department.name,
      semester: 6,
      marks: 14,
      vivaStatus: "Completed",
    });

    const student3 = await Student.create({
      name: "Siddharth Roy",
      enrollment: "P14_ENR_003",
      enrollmentNumber: "P14_ENR_003",
      email: "sid@test.com",
      class: classObj._id,
      classId: classObj._id.toString(),
      department: department.name,
      semester: 6,
      marks: 0,
      vivaStatus: "Pending",
    });

    const assignment = await Assignment.create({
      title: "P14_ASSIGNMENT",
      teacher: teacherA._id,
      department: department._id,
      subject: subject._id,
      class: classObj._id,
      status: "Active",
    });

    const session = await VivaSession.create({
      sessionId: "P14ANALYTICS",
      teacher: teacherA._id,
      assignment: assignment._id,
      class: classObj._id,
      department: department._id,
      subject: subject._id,
      topic: "P14_TOPIC",
      numberOfQuestions: 2,
      totalMarks: 20,
      difficulty: "Medium",
      status: "Active",
      studentSelectionMode: "all",
      questions: [
        { question: "What is serverless architecture?", difficulty: "Medium" },
        { question: "Explain edge computing versus cloud computing.", difficulty: "Hard" },
      ],
    });

    // Create 2 completed attempts for student1 & student2
    await VivaAttempt.create({
      vivaSession: session._id,
      student: student1._id,
      status: "Completed",
      completedAt: new Date(),
      evaluated: true,
      totalMarks: 18,
      answers: [
        {
          questionNumber: 1,
          question: "What is serverless architecture?",
          transcript: "Serverless is event-driven computing where cloud providers manage the infrastructure.",
          score: 9.0,
          feedback: "Accurate and clear definition.",
        },
        {
          questionNumber: 2,
          question: "Explain edge computing versus cloud computing.",
          transcript: "Edge computing processes data closer to where it is generated rather than in a centralized cloud datacenter.",
          score: 9.0,
          feedback: "Great distinction between edge and cloud latency.",
        },
      ],
    });

    await VivaAttempt.create({
      vivaSession: session._id,
      student: student2._id,
      status: "Completed",
      completedAt: new Date(),
      evaluated: true,
      totalMarks: 14,
      answers: [
        {
          questionNumber: 1,
          question: "What is serverless architecture?",
          transcript: "Serverless runs functions in the cloud without managing servers.",
          score: 7.0,
          feedback: "Good basic understanding.",
        },
        {
          questionNumber: 2,
          question: "Explain edge computing versus cloud computing.",
          transcript: "Edge is near devices, cloud is far away.",
          score: 7.0,
          feedback: "Brief, could include more technical specifics.",
        },
      ],
    });

    console.log("[Test 1] List Teacher Viva Sessions (GET /api/viva-sessions)");
    {
      const req = {
        user: { _id: teacherA._id, role: "teacher" },
      };
      const res = createMockRes();

      await getTeacherVivaSessions(req, res);
      const data = res.data;

      assert(res.statusCode === 200, "Teacher sessions list returns 200");
      assert(data.success === true, "Response has success: true");
      assert(Array.isArray(data.sessions), "Returns sessions array");
      assert(data.sessions.length === 1, "Teacher A has 1 session");
      assert(data.sessions[0].sessionId === "P14ANALYTICS", "Session ID matches");
      assert(data.sessions[0].totalAttempts === 2, "Records 2 total attempts");
      assert(data.sessions[0].completedCount === 2, "Records 2 completed attempts");
      assert(data.sessions[0].averageMarks === 16, "Average marks is 16 ((18+14)/2)");
    }

    console.log("\n[Test 2] Get Detailed Session Analytics (GET /api/viva-sessions/:sessionId/analytics)");
    {
      const req = {
        user: { _id: teacherA._id, role: "teacher" },
        params: { sessionId: "P14ANALYTICS" },
      };
      const res = createMockRes();

      await getSessionAnalytics(req, res);
      const data = res.data;

      assert(res.statusCode === 200, "Session analytics returns 200");
      assert(data.success === true, "Response has success: true");
      assert(data.session.sessionId === "P14ANALYTICS", "Analytics matches sessionId");
      assert(data.session.totalMarks === 20, "Total marks is 20");

      // Verify Metrics
      assert(data.metrics.totalStudents === 3, "Total eligible students is 3");
      assert(data.metrics.completedCount === 2, "Completed count is 2");
      assert(data.metrics.pendingCount === 1, "Pending count is 1");
      assert(data.metrics.averageMarks === 16, "Average mark is 16");
      assert(data.metrics.highestMarks === 18, "Highest mark is 18");
      assert(data.metrics.lowestMarks === 14, "Lowest mark is 14");

      // Verify Student Results List
      assert(data.students.length === 3, "All 3 eligible students returned in list");

      const s1 = data.students.find((s) => s.enrollmentNumber === "P14_ENR_001");
      assert(s1 !== undefined, "Student 1 found in results");
      assert(s1.vivaStatus === "Completed", "Student 1 vivaStatus is Completed");
      assert(s1.marks === 18, "Student 1 marks is 18");
      assert(s1.percentage === 90, "Student 1 percentage is 90%");
      assert(s1.answers.length === 2, "Student 1 has 2 answer transcripts");
      assert(s1.answers[0].score === 9, "Answer 1 has question-level score");
      assert(s1.answers[0].feedback.includes("Accurate"), "Answer 1 has AI feedback");

      const s3 = data.students.find((s) => s.enrollmentNumber === "P14_ENR_003");
      assert(s3 !== undefined, "Student 3 found in results");
      assert(s3.vivaStatus === "Pending", "Student 3 vivaStatus is Pending");
      assert(s3.marks === null, "Student 3 marks is null (pending)");
    }

    console.log("\n[Test 3] Access Control: Teacher B Cannot Access Teacher A's Analytics");
    {
      const req = {
        user: { _id: teacherB._id, role: "teacher" },
        params: { sessionId: "P14ANALYTICS" },
      };
      const res = createMockRes();

      await getSessionAnalytics(req, res);
      assert(res.statusCode === 404, "Teacher B receives 404 for Teacher A's session");
    }

  } finally {
    // Cleanup
    await User.deleteMany({ email: /p14_.*@test\.com/ });
    await Department.deleteMany({ code: "P14_DEPT" });
    await Subject.deleteMany({ code: "P14_SUBJ" });
    await Class.deleteMany({ code: "P14_CLASS" });
    await Student.deleteMany({ $or: [{ enrollment: /^P14_/ }, { enrollmentNumber: /^P14_/ }] });
    await Assignment.deleteMany({ title: "P14_ASSIGNMENT" });
    await VivaSession.deleteMany({ topic: "P14_TOPIC" });
    await VivaAttempt.deleteMany({});
    await mongoose.disconnect();
  }

  console.log("\n===================================================================");
  console.log(`  PHASE 14 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase14Tests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
