const mongoose = require("mongoose");

const VivaSession = require("../models/VivaSession");
const VivaAttempt = require("../models/VivaAttempt");
const Student = require("../models/Student");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const publicAttemptData = (attempt) => ({
  attemptId: attempt._id,
  status: attempt.status,
  startedAt: attempt.startedAt,
  currentQuestionIndex:
    attempt.currentQuestionIndex,
});

// =====================================================
// GET PUBLIC VIVA SESSION
// GET /api/viva/public/:sessionId
// =====================================================

const getPublicVivaSession = async (
  req,
  res
) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || !sessionId.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Viva session ID is required.",
      });
    }

    const session =
      await VivaSession.findOne({
        sessionId: sessionId.trim(),
      })
        .populate(
          "class",
          "name className"
        )
        .populate(
          "subject",
          "name subjectName"
        )
        .populate(
          "department",
          "name departmentName"
        )
        .lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Viva session not found.",
      });
    }

    if (
      session.status !== "Active" &&
      session.status !== "Configured"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This Viva Session is not currently available.",
        status: session.status,
      });
    }

    // IMPORTANT:
    // Never send questions here.
    // Never send marks.
    // Never send answer keys.
    // Never send teacher information.

    return res.status(200).json({
      success: true,

      session: {
        sessionId: session.sessionId,

        class: session.class
          ? {
              _id: session.class._id,
              name:
                session.class.name ||
                session.class.className ||
                "",
            }
          : null,

        subject: session.subject
          ? {
              _id: session.subject._id,
              name:
                session.subject.name ||
                session.subject.subjectName ||
                "",
            }
          : null,

        department: session.department
          ? {
              _id: session.department._id,
              name:
                session.department.name ||
                session.department.departmentName ||
                "",
            }
          : null,

        studentsPerViva:
          session.studentsPerViva,

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
            session.aiSettings?.voice ||
            "Female",

          speechSpeed:
            session.aiSettings?.speechSpeed ||
            "Normal",

          personality:
            session.aiSettings?.personality ||
            "Professional",
        },

        rules: {
          randomQuestions:
            session.rules?.randomQuestions ??
            true,

          noRepeatedQuestions:
            session.rules?.noRepeatedQuestions ??
            true,

          allowSkip:
            session.rules?.allowSkip ??
            true,

          followUpQuestions:
            session.rules?.followUpQuestions ??
            false,

          hintMode:
            session.rules?.hintMode ??
            false,
        },

        status: session.status,
      },
    });
  } catch (error) {
    console.error(
      "Get Public Viva Session Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load Viva Session.",
    });
  }
};

// =====================================================
// JOIN VIVA
// POST /api/viva/public/:sessionId/join
// =====================================================

const joinPublicViva = async (
  req,
  res
) => {
  try {
    const { sessionId } = req.params;
    const { enrollmentNumber } =
      req.body;

    if (!sessionId || !sessionId.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Viva session ID is required.",
      });
    }

    if (
      !enrollmentNumber ||
      !String(enrollmentNumber).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enrollment number is required.",
      });
    }

    const session =
      await VivaSession.findOne({
        sessionId: sessionId.trim(),
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Viva session not found.",
      });
    }

    if (
      session.status !== "Active" &&
      session.status !== "Configured"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This Viva Session is not active.",
      });
    }

    const normalizedEnrollment =
      String(enrollmentNumber)
        .trim()
        .toLowerCase();

    let student = null;

    // =================================================
    // SELECTED STUDENTS
    // =================================================

    if (
      Array.isArray(
        session.selectedStudents
      ) &&
      session.selectedStudents.length > 0
    ) {
      const possibleStudents =
        await Student.find({
          _id: {
            $in:
              session.selectedStudents,
          },
        }).lean();

      student =
        possibleStudents.find(
          (item) => {
            const value =
              item.enrollmentNumber ||
              item.enrollmentNo ||
              item.enrollment ||
              "";

            return (
              String(value)
                .trim()
                .toLowerCase() ===
              normalizedEnrollment
            );
          }
        ) || null;
    } else {
      // =================================================
      // ALL STUDENTS OF CLASS
      // =================================================

      const classIdStr = session.class ? session.class.toString() : "";
      const students =
        await Student.find({
          $or: [
            { class: session.class },
            { classId: classIdStr },
            { classId: session.class },
          ],
        }).lean();

      student =
        students.find(
          (item) => {
            const value =
              item.enrollmentNumber ||
              item.enrollmentNo ||
              item.enrollment ||
              "";

            return (
              String(value)
                .trim()
                .toLowerCase() ===
              normalizedEnrollment
            );
          }
        ) || null;
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student not found. Please check your enrollment number.",
      });
    }

    // =================================================
    // EXISTING ATTEMPT
    // =================================================

    const existingAttempt =
      await VivaAttempt.findOne({
        vivaSession: session._id,
        student: student._id,
      });

    if (existingAttempt) {
      if (
        existingAttempt.status ===
        "Completed"
      ) {
        return res.status(409).json({
          success: false,
          code: "ALREADY_COMPLETED",
          message:
            "You have already completed this Viva.",
        });
      }

      if (
        existingAttempt.status ===
        "Active"
      ) {
        return res.status(409).json({
          success: false,
          code: "ALREADY_STARTED",
          message:
            "Your Viva has already been started.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Viva attempt already exists.",

        attempt:
          publicAttemptData(
            existingAttempt
          ),

        student: {
          id: student._id,

          name:
            student.name ||
            student.studentName ||
            "",

          enrollmentNumber:
            student.enrollmentNumber ||
            student.enrollmentNo ||
            student.enrollment ||
            "",
        },
      });
    }

    // =================================================
    // CREATE ATTEMPT
    // =================================================

    const attempt =
      await VivaAttempt.create({
        vivaSession: session._id,
        student: student._id,
        status: "NotStarted",
        currentQuestionIndex: 0,
        questionIdsAsked: [],
        answers: [],
      });

    return res.status(201).json({
      success: true,

      message:
        "Student joined the Viva successfully.",

      attempt:
        publicAttemptData(attempt),

      student: {
        id: student._id,

        name:
          student.name ||
          student.studentName ||
          "",

        enrollmentNumber:
          student.enrollmentNumber ||
          student.enrollmentNo ||
          student.enrollment ||
          "",
      },

      session: {
        sessionId:
          session.sessionId,

        numberOfQuestions:
          session.numberOfQuestions,

        language:
          session.language,

        difficulty:
          session.difficulty,

        timeLimit:
          session.timeLimit,

        timeMode:
          session.timeMode,

        studentsPerViva:
          session.studentsPerViva,
      },
    });
  } catch (error) {
    console.error(
      "Join Public Viva Error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "ATTEMPT_EXISTS",
        message:
          "A Viva attempt already exists for this student.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to join Viva.",
    });
  }
};

// =====================================================
// START VIVA
// POST /api/viva/public/:sessionId/start
// =====================================================

const startPublicViva = async (
  req,
  res
) => {
  try {
    const { sessionId } = req.params;
    const { attemptId } =
      req.body;

    if (!sessionId || !sessionId.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Viva session ID is required.",
      });
    }

    if (
      !attemptId ||
      !isValidObjectId(attemptId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid attempt ID is required.",
      });
    }

    const session =
      await VivaSession.findOne({
        sessionId: sessionId.trim(),
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Viva session not found.",
      });
    }

    if (
      session.status !== "Active" &&
      session.status !== "Configured"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This Viva Session is not active.",
      });
    }

    if (session.status !== "Active") {
      session.status = "Active";
      if (!session.startedAt) {
        session.startedAt = new Date();
      }
      await session.save();
    }

    const attempt =
      await VivaAttempt.findOne({
        _id: attemptId,
        vivaSession: session._id,
      });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message:
          "Viva attempt not found.",
      });
    }

    if (
      attempt.status === "Completed"
    ) {
      return res.status(409).json({
        success: false,
        code: "ALREADY_COMPLETED",
        message:
          "This Viva has already been completed.",
      });
    }

    if (
      attempt.status === "Active"
    ) {
      return res.status(200).json({
        success: true,
        message:
          "Viva is already active.",
        attempt:
          publicAttemptData(attempt),
      });
    }

    attempt.status = "Active";
    attempt.startedAt = new Date();
    attempt.currentQuestionIndex = 0;
    attempt.questionIdsAsked = [];

    await attempt.save();

    return res.status(200).json({
      success: true,

      message:
        "Viva started successfully.",

      attempt:
        publicAttemptData(attempt),
    });
  } catch (error) {
    console.error(
      "Start Public Viva Error:",
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
// 10.7.2
// GET CURRENT QUESTION
// =====================================================

const getCurrentVivaQuestion = async (
  req,
  res
) => {
  try {
    const { sessionId } =
      req.params;

    const { attemptId } =
      req.query;

    if (
      !sessionId ||
      !sessionId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Viva session ID is required.",
      });
    }

    if (
      !attemptId ||
      !isValidObjectId(attemptId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid attempt ID is required.",
      });
    }

    const session =
      await VivaSession.findOne({
        sessionId:
          sessionId.trim(),
      }).lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Viva session not found.",
      });
    }

    if (
      session.status !== "Active"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This Viva Session is not active.",
      });
    }

    const attempt =
      await VivaAttempt.findOne({
        _id: attemptId,
        vivaSession: session._id,
      });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message:
          "Viva attempt not found.",
      });
    }

    if (
      attempt.status !== "Active"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Viva attempt is not active.",
      });
    }

    const questions =
      Array.isArray(session.questions)
        ? session.questions
        : [];

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No questions are available for this Viva Session.",
      });
    }

    const configuredCount =
      Number(
        session.numberOfQuestions
      ) || questions.length;

    const totalQuestions =
      Math.min(
        configuredCount,
        questions.length
      );

    let currentIndex =
      Number(
        attempt.currentQuestionIndex
      ) || 0;

    if (currentIndex < 0) {
      currentIndex = 0;
    }

    if (
      currentIndex >=
      totalQuestions
    ) {
      return res.status(200).json({
        success: true,
        completed: true,
        message:
          "All Viva questions have been completed.",
      });
    }

    let currentQuestion =
      questions[currentIndex];

    if (!currentQuestion) {
      return res.status(404).json({
        success: false,
        message:
          "Current Viva question not found.",
      });
    }

    // =================================================
    // DUPLICATE PROTECTION
    // =================================================

    const asked =
      Array.isArray(
        attempt.questionIdsAsked
      )
        ? attempt.questionIdsAsked
        : [];

    if (
      currentQuestion.questionId &&
      asked.some(
        (id) =>
          String(id) ===
          String(
            currentQuestion.questionId
          )
      )
    ) {
      let nextIndex =
        currentIndex + 1;

      while (
        nextIndex <
        totalQuestions
      ) {
        const candidate =
          questions[nextIndex];

        const candidateId =
          candidate?.questionId
            ? String(
                candidate.questionId
              )
            : null;

        const alreadyAsked =
          candidateId &&
          asked.some(
            (id) =>
              String(id) ===
              candidateId
          );

        if (!alreadyAsked) {
          currentIndex =
            nextIndex;

          attempt.currentQuestionIndex =
            currentIndex;

          await attempt.save();

          break;
        }

        nextIndex++;
      }

      if (
        currentIndex >=
        totalQuestions
      ) {
        return res.status(200).json({
          success: true,
          completed: true,
          message:
            "All Viva questions have been completed.",
        });
      }

      currentQuestion =
        questions[currentIndex];
    }

    // =================================================
    // RECORD QUESTION AS DELIVERED
    // =================================================

    if (
      currentQuestion.questionId
    ) {
      const alreadyRecorded =
        attempt.questionIdsAsked.some(
          (id) =>
            String(id) ===
            String(
              currentQuestion.questionId
            )
        );

      if (!alreadyRecorded) {
        attempt.questionIdsAsked.push(
          currentQuestion.questionId
        );

        await attempt.save();
      }
    }

    // =================================================
    // SECURITY FILTER
    // =================================================

    return res.status(200).json({
      success: true,
      completed: false,

      question: {
        id:
          currentQuestion.questionId ||
          `${session._id}-${currentIndex}`,

        question:
          currentQuestion.question ||
          "",

        difficulty:
          currentQuestion.difficulty ||
          session.difficulty ||
          "Medium",

        questionNumber:
          currentIndex + 1,

        totalQuestions,
      },
    });
  } catch (error) {
    console.error(
      "Get Current Viva Question Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load current Viva question.",
    });
  }
};

// =====================================================
// 10.7.5
// SAVE STUDENT ANSWER
//
// POST /api/viva/public/:sessionId/answer
// =====================================================

const saveStudentAnswer = async (
  req,
  res
) => {
  try {
    const { sessionId } =
      req.params;

    const {
      attemptId,
      questionId,
      questionNumber,
      question,
      transcript,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (
      !sessionId ||
      !sessionId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Viva session ID is required.",
      });
    }

    if (
      !attemptId ||
      !isValidObjectId(attemptId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid attempt ID is required.",
      });
    }

    const parsedQuestionNumber =
      Number(questionNumber);

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
    // FIND SESSION
    // =================================================

    const session =
      await VivaSession.findOne({
        sessionId:
          sessionId.trim(),
      }).lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Viva session not found.",
      });
    }

    if (
      session.status !== "Active"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This Viva Session is not active.",
      });
    }

    // =================================================
    // FIND ATTEMPT
    // =================================================

    const attempt =
      await VivaAttempt.findOne({
        _id: attemptId,
        vivaSession: session._id,
      });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message:
          "Viva attempt not found.",
      });
    }

    if (
      attempt.status !== "Active"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Viva attempt is not active.",
      });
    }

    // =================================================
    // VERIFY QUESTION
    //
    // Student cannot submit an arbitrary question.
    // =================================================

    const questions =
      Array.isArray(session.questions)
        ? session.questions
        : [];

    const configuredCount =
      Number(
        session.numberOfQuestions
      ) || questions.length;

    const totalQuestions =
      Math.min(
        configuredCount,
        questions.length
      );

    const questionIndex =
      parsedQuestionNumber - 1;

    if (
      questionIndex < 0 ||
      questionIndex >=
        totalQuestions
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid question number.",
      });
    }

    const actualQuestion =
      questions[questionIndex];

    if (!actualQuestion) {
      return res.status(404).json({
        success: false,
        message:
          "Question not found.",
      });
    }

    // =================================================
    // VERIFY IT IS THE CURRENT QUESTION
    // =================================================

    const currentIndex =
      Number(
        attempt.currentQuestionIndex
      ) || 0;

    if (
      currentIndex !==
      questionIndex
    ) {
      return res.status(409).json({
        success: false,
        code: "QUESTION_MISMATCH",
        message:
          "This is not the current Viva question.",
      });
    }

    // =================================================
    // VERIFY QUESTION ID IF PROVIDED
    // =================================================

    if (
      questionId &&
      actualQuestion.questionId &&
      String(questionId) !==
        String(
          actualQuestion.questionId
        )
    ) {
      return res.status(409).json({
        success: false,
        code: "QUESTION_MISMATCH",
        message:
          "Question verification failed.",
      });
    }

    // =================================================
    // CLEAN TRANSCRIPT
    // =================================================

    const cleanTranscript =
      typeof transcript === "string"
        ? transcript.trim()
        : "";

    // =================================================
    // CHECK EXISTING ANSWER
    //
    // Prevent duplicate submissions.
    // =================================================

    const existingAnswer =
      attempt.answers.find(
        (answer) =>
          Number(
            answer.questionNumber
          ) ===
          parsedQuestionNumber
      );

    if (existingAnswer) {
      // Update only if an answer was
      // previously empty.
      if (
        !existingAnswer.transcript &&
        cleanTranscript
      ) {
        existingAnswer.transcript =
          cleanTranscript;

        existingAnswer.answeredAt =
          new Date();

        await attempt.save();
      }

      return res.status(200).json({
        success: true,
        saved: true,
        alreadySaved: true,
        message:
          "Answer was already saved.",
      });
    }

    // =================================================
    // SAVE ANSWER
    // =================================================

    attempt.answers.push({
      questionId:
        actualQuestion.questionId ||
        null,

      questionNumber:
        parsedQuestionNumber,

      question:
        actualQuestion.question ||
        question ||
        "",

      transcript:
        cleanTranscript,

      answeredAt:
        new Date(),
    });

    await attempt.save();

    // =================================================
    // SECURITY
    //
    // Do NOT return transcript.
    // Do NOT return marks.
    // Do NOT return evaluation.
    // =================================================

    return res.status(200).json({
      success: true,
      saved: true,
      message:
        "Your answer has been saved.",
    });
  } catch (error) {
    console.error(
      "Save Student Answer Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to save your answer.",
    });
  }
};

// =====================================================
// 10.7.6
// NEXT QUESTION
//
// POST /api/viva/public/:sessionId/next
// =====================================================

const nextVivaQuestion = async (
  req,
  res
) => {
  try {
    const { sessionId } =
      req.params;

    const { attemptId } =
      req.body;

    if (
      !sessionId ||
      !sessionId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Viva session ID is required.",
      });
    }

    if (
      !attemptId ||
      !isValidObjectId(attemptId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid attempt ID is required.",
      });
    }

    const session =
      await VivaSession.findOne({
        sessionId:
          sessionId.trim(),
      }).lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Viva session not found.",
      });
    }

    if (
      session.status !== "Active"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This Viva Session is not active.",
      });
    }

    const attempt =
      await VivaAttempt.findOne({
        _id: attemptId,
        vivaSession: session._id,
      });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message:
          "Viva attempt not found.",
      });
    }

    if (
      attempt.status !== "Active"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Viva attempt is not active.",
      });
    }

    const questions =
      Array.isArray(session.questions)
        ? session.questions
        : [];

    const configuredCount =
      Number(
        session.numberOfQuestions
      ) || questions.length;

    const totalQuestions =
      Math.min(
        configuredCount,
        questions.length
      );

    const currentIndex =
      Number(
        attempt.currentQuestionIndex
      ) || 0;

    // =================================================
    // CURRENT QUESTION MUST HAVE AN ANSWER
    //
    // This prevents accidental skipping.
    // =================================================

    const currentQuestionNumber =
      currentIndex + 1;

    const answerExists =
      attempt.answers.some(
        (answer) =>
          Number(
            answer.questionNumber
          ) ===
          currentQuestionNumber
      );

    if (!answerExists) {
      return res.status(400).json({
        success: false,
        code: "ANSWER_REQUIRED",
        message:
          "Please submit your answer before moving to the next question.",
      });
    }

    // =================================================
    // LAST QUESTION
    // =================================================

    if (
      currentIndex + 1 >=
      totalQuestions
    ) {
      return res.status(200).json({
        success: true,
        completed: true,
        message:
          "All questions have been answered.",
      });
    }

    // =================================================
    // MOVE INDEX
    // =================================================

    const nextIndex =
      currentIndex + 1;

    attempt.currentQuestionIndex =
      nextIndex;

    await attempt.save();

    // =================================================
    // GET NEXT QUESTION
    // =================================================

    const nextQuestion =
      questions[nextIndex];

    if (!nextQuestion) {
      return res.status(500).json({
        success: false,
        message:
          "Next Viva question could not be found.",
      });
    }

    // =================================================
    // DUPLICATE PROTECTION
    // =================================================

    if (
      nextQuestion.questionId
    ) {
      const alreadyAsked =
        attempt.questionIdsAsked.some(
          (id) =>
            String(id) ===
            String(
              nextQuestion.questionId
            )
        );

      if (!alreadyAsked) {
        attempt.questionIdsAsked.push(
          nextQuestion.questionId
        );

        await attempt.save();
      }
    }

    // =================================================
    // SECURITY FILTER
    // =================================================

    return res.status(200).json({
      success: true,
      completed: false,

      question: {
        id:
          nextQuestion.questionId ||
          `${session._id}-${nextIndex}`,

        question:
          nextQuestion.question ||
          "",

        difficulty:
          nextQuestion.difficulty ||
          session.difficulty ||
          "Medium",

        questionNumber:
          nextIndex + 1,

        totalQuestions,
      },
    });
  } catch (error) {
    console.error(
      "Next Viva Question Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load next Viva question.",
    });
  }
};

// =====================================================
// 10.7.7
// COMPLETE VIVA
//
// POST /api/viva/public/:sessionId/complete
// =====================================================

const completePublicViva = async (
  req,
  res
) => {
  try {
    const { sessionId } =
      req.params;

    const { attemptId } =
      req.body;

    if (
      !sessionId ||
      !sessionId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Viva session ID is required.",
      });
    }

    if (
      !attemptId ||
      !isValidObjectId(attemptId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid attempt ID is required.",
      });
    }

    const session =
      await VivaSession.findOne({
        sessionId:
          sessionId.trim(),
      }).lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Viva session not found.",
      });
    }

    const attempt =
      await VivaAttempt.findOne({
        _id: attemptId,
        vivaSession: session._id,
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
      return res.status(200).json({
        success: true,
        completed: true,
        message:
          "Viva has already been completed.",
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

    const questions =
      Array.isArray(session.questions)
        ? session.questions
        : [];

    const configuredCount =
      Number(
        session.numberOfQuestions
      ) || questions.length;

    const totalQuestions =
      Math.min(
        configuredCount,
        questions.length
      );

    // =================================================
    // REQUIRE ALL QUESTIONS TO BE ANSWERED
    // =================================================

    const answeredNumbers =
      new Set(
        attempt.answers.map(
          (answer) =>
            Number(
              answer.questionNumber
            )
        )
      );

    const allowSkip = session.rules?.allowSkip !== false;

    for (
      let i = 1;
      i <= totalQuestions;
      i++
    ) {
      if (
        !answeredNumbers.has(i)
      ) {
        if (allowSkip) {
          const qObj = questions[i - 1];
          attempt.answers.push({
            questionId: qObj?.questionId || null,
            questionNumber: i,
            question: qObj?.question || `Question ${i}`,
            transcript: "[Unanswered / Skipped]",
            answeredAt: new Date(),
          });
        } else {
          return res.status(400).json({
            success: false,
            code: "ANSWERS_INCOMPLETE",
            message:
              `Question ${i} has not been answered yet.`,
          });
        }
      }
    }

    // =================================================
    // COMPLETE
    // =================================================

    attempt.status =
      "Completed";

    attempt.completedAt =
      new Date();

    // IMPORTANT:
    // Evaluation is NOT done here.
    // Marks remain hidden from student.
    attempt.evaluated = false;

    await attempt.save();

    // Trigger background AI evaluation for teacher reports (Phase 13)
    try {
      const { evaluateVivaAttempt } = require("../services/aiEvaluationService");
      evaluateVivaAttempt(attempt._id).catch((evalErr) => {
        console.error("Background AI Evaluation Error:", evalErr);
      });
    } catch (e) {
      console.error("Failed to trigger background evaluation:", e);
    }

    // =================================================
    // SECURITY
    //
    // NEVER RETURN:
    // - marks
    // - answers
    // - evaluation
    // =================================================

    return res.status(200).json({
      success: true,
      completed: true,
      message:
        "Your Viva has been completed successfully.",
    });
  } catch (error) {
    console.error(
      "Complete Public Viva Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to complete Viva.",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getPublicVivaSession,
  joinPublicViva,
  startPublicViva,
  getCurrentVivaQuestion,
  saveStudentAnswer,
  nextVivaQuestion,
  completePublicViva,
};