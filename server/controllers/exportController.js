const User = require("../models/User");
const Department = require("../models/Department");
const Subject = require("../models/Subject");
const Class = require("../models/Class");
const Assignment = require("../models/Assignment");

const getDashboardExport = async (req, res) => {
  try {
    const [
      teachers,
      departments,
      subjects,
      classes,
      assignments,
      recentTeachers,
      recentDepartments,
      recentSubjects,
      recentClasses,
      recentAssignments,
    ] = await Promise.all([
      User.countDocuments({ role: "teacher" }),
      Department.countDocuments(),
      Subject.countDocuments(),
      Class.countDocuments(),
      Assignment.countDocuments(),

      User.find({ role: "teacher" })
        .select("name createdAt")
        .sort({ createdAt: -1 })
        .limit(5),

      Department.find()
        .select("name createdAt")
        .sort({ createdAt: -1 })
        .limit(5),

      Subject.find()
        .select("name createdAt")
        .sort({ createdAt: -1 })
        .limit(5),

      Class.find()
        .select("name createdAt")
        .sort({ createdAt: -1 })
        .limit(5),

      Assignment.find()
        .populate("teacher", "name")
        .populate("class", "name")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    let activities = [];

    recentTeachers.forEach((teacher) => {
      activities.push({
        type: "Teacher",
        activity: `Teacher "${teacher.name}" was added`,
        createdAt: teacher.createdAt,
      });
    });

    recentDepartments.forEach((department) => {
      activities.push({
        type: "Department",
        activity: `Department "${department.name}" was created`,
        createdAt: department.createdAt,
      });
    });

    recentSubjects.forEach((subject) => {
      activities.push({
        type: "Subject",
        activity: `Subject "${subject.name}" was added`,
        createdAt: subject.createdAt,
      });
    });

    recentClasses.forEach((cls) => {
      activities.push({
        type: "Class",
        activity: `Class "${cls.name}" was created`,
        createdAt: cls.createdAt,
      });
    });

    recentAssignments.forEach((assignment) => {
      activities.push({
        type: "Assignment",
        activity: `${assignment.teacher?.name || "Teacher"} assigned to ${
          assignment.class?.name || "Class"
        }`,
        createdAt: assignment.createdAt,
      });
    });

    activities.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      success: true,

      report: {
        adminName: req.user?.name || "Administrator",

        generatedDate: new Date(),

        statistics: {
          teachers,
          departments,
          subjects,
          classes,
          assignments,
        },

        recentActivities: activities.slice(0, 10),
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate dashboard export.",
    });
  }
};

// ======================================================
// Helper: Collect Session Student Results & Marks Map
// ======================================================
const getSessionMarksData = async (sessionId, teacherId) => {
  const VivaSession = require("../models/VivaSession");
  const VivaAttempt = require("../models/VivaAttempt");
  const Student = require("../models/Student");

  const query = { sessionId: sessionId.trim() };
  if (teacherId) {
    query.teacher = teacherId;
  }

  const session = await VivaSession.findOne(query)
    .populate("class")
    .populate("subject")
    .populate("department")
    .lean();

  if (!session) {
    throw new Error("Viva session not found.");
  }

  // Resolve eligible students
  let eligibleStudents = [];
  if (session.studentSelectionMode === "selected" && Array.isArray(session.selectedStudents) && session.selectedStudents.length > 0) {
    eligibleStudents = await Student.find({
      _id: { $in: session.selectedStudents },
    }).lean();
  } else if (session.class) {
    const classIdStr = session.class._id ? session.class._id.toString() : session.class.toString();
    eligibleStudents = await Student.find({
      $or: [
        { class: session.class._id || session.class },
        { classId: classIdStr },
      ],
    }).lean();
  }

  // Fetch attempts
  const attempts = await VivaAttempt.find({
    vivaSession: session._id,
  }).populate("student").lean();

  const attemptByEnrollment = new Map();
  const attemptByStudentId = new Map();

  attempts.forEach((att) => {
    if (att.student && att.student._id) {
      attemptByStudentId.set(att.student._id.toString(), att);
      const enr = att.student.enrollmentNumber || att.student.enrollment;
      if (enr) {
        attemptByEnrollment.set(enr.trim().toLowerCase(), att);
      }
    }
  });

  const marksMap = new Map();
  const studentResults = eligibleStudents.map((st) => {
    const stId = st._id.toString();
    const stEnr = (st.enrollmentNumber || st.enrollment || "").trim().toLowerCase();
    const att = attemptByStudentId.get(stId) || attemptByEnrollment.get(stEnr) || null;

    const isCompleted = att?.status === "Completed";
    const isEvaluated = Boolean(att?.evaluated);
    const marks = isEvaluated ? att.totalMarks : (isCompleted ? att.totalMarks : null);
    const maxMarks = session.totalMarks || 20;
    const percentage = isEvaluated && typeof marks === "number" ? Math.round((marks / maxMarks) * 100) : null;
    const status = isCompleted ? "Completed" : "Pending";

    if (stEnr) {
      marksMap.set(stEnr, {
        marks: marks !== null ? marks : "—",
        status,
        percentage: percentage !== null ? percentage : "—",
      });
    }

    return {
      studentId: st._id,
      name: st.name || st.studentName || "—",
      enrollmentNumber: st.enrollmentNumber || st.enrollment || "—",
      vivaStatus: status,
      marks,
      maxMarks,
      percentage,
      completedAt: att?.completedAt || null,
    };
  });

  return { session, studentResults, marksMap };
};

// ======================================================
// Export Generated Viva Results Excel (Phase 15)
// GET /api/export/viva/:sessionId/excel
// ======================================================
const exportVivaSessionExcel = async (req, res) => {
  try {
    const teacherId = req.user?._id || req.user?.id;
    const { sessionId } = req.params;

    const { generateVivaResultsExcel } = require("../services/excelService");
    const { session, studentResults } = await getSessionMarksData(sessionId, teacherId);

    const excelBuffer = generateVivaResultsExcel(session, studentResults);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Viva_Results_${sessionId}.xlsx"`
    );

    return res.status(200).send(excelBuffer);
  } catch (error) {
    console.error("Export Viva Session Excel Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to export viva results to Excel.",
    });
  }
};

// ======================================================
// Populate Original / Uploaded Excel Sheet (Phase 15)
// POST /api/export/viva/:sessionId/populate-excel
// ======================================================
const populateUploadedExcel = async (req, res) => {
  try {
    const teacherId = req.user?._id || req.user?.id;
    const { sessionId } = req.params;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "Original Excel file is required.",
      });
    }

    const { populateExistingExcel } = require("../services/excelService");
    const { marksMap } = await getSessionMarksData(sessionId, teacherId);

    const populatedBuffer = populateExistingExcel(req.file.buffer, marksMap);

    const originalName = req.file.originalname
      ? req.file.originalname.replace(/\.[^/.]+$/, "")
      : "Results";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Populated_${originalName}.xlsx"`
    );

    return res.status(200).send(populatedBuffer);
  } catch (error) {
    console.error("Populate Uploaded Excel Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to populate original Excel sheet.",
    });
  }
};

module.exports = {
  getDashboardExport,
  exportVivaSessionExcel,
  populateUploadedExcel,
};