const mongoose = require("mongoose");

const vivaSessionQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Mixed"],
      default: "Medium",
    },
  },
  { _id: false }
);

const vivaSessionSchema = new mongoose.Schema(
  {
    // ==================================================
    // SESSION INFORMATION
    // ==================================================

    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    topic: {
      type: String,
      default: "Viva Session",
      trim: true,
    },

    studyMaterial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyMaterial",
      default: null,
    },

    vivaConfiguration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VivaConfiguration",
      default: null,
    },

    // ==================================================
    // GENERATED QUESTIONS SNAPSHOT
    // ==================================================

    questions: {
      type: [vivaSessionQuestionSchema],
      default: [],
    },

    // ==================================================
    // STUDENT CONFIGURATION
    // ==================================================

    studentsPerViva: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1,
    },

    selectedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    studentSelectionMode: {
      type: String,
      enum: ["all", "selected"],
      default: "all",
    },

    // ==================================================
    // QUESTION CONFIGURATION
    // ==================================================

    numberOfQuestions: {
      type: Number,
      min: 1,
      max: 50,
      default: 5,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Mixed"],
      default: "Medium",
    },

    questionType: {
      type: String,
      enum: [
        "Theory",
        "Practical",
        "Conceptual",
        "Programming",
        "Mixed",
      ],
      default: "Mixed",
    },

    // ==================================================
    // TIME CONFIGURATION
    // ==================================================

    timeLimit: {
      type: Number,
      default: 5,
      min: 1,
    },

    timeMode: {
      type: String,
      enum: ["perStudent", "perQuestion"],
      default: "perStudent",
    },

    // ==================================================
    // MARKS
    // ==================================================

    totalMarks: {
      type: Number,
      enum: [20, 30, 50, 100],
      default: 20,
    },

    // ==================================================
    // LANGUAGE
    // ==================================================

    language: {
      type: String,
      enum: ["English", "Gujarati", "Hindi"],
      default: "English",
    },

    // ==================================================
    // VIVA RULES
    // ==================================================

    rules: {
      randomQuestions: {
        type: Boolean,
        default: true,
      },

      noRepeatedQuestions: {
        type: Boolean,
        default: true,
      },

      allowSkip: {
        type: Boolean,
        default: true,
      },

      followUpQuestions: {
        type: Boolean,
        default: false,
      },

      hintMode: {
        type: Boolean,
        default: false,
      },

      autoSave: {
        type: Boolean,
        default: true,
      },
    },

    // ==================================================
    // AI SETTINGS
    // ==================================================

    aiSettings: {
      voice: {
        type: String,
        enum: ["Male", "Female"],
        default: "Female",
      },

      speechSpeed: {
        type: String,
        enum: ["Slow", "Normal", "Fast"],
        default: "Normal",
      },

      personality: {
        type: String,
        enum: ["Professional", "Friendly", "Strict"],
        default: "Professional",
      },
    },

    // ==================================================
    // SESSION STATUS
    // ==================================================

    status: {
      type: String,
      enum: [
        "Created",
        "Configured",
        "Active",
        "Completed",
        "Cancelled",
      ],
      default: "Created",
    },

    startedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

vivaSessionSchema.index({
  teacher: 1,
  createdAt: -1,
});

vivaSessionSchema.index({
  class: 1,
  createdAt: -1,
});

vivaSessionSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "VivaSession",
  vivaSessionSchema
);