const Student = require("../models/Student");

// ====================================
// Shuffle Students
// ====================================

const shuffleStudents = (students) => {
  const shuffled = [...students];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled;
};

// ====================================
// Generate Student Groups
// ====================================

const generateGroups = async (req, res) => {
  try {
    const { classId, studentsPerViva } = req.body;

    console.log("\n===============================");
    console.log("Generate Student Groups");
    console.log("===============================");
    console.log("Requested Class ID :", classId);
    console.log("Students Per Viva  :", studentsPerViva);

    const allStudents = await Student.find();

    console.log("\nAll Students In Database");

    allStudents.forEach((student) => {
      console.log({
        name: student.name,
        enrollment: student.enrollment,
        classId: student.classId,
      });
    });

    if (!classId || !studentsPerViva) {
      return res.status(400).json({
        success: false,
        message: "Class and Students Per Viva are required.",
      });
    }

    const limit = Number(studentsPerViva);

    if (![1, 2, 3, 4].includes(limit)) {
      return res.status(400).json({
        success: false,
        message: "Students Per Viva must be 1, 2, 3 or 4.",
      });
    }

    const students = await Student.find({
      classId,
    });

    console.log("\nMatched Students :", students.length);

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No students found for this class.\nCheck that uploaded students belong to the selected class.",
      });
    }

    const shuffledStudents = shuffleStudents(students);

    const groups = [];

    let groupNumber = 1;

    for (
      let i = 0;
      i < shuffledStudents.length;
      i += limit
    ) {
      groups.push({
        groupNumber,
        students: shuffledStudents.slice(
          i,
          i + limit
        ),
      });

      groupNumber++;
    }

    return res.status(200).json({
      success: true,
      totalStudents: students.length,
      totalGroups: groups.length,
      studentsPerViva: limit,
      groups,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate student groups.",
      error: error.message,
    });
  }
};

module.exports = {
  generateGroups,
};