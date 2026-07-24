const Class = require("../models/Class");

// ==========================
// Create Class
// ==========================
const createClass = async (req, res) => {
  try {
    const newClass = await Class.create(req.body);

    res.status(201).json({
      success: true,
      message: "Class created successfully.",
      class: newClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Get All Classes
// ==========================
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("department", "name code")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      classes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Get Class By ID
// ==========================
const getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate("department", "name code");

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    res.json({
      success: true,
      class: classData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Update Class
// ==========================
const updateClass = async (req, res) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    res.json({
      success: true,
      message: "Class updated successfully.",
      class: updatedClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Delete Class
// ==========================
const deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(
      req.params.id
    );

    if (!deletedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    res.json({
      success: true,
      message: "Class deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Class Count
// ==========================
const getClassCount = async (req, res) => {
  try {
    const count = await Class.countDocuments();

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Get Classes By Department
// ==========================
const getClassesByDepartment = async (req, res) => {
  try {
    const classes = await Class.find({
      department: req.params.departmentId,
      status: "Active",
    })
      .populate("department", "name code")
      .sort({ semester: 1 });

    res.json({
      success: true,
      classes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassCount,
  getClassesByDepartment,
};