import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Helper to format date string nicely
 */
const formatDate = (d) => {
  if (!d) return new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  try {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return String(d);
  }
};

/**
 * Generate and download comprehensive Class / Viva PDF Report
 */
export const exportVivaClassReportPDF = ({ session, metrics, students = [] }) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const sessionId = session?.sessionId || "VIVA";
  const className = session?.class?.name || session?.class || "Class";
  const subjectName = session?.subject?.name || session?.subject || "Subject";
  const topic = session?.topic || "General Topic";
  const maxMarks = session?.totalMarks || 20;
  const difficulty = session?.difficulty || "Medium";
  const generatedDate = new Date().toLocaleString();

  // ==========================================
  // Header Banner
  // ==========================================
  doc.setFillColor(37, 99, 235); // Royal Blue
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("VivaPartner", 14, 12);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(224, 231, 255);
  doc.text("AI-Powered Voice Viva Examination Platform", 14, 18);
  doc.text(`Generated: ${generatedDate}`, 14, 24);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CLASS VIVA REPORT", pageWidth - 14, 18, { align: "right" });

  // ==========================================
  // Session Information Card
  // ==========================================
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 34, pageWidth - 28, 26, 3, 3, "FD");

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");

  doc.text("CLASS / SECTION", 18, 41);
  doc.text("SUBJECT", 75, 41);
  doc.text("TOPIC", 135, 41);

  doc.text("SESSION ID", 18, 52);
  doc.text("MAX MARKS", 75, 52);
  doc.text("DIFFICULTY", 135, 52);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");

  doc.text(String(className), 18, 46);
  doc.text(String(subjectName), 75, 46);
  doc.text(String(topic).substring(0, 32), 135, 46);

  doc.setTextColor(37, 99, 235);
  doc.text(String(sessionId), 18, 57);
  doc.setTextColor(15, 23, 42);
  doc.text(`${maxMarks} Marks`, 75, 57);
  doc.text(String(difficulty), 135, 57);

  // ==========================================
  // Analytics Summary Cards Table
  // ==========================================
  const totalStudents = metrics?.totalStudents ?? students.length;
  const completedCount = metrics?.completedCount ?? students.filter(s => s.vivaStatus === "Completed").length;
  const pendingCount = metrics?.pendingCount ?? (totalStudents - completedCount);
  const averageMarks = metrics?.averageMarks !== null && metrics?.averageMarks !== undefined ? `${metrics.averageMarks} / ${maxMarks}` : "—";
  const highestMarks = metrics?.highestMarks !== null && metrics?.highestMarks !== undefined ? `${metrics.highestMarks} / ${maxMarks}` : "—";
  const lowestMarks = metrics?.lowestMarks !== null && metrics?.lowestMarks !== undefined ? `${metrics.lowestMarks} / ${maxMarks}` : "—";

  autoTable(doc, {
    startY: 64,
    head: [["Total Enrolled", "Completed", "Pending", "Average Score", "Highest Score", "Lowest Score"]],
    body: [[
      totalStudents,
      completedCount,
      pendingCount,
      averageMarks,
      highestMarks,
      lowestMarks,
    ]],
    theme: "plain",
    styles: {
      fontSize: 10,
      halign: "center",
      cellPadding: 4,
      font: "helvetica",
    },
    headStyles: {
      fillColor: [239, 246, 255],
      textColor: [30, 58, 138],
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontStyle: "bold",
    },
  });

  // ==========================================
  // Student Results Table
  // ==========================================
  const tableRows = students.map((st, idx) => {
    const isCompleted = st.vivaStatus === "Completed";
    const marksStr = isCompleted && st.marks !== null && st.marks !== undefined ? `${st.marks} / ${maxMarks}` : "—";
    const percStr = isCompleted && st.percentage !== null && st.percentage !== undefined ? `${st.percentage}%` : "—";
    const statusStr = isCompleted ? "Completed" : "Pending";

    return [
      idx + 1,
      st.enrollmentNumber || st.enrollment || "—",
      st.name || st.studentName || "—",
      statusStr,
      marksStr,
      percStr,
    ];
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["#", "Enrollment No", "Student Name", "Viva Status", "Marks Obtained", "Percentage"]],
    body: tableRows.length > 0 ? tableRows : [["—", "—", "No student records found", "—", "—", "—"]],
    theme: "striped",
    styles: {
      fontSize: 9,
      cellPadding: 3.5,
      textColor: [30, 41, 59],
      valign: "middle",
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { fontStyle: "bold", cellWidth: 32 },
      2: { cellWidth: 50 },
      3: { cellWidth: 26, halign: "center" },
      4: { cellWidth: 30, halign: "center" },
      5: { cellWidth: 24, halign: "center" },
    },
    didDrawCell: (data) => {
      // Color status green or amber
      if (data.section === "body" && data.column.index === 3) {
        if (data.cell.text[0] === "Completed") {
          data.cell.styles.textColor = [22, 101, 52]; // Green
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [180, 83, 9]; // Amber
        }
      }
    },
  });

  // ==========================================
  // Teacher Summary & AI Disclaimer
  // ==========================================
  const finalY = doc.lastAutoTable.finalY + 8;
  if (finalY < pageHeight - 35) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, finalY, pageWidth - 28, 20, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("EXAMINER NOTES & EVALUATION METHODOLOGY", 18, finalY + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Spoken voice viva answers were transcribed in real-time and evaluated semantically by AI against the session's topic and question concepts. All marks are grounded in accuracy, conceptual coverage, and clarity. Final marks are subject to institutional teacher review.",
      18,
      finalY + 10,
      { maxWidth: pageWidth - 36 }
    );
  }

  // ==========================================
  // Footer
  // ==========================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);

    doc.text(
      "CONFIDENTIAL — VivaPartner Institution & Teacher Report | Student marks are strictly private",
      14,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: "right" });
  }

  const cleanSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`Viva_Class_Report_${cleanSessionId}.pdf`);
};

/**
 * Generate and download individual Student PDF Scorecard with question-level evaluation
 */
export const exportStudentReportPDF = ({ session, student, answers = [] }) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const sessionId = session?.sessionId || "VIVA";
  const className = session?.class?.name || session?.class || "Class";
  const subjectName = session?.subject?.name || session?.subject || "Subject";
  const topic = session?.topic || "General Topic";
  const maxMarks = session?.totalMarks || 20;

  const studentName = student?.name || student?.studentName || "Student";
  const enrollmentNo = student?.enrollmentNumber || student?.enrollment || "—";
  const isCompleted = student?.vivaStatus === "Completed";
  const marks = isCompleted && student?.marks !== null && student?.marks !== undefined ? student.marks : "—";
  const percentage = isCompleted && student?.percentage !== null && student?.percentage !== undefined ? `${student.percentage}%` : "—";
  const completedDate = formatDate(student?.completedAt);

  // ==========================================
  // Header Banner
  // ==========================================
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("VivaPartner", 14, 12);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(224, 231, 255);
  doc.text("Student Voice Viva Examination Scorecard", 14, 18);
  doc.text(`Examination Session: ${sessionId}`, 14, 24);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(isCompleted ? "COMPLETED" : "PENDING", pageWidth - 14, 18, { align: "right" });

  // ==========================================
  // Student Profile Card
  // ==========================================
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 34, pageWidth - 28, 28, 3, 3, "FD");

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");

  doc.text("STUDENT NAME", 18, 41);
  doc.text("ENROLLMENT NO", 80, 41);
  doc.text("CLASS", 140, 41);

  doc.text("SUBJECT", 18, 53);
  doc.text("TOPIC", 80, 53);
  doc.text("DATE COMPLETED", 140, 53);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");

  doc.text(String(studentName), 18, 46);
  doc.setTextColor(37, 99, 235);
  doc.text(String(enrollmentNo), 80, 46);
  doc.setTextColor(15, 23, 42);
  doc.text(String(className), 140, 46);

  doc.text(String(subjectName), 18, 58);
  doc.text(String(topic).substring(0, 26), 80, 58);
  doc.text(String(completedDate), 140, 58);

  // ==========================================
  // Marks Summary Badge Box
  // ==========================================
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(14, 66, pageWidth - 28, 20, 2, 2, "FD");

  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.text("EVALUATION RESULT", 20, 75);

  doc.setFontSize(13);
  doc.setTextColor(37, 99, 235);
  doc.text(`Marks: ${marks} / ${maxMarks}`, 80, 76);

  doc.setTextColor(22, 101, 52);
  doc.text(`Percentage: ${percentage}`, 140, 76);

  // ==========================================
  // Question-by-Question Evaluation Table
  // ==========================================
  const qRows = (answers || []).map((ans, idx) => {
    const qNum = ans.questionNumber || idx + 1;
    const qText = ans.question || `Question ${qNum}`;
    const transcript = ans.transcript ? `"${ans.transcript}"` : "[No spoken answer recorded]";
    const score = ans.score !== undefined && ans.score !== null ? `${ans.score}` : "—";
    const feedback = ans.feedback || "Semantic accuracy evaluated by AI.";

    const contentBlock = `QUESTION:\n${qText}\n\nSTUDENT SPOKEN ANSWER:\n${transcript}\n\nAI EXAMINER FEEDBACK:\n${feedback}`;

    return [
      qNum,
      contentBlock,
      score,
    ];
  });

  autoTable(doc, {
    startY: 92,
    head: [["Q#", "Question, Student Spoken Transcript & Feedback", "Score"]],
    body: qRows.length > 0 ? qRows : [["—", "No recorded question answers found for this attempt.", "—"]],
    theme: "grid",
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
      textColor: [30, 41, 59],
      valign: "top",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { cellWidth: pageWidth - 28 - 12 - 20 },
      2: { halign: "center", cellWidth: 20, fontStyle: "bold" },
    },
    didParseCell: (data) => {
      // Highlight question and feedback headers inside cell
      if (data.section === "body" && data.column.index === 1) {
        // styled natively via linebreaks
      }
    },
  });

  // ==========================================
  // Footer
  // ==========================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);

    doc.text(
      "VivaPartner Confidential Student Scorecard — For Teacher & Institutional Review Only",
      14,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: "right" });
  }

  const cleanEnr = enrollmentNo.replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanSession = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`Viva_Scorecard_${cleanEnr}_${cleanSession}.pdf`);
};
