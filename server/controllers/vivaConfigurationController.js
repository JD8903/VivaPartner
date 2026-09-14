const mongoose = require("mongoose");
const VivaConfiguration = require("../models/VivaConfiguration");

// ==========================================
// CREATE OR UPSERT CONFIGURATION
// ==========================================

const createConfiguration = async (req, res) => {
  try {
    const teacherId =
      req.user?._id ||
      req.user?.id ||
      req.body.teacherId ||
      req.body.teacher ||
      null;

    const assignmentId = req.body.assignmentId || req.body.assignment;
    const classId = req.body.classId || req.body.class;

    const {
      students,
      selectedStudents,
      studentSelectionMode,
      studentsPerViva,
      numberOfQuestions,
      difficulty,
      questionType,
      timeLimit,
      timeType,
      totalMarks,
      language,
      rules,
      aiSettings,
    } = req.body;

    // Required fields
    if (!assignmentId || !classId) {
      return res.status(400).json({
        success: false,
        message: "Assignment and class are required to configure a Viva.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(assignmentId) ||
      !mongoose.Types.ObjectId.isValid(classId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment or class identifier.",
      });
    }

    const targetStudents =
      Array.isArray(selectedStudents) && selectedStudents.length > 0
        ? selectedStudents
        : Array.isArray(students)
        ? students
        : [];

    const selectionMode =
      studentSelectionMode === "selected" ||
      (targetStudents.length > 0 && !studentSelectionMode)
        ? "selected"
        : "all";

    if (selectionMode === "selected" && targetStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please select at least one student when specific targeting mode is enabled.",
      });
    }

    const parsedNumberOfQuestions =
      numberOfQuestions !== undefined ? Number(numberOfQuestions) : 5;
    const parsedTimeLimit =
      timeLimit !== undefined ? Number(timeLimit) : 5;
    const parsedTotalMarks =
      totalMarks !== undefined ? Number(totalMarks) : 20;
    const parsedStudentsPerViva =
      studentsPerViva !== undefined ? Number(studentsPerViva) : 1;

    if (parsedNumberOfQuestions < 1) {
      return res.status(400).json({
        success: false,
        message: "Number of questions must be at least 1.",
      });
    }

    if (parsedTimeLimit < 1) {
      return res.status(400).json({
        success: false,
        message: "Time limit must be at least 1 minute.",
      });
    }

    if (parsedTotalMarks < 1) {
      return res.status(400).json({
        success: false,
        message: "Total marks must be greater than 0.",
      });
    }

    // Check if configuration already exists for this assignment
    let configuration = await VivaConfiguration.findOne({
      assignment: assignmentId,
    });

    if (configuration) {
      // Upsert: Update existing configuration
      configuration.teacher = teacherId || configuration.teacher;
      configuration.class = classId;
      configuration.students = targetStudents;
      configuration.selectedStudents = targetStudents;
      configuration.studentSelectionMode = selectionMode;
      configuration.studentsPerViva = parsedStudentsPerViva;
      configuration.numberOfQuestions = parsedNumberOfQuestions;
      configuration.difficulty = difficulty || configuration.difficulty || "Medium";
      configuration.questionType = questionType || configuration.questionType || "Mixed";
      configuration.timeLimit = parsedTimeLimit;
      configuration.timeType = timeType || configuration.timeType || "perStudent";
      configuration.totalMarks = parsedTotalMarks;
      configuration.language = language || configuration.language || "English";

      if (rules) {
        configuration.rules = {
          ...configuration.rules?.toObject?.(),
          ...rules,
        };
      }

      if (aiSettings) {
        configuration.aiSettings = {
          ...configuration.aiSettings?.toObject?.(),
          ...aiSettings,
        };
      }

      configuration.status = "Saved";
      await configuration.save();

      return res.status(200).json({
        success: true,
        message: "Viva configuration updated successfully.",
        configuration,
      });
    }

    configuration = await VivaConfiguration.create({
      teacher: teacherId,
      assignment: assignmentId,
      class: classId,
      students: targetStudents,
      selectedStudents: targetStudents,
      studentSelectionMode: selectionMode,
      studentsPerViva: parsedStudentsPerViva,
      numberOfQuestions: parsedNumberOfQuestions,
      difficulty: difficulty || "Medium",
      questionType: questionType || "Mixed",
      timeLimit: parsedTimeLimit,
      timeType: timeType || "perStudent",
      totalMarks: parsedTotalMarks,
      language: language || "English",

      rules: {
        randomQuestions: rules?.randomQuestions ?? true,
        noRepeatedQuestions: rules?.noRepeatedQuestions ?? true,
        allowSkip: rules?.allowSkip ?? true,
        followUpQuestions: rules?.followUpQuestions ?? false,
        hintMode: rules?.hintMode ?? false,
        autoSave: rules?.autoSave ?? true,
      },

      aiSettings: {
        voice: aiSettings?.voice || "Female",
        speechSpeed: aiSettings?.speechSpeed || "Normal",
        personality: aiSettings?.personality || "Professional",
      },

      status: "Saved",
    });

    return res.status(201).json({
      success: true,
      message: "Viva configuration saved successfully.",
      configuration,
    });
  } catch (error) {
    console.error("Create Viva Configuration Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save viva configuration.",
      error: error.message,
    });
  }
};

// ==========================================
// GET CONFIGURATION
// ==========================================

const getConfiguration = async (req, res) => {
  try {
    const configuration = await VivaConfiguration.findById(req.params.id)
      .populate("assignment")
      .populate("class")
      .populate("students")
      .populate("selectedStudents");

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: "Viva configuration not found.",
      });
    }

    return res.status(200).json({
      success: true,
      configuration,
    });
  } catch (error) {
    console.error(
      "Get Viva Configuration Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch viva configuration.",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE CONFIGURATION
// ==========================================

const updateConfiguration = async (req, res) => {
  try {
    const configuration =
      await VivaConfiguration.findById(
        req.params.id
      );

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: "Viva configuration not found.",
      });
    }

    const {
      students,
      selectedStudents,
      studentSelectionMode,
      studentsPerViva,
      numberOfQuestions,
      difficulty,
      questionType,
      timeLimit,
      timeType,
      totalMarks,
      language,
      rules,
      aiSettings,
    } = req.body;

    const targetStudents = selectedStudents !== undefined ? selectedStudents : students;
    if (targetStudents !== undefined) {
      configuration.students = targetStudents;
      configuration.selectedStudents = targetStudents;
    }

    if (studentSelectionMode !== undefined) {
      configuration.studentSelectionMode = studentSelectionMode;
    }

    if (studentsPerViva !== undefined)
      configuration.studentsPerViva =
        Number(studentsPerViva);

    if (numberOfQuestions !== undefined)
      configuration.numberOfQuestions =
        Number(numberOfQuestions);

    if (difficulty !== undefined)
      configuration.difficulty = difficulty;

    if (questionType !== undefined)
      configuration.questionType = questionType;

    if (timeLimit !== undefined)
      configuration.timeLimit = Number(timeLimit);

    if (timeType !== undefined)
      configuration.timeType = timeType;

    if (totalMarks !== undefined)
      configuration.totalMarks =
        Number(totalMarks);

    if (language !== undefined)
      configuration.language = language;

    if (rules) {
      configuration.rules = {
        ...configuration.rules.toObject(),
        ...rules,
      };
    }

    if (aiSettings) {
      configuration.aiSettings = {
        ...configuration.aiSettings.toObject(),
        ...aiSettings,
      };
    }

    await configuration.save();

    return res.status(200).json({
      success: true,
      message:
        "Viva configuration updated successfully.",
      configuration,
    });
  } catch (error) {
    console.error(
      "Update Viva Configuration Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update viva configuration.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE CONFIGURATION
// ==========================================

const deleteConfiguration = async (req, res) => {
  try {
    const configuration =
      await VivaConfiguration.findById(
        req.params.id
      );

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: "Viva configuration not found.",
      });
    }

    await VivaConfiguration.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Viva configuration deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Viva Configuration Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete viva configuration.",
      error: error.message,
    });
  }
};

module.exports = {
  createConfiguration,
  getConfiguration,
  updateConfiguration,
  deleteConfiguration,
};