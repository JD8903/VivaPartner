import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { joinVivaSession } from "../../services/vivaSessionApi";

const StudentJoin = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [enrollmentNumber, setEnrollmentNumber] =
    useState("");

  const [studentName, setStudentName] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (event) => {
    event.preventDefault();

    setError("");

    const cleanEnrollment =
      enrollmentNumber.trim();

    const cleanName = studentName.trim();

    if (!cleanEnrollment) {
      setError(
        "Please enter your enrollment number."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await joinVivaSession(
          sessionId,
          cleanEnrollment,
          cleanName
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to join viva."
        );
      }

      // ------------------------------------------------
      // Store only safe student/session information.
      // No marks are stored here.
      // ------------------------------------------------

      sessionStorage.setItem(
        "studentVivaSession",
        JSON.stringify({
          sessionId,
          student: response.student,
          session: response.session,
        })
      );

      // ------------------------------------------------
      // Continue to next Phase 10 screen
      // ------------------------------------------------

      navigate(
        `/viva/${encodeURIComponent(
          sessionId
        )}/ready`
      );
    } catch (err) {
      console.error(
        "Student Join Error:",
        err
      );

      setError(
        err.message ||
          "Unable to join the viva."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background:
          "linear-gradient(135deg, #0f172a, #1e293b)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "35px",
          boxSizing: "border-box",
          boxShadow:
            "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "10px",
            }}
          >
            🎓
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              color: "#111827",
            }}
          >
            VivaPartner
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              lineHeight: "1.6",
            }}
          >
            Join your viva examination
            using your enrollment details.
          </p>
        </div>

        <form onSubmit={handleJoin}>
          {/* Enrollment Number */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              htmlFor="enrollmentNumber"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Enrollment Number
            </label>

            <input
              id="enrollmentNumber"
              type="text"
              value={enrollmentNumber}
              onChange={(event) => {
                setEnrollmentNumber(
                  event.target.value
                );
                setError("");
              }}
              placeholder="Enter your enrollment number"
              autoComplete="off"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Student Name */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              htmlFor="studentName"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Student Name
              <span
                style={{
                  fontWeight: "400",
                  color: "#9ca3af",
                  marginLeft: "6px",
                }}
              >
                Optional
              </span>
            </label>

            <input
              id="studentName"
              type="text"
              value={studentName}
              onChange={(event) => {
                setStudentName(
                  event.target.value
                );
                setError("");
              }}
              placeholder="Enter your name"
              autoComplete="name"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Error */}

          {error && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#fef2f2",
                border:
                  "1px solid #fecaca",
                color: "#dc2626",
                lineHeight: "1.5",
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* Join */}

          <button
            type="submit"
            disabled={
              loading ||
              !enrollmentNumber.trim()
            }
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background:
                loading ||
                !enrollmentNumber.trim()
                  ? "#9ca3af"
                  : "#2563eb",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "600",
              cursor:
                loading ||
                !enrollmentNumber.trim()
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "Verifying..."
              : "Continue to Viva →"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
            marginBottom: 0,
            color: "#9ca3af",
            fontSize: "13px",
          }}
        >
          Your viva marks will not be shown
          during the examination.
        </p>
      </div>
    </div>
  );
};

export default StudentJoin;