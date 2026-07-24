import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import "./ExportButtons.css";

const ExportButtons = ({
  onExportPDF,
  onExportExcel,
  loading = false,
}) => {
  return (
    <div className="export-buttons">

      <button
        className="export-btn pdf-btn"
        onClick={onExportPDF}
        disabled={loading}
      >
        <FaFilePdf />
        Export PDF
      </button>

      <button
        className="export-btn excel-btn"
        onClick={onExportExcel}
        disabled={loading}
      >
        <FaFileExcel />
        Export Excel
      </button>

    </div>
  );
};

export default ExportButtons;