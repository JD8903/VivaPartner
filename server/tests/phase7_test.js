const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Student = require("../models/Student");
const Class = require("../models/Class");
const Department = require("../models/Department");
const VivaSession = require("../models/VivaSession");
const VivaAttempt = require("../models/VivaAttempt");
const Assignment = require("../models/Assignment");

async function runPhase7Tests() {
  console.log("==================================================");
  console.log("   PHASE 7: STUDENT & CLASS DATA TEST SUITE");
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

  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/vivapartner"
  );
  console.log("MongoDB connected.");

  // Clean up any old test data
  await Student.deleteMany({ enrollment: { $regex: /^P7_TEST_/ } });
  await VivaSession.deleteMany({ sessionId: { $regex: /^P7_SESSION_/ } });

  try {
    // ----------------------------------------------------
    // SETUP: Get or create Teacher, Department, Class
    // ----------------------------------------------------
    const teacher = await User.findOne({ role: "teacher", status: "Active" });
    assert(!!teacher, "Active teacher exists in database");

    let testClass = await Class.findOne({ status: "Active" });
    assert(!!testClass, "Active class exists in database");

    // ----------------------------------------------------
    // TEST 1: Student Model & Virtual Fields
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Student Model & Virtual Compatibility ---");
    const s1 = await Student.create({
      enrollment: "P7_TEST_01",
      name: "Rohan Varma",
      department: "Computer Engineering",
      semester: testClass.semester,
      classId: testClass._id.toString(),
      class: testClass._id,
      teacher: teacher._id,
      marks: 0,
      vivaStatus: "Pending",
    });

    assert(s1._id != null, "Student s1 created successfully");
    assert(s1.enrollment === "P7_TEST_01", "Student enrollment field matches");
    assert(s1.enrollmentNumber === "P7_TEST_01", "Virtual enrollmentNumber returns enrollment");
    assert(s1.enrollmentNo === "P7_TEST_01", "Virtual enrollmentNo returns enrollment");
    assert(s1.studentName === "Rohan Varma", "Virtual studentName returns name");
    assert(s1.classId === testClass._id.toString(), "Student classId matches class _id");
    assert(String(s1.class) === testClass._id.toString(), "Student class ObjectId matches");

    const s2 = await Student.create({
      enrollment: "P7_TEST_02",
      name: "Sneha Reddy",
      department: "Computer Engineering",
      semester: testClass.semester,
      classId: testClass._id.toString(),
      class: testClass._id,
      teacher: teacher._id,
      marks: 0,
      vivaStatus: "Pending",
    });
    assert(s2._id != null, "Student s2 created successfully");

    // Student from a DIFFERENT class
    const otherClassId = new mongoose.Types.ObjectId();
    const sOtherClass = await Student.create({
      enrollment: "P7_TEST_99",
      name: "Unauthorized Outsider",
      department: "Mechanical",
      semester: 1,
      classId: otherClassId.toString(),
      class: otherClassId,
      teacher: teacher._id,
    });
    assert(sOtherClass._id != null, "Outsider student created with different classId");

    // ----------------------------------------------------
    // TEST 2: Student Targeting in Viva Session
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Viva Session - Specific Students Targeting ---");
    const specificSession = await VivaSession.create({
      sessionId: "P7_SESSION_SPECIFIC_" + Date.now(),
      teacher: teacher._id,
      assignment: new mongoose.Types.ObjectId(),
      class: testClass._id,
      department: testClass.department,
      subject: new mongoose.Types.ObjectId(),
      studentSelectionMode: "selected",
      selectedStudents: [s1._id], // ONLY s1 targeted, NOT s2, NOT sOtherClass
      status: "Active",
      numberOfQuestions: 5,
      totalMarks: 20,
    });

    assert(specificSession._id != null, "Specific targeted Viva Session created");
    assert(specificSession.studentSelectionMode === "selected", "Selection mode is 'selected'");
    assert(specificSession.selectedStudents.length === 1, "selectedStudents has exactly 1 student");
    assert(
      specificSession.selectedStudents[0].toString() === s1._id.toString(),
      "selectedStudents contains s1"
    );

    // Verify targeting rule: s1 ALLOWED, s2 DENIED, sOtherClass DENIED
    const isS1Allowed = specificSession.selectedStudents.some(
      (id) => id.toString() === s1._id.toString()
    );
    const isS2Allowed = specificSession.selectedStudents.some(
      (id) => id.toString() === s2._id.toString()
    );
    const isOtherAllowed = specificSession.selectedStudents.some(
      (id) => id.toString() === sOtherClass._id.toString()
    );

    assert(isS1Allowed === true, "Targeted student s1 is ALLOWED");
    assert(isS2Allowed === false, "Non-targeted student s2 is DENIED");
    assert(isOtherAllowed === false, "Outsider student sOtherClass is DENIED");

    // ----------------------------------------------------
    // TEST 3: Viva Session - Entire Class Targeting
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Viva Session - Entire Class Targeting ---");
    const wholeClassSession = await VivaSession.create({
      sessionId: "P7_SESSION_CLASS_" + Date.now(),
      teacher: teacher._id,
      assignment: new mongoose.Types.ObjectId(),
      class: testClass._id,
      department: testClass.department,
      subject: new mongoose.Types.ObjectId(),
      studentSelectionMode: "all",
      selectedStudents: [],
      status: "Active",
      numberOfQuestions: 5,
      totalMarks: 20,
    });

    assert(wholeClassSession._id != null, "Entire Class Viva Session created");
    assert(wholeClassSession.studentSelectionMode === "all", "Selection mode is 'all'");

    // Find all eligible students for the whole class session
    const eligibleStudents = await Student.find({
      $or: [
        { class: wholeClassSession.class },
        { classId: wholeClassSession.class.toString() },
      ],
    });

    const eligibleIds = eligibleStudents.map((s) => s._id.toString());
    assert(eligibleIds.includes(s1._id.toString()), "Class student s1 is eligible in 'all' mode");
    assert(eligibleIds.includes(s2._id.toString()), "Class student s2 is eligible in 'all' mode");
    assert(!eligibleIds.includes(sOtherClass._id.toString()), "Outsider student sOtherClass is NOT eligible");

    // ----------------------------------------------------
    // TEST 4: Student -> VivaSession -> VivaAttempt Relationship
    // ----------------------------------------------------
    console.log("\n--- TEST 4: VivaAttempt Model & Duplicate Prevention ---");
    const attempt1 = await VivaAttempt.create({
      vivaSession: specificSession._id,
      student: s1._id,
      status: "Active",
      startedAt: new Date(),
    });

    assert(attempt1._id != null, "VivaAttempt created for s1 on specificSession");
    assert(
      attempt1.vivaSession.toString() === specificSession._id.toString(),
      "Attempt links to correct VivaSession"
    );
    assert(
      attempt1.student.toString() === s1._id.toString(),
      "Attempt links to correct Student"
    );

    // Attempt to create duplicate attempt for s1 on the same session
    let duplicatePrevented = false;
    try {
      await VivaAttempt.create({
        vivaSession: specificSession._id,
        student: s1._id,
        status: "Active",
      });
    } catch (err) {
      if (err.code === 11000) {
        duplicatePrevented = true;
      }
    }
    assert(duplicatePrevented === true, "Compound unique index prevents duplicate attempt for s1 on same session");

    // Clean up attempts and test records
    await VivaAttempt.deleteMany({ vivaSession: specificSession._id });
    await VivaSession.deleteMany({
      _id: { $in: [specificSession._id, wholeClassSession._id] },
    });
    await Student.deleteMany({
      _id: { $in: [s1._id, s2._id, sOtherClass._id] },
    });
    console.log("\nCleaned up Phase 7 test records.");

  } catch (err) {
    console.error("Phase 7 test error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log("\n==================================================");
  console.log(`   PHASE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase7Tests().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
