const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    classId: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      default: "",
    },

    topic: {
      type: String,
      default: "",
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },

    questions: [
      {
        id: Number,
        question: String,
        difficulty: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Question", questionSchema);