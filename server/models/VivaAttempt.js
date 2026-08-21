const mongoose = require("mongoose");

// =====================================================
// VIVA ATTEMPT ANSWER SCHEMA
// =====================================================
// Stores the student's submitted voice-to-text answer.
//
// IMPORTANT:
// This data is stored for teacher/report/evaluation use.
// It must NEVER be returned through the public student API.
// =====================================================

const vivaAttemptAnswerSchema =
  new mongoose.Schema(
    {
      // =================================================
      // QUESTION REFERENCE
      // =================================================

      questionId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Question",
        default: null,
      },

      // =================================================
      // QUESTION NUMBER
      // =================================================

      questionNumber: {
        type: Number,
        required: true,
        min: 1,
      },

      // =================================================
      // QUESTION SNAPSHOT
      // =================================================
      // Stores the exact question asked during this attempt.
      // This protects historical attempt data even if the
      // original Question document changes later.
      // =================================================

      question: {
        type: String,
        required: true,
        trim: true,
      },

      // =================================================
      // STUDENT ANSWER
      // =================================================
      // Speech-to-Text transcript of the student's answer.
      // =================================================

      transcript: {
        type: String,
        required: true,
        trim: true,
      },

      // =================================================
      // ANSWER SUBMISSION TIME
      // =================================================

      answeredAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: true,
    }
  );

// =====================================================
// VIVA ATTEMPT SCHEMA
// =====================================================

const vivaAttemptSchema =
  new mongoose.Schema(
    {
      // =================================================
      // VIVA SESSION
      // =================================================

      vivaSession: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "VivaSession",
        required: true,
        index: true,
      },

      // =================================================
      // STUDENT
      // =================================================

      student: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
        index: true,
      },

      // =================================================
      // TIMING
      // =================================================

      startedAt: {
        type: Date,
        default: null,
      },

      completedAt: {
        type: Date,
        default: null,
      },

      // =================================================
      // ATTEMPT STATUS
      // =================================================

      status: {
        type: String,

        enum: [
          "NotStarted",
          "Active",
          "Completed",
          "Cancelled",
        ],

        default: "NotStarted",
      },

      // =================================================
      // CURRENT QUESTION
      // =================================================
      // Zero-based index.
      //
      // Example:
      // 0 = Question 1
      // 1 = Question 2
      // 2 = Question 3
      // =================================================

      currentQuestionIndex: {
        type: Number,
        default: 0,
        min: 0,
      },

      // =================================================
      // QUESTIONS ALREADY DELIVERED
      // =================================================
      // Used to prevent duplicate questions during
      // the same student's Viva attempt.
      // =================================================

      questionIdsAsked: [
        {
          type:
            mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
      ],

      // =================================================
      // STUDENT ANSWERS
      // =================================================
      // Every successfully submitted answer is stored here.
      //
      // Example:
      //
      // answers: [
      //   {
      //     questionId: "...",
      //     questionNumber: 1,
      //     question: "What is polymorphism?",
      //     transcript: "Polymorphism means...",
      //     answeredAt: Date
      //   }
      // ]
      // =================================================

      answers: {
        type: [
          vivaAttemptAnswerSchema,
        ],

        default: [],
      },

      // =================================================
      // MARKS
      // =================================================
      // IMPORTANT:
      // Marks are NEVER sent to the student through
      // public Viva APIs.
      // =================================================

      totalMarks: {
        type: Number,
        default: 0,
        min: 0,
      },

      // =================================================
      // EVALUATION STATUS
      // =================================================

      evaluated: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

// =====================================================
// ONE ATTEMPT PER STUDENT PER VIVA
// =====================================================

vivaAttemptSchema.index(
  {
    vivaSession: 1,
    student: 1,
  },
  {
    unique: true,
  }
);

// =====================================================
// ANSWER LOOKUP INDEX
// =====================================================
// Helps find an answer for a particular question
// inside a student's Viva attempt.
// =====================================================

vivaAttemptSchema.index({
  vivaSession: 1,
  student: 1,
  "answers.questionNumber": 1,
});

// =====================================================
// CURRENT QUESTION LOOKUP
// =====================================================

vivaAttemptSchema.index({
  vivaSession: 1,
  status: 1,
  currentQuestionIndex: 1,
});

// =====================================================
// EXPORT MODEL
// =====================================================

module.exports =
  mongoose.model(
    "VivaAttempt",
    vivaAttemptSchema
  );