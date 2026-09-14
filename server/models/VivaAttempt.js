const mongoose = require("mongoose");

// =====================================================
// STORED STUDENT ANSWER
// =====================================================

const vivaAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
    },

    questionNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    transcript: {
      type: String,
      default: "",
      trim: true,
    },

    answeredAt: {
      type: Date,
      default: Date.now,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    feedback: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
  }
);

// =====================================================
// VIVA ATTEMPT
// =====================================================

const vivaAttemptSchema = new mongoose.Schema(
  {
    // =====================================================
    // VIVA SESSION
    // =====================================================

    vivaSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VivaSession",
      required: true,
      index: true,
    },

    // =====================================================
    // STUDENT
    // =====================================================

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    // =====================================================
    // TIMING
    // =====================================================

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // =====================================================
    // ATTEMPT STATUS
    // =====================================================

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

    // =====================================================
    // CURRENT QUESTION
    // =====================================================

    currentQuestionIndex: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // QUESTIONS ALREADY DELIVERED
    //
    // Used to prevent duplicate questions.
    // =====================================================

    questionIdsAsked: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    // =====================================================
    // STUDENT ANSWERS
    //
    // IMPORTANT:
    // These are NEVER returned through public APIs.
    // =====================================================

    answers: {
      type: [vivaAnswerSchema],
      default: [],
    },

    // =====================================================
    // MARKS
    //
    // NEVER expose through student APIs.
    // =====================================================

    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // EVALUATION
    // =====================================================

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

module.exports = mongoose.model(
  "VivaAttempt",
  vivaAttemptSchema
);