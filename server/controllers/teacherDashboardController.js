const Assignment = require("../models/Assignment");
const Student = require("../models/Student");
const VivaSession = require("../models/VivaSession");

// =====================================================
// GET ASSIGNED CLASSES FOR TEACHER
// =====================================================
const getAssignedClasses = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const assignments = await Assignment.find({
      teacher: teacherId,
      status: "Active",
    })
      .populate("department")
      .populate("subject")
      .populate("class")
      .lean();

    // Attach student count for each class
    const assignmentsWithStudentCount = await Promise.all(
      assignments.map(async (item) => {
        if (!item.class) return { ...item, studentCount: 0 };
        const classIdStr = item.class._id.toString();
        const studentCount = await Student.countDocuments({
          $or: [{ classId: classIdStr }, { classId: item.class.code }],
        });
        return {
          ...item,
          studentCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: assignmentsWithStudentCount.length,
      assignments: assignmentsWithStudentCount,
    });
  } catch (error) {
    console.error("Get Assigned Classes Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned classes.",
    });
  }
};

// =====================================================
// GET TEACHER DASHBOARD STATS
// =====================================================
const getTeacherDashboardStats = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // 1. Active assignments
    const activeAssignments = await Assignment.find({
      teacher: teacherId,
      status: "Active",
    });

    const classIds = [
      ...new Set(
        activeAssignments
          .map((a) => a.class?.toString())
          .filter(Boolean)
      ),
    ];

    const subjectIds = [
      ...new Set(
        activeAssignments
          .map((a) => a.subject?.toString())
          .filter(Boolean)
      ),
    ];

    // 2. Enrolled students across teacher's classes
    const totalStudents = await Student.countDocuments({
      classId: { $in: classIds },
    });

    // 3. Viva sessions for teacher
    const totalSessions = await VivaSession.countDocuments({
      teacher: teacherId,
    });

    // 4. Today's viva sessions
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaySessions = await VivaSession.countDocuments({
      teacher: teacherId,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    res.status(200).json({
      success: true,
      stats: {
        classes: classIds.length,
        subjects: subjectIds.length,
        students: totalStudents,
        sessions: totalSessions,
        today: todaySessions,
      },
    });
  } catch (error) {
    console.error("Get Teacher Dashboard Stats Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics.",
    });
  }
};

module.exports = {
  getAssignedClasses,
  getTeacherDashboardStats,
};