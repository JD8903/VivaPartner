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

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

studentSchema.virtual("enrollmentNumber").get(function () {
  return this.enrollment;
});

studentSchema.virtual("enrollmentNo").get(function () {
  return this.enrollment;
});

studentSchema.virtual("studentName").get(function () {
  return this.name;
});

studentSchema.set("toJSON", { virtuals: true });
studentSchema.set("toObject", { virtuals: true });

studentSchema.index({ classId: 1 });
studentSchema.index({ class: 1 });

module.exports = mongoose.model("Student", studentSchema);