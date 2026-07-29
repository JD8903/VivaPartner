const mongoose = require("mongoose");

const studentGroupSchema = new mongoose.Schema(
  {
    // Selected Class
    classId: {
      type: String,
      required: true,
      trim: true,
    },

    // Teacher who created the group
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    // Group Number
    groupNumber: {
      type: Number,
      required: true,
    },

    // Students in this group
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
      },
    ],

    // Number of students in one viva
    studentsPerViva: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4],
    },

    // Viva Status
    vivaStatus: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "StudentGroup",
  studentGroupSchema
);