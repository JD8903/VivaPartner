import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTeacherVivaSessions,
  getSessionAnalytics,
  evaluateSessionAttempts,
} from "../../../services/vivaSessionApi";
import {
  downloadVivaResultsExcel,
  populateOriginalExcel,
} from "../../../services/reportExportApi";
import {
  FaGraduationCap,
  FaSearch,
  FaRedo,
  FaCheckCircle,
  FaClock,
  FaTrophy,
  FaChartLine,
  FaChevronRight,
  FaTimes,
  FaComments,
  FaStar,
  FaFileExcel,
  FaFileUpload,
  FaFilePdf,
} from "react-icons/fa";
import {
  exportVivaClassReportPDF,
  exportStudentReportPDF,
} from "../../../utils/exportVivaPDF";
import "./TeacherVivaResults.css";

const TeacherVivaResults = () => {
  const { sessionId: paramSessionId } = useParams();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(paramSessionId || "");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeStudentModal, setActiveStudentModal] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [populating, setPopulating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = React.useRef(null);

  // Load teacher sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch analytics whenever selectedSessionId changes
  useEffect(() => {
    if (selectedSessionId) {
      fetchAnalytics(selectedSessionId);
    }
  }, [selectedSessionId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getTeacherVivaSessions();
      if (res?.success && Array.isArray(res.sessions)) {
        setSessions(res.sessions);
        if (!selectedSessionId && res.sessions.length > 0) {
          setSelectedSessionId(res.sessions[0].sessionId);
        }
      }
    } catch (err) {
      console.error("Fetch sessions error:", err);
      setError(err.message || "Failed to load viva sessions.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (sId) => {
    try {
      setLoading(true);
      setError("");
      const res = await getSessionAnalytics(sId);
      if (res?.success) {
        setAnalytics(res);
      }
    } catch (err) {
      console.error("Fetch analytics error:", err);
      setError(err.message || "Failed to load session analytics.");
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateAll = async () => {
    if (!selectedSessionId) return;
    try {
      setEvaluating(true);
      setMessage("");
      setError("");
      const res = await evaluateSessionAttempts(selectedSessionId);
      if (res?.success) {
        setMessage(res.message || "Evaluation completed successfully!");
        await fetchAnalytics(selectedSessionId);
        setTimeout(() => setMessage(""), 4000);
      }
    } catch (err) {
      console.error("Evaluate error:", err);
      setError(err.message || "Evaluation failed.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedSessionId) return;
    try {
      setExporting(true);
      setMessage("");
      setError("");
      await downloadVivaResultsExcel(selectedSessionId);
      setMessage("Excel sheet exported successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error("Export error:", err);
      setError(err.message || "Failed to export Excel file.");
    } finally {
      setExporting(false);
    }
  };

  const handlePopulateExcelClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handlePopulateFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSessionId) return;
    try {
      setPopulating(true);
      setMessage("");
      setError("");
      await populateOriginalExcel(selectedSessionId, file);
      setMessage("Original Excel sheet populated with viva marks and downloaded successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error("Populate error:", err);
      setError(err.message || "Failed to populate original Excel file.");
    } finally {
      setPopulating(false);
    }
  };

  const handleExportClassPDF = () => {
    if (!session) return;
    try {
      exportVivaClassReportPDF({
        session,
        metrics,
        students: filteredStudents,
      });
      setMessage("Class viva PDF report downloaded successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error("Export PDF error:", err);
      setError(err.message || "Failed to generate class PDF report.");
    }
  };

  const filteredStudents = (analytics?.students || []).filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      st.vivaStatus.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const session = analytics?.session;
  const metrics = analytics?.metrics;

  return (
    <div className="teacher-viva-results">
      {/* Header */}
      <div className="results-header">
        <div>
          <h1 className="results-title">📊 Viva Results & Analytics</h1>
          <p className="results-subtitle">
            AI-evaluated voice viva marks, student spoken answers, and performance analytics.
          </p>
        </div>

        {/* Session Selector & Actions */}
        <div className="header-actions">
          {sessions.length > 0 && (
            <select
              className="session-dropdown"
              value={selectedSessionId}
              onChange={(e) => {
                setSelectedSessionId(e.target.value);
                navigate(`/teacher/results/${e.target.value}`);
              }}
            >
              {sessions.map((s) => (
                <option key={s.sessionId} value={s.sessionId}>
                  {s.class} — {s.subject} ({s.sessionId})
                </option>
              ))}
            </select>
          )}

          <button
            className="evaluate-btn"
            onClick={handleEvaluateAll}
            disabled={evaluating || loading}
          >
            <FaRedo className={evaluating ? "spin-icon" : ""} />
            <span>{evaluating ? "Evaluating..." : "AI Re-Evaluate All"}</span>
          </button>

          <button
            className="export-btn"
            onClick={handleExportExcel}
            disabled={exporting || !selectedSessionId}
            title="Download clean viva results Excel sheet"
          >
            <FaFileExcel />
            <span>{exporting ? "Exporting..." : "Export Excel"}</span>
          </button>

          <button
            className="populate-btn"
            onClick={handlePopulateExcelClick}
            disabled={populating || !selectedSessionId}
            title="Upload your original class/attendance Excel sheet to auto-fill viva marks by enrollment number"
          >
            <FaFileUpload />
            <span>{populating ? "Populating..." : "Fill Original Excel"}</span>
          </button>

          <button
            className="pdf-btn"
            onClick={handleExportClassPDF}
            disabled={!selectedSessionId || loading}
            title="Download comprehensive formatted Class Viva PDF Report"
          >
            <FaFilePdf />
            <span>Class PDF Report</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".xlsx, .xls"
            onChange={handlePopulateFileChange}
          />
        </div>
      </div>

      {message && <div className="alert-banner alert-success">✓ {message}</div>}
      {error && <div className="alert-banner alert-error">⚠️ {error}</div>}

      {/* Analytics Metric Cards */}
      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon metric-icon-blue">
              <FaGraduationCap />
            </div>
            <div>
              <div className="metric-val">{metrics.totalStudents}</div>
              <div className="metric-lbl">Total Students</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon metric-icon-green">
              <FaCheckCircle />
            </div>
            <div>
              <div className="metric-val">{metrics.completedCount}</div>
              <div className="metric-lbl">Completed Vivas</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon metric-icon-amber">
              <FaClock />
            </div>
            <div>
              <div className="metric-val">{metrics.pendingCount}</div>
              <div className="metric-lbl">Pending Vivas</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon metric-icon-purple">
              <FaChartLine />
            </div>
            <div>
              <div className="metric-val">
                {metrics.averageMarks} / {session?.totalMarks || 20}
              </div>
              <div className="metric-lbl">Class Average</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon metric-icon-yellow">
              <FaTrophy />
            </div>
            <div>
              <div className="metric-val">
                {metrics.highestMarks} / {session?.totalMarks || 20}
              </div>
              <div className="metric-lbl">Highest Mark</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-card">
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-field"
            placeholder="Search by student name or enrollment number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All ({analytics?.students?.length || 0})
          </button>
          <button
            className={`filter-btn ${statusFilter === "completed" ? "active" : ""}`}
            onClick={() => setStatusFilter("completed")}
          >
            Completed ({metrics?.completedCount || 0})
          </button>
          <button
            className={`filter-btn ${statusFilter === "pending" ? "active" : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            Pending ({metrics?.pendingCount || 0})
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="table-card">
        {loading ? (
          <div className="loading-state">Loading student viva results...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <p>No student results matching your criteria.</p>
          </div>
        ) : (
          <table className="results-table">
            <thead>
              <tr>
                <th>Enrollment No</th>
                <th>Student Name</th>
                <th>Status</th>
                <th>Marks</th>
                <th>Performance</th>
                <th>Completed At</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((st) => (
                <tr key={st.studentId}>
                  <td>
                    <span className="enr-badge">{st.enrollmentNumber}</span>
                  </td>
                  <td className="student-name-cell">{st.name}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        st.vivaStatus === "Completed"
                          ? "status-completed"
                          : "status-pending"
                      }`}
                    >
                      {st.vivaStatus}
                    </span>
                  </td>
                  <td>
                    {st.marks !== null ? (
                      <span className="marks-display">
                        <strong>{st.marks}</strong> / {st.maxMarks}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {st.percentage !== null ? (
                      <div className="progress-container">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${Math.min(100, Math.max(5, st.percentage))}%`,
                            background:
                              st.percentage >= 75
                                ? "#10b981"
                                : st.percentage >= 50
                                ? "#3b82f6"
                                : "#f59e0b",
                          }}
                        />
                        <span className="progress-text">{st.percentage}%</span>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {st.completedAt
                      ? new Date(st.completedAt).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {st.vivaStatus === "Completed" ? (
                      <div className="action-buttons-cell">
                        <button
                          className="view-transcripts-btn"
                          onClick={() => setActiveStudentModal(st)}
                          title="View spoken transcripts and AI feedback"
                        >
                          <FaComments />
                          <span>Transcripts</span>
                        </button>
                        <button
                          className="pdf-icon-btn"
                          onClick={() => exportStudentReportPDF({ session, student: st, answers: st.answers || [] })}
                          title="Download Student Scorecard PDF"
                        >
                          <FaFilePdf />
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted text-sm">Awaiting Viva</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: View Student Spoken Answers & AI Evaluation */}
      {activeStudentModal && (
        <div className="modal-overlay" onClick={() => setActiveStudentModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{activeStudentModal.name}</h2>
                <p className="text-muted">
                  Enrollment: <strong>{activeStudentModal.enrollmentNumber}</strong> | Total Marks:{" "}
                  <strong>
                    {activeStudentModal.marks} / {activeStudentModal.maxMarks}
                  </strong>
                </p>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setActiveStudentModal(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {activeStudentModal.answers.length === 0 ? (
                <p className="text-muted">No answer transcripts recorded for this attempt.</p>
              ) : (
                activeStudentModal.answers.map((ans, idx) => (
                  <div key={idx} className="answer-card">
                    <div className="answer-card-header">
                      <span className="q-badge">Question {ans.questionNumber}</span>
                      {ans.score !== undefined && (
                        <span className="score-badge">
                          <FaStar /> Score: {ans.score}
                        </span>
                      )}
                    </div>

                    <h4 className="q-text">{ans.question}</h4>

                    <div className="transcript-box">
                      <div className="transcript-label">🎙 Spoken Student Transcript:</div>
                      <p className="transcript-text">
                        "{ans.transcript || "[No answer provided]"}"
                      </p>
                    </div>

                    {ans.feedback && (
                      <div className="feedback-box">
                        <strong>💡 AI Examiner Feedback:</strong>
                        <p>{ans.feedback}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-pdf-download"
                onClick={() => exportStudentReportPDF({ session, student: activeStudentModal, answers: activeStudentModal.answers || [] })}
              >
                <FaFilePdf />
                <span>Download Scorecard PDF</span>
              </button>
              <button
                className="btn-primary"
                onClick={() => setActiveStudentModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherVivaResults;
