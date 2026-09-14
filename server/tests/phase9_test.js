const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User");
const Class = require("../models/Class");
const Department = require("../models/Department");
const Question = require("../models/Question");
const { generateQuestions } = require("../controllers/aiController");
const { saveQuestions } = require("../controllers/questionController");

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
  console.log("   PHASE 9: STUDY MATERIAL & AI QUESTIONS TEST SUITE");
  console.log("==================================================");

  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected.");

    // Foundational records
    let teacher = (await User.findOne({ role: "teacher" })) || (await User.findOne());
    let targetClass = await Class.findOne();

    console.log("\n--- TEST 1: Request Validation ---");
    let valCode = 0;
    let valResp = null;
    const resMock = {
      status: (c) => {
        valCode = c;
        return {
          json: (d) => {
            valResp = d;
          },
        };
      },
    };

    // 1a: Missing study content
    await generateQuestions({ body: { studyContent: "" } }, resMock);
    assert(valCode === 400, "Rejected empty study content with HTTP 400");
    assert(valResp?.success === false, "Error message returned for missing content");

    console.log("\n--- TEST 2: Material A Generation (Data Structures: Binary Trees) ---");
    let genCodeA = 0;
    let genRespA = null;
    const resA = {
      status: (c) => {
        genCodeA = c;
        return {
          json: (d) => {
            genRespA = d;
          },
        };
      },
    };

    const materialA = `
      Binary Search Trees (BST) are node-based binary tree data structures which have the following properties:
      The left subtree of a node contains only nodes with keys lesser than the node's key.
      The right subtree of a node contains only nodes with keys greater than the node's key.
      AVL Trees are self-balancing Binary Search Trees where the difference between heights of left and right subtrees cannot be more than one.
      Rotations in AVL trees include Left Rotation (LL), Right Rotation (RR), Left-Right Rotation (LR), and Right-Left Rotation (RL).
    `;

    await generateQuestions(
      {
        body: {
          studyContent: materialA,
          topic: "Binary Search Trees and AVL Trees",
          difficulty: "Medium",
          questionCount: 4,
        },
      },
      resA
    );

    assert(genCodeA === 200, "Material A question generation returned HTTP 200");
    assert(genRespA?.success === true, "Generation success is true");
    assert(Array.isArray(genRespA?.questions), "Questions is an array");
    assert(genRespA?.questions.length === 4, "Generated exactly 4 requested questions");

    // Verify all questions are strictly grounded in Material A
    const allQuestionsTextA = genRespA?.questions.map((q) => q.question).join(" ");
    const hasMaterialAConcepts =
      allQuestionsTextA.toLowerCase().includes("tree") ||
      allQuestionsTextA.toLowerCase().includes("avl") ||
      allQuestionsTextA.toLowerCase().includes("binary") ||
      allQuestionsTextA.toLowerCase().includes("rotation");

    assert(hasMaterialAConcepts, "Questions contain key concepts from Material A");

    console.log("\n--- TEST 3: Material B Generation & Strict Isolation (Cloud: Kubernetes) ---");
    let genCodeB = 0;
    let genRespB = null;
    const resB = {
      status: (c) => {
        genCodeB = c;
        return {
          json: (d) => {
            genRespB = d;
          },
        };
      },
    };

    const materialB = `
      Kubernetes is an open-source container orchestration system for automating software deployment, scaling, and management.
      Pods are the smallest deployable units of computing that you can create and manage in Kubernetes.
      A ReplicaSet's purpose is to maintain a stable set of replica Pods running at any given time.
      Deployments provide declarative updates for Pods and ReplicaSets.
      ConfigMaps and Secrets allow decoupling configuration artifacts from container image content.
    `;

    await generateQuestions(
      {
        body: {
          studyContent: materialB,
          topic: "Kubernetes Orchestration",
          difficulty: "Hard",
          questionCount: 5,
        },
      },
      resB
    );

    assert(genCodeB === 200, "Material B question generation returned HTTP 200");
    assert(genRespB?.questions.length === 5, "Generated exactly 5 requested questions");

    const allQuestionsTextB = genRespB?.questions.map((q) => q.question).join(" ");
    const hasMaterialBConcepts =
      allQuestionsTextB.toLowerCase().includes("kubernetes") ||
      allQuestionsTextB.toLowerCase().includes("pod") ||
      allQuestionsTextB.toLowerCase().includes("replicaset") ||
      allQuestionsTextB.toLowerCase().includes("deployment");

    assert(hasMaterialBConcepts, "Questions contain key concepts from Material B");

    // Zero cross-contamination test
    const hasContamination =
      allQuestionsTextB.toLowerCase().includes("tree") ||
      allQuestionsTextB.toLowerCase().includes("avl") ||
      allQuestionsTextB.toLowerCase().includes("binary search");

    assert(!hasContamination, "Strict Isolation: Material B questions have ZERO contamination from Material A");

    console.log("\n--- TEST 4: Saving Questions to DB (saveQuestions) ---");
    let saveCode = 0;
    let saveResp = null;
    const resSave = {
      status: (c) => {
        saveCode = c;
        return {
          json: (d) => {
            saveResp = d;
          },
        };
      },
    };

    await saveQuestions(
      {
        body: {
          teacher: teacher?._id,
          classId: targetClass?._id.toString(),
          topic: "Kubernetes Orchestration",
          difficulty: "Hard",
          questions: genRespB.questions,
        },
      },
      resSave
    );

    assert(saveCode === 201, "Saving questions returned HTTP 201 Created");
    assert(saveResp?.success === true, "Questions saved successfully");
    assert(saveResp?.data?._id !== undefined, "Question document created with ID");

    // Verify in MongoDB
    const savedDoc = await Question.findById(saveResp?.data?._id);
    assert(savedDoc !== null, "Found saved question document in MongoDB");
    assert(savedDoc.questions.length === 5, "Database record has all 5 questions");

    // Cleanup
    await Question.findByIdAndDelete(savedDoc._id);
    console.log("\nCleaned up Phase 9 test records.");

    console.log("==================================================");
    console.log(`   PHASE 9 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
    console.log("==================================================");

    await mongoose.disconnect();
    process.exit(failCount > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test crash:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
