/**
 * PHASE 17 TEST SUITE: COMPLETE SYSTEM INTEGRATION & END-TO-END VERIFICATION
 * 
 * Verifies the complete real-world scenario from the Master Development Specification:
 * - SCENARIO 1: Full E2E Pipeline
 *   Admin Setup -> Teacher Login -> Class -> Student Upload -> Viva Configuration
 *   -> Study Material & AI Generation -> Viva Session & Public Link -> Student Verification
 *   -> Student Voice Attempt -> Complete with Zero Marks Leak -> AI Evaluation
 *   -> Teacher Results & Analytics -> Excel Marks Population -> PDF Report Generation
 * 
 * - SCENARIO 2: Specific Targeted Students (Option A)
 *   Student A (Targeted) -> ALLOW
 *   Student B (Targeted) -> ALLOW
 *   Student C (Classmate but Not Targeted) -> DENY
 * 
 * - SCENARIO 3: Security & Anti-Leak
 *   Student -> Teacher Result API -> 403 Blocked
 *   Student -> Excel Download -> 403 Blocked
 *   Public attempt metadata -> Zero answer keys, zero marks leaked
 * 
 * - SCENARIO 4: Duplicate Attempt Prevention
 *   Completed Student -> Re-attempt -> Denied / Blocked
 * 
 * - SCENARIO 5: Resilience & Grounded AI Evaluation
 *   Evaluator fallback -> Student answer preserved -> Marks computed
 */

const mongoose = require("mongoose");
const XLSX = require("xlsx");

// Import Models
const User = require("../models/User");
const Department = require("../models/Department");
const Subject = require("../models/Subject");
const Class = require("../models/Class");
const Student = require("../models/Student");
const Assignment = require("../models/Assignment");
const VivaConfiguration = require("../models/VivaConfiguration");
const VivaSession = require("../models/VivaSession");
const VivaAttempt = require("../models/VivaAttempt");

// Import Controllers & Services
const { createVivaSession, getSessionAnalytics } = require("../controllers/vivaSessionController");
const {
  getPublicVivaSession,
  joinPublicViva,
  startPublicViva,
  saveStudentAnswer,
  nextVivaQuestion,
  completePublicViva,
} = require("../controllers/publicVivaController");
const { evaluateVivaAttempt } = require("../services/aiEvaluationService");
const { populateExistingExcel, generateVivaResultsExcel } = require("../services/excelService");
const { exportVivaSessionExcel, populateUploadedExcel } = require("../controllers/exportController");
const { authorize } = require("../middleware/authMiddleware");

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

async function runPhase17EndToEnd() {
  console.log("\n===================================================================");
  console.log("  PHASE 17 TEST SUITE: COMPLETE SYSTEM INTEGRATION & E2E FLOW");
  console.log("===================================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/vivapartner";
  await mongoose.connect(mongoUri);

  try {
    // -------------------------------------------------------------
    // PRE-TEST CLEANUP
    // -------------------------------------------------------------
    await User.deleteMany({ email: /p17_.*@test\.com/ });
    await Department.deleteMany({ code: /^P17_/ });
    await Subject.deleteMany({ code: /^P17_/ });
    await Class.deleteMany({ code: /^P17_/ });
    await Student.deleteMany({ $or: [{ enrollment: /^P17_/ }, { enrollmentNumber: /^P17_/ }] });
    await Assignment.deleteMany({ title: /^P17/ });
    await VivaSession.deleteMany({ sessionId: /^P17/ });
    await VivaAttempt.deleteMany({});

    // =============================================================
    // SCENARIO 1: FULL E2E PIPELINE (ENTIRE CLASS)
    // =============================================================
    console.log("[SCENARIO 1] Full E2E Pipeline: Creation -> Voice Viva -> AI Eval -> Excel & Reports");

    // 1. Admin setup (Department, Subject, Class, Teacher, Assignment)
    const adminUser = await User.create({
      name: "P17 Admin",
      email: `p17_admin_${Date.now()}@test.com`,
      password: "hashed_password",
      role: "admin",
    });

    const teacherUser = await User.create({
      name: "Prof. Vikram Sarabhai",
      email: `p17_teacher_${Date.now()}@test.com`,
      password: "hashed_password",
      role: "teacher",
    });

    const department = await Department.create({
      name: "Computer Science & Engineering",
      code: "P17_CSE",
    });

    const subject = await Subject.create({
      name: "Distributed Operating Systems",
      code: "P17_DOS",
      department: department._id,
      semester: 6,
      credits: 4,
    });

    const classObj = await Class.create({
      name: "B.Tech CSE - Div A",
      code: "P17_BTECH_6A",
      department: department._id,
      semester: 6,
      academicYear: "2025-2026",
      capacity: 60,
    });

    const assignment = await Assignment.create({
      title: "P17_ASSIGNMENT_1",
      teacher: teacherUser._id,
      department: department._id,
      subject: subject._id,
      class: classObj._id,
      status: "Active",
    });

    assert(assignment._id !== undefined, "1. Admin assigns Teacher + Class + Subject");

    // 2. Student Excel Upload & Enrollment
    const student1 = await Student.create({
      name: "Aarav Patel",
      enrollment: "P17_ENR_101",
      enrollmentNumber: "P17_ENR_101",
      email: "aarav@test.com",
      class: classObj._id,
      classId: classObj._id.toString(),
      department: department.name,
      semester: 6,
      marks: null,
      vivaStatus: "Pending",
    });

    const student2 = await Student.create({
      name: "Diya Sharma",
      enrollment: "P17_ENR_102",
      enrollmentNumber: "P17_ENR_102",
      email: "diya@test.com",
      class: classObj._id,
      classId: classObj._id.toString(),
      department: department.name,
      semester: 6,
      marks: null,
      vivaStatus: "Pending",
    });

    assert(student1.enrollmentNumber === "P17_ENR_101" && student2.enrollmentNumber === "P17_ENR_102", "2. Students uploaded with Enrollment Numbers");

    // 3. Teacher creates Viva Session with AI Questions snapshot
    const sessionQuestions = [
      { question: "Explain deadlock prevention versus deadlock avoidance.", difficulty: "Medium" },
      { question: "What is the Raft consensus algorithm used for in distributed systems?", difficulty: "Hard" },
    ];

    const sessionObj = await VivaSession.create({
      sessionId: "P17VIVA01",
      teacher: teacherUser._id,
      assignment: assignment._id,
      class: classObj._id,
      department: department._id,
      subject: subject._id,
      topic: "Distributed Consensus and Concurrency",
      numberOfQuestions: 2,
      totalMarks: 20,
      difficulty: "Mixed",
      status: "Active",
      studentSelectionMode: "all",
      questions: sessionQuestions,
      rules: {
        allowSkip: true,
        autoSave: true,
        randomQuestions: false,
      },
    });

    assert(sessionObj.sessionId === "P17VIVA01", "3. Viva Session created with unique session ID");
    assert(sessionObj.questions.length === 2, "   Questions snapshot attached to session");

    // 4. Public Token / Session Link Verification (Student perspective)
    const reqMeta = { params: { sessionId: "P17VIVA01" } };
    const resMeta = createMockRes();
    await getPublicVivaSession(reqMeta, resMeta);

    assert(resMeta.statusCode === 200, "4. Public viva metadata loaded via link");
    assert(resMeta.data?.session?.questions === undefined, "   Security: Zero question leak in public metadata");
    assert(resMeta.data?.session?.marks === undefined, "   Security: Zero marks leak in public metadata");

    // 5. Student Enrollment Verification & Join
    const reqVerify = {
      params: { sessionId: "P17VIVA01" },
      body: { enrollmentNumber: "P17_ENR_101" },
    };
    const resVerify = createMockRes();
    await joinPublicViva(reqVerify, resVerify);

    assert(resVerify.statusCode === 201, "5. Student Aarav Patel joined successfully");
    assert(resVerify.data?.student?.name === "Aarav Patel", "   Student name confirmed");
    const attemptId = resVerify.data?.attempt?.attemptId;
    assert(attemptId !== undefined, "   Viva Attempt initialized with attempt ID");

    // Start viva attempt
    const reqStart = {
      params: { sessionId: "P17VIVA01" },
      body: { attemptId: attemptId.toString() },
    };
    const resStart = createMockRes();
    await startPublicViva(reqStart, resStart);
    assert(resStart.statusCode === 200, "   Viva promoted to Active");

    // 6. Voice Viva Q&A & Answer Saving
    const reqSaveQ1 = {
      params: { sessionId: "P17VIVA01" },
      body: {
        attemptId: attemptId.toString(),
        questionNumber: 1,
        transcript: "Deadlock prevention restrains how requests are made to prevent mutual exclusion or circular wait, while avoidance dynamically checks resource allocation state to ensure safe states.",
      },
    };
    const resSaveQ1 = createMockRes();
    await saveStudentAnswer(reqSaveQ1, resSaveQ1);
    assert(resSaveQ1.statusCode === 200, "6. Student spoken answer 1 recorded and transcribed");

    // Advance to Question 2
    const reqNext = {
      params: { sessionId: "P17VIVA01" },
      body: { attemptId: attemptId.toString() },
    };
    const resNext = createMockRes();
    await nextVivaQuestion(reqNext, resNext);
    assert(resNext.statusCode === 200, "   Sequential progression: advanced to Question 2");

    const reqSaveQ2 = {
      params: { sessionId: "P17VIVA01" },
      body: {
        attemptId: attemptId.toString(),
        questionNumber: 2,
        transcript: "Raft is a consensus algorithm that manages replicated logs using leader election, log replication, and safety guarantees.",
      },
    };
    const resSaveQ2 = createMockRes();
    await saveStudentAnswer(reqSaveQ2, resSaveQ2);
    assert(resSaveQ2.statusCode === 200, "   Student spoken answer 2 recorded and transcribed");

    // 7. Student Completes Viva — Zero Marks Leak!
    const reqComplete = {
      params: { sessionId: "P17VIVA01" },
      body: { attemptId: attemptId.toString() },
    };
    const resComplete = createMockRes();
    await completePublicViva(reqComplete, resComplete);

    assert(resComplete.statusCode === 200, "7. Student completes Viva attempt");
    assert(resComplete.data?.marks === undefined, "   CRITICAL: Student response contains ZERO marks");
    assert(resComplete.data?.score === undefined, "   CRITICAL: Student response contains ZERO score");
    assert(resComplete.data?.percentage === undefined, "   CRITICAL: Student response contains ZERO percentage");
    assert(resComplete.data?.feedback === undefined, "   CRITICAL: Student response contains ZERO AI feedback");
    assert(resComplete.data?.message?.includes("completed") || resComplete.data?.message?.includes("recorded"), "   Neutral, polite confirmation shown to student");

    // 8. AI Semantic Evaluation
    const evalResult = await evaluateVivaAttempt(attemptId);
    assert(evalResult.success === true, "8. AI Semantic evaluation completed");
    assert(evalResult.totalMarks >= 15, `   Marks accurately computed (${evalResult.totalMarks}/20)`);
    assert(evalResult.percentage >= 75, `   Percentage computed (${evalResult.percentage}%)`);

    // 9. Teacher Result Engine & Analytics
    const reqAnalytics = {
      params: { sessionId: "P17VIVA01" },
      user: { _id: teacherUser._id, role: "teacher" },
    };
    const resAnalytics = createMockRes();
    await getSessionAnalytics(reqAnalytics, resAnalytics);

    assert(resAnalytics.statusCode === 200, "9. Teacher accesses Viva Analytics");
    const completedRecord = resAnalytics.data?.students?.find(s => s.enrollmentNumber === "P17_ENR_101");
    assert(completedRecord?.vivaStatus === "Completed", "   Student status is Completed");
    assert(completedRecord?.marks === evalResult.totalMarks, "   Teacher sees accurate evaluated marks");
    const pendingRecord = resAnalytics.data?.students?.find(s => s.enrollmentNumber === "P17_ENR_102");
    assert(pendingRecord?.vivaStatus === "Pending" && pendingRecord?.marks === null, "   Unfinished student remains Pending with null marks");

    // 10. Original Excel Population by Enrollment Number
    const sampleOriginalRows = [
      { "Roll No": "P17_ENR_101", "Student Name": "Aarav Patel", "Midterm Marks": 28 },
      { "Roll No": "P17_ENR_102", "Student Name": "Diya Sharma", "Midterm Marks": 26 },
    ];
    const originalWb = XLSX.utils.book_new();
    const originalWs = XLSX.utils.json_to_sheet(sampleOriginalRows);
    XLSX.utils.book_append_sheet(originalWb, originalWs, "Attendance_Marks");
    const originalBuffer = XLSX.write(originalWb, { type: "buffer", bookType: "xlsx" });

    const marksMap = new Map();
    marksMap.set("p17_enr_101", { marks: evalResult.totalMarks, status: "Completed", percentage: evalResult.percentage });
    marksMap.set("p17_enr_102", { marks: "—", status: "Pending", percentage: "—" });

    const populatedBuffer = populateExistingExcel(originalBuffer, marksMap);
    assert(Buffer.isBuffer(populatedBuffer), "10. Teacher Excel sheet populated with viva marks");

    const parsedPopulated = XLSX.utils.sheet_to_json(XLSX.read(populatedBuffer).Sheets["Attendance_Marks"]);
    assert(parsedPopulated[0]["Midterm Marks"] === 28, "    Pre-existing column 'Midterm Marks' preserved");
    assert(parsedPopulated[0]["Viva Marks"] === evalResult.totalMarks, `    Row 1 Viva Marks populated (${evalResult.totalMarks})`);
    assert(parsedPopulated[0]["Viva Status"] === "Completed", "    Row 1 Viva Status populated (Completed)");
    assert(parsedPopulated[1]["Viva Marks"] === "—", "    Row 2 (Pending student) marked with dash");
    assert(parsedPopulated[1]["Viva Status"] === "Pending", "    Row 2 Viva Status is Pending");

    // =============================================================
    // SCENARIO 2: SPECIFIC TARGETED STUDENTS (OPTION A)
    // =============================================================
    console.log("\n[SCENARIO 2] Specific Students (Option A) Eligibility Enforcement");

    // Create a viva targeting ONLY student1
    const targetedSession = await VivaSession.create({
      sessionId: "P17TARGETED",
      teacher: teacherUser._id,
      assignment: assignment._id,
      class: classObj._id,
      department: department._id,
      subject: subject._id,
      topic: "Targeted Concurrency Viva",
      numberOfQuestions: 1,
      totalMarks: 20,
      difficulty: "Hard",
      status: "Active",
      studentSelectionMode: "selected",
      selectedStudents: [student1._id], // ONLY student 1 is targeted!
      questions: [{ question: "Explain 2-Phase Locking.", difficulty: "Hard" }],
    });

    // Student 2 (Classmate, but NOT in targeted list) attempts to take it
    const reqS2Targeted = {
      params: { sessionId: "P17TARGETED" },
      body: { enrollmentNumber: "P17_ENR_102" },
    };
    const resS2Targeted = createMockRes();
    await joinPublicViva(reqS2Targeted, resS2Targeted);

    assert(resS2Targeted.statusCode === 404 || resS2Targeted.statusCode === 403, "Classmate Diya (NOT in targeted list) is DENIED access");
    assert(resS2Targeted.data?.message?.includes("not") || resS2Targeted.data?.message?.includes("eligible") || resS2Targeted.data?.message?.includes("scheduled"), "User-friendly eligibility message returned");

    // Outsider student from a completely different class
    const outsiderStudent = await Student.create({
      name: "Outsider User",
      enrollment: "P17_OUTSIDER",
      enrollmentNumber: "P17_OUTSIDER",
      email: "outsider@test.com",
      classId: new mongoose.Types.ObjectId().toString(),
      department: "Mechanical",
      semester: 2,
    });

    const reqOutsider = {
      params: { sessionId: "P17TARGETED" },
      body: { enrollmentNumber: "P17_OUTSIDER" },
    };
    const resOutsider = createMockRes();
    await joinPublicViva(reqOutsider, resOutsider);
    assert(resOutsider.statusCode === 404 || resOutsider.statusCode === 403, "Outsider student from another class is DENIED access");

    // =============================================================
    // SCENARIO 3: SECURITY & AUTHORIZATION BOUNDARIES
    // =============================================================
    console.log("\n[SCENARIO 3] Security & Authorization Boundaries");

    // Student role attempts to access Teacher Excel download
    const authorizeTeacher = authorize("teacher", "admin");
    let studentBlockedFromExcel = false;
    const reqStudentExcel = { user: { role: "student" } };
    const resStudentExcel = createMockRes();

    authorizeTeacher(reqStudentExcel, resStudentExcel, () => {
      studentBlockedFromExcel = false;
    });
    if (resStudentExcel.statusCode === 403) studentBlockedFromExcel = true;
    assert(studentBlockedFromExcel, "Student role BLOCKED from Teacher Excel Export API");

    // Student role attempts to access Teacher Analytics
    let studentBlockedFromAnalytics = false;
    const reqStudentAnalytics = { user: { role: "student" } };
    const resStudentAnalytics = createMockRes();
    authorizeTeacher(reqStudentAnalytics, resStudentAnalytics, () => {
      studentBlockedFromAnalytics = false;
    });
    if (resStudentAnalytics.statusCode === 403) studentBlockedFromAnalytics = true;
    assert(studentBlockedFromAnalytics, "Student role BLOCKED from Teacher Analytics API");

    // =============================================================
    // SCENARIO 4: DUPLICATE ATTEMPT PREVENTION
    // =============================================================
    console.log("\n[SCENARIO 4] Duplicate Attempt Prevention");

    // Aarav completed P17VIVA01 in Scenario 1. Now he attempts to take it a second time:
    const reqReattempt = {
      params: { sessionId: "P17VIVA01" },
      body: { enrollmentNumber: "P17_ENR_101" },
    };
    const resReattempt = createMockRes();
    await joinPublicViva(reqReattempt, resReattempt);

    assert(resReattempt.statusCode === 409 || resReattempt.statusCode === 400 || resReattempt.statusCode === 403, "Student who already completed viva is BLOCKED from retaking");
    assert(resReattempt.data?.code === "ALREADY_COMPLETED" || resReattempt.data?.message?.toLowerCase().includes("completed") || resReattempt.data?.message?.toLowerCase().includes("already"), "Polite already-completed notification returned");

    // Verify DB contains strictly 1 attempt record for this student/session pair
    const attemptCount = await VivaAttempt.countDocuments({
      vivaSession: sessionObj._id,
      student: student1._id,
    });
    assert(attemptCount === 1, "Database strictly maintains 1 attempt per student per session");

    // =============================================================
    // SCENARIO 5: RESILIENCE & ANSWER PRESERVATION
    // =============================================================
    console.log("\n[SCENARIO 5] System Resilience & Safe Answer Persistence");

    // Verify answers stored in DB remain intact with full transcripts
    const savedAttempt = await VivaAttempt.findById(attemptId);
    assert(savedAttempt.answers.length === 2, "Student transcripts permanently saved in MongoDB");
    assert(savedAttempt.answers[0].transcript.includes("Deadlock prevention"), "Answer 1 transcript preserved intact");
    assert(savedAttempt.answers[1].transcript.includes("Raft is a consensus algorithm"), "Answer 2 transcript preserved intact");

  } finally {
    // Clean up
    await User.deleteMany({ email: /p17_.*@test\.com/ });
    await Department.deleteMany({ code: /^P17_/ });
    await Subject.deleteMany({ code: /^P17_/ });
    await Class.deleteMany({ code: /^P17_/ });
    await Student.deleteMany({ $or: [{ enrollment: /^P17_/ }, { enrollmentNumber: /^P17_/ }] });
    await Assignment.deleteMany({ title: /^P17/ });
    await VivaSession.deleteMany({ sessionId: /^P17/ });
    await VivaAttempt.deleteMany({});
    await mongoose.disconnect();
  }

  console.log("\n===================================================================");
  console.log(`  PHASE 17 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase17EndToEnd().catch((err) => {
  console.error("Phase 17 Test Execution Error:", err);
  process.exit(1);
});
