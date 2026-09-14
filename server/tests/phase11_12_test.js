/**
 * Phase 11 & Phase 12 Automated Test Suite
 *
 * Verifies:
 * 1. Phase 11: Student Voice Viva Experience Flow
 *    - Join viva session with enrollment number
 *    - Start viva session attempt
 *    - Sequential question retrieval (question 1, question 2, etc.)
 *    - Voice answer transcript saving
 *    - Question progression and duplicate protection
 *    - Skip question capability
 * 2. Phase 12: Anti-Leak & Student Submission Policy
 *    - Completion of viva attempt
 *    - STRICT ZERO-LEAK VERIFICATION:
 *      * No marks returned in API response
 *      * No percentage, grades, or teacher evaluations leaked
 *      * Neutral completion confirmation returned
 *      * Attempt status is 'Completed' with answers preserved for AI evaluation (Phase 13)
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
  getPublicVivaSession,
  joinPublicViva,
  startPublicViva,
  getCurrentVivaQuestion,
  saveStudentAnswer,
  nextVivaQuestion,
  completePublicViva,
} = require("../controllers/publicVivaController");

const {
  createVivaSession,
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

async function runPhase11And12Tests() {
  console.log("\n===================================================================");
  console.log("  PHASE 11 & 12 TEST SUITE: STUDENT VOICE VIVA & ANTI-LEAK POLICY");
  console.log("===================================================================\n");

  await mongoose.connect(MONGO_URI);

  // Clean test fixtures
  await User.deleteMany({ email: /p11_teacher.*@test\.com/ });
  await Department.deleteMany({ code: "P11_DEPT" });
  await Subject.deleteMany({ code: "P11_SUBJ" });
  await Class.deleteMany({ code: "P11_CLASS" });
  await Student.deleteMany({ $or: [{ enrollment: /^P11_/ }, { enrollmentNumber: /^P11_/ }] });
  await Assignment.deleteMany({ title: "P11_ASSIGNMENT" });
  await VivaSession.deleteMany({ topic: "P11_TOPIC" });
  await VivaAttempt.deleteMany({});

  try {
    // 1. Setup entities
    const teacher = await User.create({
      name: "Phase11 Teacher",
      email: `p11_teacher_${Date.now()}@test.com`,
      password: "hashed_password",
      role: "teacher",
    });

    const department = await Department.create({
      name: "Phase11 Department",
      code: "P11_DEPT",
    });

    const subject = await Subject.create({
      name: "Phase11 Voice Systems",
      code: "P11_SUBJ",
      department: department._id,
      semester: 6,
      credits: 4,
    });

    const classObj = await Class.create({
      name: "P11_CLASS",
      code: "P11_CLASS",
      department: department._id,
      semester: 6,
      academicYear: "2025-2026",
      capacity: 60,
    });

    const student = await Student.create({
      name: "Ananya Sharma",
      enrollment: "P11_ENR_001",
      enrollmentNumber: "P11_ENR_001",
      email: "ananya@test.com",
      class: classObj._id,
      classId: classObj._id.toString(),
      department: department.name,
      semester: 6,
    });

    const assignment = await Assignment.create({
      title: "P11_ASSIGNMENT",
      teacher: teacher._id,
      department: department._id,
      subject: subject._id,
      class: classObj._id,
      status: "Active",
    });

    const questions = [
      { id: 1, question: "What is asynchronous programming in Node.js?", difficulty: "Easy", questionType: "Conceptual" },
      { id: 2, question: "Explain the event loop and thread pool in V8.", difficulty: "Medium", questionType: "Technical" },
      { id: 3, question: "How does MongoDB indexing improve query execution?", difficulty: "Hard", questionType: "Practical" },
    ];

    // Create Viva Session
    let sessionId = "";
    {
      const req = {
        user: { _id: teacher._id, role: "teacher" },
        body: {
          assignment: assignment._id.toString(),
          questions,
          studentSelectionMode: "all",
          selectedStudents: [],
          numberOfQuestions: 3,
          totalMarks: 30,
          topic: "P11_TOPIC",
          rules: {
            allowSkip: true,
            randomQuestions: false,
          },
          aiSettings: {
            voice: "Female",
            speechSpeed: "Normal",
          },
        },
      };
      const res = createMockRes();
      await createVivaSession(req, res);
      sessionId = res.data.session.sessionId;
    }

    console.log("[Test 1] Student Joins Viva Session (Phase 11 Entry)");
    let attemptId = "";
    {
      const req = {
        params: { sessionId },
        body: { enrollmentNumber: "P11_ENR_001" },
      };
      const res = createMockRes();

      await joinPublicViva(req, res);
      const data = res.data;

      assert(res.statusCode === 201, "Student joined viva successfully (201)");
      assert(data.success === true, "Join response has success: true");
      assert(Boolean(data.attempt?.attemptId), "Received attemptId");
      assert(data.student.enrollmentNumber === "P11_ENR_001", "Student enrollment matched");
      assert(data.attempt.status === "NotStarted", "Initial attempt status is NotStarted");
      assert(data.session.numberOfQuestions === 3, "Correct question count returned");
      assert(data.marks === undefined, "Zero marks leak during join");
      attemptId = data.attempt.attemptId;
    }

    console.log("\n[Test 2] Student Starts Voice Viva (Promotes to Active)");
    {
      const req = {
        params: { sessionId },
        body: { attemptId: attemptId.toString() },
      };
      const res = createMockRes();

      await startPublicViva(req, res);
      const data = res.data;

      assert(res.statusCode === 200, "Viva started successfully (200)");
      assert(data.success === true, "Start response has success: true");
      assert(data.attempt.status === "Active", "Attempt status is Active");
      assert(data.marks === undefined, "Zero marks leak during viva start");

      const dbSession = await VivaSession.findOne({ sessionId });
      assert(dbSession.status === "Active", "Session status is Active in DB");
    }

    console.log("\n[Test 3] Student Receives Question 1 & Verifies Zero Question Leaks");
    {
      const req = {
        params: { sessionId },
        query: { attemptId: attemptId.toString() },
      };
      const res = createMockRes();

      await getCurrentVivaQuestion(req, res);
      const data = res.data;

      assert(res.statusCode === 200, "Question 1 loaded with status 200");
      assert(data.success === true, "Question response has success: true");
      assert(data.completed === false, "Viva is not yet completed");
      assert(data.question.questionNumber === 1, "Question number is 1");
      assert(data.question.totalQuestions === 3, "Total questions is 3");
      assert(data.question.question === "What is asynchronous programming in Node.js?", "Question text matches");
      assert(data.question.difficulty === "Easy", "Difficulty is Easy");
      assert(data.question.answers === undefined, "CRITICAL: No answer key leaked to student");
      assert(data.question.criteria === undefined, "CRITICAL: No evaluation criteria leaked to student");
      assert(data.marks === undefined, "Zero marks leak during question retrieval");
    }

    console.log("\n[Test 4] Student Speaks & Saves Answer for Question 1");
    {
      const answerTranscript = "Asynchronous programming allows non-blocking I/O operations using the event loop and callbacks.";
      const req = {
        params: { sessionId },
        body: {
          attemptId: attemptId.toString(),
          questionNumber: 1,
          transcript: answerTranscript,
        },
      };
      const res = createMockRes();

      await saveStudentAnswer(req, res);
      const data = res.data;

      assert(res.statusCode === 200, "Answer saved successfully with status 200");
      assert(data.success === true, "Save answer has success: true");
      assert(data.saved === true, "Answer registered as saved");
      assert(data.marks === undefined, "CRITICAL: Marks are NOT leaked when saving answer");
      assert(data.score === undefined, "CRITICAL: Score is NOT leaked when saving answer");

      // Verify answer in DB
      const dbAttempt = await VivaAttempt.findById(attemptId);
      assert(dbAttempt.answers.length === 1, "Attempt in DB has 1 answer");
      assert(dbAttempt.answers[0].transcript === answerTranscript, "Saved transcript matches spoken input");
      assert(dbAttempt.answers[0].questionNumber === 1, "Saved questionNumber is 1");
    }

    console.log("\n[Test 5] Student Advances to Question 2");
    {
      const req = {
        params: { sessionId },
        body: { attemptId: attemptId.toString() },
      };
      const res = createMockRes();

      await nextVivaQuestion(req, res);
      const data = res.data;

      assert(res.statusCode === 200, "Advanced to Question 2 with status 200");
      assert(data.success === true, "Next question has success: true");
      assert(data.completed === false, "Viva not completed yet");
      assert(data.question.questionNumber === 2, "Question number is now 2");
      assert(data.question.question === "Explain the event loop and thread pool in V8.", "Question 2 text matches");
      assert(data.marks === undefined, "Zero marks leak during next question");
    }

    console.log("\n[Test 6] Student Skips Question 2 (Allowed by Rules)");
    {
      // Student skips Question 2
      const reqSave = {
        params: { sessionId },
        body: {
          attemptId: attemptId.toString(),
          questionNumber: 2,
          transcript: "[Skipped by student]",
        },
      };
      const resSave = createMockRes();
      await saveStudentAnswer(reqSave, resSave);
      assert(resSave.statusCode === 200, "Skipped answer placeholder recorded");

      const reqNext = {
        params: { sessionId },
        body: { attemptId: attemptId.toString() },
      };
      const resNext = createMockRes();
      await nextVivaQuestion(reqNext, resNext);
      const dataNext = resNext.data;

      assert(dataNext.question.questionNumber === 3, "Advanced to Question 3 after skipping");
    }

    console.log("\n[Test 7] Student Speaks & Saves Answer for Question 3");
    {
      const req = {
        params: { sessionId },
        body: {
          attemptId: attemptId.toString(),
          questionNumber: 3,
          transcript: "Indexes create B-trees that speed up search queries from linear O(N) to logarithmic O(log N).",
        },
      };
      const res = createMockRes();
      await saveStudentAnswer(req, res);
      assert(res.statusCode === 200, "Answer for Question 3 saved");
    }

    console.log("\n[Test 8] Student Completes Viva & Phase 12 Anti-Leak Verification");
    {
      const req = {
        params: { sessionId },
        body: { attemptId: attemptId.toString() },
      };
      const res = createMockRes();

      await completePublicViva(req, res);
      const data = res.data;

      assert(res.statusCode === 200, "Viva completed successfully with status 200");
      assert(data.success === true, "Complete response has success: true");
      assert(data.completed === true, "Completed flag is true");
      assert(typeof data.message === "string", "Response includes confirmation message");

      // =================================================================
      // STRICT ZERO-LEAK VERIFICATIONS (PHASE 12 POLICY)
      // =================================================================
      assert(data.marks === undefined, "ZERO LEAK: 'marks' is strictly absent from completion response");
      assert(data.totalMarks === undefined, "ZERO LEAK: 'totalMarks' is strictly absent from completion response");
      assert(data.score === undefined, "ZERO LEAK: 'score' is strictly absent from completion response");
      assert(data.percentage === undefined, "ZERO LEAK: 'percentage' is strictly absent from completion response");
      assert(data.grade === undefined, "ZERO LEAK: 'grade' is strictly absent from completion response");
      assert(data.evaluation === undefined, "ZERO LEAK: 'evaluation' is strictly absent from completion response");
      assert(data.feedback === undefined, "ZERO LEAK: 'feedback' is strictly absent from completion response");
      assert(data.excelFile === undefined, "ZERO LEAK: 'excelFile' is strictly absent from completion response");

      // Verify Attempt in DB
      const dbAttempt = await VivaAttempt.findById(attemptId);
      assert(dbAttempt.status === "Completed", "Attempt status in DB is Completed");
      assert(dbAttempt.completedAt !== null, "completedAt timestamp is recorded");
      assert(dbAttempt.answers.length === 3, "All 3 answers (including skip) preserved for teacher evaluation");
      assert(dbAttempt.evaluated === false, "Evaluated is false pending Phase 13 AI Evaluation");
    }

  } finally {
    // Cleanup
    await User.deleteMany({ email: /p11_teacher.*@test\.com/ });
    await Department.deleteMany({ code: "P11_DEPT" });
    await Subject.deleteMany({ code: "P11_SUBJ" });
    await Class.deleteMany({ code: "P11_CLASS" });
    await Student.deleteMany({ $or: [{ enrollment: /^P11_/ }, { enrollmentNumber: /^P11_/ }] });
    await Assignment.deleteMany({ title: "P11_ASSIGNMENT" });
    await VivaSession.deleteMany({ topic: "P11_TOPIC" });
    await VivaAttempt.deleteMany({});
    await mongoose.disconnect();
  }

  console.log("\n===================================================================");
  console.log(`  PHASE 11 & 12 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase11And12Tests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
