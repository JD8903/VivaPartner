const mongoose = require("mongoose");

const vivaConfigurationSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
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

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    studentsPerViva: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1,
    },

    numberOfQuestions: {
      type: Number,
      enum: [5, 10, 15, 20],
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

    timeLimit: {
      type: Number,
      default: 5,
    },

    timeType: {
      type: String,
      enum: ["perStudent", "perQuestion"],
      default: "perStudent",
    },

    totalMarks: {
      type: Number,
      default: 20,
    },

    language: {
      type: String,
      enum: ["English", "Gujarati", "Hindi"],
      default: "English",
    },

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

    status: {
      type: String,
      enum: ["Draft", "Saved", "Active", "Completed"],
      default: "Saved",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "VivaConfiguration",
  vivaConfigurationSchema
);