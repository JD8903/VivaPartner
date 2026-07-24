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

    res.status(500).json({
      success: false,
      message: "Unable to generate dashboard export.",
    });
  }
};

module.exports = {
  getDashboardExport,
};