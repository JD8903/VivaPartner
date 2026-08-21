const crypto = require("crypto");
const mongoose = require("mongoose");

const VivaSession = require("../models/VivaSession");
const VivaConfiguration = require("../models/VivaConfiguration");
const Question = require("../models/Question");
const Student = require("../models/Student");
const VivaAttempt = require("../models/VivaAttempt");
const {
  evaluateVivaAttempt,
} = require("../services/vivaEvaluationService");

// ======================================================
// Generate Unique Session ID
// ======================================================

const generateSessionId = () => {
  return crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();
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

const normalizeQuestions = (
  questions
) => {
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
        typeof questionText !==
          "string" ||
        !questionText.trim()
      ) {
        return null;
      }

      let questionId = null;

      if (
        item.questionId &&
        mongoose.Types.ObjectId.isValid(
          item.questionId
        )
      ) {
        questionId = item.questionId;
      } else if (
        item._id &&
        mongoose.Types.ObjectId.isValid(
          item._id
        )
      ) {
        questionId = item._id;
      }

      return {
        questionId,
        question:
          questionText.trim(),
        difficulty:
          item.difficulty ||
          "Medium",
      };
    })
    .filter(Boolean);
};

// ======================================================
// CREATE VIVA SESSION
// POST /api/viva-sessions
// ======================================================

const createVivaSession =
  async (req, res) => {
    try {
      const teacherId =
        getTeacherId(req);

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message:
            "Teacher authentication is required.",
        });
      }

      const {
        assignment,
        assignmentId,
        vivaConfigurationId,
        classId,
        department,
        subject,
        questions,
        questionIds,
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
      // ASSIGNMENT
      // ==================================================

      const finalAssignmentId =
        assignmentId || assignment;

      if (
        !finalAssignmentId ||
        !mongoose.Types.ObjectId.isValid(
          finalAssignmentId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid assignment is required.",
        });
      }

      // ==================================================
      // LOAD ASSIGNMENT
      // ==================================================

      const Assignment =
        require("../models/Assignment");

      const assignmentDocument =
        await Assignment.findOne({
          _id: finalAssignmentId,
          teacher: teacherId,
          status: "Active",
        }).lean();

      if (!assignmentDocument) {
        return res.status(404).json({
          success: false,
          message:
            "The selected assignment was not found or is not assigned to this teacher.",
        });
      }

      // ==================================================
      // GET CLASS / DEPARTMENT / SUBJECT
      // ==================================================

      const finalClassId =
        assignmentDocument.class ||
        classId;

      const finalDepartmentId =
        assignmentDocument.department ||
        department;

      const finalSubjectId =
        assignmentDocument.subject ||
        subject;

      // ==================================================
      // VALIDATE CLASS
      // ==================================================

      if (
        !finalClassId ||
        !mongoose.Types.ObjectId.isValid(
          finalClassId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The selected assignment does not contain a valid class.",
        });
      }

      // ==================================================
      // VALIDATE DEPARTMENT
      // ==================================================

      if (
        !finalDepartmentId ||
        !mongoose.Types.ObjectId.isValid(
          finalDepartmentId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The selected assignment does not contain a valid department.",
        });
      }

      // ==================================================
      // VALIDATE SUBJECT
      // ==================================================

      if (
        !finalSubjectId ||
        !mongoose.Types.ObjectId.isValid(
          finalSubjectId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The selected assignment does not contain a valid subject.",
        });
      }

      // ==================================================
      // LOAD CONFIGURATION
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
            message:
              "Viva configuration not found.",
          });
        }

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
      // QUESTIONS
      // ==================================================

      let sessionQuestions =
        normalizeQuestions(
          questions
        );

      if (
        sessionQuestions.length ===
          0 &&
        Array.isArray(questionIds) &&
        questionIds.length > 0
      ) {
        const validIds =
          questionIds.filter((id) =>
            mongoose.Types.ObjectId.isValid(
              id
            )
          );

        if (validIds.length > 0) {
          const dbQuestions =
            await Question.find({
              _id: {
                $in: validIds,
              },
            }).lean();

          sessionQuestions =
            normalizeQuestions(
              dbQuestions
            );
        }
      }

      if (
        sessionQuestions.length ===
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No generated questions were provided. Please generate questions before creating the viva session.",
        });
      }

      // ==================================================
      // UNIQUE SESSION ID
      // ==================================================

      let sessionId;
      let exists = true;

      while (exists) {
        sessionId =
          generateSessionId();

        exists =
          await VivaSession.exists({
            sessionId,
          });
      }

      // ==================================================
      // CONFIGURATION VALUES
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
          personality:
            "Professional",
        };

      // ==================================================
      // CREATE SESSION
      // ==================================================

      const session =
        await VivaSession.create({
          sessionId,

          teacher: teacherId,

          assignment:
            finalAssignmentId,

          class:
            finalClassId,

          department:
            finalDepartmentId,

          subject:
            finalSubjectId,

          vivaConfiguration:
            vivaConfigurationId ||
            null,

          questions:
            sessionQuestions,

          studentsPerViva:
            finalStudentsPerViva,

          selectedStudents:
            Array.isArray(
              selectedStudents
            )
              ? selectedStudents
              : [],

          studentSelectionMode:
            studentSelectionMode ||
            "all",

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

      return res.status(201).json({
        success: true,
        message:
          "Viva session created successfully.",

        session: {
          id: session._id,
          sessionId:
            session.sessionId,
          status:
            session.status,
        },
      });
    } catch (error) {
      console.error(
        "createVivaSession Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create Viva session.",
      });
    }
  };

// ======================================================
// GET VIVA SESSION
// Teacher only
// ======================================================

const getVivaSession =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      const teacherId =
        getTeacherId(req);

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message:
            "Teacher authentication is required.",
        });
      }

      const session =
        await VivaSession.findOne({
          sessionId,
          teacher: teacherId,
        });

      if (!session) {
        return res.status(404).json({
          success: false,
          message:
            "Viva session not found.",
        });
      }

      return res.status(200).json({
        success: true,
        session,
      });
    } catch (error) {
      console.error(
        "getVivaSession Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch Viva session.",
      });
    }
  };

// ======================================================
// GET STUDENT VIVA SHARE LINK
// ======================================================

const getStudentVivaLink =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      const teacherId =
        getTeacherId(req);

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message:
            "Teacher authentication is required.",
        });
      }

      const session =
        await VivaSession.findOne({
          sessionId,
          teacher: teacherId,
        });

      if (!session) {
        return res.status(404).json({
          success: false,
          message:
            "Viva session not found.",
        });
      }

      const baseUrl =
        process.env.CLIENT_URL ||
        "http://localhost:5173";

      const shareLink =
        `${baseUrl}/viva/${encodeURIComponent(
          session.sessionId
        )}`;

      return res.status(200).json({
        success: true,

        sessionId:
          session.sessionId,

        shareLink,
      });
    } catch (error) {
      console.error(
        "getStudentVivaLink Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to generate Viva link.",
      });
    }
  };

// ======================================================
// JOIN VIVA SESSION
// ======================================================

const joinVivaSession =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      const {
        enrollmentNumber,
        studentName,
      } = req.body || {};

      const cleanEnrollment =
        String(
          enrollmentNumber || ""
        ).trim();

      if (!cleanEnrollment) {
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
        session.status !==
        "Active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This Viva session is not active.",
        });
      }

      const student =
        await Student.findOne({
          $or: [
            {
              enrollmentNumber:
                cleanEnrollment,
            },
            {
              enrollmentNo:
                cleanEnrollment,
            },
            {
              enrollment:
                cleanEnrollment,
            },
          ],
        });

      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "Student not found. Please check your enrollment number.",
        });
      }

      if (
        student.class &&
        session.class &&
        String(
          student.class
        ) !==
          String(
            session.class
          )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This student does not belong to this Viva class.",
        });
      }

      if (
        session.studentSelectionMode ===
          "selected" &&
        Array.isArray(
          session.selectedStudents
        )
      ) {
        const allowed =
          session.selectedStudents.some(
            (studentId) =>
              String(studentId) ===
              String(student._id)
          );

        if (!allowed) {
          return res.status(403).json({
            success: false,
            message:
              "You are not selected for this Viva.",
          });
        }
      }

      let attempt =
        await VivaAttempt.findOne({
          vivaSession:
            session._id,
          student:
            student._id,
        });

      if (!attempt) {
        attempt =
          await VivaAttempt.create({
            vivaSession:
              session._id,

            student:
              student._id,

            status:
              "NotStarted",

            currentQuestionIndex:
              0,

            questionIdsAsked: [],

            answers: [],

            evaluated: false,

            totalMarks: 0,
          });
      }

      return res.status(200).json({
        success: true,

        message:
          "Student joined Viva successfully.",

        attempt: {
          attemptId:
            attempt._id,

          status:
            attempt.status,

          currentQuestionIndex:
            attempt.currentQuestionIndex,

          startedAt:
            attempt.startedAt,
        },

        student: {
          name:
            student.name ||
            student.studentName ||
            studentName ||
            "",

          enrollmentNumber:
            cleanEnrollment,
        },

        session: {
          sessionId:
            session.sessionId,

          language:
            session.language,

          numberOfQuestions:
            session.numberOfQuestions,

          timeLimit:
            session.timeLimit,

          timeMode:
            session.timeMode,

          aiSettings:
            session.aiSettings,
        },
      });
    } catch (error) {
      console.error(
        "joinVivaSession Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to join Viva.",
      });
    }
  };

// ======================================================
// START VIVA SESSION
// ======================================================

const startVivaSession =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      const {
        attemptId,
      } = req.body || {};

      if (
        !attemptId ||
        !mongoose.Types.ObjectId.isValid(
          attemptId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid attempt ID is required.",
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
        session.status ===
        "Configured"
      ) {
        session.status =
          "Active";

        session.startedAt =
          new Date();

        await session.save();
      }

      if (
        session.status !==
        "Active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Viva session cannot be started.",
        });
      }

      const attempt =
        await VivaAttempt.findOne({
          _id:
            attemptId,

          vivaSession:
            session._id,
        });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Viva attempt not found.",
        });
      }

      if (
        attempt.status ===
        "Completed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This Viva attempt is already completed.",
        });
      }

      if (
        attempt.status !==
        "Active"
      ) {
        attempt.status =
          "Active";

        attempt.startedAt =
          new Date();

        attempt.currentQuestionIndex =
          0;

        await attempt.save();
      }

      return res.status(200).json({
        success: true,

        message:
          "Viva started successfully.",

        attempt: {
          attemptId:
            attempt._id,

          status:
            attempt.status,

          currentQuestionIndex:
            attempt.currentQuestionIndex,

          startedAt:
            attempt.startedAt,
        },
      });
    } catch (error) {
      console.error(
        "startVivaSession Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to start Viva.",
      });
    }
  };

// ======================================================
// GET NEXT VIVA QUESTION
// ======================================================

const getNextVivaQuestion =
  async (req, res) => {
    try {
      const {
        sessionId,
        questionNumber,
      } = req.params;

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

      const index =
        Number(questionNumber) - 1;

      if (
        !Number.isInteger(index) ||
        index < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid question number.",
        });
      }

      const question =
        session.questions?.[index];

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Viva question not found.",
        });
      }

      return res.status(200).json({
        success: true,

        question: {
          id:
            question._id ||
            null,

          questionId:
            question.questionId ||
            null,

          question:
            question.question,

          difficulty:
            question.difficulty,

          questionNumber:
            index + 1,

          totalQuestions:
            session.questions.length,
        },

        aiSettings:
          session.aiSettings,

        language:
          session.language,
      });
    } catch (error) {
      console.error(
        "getNextVivaQuestion Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load Viva question.",
      });
    }
  };

// ======================================================
// PUBLIC VIVA SESSION
// ======================================================

const getPublicVivaSession =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      const session =
        await VivaSession.findOne({
          sessionId,
        }).lean();

      if (!session) {
        return res.status(404).json({
          success: false,
          message:
            "Viva session not found.",
        });
      }

      if (
        session.status ===
          "Cancelled" ||
        session.status ===
          "Completed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This Viva session is no longer available.",
        });
      }

      return res.status(200).json({
        success: true,

        session: {
          sessionId:
            session.sessionId,

          subject:
            session.subject,

          class:
            session.class,

          department:
            session.department,

          numberOfQuestions:
            session.numberOfQuestions,

          difficulty:
            session.difficulty,

          questionType:
            session.questionType,

          timeLimit:
            session.timeLimit,

          timeMode:
            session.timeMode,

          language:
            session.language,

          aiSettings: {
            voice:
              session.aiSettings
                ?.voice ||
              "Female",

            speechSpeed:
              session.aiSettings
                ?.speechSpeed ||
              "Normal",

            personality:
              session.aiSettings
                ?.personality ||
              "Professional",
          },

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
        message:
          "Unable to load Viva session.",
      });
    }
  };

// ======================================================
// START PUBLIC VIVA
// ======================================================

const startPublicViva =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      const {
        attemptId,
      } = req.body || {};

      if (
        !attemptId ||
        !mongoose.Types.ObjectId.isValid(
          attemptId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid attempt ID is required.",
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
        session.status !==
        "Active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This Viva is not active.",
        });
      }

      const attempt =
        await VivaAttempt.findOne({
          _id:
            attemptId,

          vivaSession:
            session._id,
        });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Viva attempt not found.",
        });
      }

      if (
        attempt.status ===
        "Completed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This Viva attempt is already completed.",
        });
      }

      if (
        attempt.status ===
        "Cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This Viva attempt has been cancelled.",
        });
      }

      if (
        attempt.status !==
        "Active"
      ) {
        attempt.status =
          "Active";

        attempt.startedAt =
          new Date();

        attempt.currentQuestionIndex =
          0;

        await attempt.save();
      }

      return res.status(200).json({
        success: true,

        message:
          "Viva started successfully.",

        attempt: {
          attemptId:
            attempt._id,

          status:
            attempt.status,

          currentQuestionIndex:
            attempt.currentQuestionIndex,

          startedAt:
            attempt.startedAt,
        },
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

// ======================================================
// SUBMIT PUBLIC VIVA ANSWER
// ======================================================

const submitPublicVivaAnswer =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      const {
        attemptId,
        enrollmentNo,
        questionId,
        question,
        answer,
        questionNumber,
      } = req.body || {};

      // =================================================
      // BASIC VALIDATION
      // =================================================

      const cleanSessionId =
        String(
          sessionId || ""
        ).trim();

      const cleanEnrollmentNo =
        String(
          enrollmentNo || ""
        ).trim();

      const cleanAnswer =
        String(
          answer || ""
        ).trim();

      const cleanQuestion =
        String(
          question || ""
        ).trim();

      const parsedQuestionNumber =
        Number(questionNumber);

      if (!cleanSessionId) {
        return res.status(400).json({
          success: false,
          message:
            "Viva session ID is required.",
        });
      }

      if (
        !attemptId ||
        !mongoose.Types.ObjectId.isValid(
          attemptId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid Viva attempt ID is required.",
        });
      }

      if (!cleanEnrollmentNo) {
        return res.status(400).json({
          success: false,
          message:
            "Enrollment number is required.",
        });
      }

      if (!cleanAnswer) {
        return res.status(400).json({
          success: false,
          message:
            "Answer cannot be empty.",
        });
      }

      if (
        !Number.isInteger(
          parsedQuestionNumber
        ) ||
        parsedQuestionNumber < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid question number is required.",
        });
      }

      // =================================================
      // SESSION VALIDATION
      // =================================================

      const session =
        await VivaSession.findOne({
          sessionId:
            cleanSessionId,
        });

      if (!session) {
        return res.status(404).json({
          success: false,
          message:
            "Viva session not found.",
        });
      }

      if (
        session.status ===
        "Cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This Viva session has been cancelled.",
        });
      }

      if (
        session.status ===
        "Completed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This Viva session has already been completed.",
        });
      }

      if (
        session.status !==
        "Active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Viva session is not active.",
        });
      }

      // =================================================
      // ATTEMPT VALIDATION
      // =================================================

      const attempt =
        await VivaAttempt.findOne({
          _id:
            attemptId,

          vivaSession:
            session._id,
        });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Viva attempt not found.",
        });
      }

      if (
        attempt.status !==
        "Active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Viva attempt is not active.",
        });
      }

      // =================================================
      // STUDENT VALIDATION
      // =================================================

      const student =
        await Student.findOne({
          $or: [
            {
              enrollmentNumber:
                cleanEnrollmentNo,
            },
            {
              enrollmentNo:
                cleanEnrollmentNo,
            },
            {
              enrollment:
                cleanEnrollmentNo,
            },
          ],
        });

      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "Student was not found.",
        });
      }

      // =================================================
      // ATTEMPT OWNERSHIP
      // =================================================

      if (
        String(
          attempt.student
        ) !==
        String(
          student._id
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This student is not authorized to submit this Viva answer.",
        });
      }

      // =================================================
      // CLASS VALIDATION
      // =================================================

      if (
        student.class &&
        session.class &&
        String(
          student.class
        ) !==
        String(
          session.class
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This student does not belong to this Viva class.",
        });
      }

      // =================================================
      // CURRENT QUESTION VALIDATION
      // =================================================

      const expectedQuestionNumber =
        Number(
          attempt.currentQuestionIndex ||
            0
        ) + 1;

      if (
        parsedQuestionNumber !==
        expectedQuestionNumber
      ) {
        return res.status(409).json({
          success: false,

          code:
            "QUESTION_SEQUENCE_MISMATCH",

          message:
            "This is not the current Viva question.",

          currentQuestionNumber:
            expectedQuestionNumber,
        });
      }

      // =================================================
      // SERVER-SIDE QUESTION
      // =================================================

      const sessionQuestions =
        Array.isArray(
          session.questions
        )
          ? session.questions
          : [];

      const actualQuestion =
        sessionQuestions[
          parsedQuestionNumber - 1
        ];

      if (!actualQuestion) {
        return res.status(400).json({
          success: false,
          message:
            "The submitted question does not exist in this Viva.",
        });
      }

      const actualQuestionText =
        String(
          actualQuestion.question ||
            ""
        ).trim();

      if (!actualQuestionText) {
        return res.status(400).json({
          success: false,
          message:
            "The Viva question is invalid.",
        });
      }

      // =================================================
      // QUESTION ID VALIDATION
      // =================================================

      if (
        questionId &&
        actualQuestion.questionId &&
        String(questionId) !==
          String(
            actualQuestion.questionId
          )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Question validation failed.",
        });
      }

      // =================================================
      // QUESTION TEXT VALIDATION
      // =================================================

      if (
        cleanQuestion &&
        cleanQuestion !==
          actualQuestionText
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Question validation failed.",
        });
      }

      // =================================================
      // DUPLICATE ANSWER PROTECTION
      // =================================================

      const answers =
        Array.isArray(
          attempt.answers
        )
          ? attempt.answers
          : [];

      const existingAnswer =
        answers.find(
          (item) =>
            Number(
              item.questionNumber
            ) ===
            parsedQuestionNumber
        );

      if (existingAnswer) {
        return res.status(409).json({
          success: false,

          code:
            "ANSWER_ALREADY_SUBMITTED",

          message:
            "This question has already been answered.",
        });
      }

      // =================================================
      // SAVE ANSWER
      // =================================================

      if (
        !Array.isArray(
          attempt.answers
        )
      ) {
        attempt.answers = [];
      }

      attempt.answers.push({
        questionId:
          actualQuestion.questionId ||
          null,

        questionNumber:
          parsedQuestionNumber,

        question:
          actualQuestionText,

        transcript:
          cleanAnswer,

        answeredAt:
          new Date(),
      });

      // =================================================
      // MOVE TO NEXT QUESTION
      // =================================================

      attempt.currentQuestionIndex =
        parsedQuestionNumber;

      await attempt.save();

      // =================================================
      // STUDENT-SAFE RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        saved: true,

        message:
          "Answer saved successfully.",

        nextQuestionIndex:
          attempt.currentQuestionIndex,
      });
    } catch (error) {
      console.error(
        "submitPublicVivaAnswer Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to save answer. Please try again.",
      });
    }
  };

// ======================================================
// COMPLETE PUBLIC VIVA
// ======================================================

const completePublicViva =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      const {
        attemptId,
        enrollmentNo,
      } = req.body || {};

      const cleanEnrollmentNo =
        String(
          enrollmentNo || ""
        ).trim();

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message:
            "Viva session ID is required.",
        });
      }

      if (!cleanEnrollmentNo) {
        return res.status(400).json({
          success: false,
          message:
            "Enrollment number is required.",
        });
      }

      const session =
        await VivaSession.findOne({
          sessionId:
            String(
              sessionId
            ).trim(),
        });

      if (!session) {
        return res.status(404).json({
          success: false,
          message:
            "Viva session not found.",
        });
      }

      // =================================================
      // FIND STUDENT
      // =================================================

      const student =
        await Student.findOne({
          $or: [
            {
              enrollmentNumber:
                cleanEnrollmentNo,
            },
            {
              enrollmentNo:
                cleanEnrollmentNo,
            },
            {
              enrollment:
                cleanEnrollmentNo,
            },
          ],
        });

      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "Student not found.",
        });
      }

      // =================================================
      // FIND ATTEMPT
      // =================================================

      const attemptQuery = {
        vivaSession:
          session._id,

        student:
          student._id,
      };

      if (
        attemptId &&
        mongoose.Types.ObjectId.isValid(
          attemptId
        )
      ) {
        attemptQuery._id =
          attemptId;
      }

      const attempt =
        await VivaAttempt.findOne(
          attemptQuery
        );

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message:
            "Viva attempt not found.",
        });
      }

      // =================================================
      // VERIFY OWNERSHIP
      // =================================================

      if (
        String(
          attempt.student
        ) !==
        String(
          student._id
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to complete this Viva.",
        });
      }

      // =================================================
      // ALREADY COMPLETED
      // =================================================

      if (
        attempt.status ===
        "Completed"
      ) {
        return res.status(200).json({
          success: true,

          completed: true,

          message:
            "Viva completed successfully.",
        });
      }

      if (
        attempt.status ===
        "Cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This Viva attempt has been cancelled.",
        });
      }

      // =================================================
      // COMPLETE ATTEMPT
      // =================================================

      attempt.status =
        "Completed";

      attempt.completedAt =
        new Date();

      await attempt.save();

      // =================================================
      // EXISTING AI EVALUATION
      // =================================================

      if (
        typeof evaluateVivaAttempt ===
        "function"
      ) {
        evaluateVivaAttempt(
          attempt._id
        )
          .then(() => {
            console.log(
              `AI Evaluation completed for attempt: ${attempt._id}`
            );
          })
          .catch((error) => {
            console.error(
              `AI Evaluation failed for attempt ${attempt._id}:`,
              error.message
            );
          });
      }

      console.log(
        `Viva completed: ${sessionId} / ${cleanEnrollmentNo}`
      );

      // =================================================
      // STUDENT-SAFE RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        completed: true,

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
// EXPORT ALL CONTROLLERS
// ======================================================

module.exports = {
  // ====================================================
  // Teacher Viva Session
  // ====================================================

  createVivaSession,
  getVivaSession,
  getStudentVivaLink,

  // ====================================================
  // Student Viva
  // ====================================================

  joinVivaSession,
  startVivaSession,
  getNextVivaQuestion,

  // ====================================================
  // Public Viva
  // ====================================================

  getPublicVivaSession,
  startPublicViva,

  // ====================================================
  // Phase 11.7
  // Student Answer Submission
  // ====================================================

  submitPublicVivaAnswer,

  // ====================================================
  // Phase 10.8
  // Viva Completion
  // ====================================================

  completePublicViva,
};