const VivaAttempt = require("../models/VivaAttempt");
const VivaSession = require("../models/VivaSession");
const Student = require("../models/Student");
const { evaluateVivaAttempt } = require("../services/vivaEvaluationService");

// ======================================================
// Evaluate a single student's Viva attempt
// POST /api/results/evaluate/:attemptId
// ======================================================

const evaluateAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await VivaAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Viva attempt not found.",
      });
    }

    if (attempt.evaluated) {
      return res.status(200).json({
        success: true,
        message: "Attempt already evaluated.",
        attempt,
      });
    }

    const evaluated = await evaluateVivaAttempt(attemptId);

    return res.status(200).json({
      success: true,
      message: "Evaluation completed successfully.",
      attempt: evaluated,
    });
  } catch (error) {
    console.error("Evaluate Attempt Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to evaluate attempt.",
    });
  }
};

// ======================================================
// Get aggregated results for a Viva Session
// GET /api/results/viva/:sessionId
// ======================================================

const getVivaResults = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await VivaSession.findOne({ sessionId })
      .populate("class")
      .populate("subject")
      .populate("department");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Viva session not found.",
      });
    }

    const attempts = await VivaAttempt.find({
      vivaSession: session._id,
    }).populate("student");

    const completedAttempts = attempts.filter(
      (a) => a.status === "Completed"
    );

    const totalStudents = attempts.length;
    const completedStudents = completedAttempts.length;
    const pendingStudents = totalStudents - completedStudents;

    const marks = completedAttempts.map((a) => a.totalMarks || 0);
    const averageMarks =
      marks.length > 0
        ? Math.round(
            (marks.reduce((s, m) => s + m, 0) / marks.length) * 10
          ) / 10
        : 0;
    const highestMarks =
      marks.length > 0 ? Math.max(...marks) : 0;
    const lowestMarks =
      marks.length > 0 ? Math.min(...marks) : 0;

    const studentResults = attempts.map((attempt) => ({
      attemptId: attempt._id,
      studentId: attempt.student?._id,
      enrollment: attempt.student?.enrollment || "N/A",
      name: attempt.student?.name || "Unknown",
      totalMarks: attempt.totalMarks || 0,
      maxMarks: session.totalMarks || 20,
      percentage:
        session.totalMarks
          ? Math.round(
              ((attempt.totalMarks || 0) / session.totalMarks) * 100
            )
          : 0,
      status: attempt.status,
      evaluated: attempt.evaluated,
      completedAt: attempt.completedAt,
    }));

    return res.status(200).json({
      success: true,
      session: {
        sessionId: session.sessionId,
        className: session.class?.name || "",
        subjectName: session.subject?.name || "",
        departmentName: session.department?.name || "",
        totalMarks: session.totalMarks || 20,
        numberOfQuestions: session.numberOfQuestions || 5,
        difficulty: session.difficulty || "Medium",
        status: session.status,
        createdAt: session.createdAt,
      },
      summary: {
        totalStudents,
        completedStudents,
        pendingStudents,
        averageMarks,
        highestMarks,
        lowestMarks,
      },
      students: studentResults,
    });
  } catch (error) {
    console.error("Get Viva Results Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch viva results.",
    });
  }
};

// ======================================================
// Get individual student attempt details
// GET /api/results/student/:attemptId
// ======================================================

const getStudentResult = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await VivaAttempt.findById(attemptId).populate("student");
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Viva attempt not found.",
      });
    }

    const session = await VivaSession.findById(attempt.vivaSession)
      .populate("class")
      .populate("subject")
      .populate("department");

    return res.status(200).json({
      success: true,
      student: {
        name: attempt.student?.name || "Unknown",
        enrollment: attempt.student?.enrollment || "N/A",
      },
      session: {
        sessionId: session?.sessionId || "",
        className: session?.class?.name || "",
        subjectName: session?.subject?.name || "",
        departmentName: session?.department?.name || "",
        totalMarks: session?.totalMarks || 20,
        numberOfQuestions: session?.numberOfQuestions || 5,
        difficulty: session?.difficulty || "Medium",
      },
      attempt: {
        attemptId: attempt._id,
        status: attempt.status,
        evaluated: attempt.evaluated,
        totalMarks: attempt.totalMarks || 0,
        maxMarks: session?.totalMarks || 20,
        percentage: session?.totalMarks
          ? Math.round(((attempt.totalMarks || 0) / session.totalMarks) * 100)
          : 0,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        answers: attempt.answers.map((ans) => ({
          questionNumber: ans.questionNumber,
          question: ans.question,
          transcript: ans.transcript,
          score: ans.score || 0,
          maxScore: ans.maxScore || 0,
          status: ans.status || "NO_ANSWER",
          feedback: ans.feedback || "",
          matchedConcepts: ans.matchedConcepts || [],
          missingConcepts: ans.missingConcepts || [],
        })),
      },
    });
  } catch (error) {
    console.error("Get Student Result Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch student result.",
    });
  }
};

// ======================================================
// List all Viva sessions for the teacher
// GET /api/results/teacher/vivas
// ======================================================

const getTeacherVivas = async (req, res) => {
  try {
    const teacherId = req.user?._id || req.user?.id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const sessions = await VivaSession.find({ teacher: teacherId })
      .populate("class")
      .populate("subject")
      .populate("department")
      .sort({ createdAt: -1 });

    const results = [];

    for (const session of sessions) {
      const attempts = await VivaAttempt.find({
        vivaSession: session._id,
      });

      const completedAttempts = attempts.filter(
        (a) => a.status === "Completed"
      );
      const marks = completedAttempts.map((a) => a.totalMarks || 0);

      results.push({
        sessionId: session.sessionId,
        sessionDbId: session._id,
        className: session.class?.name || "",
        subjectName: session.subject?.name || "",
        departmentName: session.department?.name || "",
        totalMarks: session.totalMarks || 20,
        numberOfQuestions: session.numberOfQuestions || 5,
        difficulty: session.difficulty || "Medium",
        status: session.status,
        createdAt: session.createdAt,
        totalStudents: attempts.length,
        completedStudents: completedAttempts.length,
        pendingStudents: attempts.length - completedAttempts.length,
        averageMarks:
          marks.length > 0
            ? Math.round(
                (marks.reduce((s, m) => s + m, 0) / marks.length) * 10
              ) / 10
            : 0,
        highestMarks: marks.length > 0 ? Math.max(...marks) : 0,
        lowestMarks: marks.length > 0 ? Math.min(...marks) : 0,
      });
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      vivas: results,
    });
  } catch (error) {
    console.error("Get Teacher Vivas Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch teacher vivas.",
    });
  }
};

// ======================================================
// Evaluate ALL unevaluated attempts for a Viva Session
// POST /api/results/evaluate-all/:sessionId
// ======================================================

const evaluateAllAttempts = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await VivaSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Viva session not found.",
      });
    }

    const attempts = await VivaAttempt.find({
      vivaSession: session._id,
      status: "Completed",
      evaluated: false,
    });

    if (attempts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No unevaluated attempts found.",
        evaluated: 0,
      });
    }

    let evaluatedCount = 0;
    const errors = [];

    for (const attempt of attempts) {
      try {
        await evaluateVivaAttempt(attempt._id);
        evaluatedCount++;
      } catch (err) {
        console.error(`Failed to evaluate attempt ${attempt._id}:`, err.message);
        errors.push({
          attemptId: attempt._id,
          error: err.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Evaluated ${evaluatedCount} of ${attempts.length} attempts.`,
      evaluated: evaluatedCount,
      total: attempts.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Evaluate All Attempts Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to evaluate attempts.",
    });
  }
};

module.exports = {
  evaluateAttempt,
  getVivaResults,
  getStudentResult,
  getTeacherVivas,
  evaluateAllAttempts,
};
