import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getStudentVivaLink } from "../../services/vivaSessionApi";
import {
  FaCopy,
  FaCheck,
  FaWhatsapp,
  FaEnvelope,
  FaExternalLinkAlt,
  FaArrowLeft,
  FaGraduationCap,
  FaBookOpen,
  FaUsers,
  FaQuestionCircle,
} from "react-icons/fa";

const ShareVivaLink = (props) => {
  const { sessionId: paramSessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState("");
  const [sessionData, setSessionData] = useState(null);
  const [configData, setConfigData] = useState(null);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Resolve sessionId from props, URL params, navigation state, or localStorage
    let activeId = props.sessionId || paramSessionId || location.state?.sessionId;

    if (!activeId) {
      try {
        const storedSession = localStorage.getItem("vivaSession");
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          activeId = parsed.sessionId || parsed.id || parsed._id;
          setSessionData(parsed);
        }
      } catch (err) {
        console.error("Failed to parse stored vivaSession:", err);
      }
    }

    try {
      const storedConfig = localStorage.getItem("vivaConfig");
      if (storedConfig) {
        setConfigData(JSON.parse(storedConfig));
      }
    } catch (e) {
      console.error("Failed to parse vivaConfig:", e);
    }

    if (activeId) {
      setSessionId(activeId);
      fetchLink(activeId);
    }
  }, [props.sessionId, paramSessionId, location.state]);

  const fetchLink = async (idToFetch) => {
    try {
      setLoading(true);
      setError("");

      const response = await getStudentVivaLink(idToFetch);

      if (response?.success && response?.link) {
        setLink(response.link);
      } else {
        // Fallback to local origin URL
        const fallback = `${window.location.origin}/viva/${idToFetch}`;
        setLink(fallback);
      }
    } catch (err) {
      console.warn("API getStudentVivaLink error, using client URL fallback:", err);
      const fallback = `${window.location.origin}/viva/${idToFetch}`;
      setLink(fallback);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Copy Link Error:", err);
      setError("Unable to copy automatically. Please copy the link manually.");
    }
  };

  const shareViaWhatsApp = () => {
    if (!link) return;
    const message = `Hello students! Here is your AI Voice Viva examination link for ${
      configData?.className || "your class"
    } (${configData?.subject || "Viva"}): ${link}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const shareViaEmail = () => {
    if (!link) return;
    const subject = encodeURIComponent(
      `AI Voice Viva Link: ${configData?.className || "Class"} - ${configData?.subject || "Exam"}`
    );
    const body = encodeURIComponent(
      `Dear Students,\n\nPlease access your independent AI Voice Viva examination using the following link:\n\n${link}\n\nMake sure to use a device with a working microphone.\n\nBest regards,\nVivaPartner`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const previewStudentView = () => {
    if (!sessionId) return;
    window.open(`/viva/${sessionId}`, "_blank");
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "32px",
        borderRadius: "20px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 10px 35px rgba(15, 23, 42, 0.06)",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "60px",
            height: "60px",
            borderRadius: "16px",
            background: "#eff6ff",
            color: "#2563eb",
            fontSize: "26px",
            marginBottom: "14px",
          }}
        >
          🔗
        </div>

        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "26px",
            fontWeight: "700",
            color: "#0f172a",
          }}
        >
          Viva Session Created & Link Ready
        </h1>

        <p style={{ margin: 0, color: "#64748b", fontSize: "15px", lineHeight: "1.5" }}>
          Share this controlled examination link with your students. Each student can independently
          take their voice viva on their own device.
        </p>
      </div>

      {/* Session Metadata Card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "14px",
          padding: "18px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          marginBottom: "25px",
        }}
      >
        <div>
          <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Session ID</span>
          <strong style={{ fontSize: "15px", color: "#0f172a", fontFamily: "monospace" }}>
            {sessionId || "GENERATING..."}
          </strong>
        </div>

        <div>
          <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Class</span>
          <strong style={{ fontSize: "14px", color: "#0f172a" }}>
            {configData?.className || "Assigned Class"}
          </strong>
        </div>

        <div>
          <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Subject</span>
          <strong style={{ fontSize: "14px", color: "#0f172a" }}>
            {configData?.subject || "Subject"}
          </strong>
        </div>

        <div>
          <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Target Students</span>
          <strong style={{ fontSize: "14px", color: "#2563eb" }}>
            {configData?.studentSelectionMode === "selected"
              ? `Specific (${configData?.selectedStudents?.length || 0})`
              : "Entire Class"}
          </strong>
        </div>
      </div>

      {/* Link Box */}
      <div
        style={{
          background: "#f1f5f9",
          border: "1.5px dashed #cbd5e1",
          borderRadius: "12px",
          padding: "18px",
          marginBottom: "24px",
        }}
      >
        <span
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: "700",
            textTransform: "uppercase",
            color: "#475569",
            marginBottom: "8px",
          }}
        >
          Unique Student Examination URL
        </span>

        {loading ? (
          <div style={{ color: "#64748b", fontSize: "14px" }}>Generating live viva link...</div>
        ) : (
          <div
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#2563eb",
              wordBreak: "break-all",
              userSelect: "all",
            }}
          >
            {link || `${window.location.origin}/viva/${sessionId}`}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "25px",
        }}
      >
        {/* Copy Button */}
        <button
          type="button"
          onClick={copyLink}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "13px 18px",
            border: "none",
            borderRadius: "10px",
            background: copied ? "#16a34a" : "#2563eb",
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {copied ? <FaCheck /> : <FaCopy />}
          {copied ? "Link Copied!" : "Copy Viva Link"}
        </button>

        {/* WhatsApp Share */}
        <button
          type="button"
          onClick={shareViaWhatsApp}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "13px 18px",
            border: "none",
            borderRadius: "10px",
            background: "#25D366",
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          <FaWhatsapp size={18} />
          Share via WhatsApp
        </button>

        {/* Email Share */}
        <button
          type="button"
          onClick={shareViaEmail}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "13px 18px",
            border: "1.5px solid #cbd5e1",
            borderRadius: "10px",
            background: "#ffffff",
            color: "#334155",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          <FaEnvelope />
          Share via Email
        </button>

        {/* Preview Student Page */}
        <button
          type="button"
          onClick={previewStudentView}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "13px 18px",
            border: "1.5px solid #cbd5e1",
            borderRadius: "10px",
            background: "#ffffff",
            color: "#334155",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          <FaExternalLinkAlt />
          Preview Student View
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* Navigation Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "20px",
          borderTop: "1px solid #e2e8f0",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/teacher/assigned-classes")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            border: "none",
            background: "none",
            color: "#64748b",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <FaArrowLeft />
          Back to Assigned Classes
        </button>

        <button
          type="button"
          onClick={() => navigate("/teacher/dashboard")}
          style={{
            padding: "10px 20px",
            border: "1.5px solid #2563eb",
            borderRadius: "8px",
            background: "#ffffff",
            color: "#2563eb",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Teacher Dashboard →
        </button>
      </div>
    </div>
  );
};

export default ShareVivaLink;