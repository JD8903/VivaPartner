const Student = require("../models/Student");
const Class = require("../models/Class");
const Assignment = require("../models/Assignment");
const mongoose = require("mongoose");
const { parseExcel } = require("../services/excelService");

// Helper to find a matching column header by regex list
const findColumnKey = (row, regexList) => {
  const keys = Object.keys(row);
  for (const regex of regexList) {
    const matched = keys.find((key) => regex.test(key.trim()));
    if (matched) return matched;
  }
  return null;
};

// =====================================================
// UPLOAD STUDENTS VIA EXCEL
// =====================================================
const uploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required.",
      });
    }

    const { classId, teacher } = req.body;

    let rows = parseExcel(req.file.buffer);

    if (!rows || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty.",
      });
    }

    // Filter out rows that are entirely empty
    rows = rows.filter((row) =>
      Object.values(row).some(
        (val) => val !== "" && val !== null && val !== undefined
      )
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file contains no data rows.",
      });
    }

    // Detect column headers flexibly
    const firstRow = rows[0];

    const enrollmentKey = findColumnKey(firstRow, [
      /^enrollment(\s*(no|number|num))?$/i,
      /^roll(\s*(no|number|num))?$/i,
      /^reg(istration)?(\s*(no|number|num))?$/i,
      /enrollment/i,
      /roll/i,
    ]);

    const nameKey = findColumnKey(firstRow, [
      /^student(\s*name)?$/i,
      /^name$/i,
      /^full(\s*name)?$/i,
      /name/i,
    ]);

    if (!enrollmentKey || !nameKey) {
      return res.status(400).json({
        success: false,
        message:
          "Required columns missing. Please ensure your Excel sheet has 'Enrollment Number' (or 'Roll No') and 'Student Name' columns.",
      });
    }

    const deptKey = findColumnKey(firstRow, [
      /^department$/i,
      /^dept$/i,
      /department/i,
    ]);

    const semKey = findColumnKey(firstRow, [
      /^semester$/i,
      /^sem$/i,
      /semester/i,
    ]);

    const classKey = findColumnKey(firstRow, [
      /^class$/i,
      /^class(\s*name|code)?$/i,
      /class/i,
    ]);

    const marksKey = findColumnKey(firstRow, [
      /^marks$/i,
      /^score$/i,
      /marks/i,
    ]);

    // Lookup class metadata if classId is provided
    let defaultDepartment = "";
    let defaultSemester = 1;
    let resolvedClassId = classId || "";

    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      const cls = await Class.findById(classId).populate("department");
      if (cls) {
        resolvedClassId = cls._id.toString();
        defaultDepartment = cls.department?.name || cls.department?.code || "";
        defaultSemester = cls.semester || 1;
      }
    }

    // Process rows
    const seenInExcel = new Set();
    const duplicateInExcel = [];
    const importedStudents = [];
    const updatedStudents = [];
    const invalidRows = [];

    const effectiveTeacher =
      teacher || (req.user?.role === "teacher" ? req.user._id : null);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawEnrollment = row[enrollmentKey];
      const rawName = row[nameKey];

      const enrollment = rawEnrollment !== undefined && rawEnrollment !== null
        ? String(rawEnrollment).trim()
        : "";
      const name = rawName !== undefined && rawName !== null
        ? String(rawName).trim()
        : "";

      if (!enrollment || !name) {
        invalidRows.push({
          rowNumber: i + 2,
          reason: !enrollment ? "Missing enrollment number" : "Missing student name",
        });
        continue;
      }

      // Check duplicate within Excel
      if (seenInExcel.has(enrollment)) {
        duplicateInExcel.push(enrollment);
        continue;
      }
      seenInExcel.add(enrollment);

      // Extract row data with fallbacks
      const department =
        (deptKey && String(row[deptKey]).trim()) ||
        defaultDepartment ||
        "General";

      const semester =
        (semKey && Number(row[semKey])) ||
        defaultSemester ||
        1;

      const rowClassId =
        resolvedClassId ||
        (classKey && String(row[classKey]).trim()) ||
        "General";

      const marks = (marksKey && Number(row[marksKey])) || 0;

      // Check if student already exists in DB
      let existing = await Student.findOne({ enrollment });

      if (existing) {
        // Update existing record with current class and info
        existing.name = name;
        if (department) existing.department = department;
        if (semester) existing.semester = semester;
        if (rowClassId) existing.classId = rowClassId;
        if (effectiveTeacher) existing.teacher = effectiveTeacher;
        if (marksKey && !isNaN(marks)) existing.marks = marks;

        await existing.save();
        updatedStudents.push(existing);
      } else {
        // Create new student
        const newStudent = await Student.create({
          enrollment,
          name,
          department,
          semester,
          classId: rowClassId,
          teacher: effectiveTeacher || null,
          vivaStatus: "Pending",
          marks,
        });
        importedStudents.push(newStudent);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Successfully processed ${importedStudents.length + updatedStudents.length} students (${importedStudents.length} added, ${updatedStudents.length} updated).`,
      summary: {
        totalRows: rows.length,
        imported: importedStudents.length,
        updated: updatedStudents.length,
        duplicateInExcel: duplicateInExcel.length,
        invalidRows: invalidRows.length,
      },
      duplicateInExcel,
      invalidRows,
      students: [...importedStudents, ...updatedStudents],
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

// =====================================================
// GET STUDENTS (SEARCH + FILTER + PAGINATION)
// =====================================================
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

    // Teacher authorization: restrict to teacher's assigned classes if teacher role
    if (req.user && req.user.role === "teacher") {
      const teacherAssignments = await Assignment.find({
        teacher: req.user._id,
        status: "Active",
      }).populate("class");

      const allowedClassIds = teacherAssignments
        .map((a) => a.class?._id?.toString())
        .filter(Boolean);

      const allowedClassCodes = teacherAssignments
        .map((a) => a.class?.code)
        .filter(Boolean);

      const allAllowed = [...new Set([...allowedClassIds, ...allowedClassCodes])];

      if (classId && classId.trim() !== "") {
        filter.classId = classId;
      } else {
        filter.classId = { $in: allAllowed };
      }
    } else if (classId && classId.trim() !== "") {
      filter.classId = classId;
    }

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

    if (department && department.trim() !== "") {
      filter.department = department;
    }

    const currentPage = parseInt(page);
    const rowsPerPage = parseInt(limit);

    const totalStudents = await Student.countDocuments(filter);

    const students = await Student.find(filter)
      .sort({ enrollment: 1, createdAt: -1 })
      .skip((currentPage - 1) * rowsPerPage)
      .limit(rowsPerPage);

    return res.status(200).json({
      success: true,
      students,
      pagination: {
        totalStudents,
        currentPage,
        rowsPerPage,
        totalPages: Math.ceil(totalStudents / rowsPerPage) || 1,
      },
    });
  } catch (error) {
    console.error("Get Students Error:", error);

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