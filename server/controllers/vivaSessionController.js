const crypto = require("crypto");
const mongoose = require("mongoose");

const VivaSession = require("../models/VivaSession");
const VivaConfiguration = require("../models/VivaConfiguration");
const Question = require("../models/Question");
const Student = require("../models/Student");
const Assignment = require("../models/Assignment");
// ======================================================
// Generate Unique Session ID
// ======================================================

const generateSessionId = () => {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
};

// ======================================================
// Get Teacher ID From Authenticated User
// ======================================================

const getTeacherId = (req) => {
  return (
    req.user?._id ||
    req.user?.id ||
    req.teacher?._id ||
    req.teacher?.id ||
    null
  );
};

// ======================================================
// Normalize Questions
// ======================================================

const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .map((item) => {
      if (!item) {
        return null;
      }

      const questionText =
        typeof item === "string"
          ? item
          : item.question;

      if (
        !questionText ||
        typeof questionText !== "string" ||
        !questionText.trim()
      ) {
        return null;
      }

      let questionId = null;

      if (
        item.questionId &&
        mongoose.Types.ObjectId.isValid(item.questionId)
      ) {
        questionId = item.questionId;
      } else if (
        item._id &&
        mongoose.Types.ObjectId.isValid(item._id)
      ) {
        questionId = item._id;
      }

      return {
        questionId,
        question: questionText.trim(),
        difficulty:
          item.difficulty || "Medium",
      };
    })
    .filter(Boolean);
};

// ======================================================
// Create Viva Session
// POST /api/viva-sessions
// ======================================================

const createVivaSession = async (req, res) => {
  try {
    const teacherId = getTeacherId(req);

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Teacher authentication is required.",
      });
    }

    const {
      vivaConfigurationId,
      assignment,
      classId,
      department,
      subject,
      questions,
      studentsPerViva,
      selectedStudents,
      studentSelectionMode,
      numberOfQuestions,
      difficulty,
      questionType,
      timeLimit,
      timeMode,
      totalMarks,
      language,
      rules,
      aiSettings,
    } = req.body;

    // ==================================================
    // Basic Validation
    // ==================================================

    if (
      !assignment ||
      !mongoose.Types.ObjectId.isValid(assignment)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid assignment is required.",
      });
    }

    // Auto-resolve missing class, department, or subject from Assignment
    let resolvedClassId = classId;
    let resolvedDepartment = department;
    let resolvedSubject = subject;

    if (!resolvedClassId || !resolvedDepartment || !resolvedSubject) {
      const assignmentDoc = await Assignment.findById(assignment);
      if (!assignmentDoc) {
        return res.status(404).json({
          success: false,
          message: "Assignment record not found.",
        });
      }
      resolvedClassId = resolvedClassId || assignmentDoc.class;
      resolvedDepartment = resolvedDepartment || assignmentDoc.department;
      resolvedSubject = resolvedSubject || assignmentDoc.subject;
    }

    if (!resolvedClassId || !mongoose.Types.ObjectId.isValid(resolvedClassId)) {
      return res.status(400).json({
        success: false,
        message: "A valid class is required.",
      });
    }

    if (!resolvedDepartment || !mongoose.Types.ObjectId.isValid(resolvedDepartment)) {
      return res.status(400).json({
        success: false,
        message: "A valid department is required.",
      });
    }

    if (!resolvedSubject || !mongoose.Types.ObjectId.isValid(resolvedSubject)) {
      return res.status(400).json({
        success: false,
        message: "A valid subject is required.",
      });
    }

    // ==================================================
    // Load Existing Configuration
    // ==================================================

    let configuration = null;

    if (
      vivaConfigurationId &&
      mongoose.Types.ObjectId.isValid(
        vivaConfigurationId
      )
    ) {
      configuration =
        await VivaConfiguration.findById(
          vivaConfigurationId
        );

      if (!configuration) {
        return res.status(404).json({
          success: false,
          message: "Viva configuration not found.",
        });
      }

      // Make sure teacher cannot use somebody else's config
      if (
        configuration.teacher &&
        configuration.teacher.toString() !==
          teacherId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to use this viva configuration.",
        });
      }
    }

    // ==================================================
    // Questions
    // ==================================================

    let sessionQuestions = normalizeQuestions(
      questions
    );

    /*
      If question IDs are provided instead of full
      question objects, load the questions from DB.
    */

    if (
      sessionQuestions.length === 0 &&
      Array.isArray(req.body.questionIds) &&
      req.body.questionIds.length > 0
    ) {
      const validIds =
        req.body.questionIds.filter((id) =>
          mongoose.Types.ObjectId.isValid(id)
        );

      if (validIds.length > 0) {
        const dbQuestions = await Question.find({
          _id: { $in: validIds },
        }).lean();

        sessionQuestions = normalizeQuestions(
          dbQuestions
        );
      }
    }

    if (sessionQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No generated questions were provided. Please generate questions before creating the viva session.",
      });
    }

    // ==================================================
    // Generate Unique Session ID
    // ==================================================

    let sessionId;
    let exists = true;

    while (exists) {
      sessionId = generateSessionId();

      exists = await VivaSession.exists({
        sessionId,
      });
    }

    // ==================================================
    // Use Configuration Defaults When Available
    // ==================================================

    const finalStudentsPerViva =
      studentsPerViva ??
      configuration?.studentsPerViva ??
      1;

    const finalNumberOfQuestions =
      numberOfQuestions ??
      configuration?.numberOfQuestions ??
      sessionQuestions.length;

    const finalDifficulty =
      difficulty ??
      configuration?.difficulty ??
      "Medium";

    const finalQuestionType =
      questionType ??
      configuration?.questionType ??
      "Mixed";

    const finalTimeLimit =
      timeLimit ??
      configuration?.timeLimit ??
      5;

    const finalTimeMode =
      timeMode ??
      configuration?.timeType ??
      "perStudent";

    const finalTotalMarks =
      totalMarks ??
      configuration?.totalMarks ??
      20;

    const finalLanguage =
      language ??
      configuration?.language ??
      "English";

    const finalRules =
      rules ||
      configuration?.rules || {
        randomQuestions: true,
        noRepeatedQuestions: true,
        allowSkip: true,
        followUpQuestions: false,
        hintMode: false,
        autoSave: true,
      };

    const finalAISettings =
      aiSettings ||
      configuration?.aiSettings || {
        voice: "Female",
        speechSpeed: "Normal",
        personality: "Professional",
      };

    // ==================================================
    // Create Session
    // ==================================================

    const vivaSession =
      await VivaSession.create({
        sessionId,

        teacher: teacherId,

        assignment,

        class: resolvedClassId,

        department: resolvedDepartment,

        subject: resolvedSubject,

        vivaConfiguration:
          configuration?._id || null,

        questions: sessionQuestions,

        studentsPerViva:
          finalStudentsPerViva,

        selectedStudents:
          Array.isArray(selectedStudents)
            ? selectedStudents
            : [],

        studentSelectionMode:
          studentSelectionMode || "all",

        numberOfQuestions:
          finalNumberOfQuestions,

        difficulty:
          finalDifficulty,

        questionType:
          finalQuestionType,

        timeLimit:
          finalTimeLimit,

        timeMode:
          finalTimeMode,

        totalMarks:
          finalTotalMarks,

        language:
          finalLanguage,

        rules:
          finalRules,

        aiSettings:
          finalAISettings,

        status: "Configured",
      });

    // ==================================================
    // Update Configuration Status
    // ==================================================

    if (configuration) {
      configuration.status = "Active";
      await configuration.save();
    }

    // ==================================================
    // Response
    // ==================================================

    return res.status(201).json({
      success: true,
      message:
        "Viva session created successfully.",

      session: {
        id: vivaSession._id,
        sessionId: vivaSession.sessionId,
        status: vivaSession.status,
        totalQuestions:
          vivaSession.questions.length,
        numberOfQuestions:
          vivaSession.numberOfQuestions,
        difficulty:
          vivaSession.difficulty,
        language:
          vivaSession.language,
      },
    });
  } catch (error) {
    console.error(
      "Create Viva Session Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create viva session.",
      error: error.message,
    });
  }
};

// ======================================================
// Get Single Viva Session
// GET /api/viva-sessions/:sessionId
// ======================================================

const getVivaSession = async (req, res) => {
  try {
    const teacherId = getTeacherId(req);
    const { sessionId } = req.params;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const session =
      await VivaSession.findOne({
        sessionId,
        teacher: teacherId,
      })
        .populate("class")
        .populate("subject")
        .populate("department");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Viva session not found.",
      });
    }

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error(
      "Get Viva Session Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch viva session.",
      error: error.message,
    });
  }
};

// ======================================================
// Get All Viva Sessions for Teacher (Phase 14)
// GET /api/viva-sessions
// ======================================================

const getTeacherVivaSessions = async (req, res) => {
  try {
    const teacherId = getTeacherId(req);

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const sessions = await VivaSession.find({ teacher: teacherId })
      .populate("class", "name className")
      .populate("subject", "name subjectName")
      .populate("department", "name departmentName")
      .sort({ createdAt: -1 })
      .lean();

    const VivaAttempt = require("../models/VivaAttempt");

    const sessionList = await Promise.all(
      sessions.map(async (sess) => {
        const attempts = await VivaAttempt.find({ vivaSession: sess._id }).lean();
        const completedAttempts = attempts.filter((a) => a.status === "Completed");
        const evaluatedAttempts = completedAttempts.filter((a) => a.evaluated);

        let avgMarks = 0;
        if (evaluatedAttempts.length > 0) {
          const sum = evaluatedAttempts.reduce((acc, curr) => acc + (curr.totalMarks || 0), 0);
          avgMarks = Math.round((sum / evaluatedAttempts.length) * 10) / 10;
        }

        return {
          _id: sess._id,
          sessionId: sess.sessionId,
          topic: sess.topic || "Viva Session",
          class: sess.class?.name || sess.class?.className || "—",
          subject: sess.subject?.name || sess.subject?.subjectName || "—",
          department: sess.department?.name || sess.department?.departmentName || "—",
          numberOfQuestions: sess.numberOfQuestions || sess.questions?.length || 0,
          totalMarks: sess.totalMarks || 20,
          difficulty: sess.difficulty || "Medium",
          status: sess.status,
          totalAttempts: attempts.length,
          completedCount: completedAttempts.length,
          averageMarks: avgMarks,
          createdAt: sess.createdAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      sessions: sessionList,
    });
  } catch (error) {
    console.error("Get Teacher Viva Sessions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch teacher viva sessions.",
      error: error.message,
    });
  }
};

// ======================================================
// Get Detailed Session Analytics for Teacher (Phase 14)
// GET /api/viva-sessions/:sessionId/analytics
// ======================================================

const getSessionAnalytics = async (req, res) => {
  try {
    const teacherId = getTeacherId(req);
    const { sessionId } = req.params;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const session = await VivaSession.findOne({
      sessionId: sessionId.trim(),
      teacher: teacherId,
    })
      .populate("class")
      .populate("subject")
      .populate("department")
      .lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Viva session not found.",
      });
    }

    const VivaAttempt = require("../models/VivaAttempt");
    const Student = require("../models/Student");

    // Resolve eligible students (Option A vs Option B)
    let eligibleStudents = [];
    if (session.studentSelectionMode === "selected" && Array.isArray(session.selectedStudents) && session.selectedStudents.length > 0) {
      eligibleStudents = await Student.find({
        _id: { $in: session.selectedStudents },
      }).lean();
    } else if (session.class) {
      const classIdStr = session.class._id ? session.class._id.toString() : session.class.toString();
      eligibleStudents = await Student.find({
        $or: [
          { class: session.class._id || session.class },
          { classId: classIdStr },
        ],
      }).lean();
    }

    // Fetch all attempts for this session
    const attempts = await VivaAttempt.find({
      vivaSession: session._id,
    })
      .populate("student")
      .lean();

    const attemptByStudentId = new Map();
    const attemptByEnrollment = new Map();

    attempts.forEach((att) => {
      if (att.student && att.student._id) {
        attemptByStudentId.set(att.student._id.toString(), att);
        const enr = att.student.enrollmentNumber || att.student.enrollment;
        if (enr) attemptByEnrollment.set(enr.trim().toLowerCase(), att);
      }
    });

    const completedAttempts = attempts.filter((a) => a.status === "Completed");
    const evaluatedAttempts = completedAttempts.filter((a) => a.evaluated);

    let highestMarks = 0;
    let lowestMarks = session.totalMarks || 20;
    let totalMarksSum = 0;

    if (evaluatedAttempts.length > 0) {
      evaluatedAttempts.forEach((a) => {
        const m = a.totalMarks || 0;
        totalMarksSum += m;
        if (m > highestMarks) highestMarks = m;
        if (m < lowestMarks) lowestMarks = m;
      });
    } else {
      lowestMarks = 0;
    }

    const avgMarks = evaluatedAttempts.length > 0
      ? Math.round((totalMarksSum / evaluatedAttempts.length) * 10) / 10
      : 0;

    // Build per-student records
    const studentResults = eligibleStudents.map((st) => {
      const stId = st._id.toString();
      const stEnr = (st.enrollmentNumber || st.enrollment || "").trim().toLowerCase();
      const att = attemptByStudentId.get(stId) || attemptByEnrollment.get(stEnr) || null;

      const isCompleted = att?.status === "Completed";
      const isEvaluated = Boolean(att?.evaluated);
      const studentMarks = isEvaluated ? att.totalMarks : (st.marks || 0);
      const maxMarks = session.totalMarks || 20;
      const percentage = isEvaluated ? Math.round((studentMarks / maxMarks) * 100) : null;

      return {
        studentId: st._id,
        name: st.name || st.studentName || "—",
        enrollmentNumber: st.enrollmentNumber || st.enrollment || "—",
        email: st.email || "",
        vivaStatus: isCompleted ? "Completed" : "Pending",
        attemptStatus: att?.status || "NotStarted",
        evaluated: isEvaluated,
        marks: isEvaluated ? studentMarks : null,
        maxMarks,
        percentage,
        completedAt: att?.completedAt || null,
        answers: att?.answers || [],
      };
    });

    return res.status(200).json({
      success: true,
      session: {
        _id: session._id,
        sessionId: session.sessionId,
        topic: session.topic || "Viva Session",
        class: session.class?.name || session.class?.className || "—",
        subject: session.subject?.name || session.subject?.subjectName || "—",
        department: session.department?.name || session.department?.departmentName || "—",
        totalMarks: session.totalMarks || 20,
        numberOfQuestions: session.numberOfQuestions || session.questions?.length || 0,
        difficulty: session.difficulty || "Medium",
        status: session.status,
        createdAt: session.createdAt,
      },
      metrics: {
        totalStudents: eligibleStudents.length,
        completedCount: completedAttempts.length,
        pendingCount: Math.max(0, eligibleStudents.length - completedAttempts.length),
        evaluatedCount: evaluatedAttempts.length,
        averageMarks: avgMarks,
        highestMarks,
        lowestMarks,
      },
      students: studentResults,
    });
  } catch (error) {
    console.error("Get Session Analytics Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch session analytics.",
      error: error.message,
    });
  }
};

// ======================================================
// Generate / Get Student Viva Link
// GET /api/viva-sessions/:sessionId/share-link
// ======================================================

const getStudentVivaLink = async (req, res) => {
  try {
    const teacherId = getTeacherId(req);
    const { sessionId } = req.params;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    if (!sessionId || !sessionId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Viva session ID is required.",
      });
    }

    const session = await VivaSession.findOne({
      sessionId: sessionId.trim(),
      teacher: teacherId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Viva session not found.",
      });
    }

    if (
      session.status === "Completed" ||
      session.status === "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This viva session is no longer available.",
      });
    }

    /*
     * The frontend URL is configurable.
     *
     * For local development:
     * CLIENT_URL=http://localhost:5173
     *
     * Later in production:
     * CLIENT_URL=https://your-domain.com
     */

    const clientUrl = (
      process.env.CLIENT_URL ||
      "http://localhost:5173"
    ).replace(/\/+$/, "");

    const studentVivaLink =
      `${clientUrl}/viva/${encodeURIComponent(
        session.sessionId
      )}`;

    return res.status(200).json({
      success: true,

      session: {
        id: session._id,
        sessionId: session.sessionId,
        status: session.status,
      },

      link: studentVivaLink,
    });
  } catch (error) {
    console.error(
      "Get Student Viva Link Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate student viva link.",
      error: error.message,
    });
  }
};
// ======================================================
// Student Join / Verify
// POST /api/viva-sessions/:sessionId/join
// ======================================================

const joinVivaSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { enrollmentNumber, studentName } = req.body;

    // --------------------------------------------------
    // Basic validation
    // --------------------------------------------------

    if (!sessionId || !sessionId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Viva session ID is required.",
      });
    }

    if (
      !enrollmentNumber ||
      !enrollmentNumber.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Enrollment number is required.",
      });
    }

    // --------------------------------------------------
    // Find Viva Session
    // --------------------------------------------------

    const session = await VivaSession.findOne({
      sessionId: sessionId.trim(),
    }).populate("class");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Viva session not found.",
      });
    }

    // --------------------------------------------------
    // Session status check
    // --------------------------------------------------

    if (
      session.status === "Completed" ||
      session.status === "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This viva session is no longer available.",
      });
    }

    // --------------------------------------------------
    // Find Student
    // --------------------------------------------------

    const Student = require("../models/Student");

    const cleanEnrollment =
      enrollmentNumber.trim();

    const student = await Student.findOne({
      $or: [
        { enrollment: cleanEnrollment },
        { enrollmentNumber: cleanEnrollment },
        { enrollmentNo: cleanEnrollment },
      ],
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student not found. Please check your enrollment number.",
      });
    }

    // --------------------------------------------------
    // Verify Student belongs to session
    // --------------------------------------------------

    let studentAllowed = false;

    // Case 1:
    // Session explicitly contains selected students

    if (
      Array.isArray(session.selectedStudents) &&
      session.selectedStudents.length > 0
    ) {
      studentAllowed =
        session.selectedStudents.some(
          (id) =>
            id.toString() ===
            student._id.toString()
        );
    }

    // Case 2:
    // Session allows all students
    else if (
      session.studentSelectionMode === "all"
    ) {
      studentAllowed = true;
    }

    if (!studentAllowed) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to participate in this viva.",
      });
    }

    // --------------------------------------------------
    // Optional name verification
    // --------------------------------------------------

    if (
      studentName &&
      studentName.trim() &&
      student.name
    ) {
      const enteredName =
        studentName.trim().toLowerCase();

      const actualName =
        student.name.trim().toLowerCase();

      if (enteredName !== actualName) {
        return res.status(403).json({
          success: false,
          message:
            "Student name does not match the enrollment number.",
        });
      }
    }

    // --------------------------------------------------
    // IMPORTANT
    //
    // Do NOT send marks/questions/answers here.
    // Student should only receive safe session data.
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Student verified successfully.",

      student: {
        id: student._id,
        enrollmentNumber:
          student.enrollmentNumber,
        name: student.name,
      },

      session: {
        sessionId: session.sessionId,
        status: session.status,
        studentsPerViva:
          session.studentsPerViva,
        numberOfQuestions:
          session.numberOfQuestions,
        difficulty: session.difficulty,
        questionType:
          session.questionType,
        timeLimit: session.timeLimit,
        timeMode: session.timeMode,
        language: session.language,
      },
    });
  } catch (error) {
    console.error(
      "Student Join Viva Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to join viva session.",
      error: error.message,
    });
  }
};

// ======================================================
// Start Viva Session
// POST /api/viva-sessions/:sessionId/start
// ======================================================

const startVivaSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || !sessionId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Viva session ID is required.",
      });
    }

    const VivaSession = require("../models/VivaSession");

    const session = await VivaSession.findOne({
      sessionId: sessionId.trim(),
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Viva session not found.",
      });
    }

    // --------------------------------------------------
    // Cannot start cancelled/completed session
    // --------------------------------------------------

    if (session.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "This viva session has been cancelled.",
      });
    }

    if (session.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "This viva session has already been completed.",
      });
    }

    // --------------------------------------------------
    // Start session only once
    // --------------------------------------------------

    if (session.status !== "Active") {
      session.status = "Active";

      if (!session.startedAt) {
        session.startedAt = new Date();
      }

      await session.save();
    }

    // --------------------------------------------------
    // IMPORTANT:
    // Do NOT return questions or marks here.
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Viva is ready to start.",

      session: {
        sessionId: session.sessionId,
        status: session.status,
        numberOfQuestions: session.numberOfQuestions,
        difficulty: session.difficulty,
        questionType: session.questionType,
        timeLimit: session.timeLimit,
        timeMode: session.timeMode,
        language: session.language,
        studentsPerViva: session.studentsPerViva,
        rules: session.rules,
        aiSettings: session.aiSettings,
      },
    });
  } catch (error) {
    console.error(
      "Start Viva Session Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to start viva session.",
      error: error.message,
    });
  }
};
// ======================================================
// Get Next Viva Question
// GET /api/viva-sessions/:sessionId/question/:questionNumber
// ======================================================

const getNextVivaQuestion = async (req, res) => {
  try {
    const { sessionId, questionNumber } = req.params;

    const number = Number(questionNumber);

    if (!sessionId || !sessionId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Viva session ID is required.",
      });
    }

    if (!Number.isInteger(number) || number < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid question number.",
      });
    }

    const VivaSession = require("../models/VivaSession");

    const session = await VivaSession.findOne({
      sessionId: sessionId.trim(),
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Viva session not found.",
      });
    }

    if (session.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "This viva session has been cancelled.",
      });
    }

    if (session.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "This viva session has already completed.",
      });
    }

    if (session.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Viva session is not active.",
      });
    }

    if (number > session.numberOfQuestions) {
      return res.status(400).json({
        success: false,
        message: "No more questions are available.",
      });
    }

    // --------------------------------------------------
    // Find generated questions
    // --------------------------------------------------

    const Question = require("../models/Question");

    const questionDocuments = await Question.find({
      vivaSession: session._id,
    }).sort({
      createdAt: 1,
    });

    if (
      !questionDocuments ||
      questionDocuments.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "No generated questions found for this viva.",
      });
    }

    if (number > questionDocuments.length) {
      return res.status(400).json({
        success: false,
        message:
          "Requested question is not available.",
      });
    }

    const selectedQuestion =
      questionDocuments[number - 1];

    // --------------------------------------------------
    // IMPORTANT
    //
    // Only send the current question.
    // Never send answer/marks/evaluation.
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      question: {
        id: selectedQuestion._id,
        questionNumber: number,
        totalQuestions: session.numberOfQuestions,
        question:
          selectedQuestion.question,
        difficulty:
          selectedQuestion.difficulty,
      },
    });
  } catch (error) {
    console.error(
      "Get Viva Question Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load viva question.",
      error: error.message,
    });
  }
};

// =====================================================
// GET PUBLIC VIVA SESSION
// =====================================================

const getPublicVivaSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Viva session ID is required.",
      });
    }

    const session = await VivaSession.findOne({
      sessionId,
    })
      .populate("subject")
      .populate("class")
      .populate("department");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Viva session not found.",
      });
    }

    if (
      session.status === "Completed" ||
      session.status === "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "This Viva session is no longer available.",
      });
    }

    return res.status(200).json({
      success: true,

      session: {
        sessionId: session.sessionId,

        subject: session.subject,

        class: session.class,

        department: session.department,

        studentsPerViva:
          session.studentsPerViva,

        numberOfQuestions:
          session.numberOfQuestions,

        difficulty: session.difficulty,

        questionType:
          session.questionType,

        timeLimit:
          session.timeLimit,

        timeMode:
          session.timeMode,

        language:
          session.language,

        rules:
          session.rules,

        aiSettings:
          session.aiSettings,

        status:
          session.status,
      },
    });
  } catch (error) {
    console.error(
      "getPublicVivaSession Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load Viva session.",
    });
  }
};

// =====================================================
// START PUBLIC VIVA
// =====================================================

const startPublicViva = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const {
      studentName,
      enrollmentNo,
    } = req.body;

    if (!studentName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Student name is required.",
      });
    }

    if (!enrollmentNo?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Enrollment number is required.",
      });
    }

    const session =
      await VivaSession.findOne({
        sessionId,
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Viva session not found.",
      });
    }

    if (
      session.status === "Completed" ||
      session.status === "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This Viva session is closed.",
      });
    }

    // =================================================
    // Find Student
    // =================================================

    const cleanEnrollmentNo = String(enrollmentNo).trim();
    let student = await Student.findOne({
      $or: [
        { enrollment: cleanEnrollmentNo },
        { enrollmentNumber: cleanEnrollmentNo },
        { enrollmentNo: cleanEnrollmentNo },
      ],
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Enrollment number was not found in this Viva.",
      });
    }

    // =================================================
    // Verify Student Belongs To Class
    // =================================================

    const studentClass = student.class ? String(student.class) : String(student.classId || "");
    const sessionClass = String(session.class);

    if (
      studentClass &&
      sessionClass &&
      studentClass !== sessionClass
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This student does not belong to this Viva class.",
      });
    }

    // =================================================
    // Get Questions
    // =================================================

    const questions =
      await Question.find({
        vivaSession:
          session._id,
      }).lean();

    if (!questions.length) {
      return res.status(404).json({
        success: false,
        message:
          "No questions are available for this Viva.",
      });
    }

    // Never send evaluation/marks to student.
    const safeQuestions =
      questions.map((question) => ({
        _id: question._id,
        id:
          question.id ||
          question._id.toString(),

        question:
          question.question,

        difficulty:
          question.difficulty,
      }));

    return res.status(200).json({
      success: true,

      student: {
        name:
          student.name ||
          student.studentName ||
          studentName.trim(),

        enrollmentNo:
          enrollmentNo.trim(),
      },

      questions: safeQuestions,
    });
  } catch (error) {
    console.error(
      "startPublicViva Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to start Viva.",
    });
  }
};

// =====================================================
// SUBMIT PUBLIC VIVA ANSWER
// =====================================================

const submitPublicVivaAnswer = async (
  req,
  res
) => {
  try {
    const { sessionId } =
      req.params;

    const {
      enrollmentNo,
      questionId,
      question,
      answer,
      questionNumber,
    } = req.body;

    if (!enrollmentNo) {
      return res.status(400).json({
        success: false,
        message:
          "Enrollment number is required.",
      });
    }

    if (!answer?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Answer cannot be empty.",
      });
    }

    const session =
      await VivaSession.findOne({
        sessionId,
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Viva session not found.",
      });
    }

    // -------------------------------------------------
    // IMPORTANT
    // We intentionally store answer without sending
    // marks/evaluation back to the student.
    // -------------------------------------------------

    const answerData = {
      sessionId: session._id,

      studentEnrollmentNo:
        enrollmentNo.trim(),

      questionId:
        questionId || null,

      question:
        question || "",

      answer:
        answer.trim(),

      questionNumber:
        Number(questionNumber) || 0,

      submittedAt:
        new Date(),
    };

    /*
      Phase 10.5 stores the answer.

      Phase 10.6 will connect this to the
      permanent VivaAnswer model + AI evaluation.
    */

    console.log(
      "VIVA ANSWER RECEIVED:",
      answerData
    );

    return res.status(200).json({
      success: true,
      message:
        "Answer saved successfully.",
    });
  } catch (error) {
    console.error(
      "submitPublicVivaAnswer Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to save answer.",
    });
  }
};

// =====================================================
// COMPLETE PUBLIC VIVA
// =====================================================

const completePublicViva = async (
  req,
  res
) => {
  try {
    const { sessionId } =
      req.params;

    const {
      enrollmentNo,
    } = req.body;

    if (!enrollmentNo) {
      return res.status(400).json({
        success: false,
        message:
          "Enrollment number is required.",
      });
    }

    const session =
      await VivaSession.findOne({
        sessionId,
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Viva session not found.",
      });
    }

    console.log(
      `Viva completed: ${sessionId} / ${enrollmentNo}`
    );

    return res.status(200).json({
      success: true,
      message:
        "Viva completed successfully.",
    });
  } catch (error) {
    console.error(
      "completePublicViva Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to complete Viva.",
    });
  }
};

// ======================================================
// Teacher Trigger / Re-run AI Evaluation (Phase 13)
// POST /api/viva-sessions/:sessionId/evaluate
// ======================================================

const evaluateSessionAttempts = async (req, res) => {
  try {
    const teacherId = getTeacherId(req);
    const { sessionId } = req.params;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const session = await VivaSession.findOne({
      sessionId: sessionId.trim(),
      teacher: teacherId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Viva session not found.",
      });
    }

    const VivaAttempt = require("../models/VivaAttempt");
    const { evaluateVivaAttempt } = require("../services/aiEvaluationService");

    const attempts = await VivaAttempt.find({
      vivaSession: session._id,
      status: "Completed",
    });

    if (attempts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No completed attempts found to evaluate.",
        evaluatedCount: 0,
      });
    }

    const results = [];
    for (const attempt of attempts) {
      const evalResult = await evaluateVivaAttempt(attempt._id);
      results.push(evalResult);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully evaluated ${results.length} student attempt(s).`,
      evaluatedCount: results.length,
      evaluations: results,
    });
  } catch (error) {
    console.error("Evaluate Session Attempts Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to evaluate session attempts.",
      error: error.message,
    });
  }
};

module.exports = {
  createVivaSession,
  getVivaSession,
  getTeacherVivaSessions,
  getSessionAnalytics,
  getStudentVivaLink,
  joinVivaSession,
  startVivaSession,
  getNextVivaQuestion,
  getPublicVivaSession,
  startPublicViva,
  submitPublicVivaAnswer,
  completePublicViva,
  evaluateSessionAttempts,
};