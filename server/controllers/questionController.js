const Question = require("../models/Question");

const saveQuestions = async (req, res) => {
  try {
    console.log("========== SAVE QUESTIONS ==========");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("====================================");

    const {
      teacher,
      classId,
      subject,
      topic,
      difficulty,
      questions,
    } = req.body;

    // Validation
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: "classId is required",
      });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Questions are required",
      });
    }

    const savedQuestion = await Question.create({
      teacher: teacher || null,
      classId,
      subject: subject || "",
      topic: topic || "",
      difficulty: difficulty || "Medium",
      questions,
    });

    console.log("Questions saved successfully.");
    console.log(savedQuestion);

    res.status(201).json({
      success: true,
      message: "Questions saved successfully.",
      data: savedQuestion,
    });

  } catch (error) {
    console.log("========== DATABASE ERROR ==========");
    console.error(error);
    console.log("====================================");

    res.status(500).json({
      success: false,
      message: "Failed to save questions.",
      error: error.message,
    });
  }
};

module.exports = {
  saveQuestions,
};