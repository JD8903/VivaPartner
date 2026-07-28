const VivaSession = require("../models/VivaSession");
const Assignment = require("../models/Assignment");

// Generate Session ID
const generateSessionId = async () => {
  const today = new Date();

  const date =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  const count = await VivaSession.countDocuments();

  return `VS-${date}-${String(count + 1).padStart(4, "0")}`;
};

// Create Viva Session
const createVivaSession = async (req, res) => {
  try {
    const {
      assignmentId,
      studentsPerViva,
      numberOfQuestions,
      difficulty,
    } = req.body;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const sessionId = await generateSessionId();

    const session = await VivaSession.create({
      sessionId,
      teacher: assignment.teacher,
      assignment: assignment._id,
      class: assignment.class,
      department: assignment.department,
      subject: assignment.subject,
      studentsPerViva,
      numberOfQuestions,
      difficulty,
      status: "Created",
    });

    res.status(201).json({
      success: true,
      message: "Viva Session created successfully.",
      session,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Viva Session
const getVivaSession = async (req, res) => {
  try {
    const session = await VivaSession.findById(req.params.id)
      .populate("teacher")
      .populate("department")
      .populate("subject")
      .populate("class")
      .populate("assignment");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createVivaSession,
  getVivaSession,
};