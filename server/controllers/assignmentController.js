const User = require("../models/User");
const Department = require("../models/Department");
const Subject = require("../models/Subject");
const Class = require("../models/Class");

const Assignment = require("../models/Assignment");

// Create Assignment
const createAssignment = async (req, res) => {
  try {
    const exists = await Assignment.findOne({
      teacher: req.body.teacher,
      subject: req.body.subject,
      class: req.body.class,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Assignment already exists.",
      });
    }

    const assignment = await Assignment.create(req.body);

    res.status(201).json({
      success: true,
      message: "Assignment created successfully.",
      assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("teacher", "name email")
      .populate("department", "name")
      .populate("subject", "name code")
      .populate("class", "name code")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Get Assignment By ID
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("teacher", "name email")
      .populate("department", "name")
      .populate("subject", "name code")
      .populate("class", "name code");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    res.json({
      success: true,
      assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Assignment
const updateAssignment = async (req, res) => {
  try {
    const assignment =
      await Assignment.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    res.json({
      success: true,
      message: "Assignment updated successfully.",
      assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Assignment
const deleteAssignment = async (req, res) => {
  try {
    const assignment =
      await Assignment.findByIdAndDelete(
        req.params.id
      );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    res.json({
      success: true,
      message: "Assignment deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};