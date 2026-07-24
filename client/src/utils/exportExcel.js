import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const exportDashboardExcel = ({
  adminName = "Administrator",
  statistics = {},
  activities = [],
}) => {
  const workbook = XLSX.utils.book_new();

  const summary = [
    ["VivaPartner Dashboard Report"],
    [],
    ["Admin Name", adminName],
    ["Generated Date", new Date().toLocaleString()],
    [],
    ["Statistics", "Count"],
    ["Teachers", statistics.teachers || 0],
    ["Departments", statistics.departments || 0],
    ["Subjects", statistics.subjects || 0],
    ["Classes", statistics.classes || 0],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summary);

  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    "Dashboard Summary"
  );

  const activityData =
    activities.length > 0
      ? activities.map((activity) => ({
          Activity: activity.title,
          Date: new Date(activity.createdAt).toLocaleString(),
        }))
      : [{ Activity: "No Recent Activity", Date: "-" }];

  const activitySheet = XLSX.utils.json_to_sheet(activityData);

  XLSX.utils.book_append_sheet(
    workbook,
    activitySheet,
    "Recent Activities"
  );

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  const date = new Date()
    .toLocaleDateString("en-GB")
    .replace(/\//g, "-");

  saveAs(file, `Dashboard_Report_${date}.xlsx`);
};

export default exportDashboardExcel;