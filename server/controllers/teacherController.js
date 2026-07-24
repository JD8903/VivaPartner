const bcrypt = require("bcryptjs");
const User = require("../models/User");

/**
 * @desc    Create Teacher
 * @route   POST /api/teachers
 */
const createTeacher = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    // Validation
    if (!name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Check existing email
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists.",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create teacher
    const teacher = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      department,
      role: "teacher",
      status: "Active",
    });

    return res.status(201).json({
      success: true,
      message: "Teacher created successfully.",
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        role: teacher.role,
        status: teacher.status,
      },
    });
  } catch (error) {
    console.error("Create Teacher Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

/**
 * @desc    Get All Teachers
 * @route   GET /api/teachers
 */
const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select("-password");

    res.status(200).json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error("Get Teachers Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

/**
 * @desc    Get Teacher By ID
 * @route   GET /api/teachers/:id
 */
const getTeacherById = async (req, res) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
    }).select("-password");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found.",
      });
    }

    res.status(200).json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error("Get Teacher Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

/**
 * @desc    Update Teacher
 * @route   PUT /api/teachers/:id
 */
const updateTeacher = async (req, res) => {
  try {
    const { name, email, department, status } = req.body;

    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found.",
      });
    }

    // Check duplicate email
    if (email && email !== teacher.email) {
      const exists = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Email already exists.",
        });
      }

      teacher.email = email.toLowerCase().trim();
    }

    teacher.name = name ?? teacher.name;
    teacher.department = department ?? teacher.department;
    teacher.status = status ?? teacher.status;

    await teacher.save();

    res.status(200).json({
      success: true,
      message: "Teacher updated successfully.",
      teacher,
    });
  } catch (error) {
    console.error("Update Teacher Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

/**
 * @desc    Delete Teacher
 * @route   DELETE /api/teachers/:id
 */
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findOneAndDelete({
      _id: req.params.id,
      role: "teacher",
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Teacher deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Teacher Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const getTeacherCount = async (req, res) => {
  try {
    const count = await User.countDocuments({
      role: "teacher",
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherCount,
};