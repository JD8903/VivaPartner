import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  startVivaSession,
} from "../../services/vivaSessionApi";

const VivaReady = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [session, setSession] = useState(null);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // Load verified student/session
  // =====================================================

  useEffect(() => {
    loadVivaData();
  }, [sessionId]);

  const loadVivaData = () => {
    try {
      const storedData = sessionStorage.getItem(
        "studentVivaSession"
      );

      if (!storedData) {
        setError(
          "Your viva verification session has expired. Please join again."
        );

        setLoading(false);
        return;
      }

      const parsedData = JSON.parse(storedData);

      if (!parsedData?.student) {
        setError(
          "Student verification information is missing."
        );

        setLoading(false);
        return;
      }

      if (!parsedData?.session) {
        setError(
          "Viva session information is missing."
        );

        setLoading(false);
        return;
      }

      if (
        parsedData.sessionId &&
        parsedData.sessionId !== sessionId
      ) {
        setError(
          "Invalid viva session."
        );

        setLoading(false);
        return;
      }

      setStudent(parsedData.student);
      setSession(parsedData.session);

      setLoading(false);
    } catch (err) {
      console.error(
        "Load Viva Ready Error:",
        err
      );

      setError(
        "Unable to load viva information."
      );

      setLoading(false);
    }
  };

  // =====================================================
  // Start Viva
  // =====================================================

  const handleStartViva = async () => {
    try {
      setError("");
      setStarting(true);

      const response =
        await startVivaSession(sessionId);

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to start viva."
        );
      }

      // -------------------------------------------------
      // Update stored session information
      // -------------------------------------------------

      const existingData =
        JSON.parse(
          sessionStorage.getItem(
            "studentVivaSession"
          ) || "{}"
        );

      sessionStorage.setItem(
        "studentVivaSession",
        JSON.stringify({
          ...existingData,
          session: response.session,
        })
      );

      // -------------------------------------------------
      // Move to Voice Viva
      // -------------------------------------------------

      navigate(
        `/viva/${encodeURIComponent(
          sessionId
        )}/voice`
      );
    } catch (err) {
      console.error(
        "Start Viva Error:",
        err
      );

      setError(
        err.message ||
          "Unable to start viva."
      );
    } finally {
      setStarting(false);
    }
  };

  // =====================================================
  // Loading
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#fff",
          fontSize: "20px",
        }}
      >
        Loading Viva...
      </div>
    );
  }

  // =====================================================
  // Error
  // =====================================================

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          background: "#0f172a",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            background: "#fff",
            borderRadius: "20px",
            padding: "35px",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              fontSize: "50px",
              marginBottom: "15px",
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              marginBottom: "12px",
              color: "#111827",
            }}
          >
            Unable to Continue
          </h2>

          <p
            style={{
              color: "#6b7280",
              lineHeight: "1.6",
            }}
          >
            {error}
          </p>

          <button
            onClick={() =>
              navigate(
                `/viva/${encodeURIComponent(
                  sessionId
                )}`
              )
            }
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              border: "none",
              borderRadius: "9px",
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // Main Ready Screen
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px 20px",
        background:
          "linear-gradient(135deg, #0f172a, #1e293b)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "850px",
          margin: "0 auto",
        }}
      >
        {/* Header */}

        <div
          style={{
            textAlign: "center",
            color: "#fff",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              fontSize: "55px",
              marginBottom: "10px",
            }}
          >
            🎓
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "32px",
            }}
          >
            VivaPartner
          </h1>

          <p
            style={{
              margin: 0,
              color: "#cbd5e1",
            }}
          >
            Your viva examination is ready
          </p>
        </div>

        {/* Student Card */}

        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "25px",
            marginBottom: "20px",
            boxShadow:
              "0 15px 40px rgba(0,0,0,0.2)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#111827",
            }}
          >
            👤 Student Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "15px",
            }}
          >
            <div
              style={{
                padding: "15px",
                background: "#f8fafc",
                borderRadius: "10px",
              }}
            >
              <small
                style={{
                  color: "#64748b",
                }}
              >
                Student Name
              </small>

              <div
                style={{
                  marginTop: "5px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                {student?.name || "-"}
              </div>
            </div>

            <div
              style={{
                padding: "15px",
                background: "#f8fafc",
                borderRadius: "10px",
              }}
            >
              <small
                style={{
                  color: "#64748b",
                }}
              >
                Enrollment Number
              </small>

              <div
                style={{
                  marginTop: "5px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                {student?.enrollmentNumber ||
                  "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Viva Information */}

        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "25px",
            marginBottom: "20px",
            boxShadow:
              "0 15px 40px rgba(0,0,0,0.2)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#111827",
            }}
          >
            📋 Viva Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
            }}
          >
            <InfoCard
              title="Questions"
              value={
                session?.numberOfQuestions ||
                "-"
              }
              icon="❓"
            />

            <InfoCard
              title="Difficulty"
              value={
                session?.difficulty ||
                "-"
              }
              icon="📊"
            />

            <InfoCard
              title="Question Type"
              value={
                session?.questionType ||
                "-"
              }
              icon="📝"
            />

            <InfoCard
              title="Language"
              value={
                session?.language ||
                "-"
              }
              icon="🌐"
            />

            <InfoCard
              title="Time Limit"
              value={
                session?.timeLimit
                  ? `${session.timeLimit} min`
                  : "-"
              }
              icon="⏱️"
            />
          </div>
        </div>

        {/* Instructions */}

        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "25px",
            marginBottom: "20px",
            boxShadow:
              "0 15px 40px rgba(0,0,0,0.2)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#111827",
            }}
          >
            📢 Before You Start
          </h2>

          <ul
            style={{
              color: "#475569",
              lineHeight: "1.9",
              paddingLeft: "22px",
            }}
          >
            <li>
              Make sure you are in a quiet
              environment.
            </li>

            <li>
              Allow microphone access when
              requested.
            </li>

            <li>
              Speak clearly while answering
              questions.
            </li>

            <li>
              Do not refresh or close the
              browser during the viva.
            </li>

            <li>
              Keep a stable internet
              connection.
            </li>

            <li>
              Your marks will not be shown
              during the viva.
            </li>
          </ul>
        </div>

        {/* Error */}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "14px",
              borderRadius: "10px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* Start Button */}

        <button
          onClick={handleStartViva}
          disabled={starting}
          style={{
            width: "100%",
            padding: "18px",
            border: "none",
            borderRadius: "14px",
            background: starting
              ? "#64748b"
              : "#16a34a",
            color: "#fff",
            fontSize: "19px",
            fontWeight: "700",
            cursor: starting
              ? "not-allowed"
              : "pointer",
            boxShadow:
              "0 10px 25px rgba(0,0,0,0.2)",
          }}
        >
          {starting
            ? "Starting Viva..."
            : "🎤 Start Viva"}
        </button>

        <p
          style={{
            textAlign: "center",
            color: "#94a3b8",
            marginTop: "15px",
            fontSize: "13px",
          }}
        >
          Click Start Viva only when you
          are ready.
        </p>
      </div>
    </div>
  );
};

// =====================================================
// Info Card
// =====================================================

const InfoCard = ({
  title,
  value,
  icon,
}) => {
  return (
    <div
      style={{
        padding: "18px",
        background: "#f8fafc",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          fontSize: "24px",
          marginBottom: "8px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#64748b",
          marginBottom: "5px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontWeight: "700",
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
};

export default VivaReady;