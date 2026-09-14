/**
 * Phase 13 Automated Test Suite: AI Evaluation & Marks Computation
 *
 * Verifies:
 * 1. AI Evaluation Service executes conceptual and semantic assessment of spoken answers
 * 2. Question-level scoring and constructive feedback generation
 * 3. Skipped / unanswered questions are properly awarded 0 marks
 * 4. Total marks computed out of session.totalMarks (clamped to max limits)
 * 5. VivaAttempt updated with evaluated: true, totalMarks, and per-answer scores/feedback
 * 6. Student model synchronized with marks and vivaStatus: "Completed"
 * 7. Teacher endpoint POST /api/viva-sessions/:sessionId/evaluate evaluates session attempts
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
  evaluateVivaAttempt,
  evaluateSemantically,
} = require("../services/aiEvaluationService");

const {
  evaluateSessionAttempts,
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

async function runPhase13Tests() {
  console.log("\n===================================================================");
  console.log("  PHASE 13 TEST SUITE: AI EVALUATION & MARKS COMPUTATION");
  console.log("===================================================================\n");

  await mongoose.connect(MONGO_URI);

  // Clean test fixtures
  await User.deleteMany({ email: /p13_teacher.*@test\.com/ });
  await Department.deleteMany({ code: "P13_DEPT" });
  await Subject.deleteMany({ code: "P13_SUBJ" });
  await Class.deleteMany({ code: "P13_CLASS" });
  await Student.deleteMany({ $or: [{ enrollment: /^P13_/ }, { enrollmentNumber: /^P13_/ }] });
  await Assignment.deleteMany({ title: "P13_ASSIGNMENT" });
  await VivaSession.deleteMany({ topic: "P13_TOPIC" });
  await VivaAttempt.deleteMany({});

  try {
    // 1. Unit Test Semantic Evaluator
    console.log("[Test 1] Grounded Semantic Evaluator Unit Test");
    {
      const question = "Explain how Node.js handles asynchronous non-blocking I/O using libuv and the event loop.";
      const goodAnswer = "Node.js uses libuv event loop to handle non-blocking asynchronous operations with an internal thread pool for file and network I/O.";
      const maxMarks = 10;

      const evalGood = evaluateSemantically(question, goodAnswer, maxMarks, "Node.js Runtime");
      assert(evalGood.score > 5, `Good answer receives high score (${evalGood.score}/${maxMarks})`);
      assert(typeof evalGood.feedback === "string" && evalGood.feedback.length > 5, "Good answer receives constructive feedback");

      const skippedAnswer = "[Skipped by student]";
      const evalSkipped = evaluateSemantically(question, skippedAnswer, maxMarks, "Node.js Runtime");
      assert(evalSkipped.score === 0, "Skipped answer strictly receives 0 score");
      assert(evalSkipped.feedback.includes("skipped") || evalSkipped.feedback.includes("unanswered"), "Skipped feedback notes skip status");
    }

    // 2. Setup DB entities for full pipeline evaluation test
    console.log("\n[Test 2] End-to-End Attempt Evaluation Pipeline");
    await User.deleteMany({ email: /p13_.*@test\.com/ });
    await Department.deleteMany({ code: "P13_DEPT" });
    await Subject.deleteMany({ code: "P13_SUBJ" });
    await Class.deleteMany({ code: "P13_CLASS" });
    await Student.deleteMany({ $or: [{ enrollment: /^P13_/ }, { enrollmentNumber: /^P13_/ }] });
    await Assignment.deleteMany({ title: "P13_ASSIGNMENT" });
    await VivaSession.deleteMany({ sessionId: /^P13/ });
    await VivaAttempt.deleteMany({});

    const teacher = await User.create({
      name: "Phase13 Teacher",
      email: `p13_teacher_${Date.now()}@test.com`,
      password: "hashed_password",
      role: "teacher",
    });

    const department = await Department.create({
      name: "Phase13 Department",
      code: "P13_DEPT",
    });

    const subject = await Subject.create({
      name: "Phase13 Distributed Systems",
      code: "P13_SUBJ",
      department: department._id,
      semester: 6,
      credits: 4,
    });

    const classObj = await Class.create({
      name: "P13_CLASS",
      code: "P13_CLASS",
      department: department._id,
      semester: 6,
      academicYear: "2025-2026",
      capacity: 60,
    });

    const student = await Student.create({
      name: "Devendra Patel",
      enrollment: "P13_ENR_001",
      enrollmentNumber: "P13_ENR_001",
      email: "devendra@test.com",
      class: classObj._id,
      classId: classObj._id.toString(),
      department: department.name,
      semester: 6,
      marks: 0,
      vivaStatus: "Pending",
    });

    const assignment = await Assignment.create({
      title: "P13_ASSIGNMENT",
      teacher: teacher._id,
      department: department._id,
      subject: subject._id,
      class: classObj._id,
      status: "Active",
    });

    const session = await VivaSession.create({
      sessionId: "P13EVAL",
      teacher: teacher._id,
      assignment: assignment._id,
      class: classObj._id,
      department: department._id,
      subject: subject._id,
      topic: "P13_TOPIC",
      numberOfQuestions: 2,
      totalMarks: 20,
      difficulty: "Medium",
      status: "Active",
      questions: [
        { question: "What is database sharding and how does it scale data?", difficulty: "Medium" },
        { question: "Explain the CAP theorem in distributed computing.", difficulty: "Hard" },
      ],
    });

    // Create a Completed Attempt with 2 answers
    const attempt = await VivaAttempt.create({
      vivaSession: session._id,
      student: student._id,
      status: "Completed",
      completedAt: new Date(),
      evaluated: false,
      totalMarks: 0,
      answers: [
        {
          questionNumber: 1,
          question: "What is database sharding and how does it scale data?",
          transcript: "Database sharding is horizontal partitioning of database rows across multiple server instances to scale read and write throughput.",
        },
        {
          questionNumber: 2,
          question: "Explain the CAP theorem in distributed computing.",
          transcript: "CAP theorem states a distributed system can provide at most two out of Consistency, Availability, and Partition tolerance.",
        },
      ],
    });

    // Run AI Evaluation
    const evalResult = await evaluateVivaAttempt(attempt._id);

    assert(evalResult.evaluated === true, "Evaluation result has evaluated: true");
    assert(evalResult.totalMarks > 0, `Total marks calculated (${evalResult.totalMarks}/${session.totalMarks})`);
    assert(evalResult.totalMarks <= session.totalMarks, "Total marks does not exceed session totalMarks");
    assert(evalResult.answers.length === 2, "Both answers evaluated");
    assert(evalResult.answers[0].score > 0, `Answer 1 scored (${evalResult.answers[0].score})`);
    assert(typeof evalResult.answers[0].feedback === "string", "Answer 1 has feedback");
    assert(evalResult.answers[1].score > 0, `Answer 2 scored (${evalResult.answers[1].score})`);
    assert(typeof evalResult.answers[1].feedback === "string", "Answer 2 has feedback");

    // Verify VivaAttempt in DB
    const dbAttempt = await VivaAttempt.findById(attempt._id);
    assert(dbAttempt.evaluated === true, "Attempt in DB has evaluated: true");
    assert(dbAttempt.totalMarks === evalResult.totalMarks, "Attempt in DB has matching totalMarks");
    assert(dbAttempt.answers[0].score === evalResult.answers[0].score, "Attempt answer 1 score matches");

    // Verify Student record synchronized
    const dbStudent = await Student.findById(student._id);
    assert(dbStudent.marks === evalResult.totalMarks, `Student marks synchronized in DB (${dbStudent.marks})`);
    assert(dbStudent.vivaStatus === "Completed", "Student vivaStatus set to 'Completed'");

    console.log("\n[Test 3] Teacher Session Evaluation API (POST /api/viva-sessions/:sessionId/evaluate)");
    {
      const req = {
        user: { _id: teacher._id, role: "teacher" },
        params: { sessionId: "P13EVAL" },
      };
      const res = createMockRes();

      await evaluateSessionAttempts(req, res);
      const data = res.data;

      assert(res.statusCode === 200, "Teacher evaluate endpoint returns 200");
      assert(data.success === true, "Evaluate endpoint response has success: true");
      assert(data.evaluatedCount === 1, "Evaluated 1 student attempt");
      assert(Array.isArray(data.evaluations), "Returns evaluations array for teacher");
      assert(data.evaluations[0].totalMarks === evalResult.totalMarks, "Evaluations array contains student marks");
    }

  } finally {
    // Cleanup
    await User.deleteMany({ email: /p13_teacher.*@test\.com/ });
    await Department.deleteMany({ code: "P13_DEPT" });
    await Subject.deleteMany({ code: "P13_SUBJ" });
    await Class.deleteMany({ code: "P13_CLASS" });
    await Student.deleteMany({ $or: [{ enrollment: /^P13_/ }, { enrollmentNumber: /^P13_/ }] });
    await Assignment.deleteMany({ title: "P13_ASSIGNMENT" });
    await VivaSession.deleteMany({ topic: "P13_TOPIC" });
    await VivaAttempt.deleteMany({});
    await mongoose.disconnect();
  }

  console.log("\n===================================================================");
  console.log(`  PHASE 13 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase13Tests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
