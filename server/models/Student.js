const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    enrollment: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    semester: {
      type: Number,
      required: true,
    },

    classId: {
      type: String,
      required: true,
      trim: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },

    vivaStatus: {
      type: String,
      enum: ["Pending", "Completed", "Absent"],
      default: "Pending",
    },

    marks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", studentSchema);