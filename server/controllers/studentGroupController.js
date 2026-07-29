const Student = require("../models/Student");

// Fisher-Yates Shuffle
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

const generateGroups = async (req, res) => {
  try {
    const { classId, studentsPerViva } = req.body;

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

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found for this class.",
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
    });
  }
};

module.exports = {
  generateGroups,
};