const mongoose = require("mongoose");

const studyMaterialSchema = new mongoose.Schema(
  {
    vivaSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VivaSession",
      required: true,
    },

    vivaConfigurationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VivaConfiguration",
      default: null,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
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

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },

    materialType: {
      type: String,
      enum: ["PDF", "PPTX", "DOCX", "TXT", "Topic"],
      default: "Topic",
    },

    topic: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },

    fileName: {
      type: String,
      trim: true,
      default: "",
    },

    filePath: {
      type: String,
      trim: true,
      default: "",
    },

    fileType: {
      type: String,
      trim: true,
      uppercase: true,
      enum: ["", "PDF", "PPTX", "DOCX", "TXT"],
      default: "",
    },

    fileSize: {
      type: Number,
      min: 0,
      default: 0,
    },

    extractedText: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Uploading", "Processing", "Ready", "Failed"],
      default: "Ready",
    },
  },
  { timestamps: true }
);

studyMaterialSchema.index(
  { vivaSession: 1, fileName: 1 },
  {
    unique: true,
    partialFilterExpression: {
      fileName: { $exists: true, $ne: "" },
    },
  }
);

studyMaterialSchema.index({
  vivaConfigurationId: 1,
  createdAt: -1,
});

studyMaterialSchema.index({
  vivaSession: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "StudyMaterial",
  studyMaterialSchema
);
