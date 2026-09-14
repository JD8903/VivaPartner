const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User");
const Class = require("../models/Class");
const Department = require("../models/Department");
const Subject = require("../models/Subject");
const Assignment = require("../models/Assignment");
const Student = require("../models/Student");
const VivaConfiguration = require("../models/VivaConfiguration");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vivapartner";

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("   PHASE 8: VIVA CONFIGURATION TEST SUITE");
  console.log("==================================================");

  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected.");

    // Step 0: Ensure foundational records
    let teacher =
      (await User.findOne({ email: "phase8_teacher@vivapartner.local" })) ||
      (await User.findOne({ role: "teacher" }));

    if (!teacher) {
      teacher = await User.create({
        name: "Phase 8 Teacher",
        email: "phase8_teacher@vivapartner.local",
        password: "Password123!",
        role: "teacher",
        isActive: true,
      });
    }

    let department = await Department.findOne();
    if (!department) {
      department = await Department.create({
        name: "Phase 8 Computer Engineering",
        code: "P8CE",
        status: "Active",
      });
    }

    let targetClass = await Class.findOne();
    if (!targetClass) {
      targetClass = await Class.create({
        name: "P8 Class A",
        department: department._id,
        semester: "6",
        academicYear: "2025-2026",
        status: "Active",
      });
    }

    let subject = await Subject.findOne();
    if (!subject) {
      subject = await Subject.create({
        name: "Phase 8 AI Systems",
        code: "P8AI",
        department: department._id,
        semester: "6",
        status: "Active",
      });
    }

    let assignment = await Assignment.findOne({ teacher: teacher._id, class: targetClass._id });
    if (!assignment) {
      assignment = await Assignment.create({
        teacher: teacher._id,
        class: targetClass._id,
        department: department._id,
        subject: subject._id,
        status: "Active",
      });
    }

    // Create 2 test students
    const s1 = await Student.create({
      name: "Config Student 1",
      enrollment: "P8STU001",
      department: department._id,
      semester: "6",
      classId: targetClass._id.toString(),
      class: targetClass._id,
    });

    const s2 = await Student.create({
      name: "Config Student 2",
      enrollment: "P8STU002",
      department: department._id,
      semester: "6",
      classId: targetClass._id.toString(),
      class: targetClass._id,
    });

    console.log("\n--- TEST 1: Option A (Specific Students) Configuration ---");
    const configA = await VivaConfiguration.create({
      teacher: teacher._id,
      assignment: assignment._id,
      class: targetClass._id,
      selectedStudents: [s1._id],
      students: [s1._id],
      studentSelectionMode: "selected",
      studentsPerViva: 1,
      numberOfQuestions: 10,
      difficulty: "Hard",
      questionType: "Conceptual",
      timeLimit: 15,
      timeType: "perStudent",
      totalMarks: 30,
      language: "English",
      rules: {
        randomQuestions: true,
        noRepeatedQuestions: true,
        allowSkip: false,
        followUpQuestions: true,
        hintMode: false,
        autoSave: true,
      },
      aiSettings: {
        voice: "Male",
        speechSpeed: "Fast",
        personality: "Strict",
      },
      status: "Saved",
    });

    assert(configA !== null, "Config A created successfully");
    assert(configA.studentSelectionMode === "selected", "Selection mode is 'selected'");
    assert(configA.selectedStudents.length === 1, "Selected students has 1 student");
    assert(configA.selectedStudents[0].toString() === s1._id.toString(), "Selected student matches s1");
    assert(configA.difficulty === "Hard", "Difficulty is Hard");
    assert(configA.questionType === "Conceptual", "Question type is Conceptual");
    assert(configA.timeLimit === 15, "Time limit is 15");
    assert(configA.totalMarks === 30, "Total marks is 30");
    assert(configA.aiSettings.voice === "Male", "AI voice is Male");
    assert(configA.aiSettings.personality === "Strict", "AI personality is Strict");

    console.log("\n--- TEST 2: Controller Upsert Functionality ---");
    const { createConfiguration } = require("../controllers/vivaConfigurationController");

    // Mock Express req/res for updating existing configuration (upsert) to Option B (Entire class)
    let updatedResponse = null;
    let statusCode = 200;
    const reqUpsert = {
      user: teacher,
      body: {
        assignmentId: assignment._id.toString(),
        classId: targetClass._id.toString(),
        studentSelectionMode: "all",
        selectedStudents: [],
        studentsPerViva: 2,
        numberOfQuestions: 5,
        difficulty: "Medium",
        questionType: "Mixed",
        timeLimit: 10,
        totalMarks: 20,
        language: "English",
        rules: { randomQuestions: true },
        aiSettings: { voice: "Female", speechSpeed: "Normal", personality: "Professional" },
      },
    };

    const resUpsert = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            updatedResponse = data;
          },
        };
      },
    };

    await createConfiguration(reqUpsert, resUpsert);
    assert(statusCode === 200, "Upsert returned HTTP 200 (not 409 conflict)");
    assert(updatedResponse?.success === true, "Upsert succeeded");
    assert(updatedResponse?.configuration?.studentSelectionMode === "all", "Selection mode changed to 'all'");
    assert(updatedResponse?.configuration?.numberOfQuestions === 5, "Number of questions updated to 5");
    assert(updatedResponse?.configuration?.difficulty === "Medium", "Difficulty updated to Medium");

    console.log("\n--- TEST 3: Validation & Error Rejections ---");
    // Test 3a: Missing assignment
    let invalidCode = 0;
    let invalidResp = null;
    const resValidation = {
      status: (code) => {
        invalidCode = code;
        return {
          json: (data) => {
            invalidResp = data;
          },
        };
      },
    };

    await createConfiguration({ user: teacher, body: { classId: targetClass._id.toString() } }, resValidation);
    assert(invalidCode === 400, "Rejected missing assignment with 400");
    assert(invalidResp?.success === false, "Error response received");

    // Test 3b: Option A with no selected students
    await createConfiguration(
      {
        user: teacher,
        body: {
          assignmentId: assignment._id.toString(),
          classId: targetClass._id.toString(),
          studentSelectionMode: "selected",
          selectedStudents: [],
        },
      },
      resValidation
    );
    assert(invalidCode === 400, "Rejected empty students in 'selected' mode with 400");

    // Test 3c: Invalid numberOfQuestions (< 1)
    await createConfiguration(
      {
        user: teacher,
        body: {
          assignmentId: assignment._id.toString(),
          classId: targetClass._id.toString(),
          studentSelectionMode: "all",
          numberOfQuestions: 0,
        },
      },
      resValidation
    );
    assert(invalidCode === 400, "Rejected numberOfQuestions < 1 with 400");

    // Test 3d: Invalid totalMarks (< 1)
    await createConfiguration(
      {
        user: teacher,
        body: {
          assignmentId: assignment._id.toString(),
          classId: targetClass._id.toString(),
          studentSelectionMode: "all",
          totalMarks: 0,
        },
      },
      resValidation
    );
    assert(invalidCode === 400, "Rejected totalMarks < 1 with 400");

    console.log("\n--- TEST 4: Get Configuration API with Population ---");
    const { getConfiguration } = require("../controllers/vivaConfigurationController");
    let getResp = null;
    let getCode = 0;
    const resGet = {
      status: (code) => {
        getCode = code;
        return {
          json: (data) => {
            getResp = data;
          },
        };
      },
    };

    await getConfiguration({ params: { id: configA._id.toString() } }, resGet);
    assert(getCode === 200, "Get configuration returned 200");
    assert(getResp?.success === true, "Fetch successful");
    assert(getResp?.configuration?.assignment?._id !== undefined, "Assignment populated");
    assert(getResp?.configuration?.class?._id !== undefined, "Class populated");

    // Cleanup
    await VivaConfiguration.deleteMany({ assignment: assignment._id });
    await Student.deleteMany({ _id: { $in: [s1._id, s2._id] } });
    console.log("\nCleaned up Phase 8 test records.");

    console.log("==================================================");
    console.log(`   PHASE 8 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
    console.log("==================================================");

    await mongoose.disconnect();
    process.exit(failCount > 0 ? 1 : 0);
  } catch (error) {
    console.error("Test Suite Crash:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
