export const validateStudents = (rows) => {
  const errors = [];
  const cleanedStudents = [];
  const enrollmentSet = new Set();

  rows.forEach((row, index) => {
    const keys = Object.keys(row);

    const enrollmentKey =
      keys.find((key) =>
        key.toLowerCase().includes("enrollment")
      ) || "";

    const nameKey =
      keys.find((key) =>
        key.toLowerCase().includes("name")
      ) || "";

    const enrollmentNo = String(
      row[enrollmentKey] || ""
    ).trim();

    const studentName = String(
      row[nameKey] || ""
    ).trim();

    // Ignore completely empty rows
    if (!enrollmentNo && !studentName) {
      return;
    }

    if (!enrollmentNo) {
      errors.push(
        `Row ${index + 2}: Enrollment Number is missing.`
      );
      return;
    }

    if (!studentName) {
      errors.push(
        `Row ${index + 2}: Student Name is missing.`
      );
      return;
    }

    if (enrollmentSet.has(enrollmentNo)) {
      errors.push(
        `Row ${index + 2}: Duplicate Enrollment Number (${enrollmentNo}).`
      );
      return;
    }

    enrollmentSet.add(enrollmentNo);

    cleanedStudents.push({
      enrollmentNo,
      studentName,
    });
  });

  return {
    students: cleanedStudents,
    errors,
  };
};