const XLSX = require("xlsx");
const path = require("path");

const data = [
  { "Enrollment No": "CS2026001", "Student Name": "John Doe" },
  { "Enrollment No": "CS2026002", "Student Name": "Jane Smith" },
  { "Enrollment No": "CS2026003", "Student Name": "Alice Johnson" },
  { "Enrollment No": "CS2026004", "Student Name": "Bob Brown" }
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

const outputPath = path.join(__dirname, "students.xlsx");
XLSX.writeFile(workbook, outputPath);
console.log("Excel file generated at:", outputPath);
