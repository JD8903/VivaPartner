const VivaConfiguration = require("../models/VivaConfiguration");

// ==========================================
// CREATE CONFIGURATION
// ==========================================

const createConfiguration = async (req, res) => {
  try {
    const {
      assignmentId,
      classId,
      teacherId,
      students,
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
        message: "Assignment and class are required.",
      });
    }

    // Prevent duplicate configuration
    const existingConfiguration =
      await VivaConfiguration.findOne({
        assignment: assignmentId,
      });

    if (existingConfiguration) {
      return res.status(409).json({
        success: false,
        message:
          "Viva configuration already exists for this assignment.",
        configuration: existingConfiguration,
      });
    }

    const configuration = await VivaConfiguration.create({
      teacher: teacherId || null,
      assignment: assignmentId,
      class: classId,
      students: students || [],
      studentsPerViva: Number(studentsPerViva) || 1,
      numberOfQuestions:
        Number(numberOfQuestions) || 5,
      difficulty: difficulty || "Medium",
      questionType: questionType || "Mixed",
      timeLimit: Number(timeLimit) || 5,
      timeType: timeType || "perStudent",
      totalMarks: Number(totalMarks) || 20,
      language: language || "English",

      rules: {
        randomQuestions:
          rules?.randomQuestions ?? true,

        noRepeatedQuestions:
          rules?.noRepeatedQuestions ?? true,

        allowSkip:
          rules?.allowSkip ?? true,

        followUpQuestions:
          rules?.followUpQuestions ?? false,

        hintMode:
          rules?.hintMode ?? false,

        autoSave:
          rules?.autoSave ?? true,
      },

      aiSettings: {
        voice:
          aiSettings?.voice || "Female",

        speechSpeed:
          aiSettings?.speechSpeed || "Normal",

        personality:
          aiSettings?.personality ||
          "Professional",
      },

      status: "Saved",
    });

    return res.status(201).json({
      success: true,
      message:
        "Viva configuration saved successfully.",
      configuration,
    });
  } catch (error) {
    console.error(
      "Create Viva Configuration Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to save viva configuration.",
      error: error.message,
    });
  }
};

// ==========================================
// GET CONFIGURATION
// ==========================================

const getConfiguration = async (req, res) => {
  try {
    const configuration =
      await VivaConfiguration.findById(req.params.id)
        .populate("assignment")
        .populate("class")
        .populate("students");

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

    if (students !== undefined)
      configuration.students = students;

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