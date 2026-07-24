const User = require("../models/User");
const Department = require("../models/Department");
const Subject = require("../models/Subject");
const Class = require("../models/Class");
const Assignment = require("../models/Assignment");

// Dashboard Statistics
const getDashboardStatistics = async (req, res) => {
  try {
    const [
      teachers,
      departments,
      subjects,
      classes,
      assignments,
    ] = await Promise.all([
      User.countDocuments({ role: "teacher" }),
      Department.countDocuments(),
      Subject.countDocuments(),
      Class.countDocuments(),
      Assignment.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        teachers,
        departments,
        subjects,
        classes,
        assignments,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard statistics.",
    });
  }
};

// Recent Activities
const getRecentActivities = async (req, res) => {
  try {
    const [
      teachers,
      departments,
      subjects,
      classes,
      assignments,
    ] = await Promise.all([
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

    teachers.forEach((teacher) => {
      activities.push({
        type: "teacher",
        title: `Teacher "${teacher.name}" was added`,
        icon: "teacher",
        createdAt: teacher.createdAt,
      });
    });

    departments.forEach((department) => {
      activities.push({
        type: "department",
        title: `Department "${department.name}" was created`,
        icon: "department",
        createdAt: department.createdAt,
      });
    });

    subjects.forEach((subject) => {
      activities.push({
        type: "subject",
        title: `Subject "${subject.name}" was added`,
        icon: "subject",
        createdAt: subject.createdAt,
      });
    });

    classes.forEach((cls) => {
      activities.push({
        type: "class",
        title: `Class "${cls.name}" was created`,
        icon: "class",
        createdAt: cls.createdAt,
      });
    });

    assignments.forEach((assignment) => {
      activities.push({
        type: "assignment",
        title: `${assignment.teacher?.name || "Teacher"} assigned to ${
          assignment.class?.name || "Class"
        }`,
        icon: "assignment",
        createdAt: assignment.createdAt,
      });
    });

    activities.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    activities = activities.slice(0, 10);

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch recent activities.",
    });
  }
};

// Teachers per Department
const getTeachersPerDepartment = async (req, res) => {
  try {
    const data = await Assignment.aggregate([
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: "$department",
      },
      {
        $group: {
          _id: "$department.name",
          teachers: {
            $addToSet: "$teacher",
          },
        },
      },
      {
        $project: {
          _id: 0,
          department: "$_id",
          teachers: {
            $size: "$teachers",
          },
        },
      },
      {
        $sort: {
          department: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch teachers chart.",
    });
  }
};

// Subjects per Department
const getSubjectsPerDepartment = async (req, res) => {
  try {
    const data = await Subject.aggregate([
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: "$department",
      },
      {
        $group: {
          _id: "$department.name",
          subjects: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          department: "$_id",
          subjects: 1,
        },
      },
      {
        $sort: {
          department: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch subjects analytics.",
    });
  }
};

// Classes per Department
const getClassesPerDepartment = async (req, res) => {
  try {
    const data = await Class.aggregate([
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: "$department",
      },
      {
        $group: {
          _id: "$department.name",
          classes: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          department: "$_id",
          classes: 1,
        },
      },
      {
        $sort: {
          department: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch classes analytics.",
    });
  }
};

// Assignments per Teacher
const getAssignmentsPerTeacher = async (req, res) => {
  try {
    const data = await Assignment.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "teacher",
          foreignField: "_id",
          as: "teacher",
        },
      },
      {
        $unwind: "$teacher",
      },
      {
        $group: {
          _id: "$teacher.name",
          assignments: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          teacher: "$_id",
          assignments: 1,
        },
      },
      {
        $sort: {
          assignments: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch assignment analytics.",
    });
  }
};

module.exports = {
  getDashboardStatistics,
  getRecentActivities,
  getTeachersPerDepartment,
  getSubjectsPerDepartment,
  getClassesPerDepartment,
  getAssignmentsPerTeacher,
};