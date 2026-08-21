const Student = require("../models/Student");
const Class = require("../models/Class");
const { parseExcel } = require("../services/excelService");

const uploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required.",
      });
    }

    const { classId, teacher } = req.body;

    let students = parseExcel(req.file.buffer);

    console.log("Students raw count:", students.length);

    if (!students || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty.",
      });
    }

    // Remove empty rows
    students = students.filter((row) =>
      Object.values(row).some(
        (value) => value !== "" && value !== null && value !== undefined
      )
    );

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file contains no non-empty rows.",
      });
    }

    // Helper to find a key matching some names
    const getRowValue = (row, names) => {
      const keys = Object.keys(row);
      for (const name of names) {
        const key = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, "").includes(name.toLowerCase().replace(/[^a-z0-9]/g, "")));
        if (key) return row[key];
      }
      return null;
    };

    // If Class information is missing in Excel, we look up from the class database
    let defaultClassDoc = null;
    if (classId) {
      defaultClassDoc = await Class.findById(classId).populate("department");
    }

    const firstRow = students[0];
    const enrollmentKeyUsed = Object.keys(firstRow).find(k => k.toLowerCase().includes("enrollment") || k.toLowerCase() === "roll no" || k.toLowerCase() === "rollnumber");
    const nameKeyUsed = Object.keys(firstRow).find(k => k.toLowerCase().includes("name"));

    if (!enrollmentKeyUsed || !nameKeyUsed) {
      return res.status(400).json({
        success: false,
        message: "Missing essential columns. Excel must contain 'Enrollment No' and 'Student Name' columns.",
      });
    }

    // Duplicate check inside Excel
    const seen = new Set();
    const duplicateInExcel = [];

    students.forEach((row) => {
      const val = row[enrollmentKeyUsed];
      const enrollment = val ? String(val).trim() : "";
      if (!enrollment) return;

      if (seen.has(enrollment)) {
        duplicateInExcel.push(enrollment);
      } else {
        seen.add(enrollment);
      }
    });

    const importedStudents = [];
    const skippedStudents = [];

    for (const row of students) {
      const val = row[enrollmentKeyUsed];
      const enrollment = val ? String(val).trim() : "";
      if (!enrollment) continue;

      // Skip duplicate rows inside Excel
      if (duplicateInExcel.includes(enrollment)) {
        if (skippedStudents.includes(enrollment)) {
          continue;
        }
        skippedStudents.push(enrollment);
        continue;
      }

      const exists = await Student.findOne({ enrollment });

      if (exists) {
        skippedStudents.push(enrollment);
        continue;
      }

      // Extract details
      const studentName = String(row[nameKeyUsed] || "").trim();
      
      // Determine department, semester, class values
      let deptVal = getRowValue(row, ["department", "dept"]);
      let semVal = getRowValue(row, ["semester", "sem"]);
      let classVal = getRowValue(row, ["class", "classid"]);

      if (!deptVal && defaultClassDoc) {
        deptVal = defaultClassDoc.department ? defaultClassDoc.department.name : "";
      }
      if (!semVal && defaultClassDoc) {
        semVal = defaultClassDoc.semester;
      }
      if (!classVal && defaultClassDoc) {
        classVal = defaultClassDoc.name;
      }

      const studentData = {
        enrollment,
        name: studentName,
        department: String(deptVal || "General").trim(),
        semester: Number(semVal || 1),
        classId: classId || String(classVal || "").trim(),
        vivaStatus: "Pending",
        marks: 0,
      };

      // Only save teacher if it exists
      if (teacher && teacher !== "") {
        studentData.teacher = teacher;
      }

      const student = await Student.create(studentData);
      importedStudents.push(student);
    }

    return res.status(201).json({
      success: true,
      message: "Students imported successfully.",
      summary: {
        totalRows: students.length,
        imported: importedStudents.length,
        skipped: skippedStudents.length,
        duplicateInExcel: duplicateInExcel.length,
      },
      duplicateInExcel,
      skippedEnrollments: skippedStudents,
      students: importedStudents,
    });
  } catch (error) {
    console.error("Student Import Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to import students.",
      error: error.message,
    });
  }
};

const getStudents = async (req, res) => {
  try {
    const {
      search,
      classId,
      department,
      page = 1,
      limit = 10,
    } = req.query;

    let filter = {};

    if (search && search.trim() !== "") {
      filter.$or = [
        {
          enrollment: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    if (classId && classId.trim() !== "") {
      filter.classId = classId;
    }

    if (department && department.trim() !== "") {
      filter.department = department;
    }

    const currentPage = parseInt(page);
    const rowsPerPage = parseInt(limit);

    const totalStudents = await Student.countDocuments(filter);

    const students = await Student.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * rowsPerPage)
      .limit(rowsPerPage);

    return res.status(200).json({
      success: true,
      students,
      pagination: {
        totalStudents,
        currentPage,
        rowsPerPage,
        totalPages: Math.ceil(totalStudents / rowsPerPage),
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch students.",
    });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      enrollment,
      name,
      department,
      semester,
      classId,
      vivaStatus,
      marks,
    } = req.body;

    if (
      !enrollment ||
      !name ||
      !department ||
      !semester ||
      !classId
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory.",
      });
    }

    const existingStudent = await Student.findOne({
      enrollment,
      _id: { $ne: id },
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Enrollment number already exists.",
      });
    }

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    student.enrollment = enrollment;
    student.name = name;
    student.department = department;
    student.semester = Number(semester);
    student.classId = classId;
    student.vivaStatus = vivaStatus;
    student.marks = Number(marks);

    await student.save();

    return res.status(200).json({
      success: true,
      message: "Student updated successfully.",
      student,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update student.",
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    await Student.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete student.",
    });
  }
};

module.exports = {
  uploadStudents,
  getStudents,
  updateStudent,
  deleteStudent,
};