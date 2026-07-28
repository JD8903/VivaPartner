const Assignment = require("../models/Assignment");

const getAssignedClasses = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const assignments = await Assignment.find({
      teacher: teacherId,
      status: "Active",
    })
      .populate("department")
      .populate("subject")
      .populate("class");

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Get Assigned Classes Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned classes.",
    });
  }
};

module.exports = {
  getAssignedClasses,
};