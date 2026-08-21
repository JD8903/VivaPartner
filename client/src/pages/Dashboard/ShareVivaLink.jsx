import { useState } from "react";
import { getStudentVivaLink } from "../../services/vivaSessionApi";

const ShareVivaLink = ({ sessionId }) => {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const generateLink = async () => {
    if (!sessionId) {
      setError("Viva session ID is missing.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCopied(false);

      const response =
        await getStudentVivaLink(sessionId);

      if (!response?.success || !response?.link) {
        throw new Error(
          response?.message ||
            "Unable to generate viva link."
        );
      }

      setLink(response.link);
    } catch (err) {
      console.error(
        "Generate Viva Link Error:",
        err
      );

      setError(
        err.message ||
          "Unable to generate viva link."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(
        "Copy Link Error:",
        err
      );

      setError(
        "Unable to copy the link. Please copy it manually."
      );
    }
  };

  const shareLink = async () => {
    if (!link) return;

    try {
      if (
        navigator.share &&
        typeof navigator.share === "function"
      ) {
        await navigator.share({
          title: "VivaPartner Viva",
          text: "Join your VivaPartner viva using this link:",
          url: link,
        });
      } else {
        await copyLink();
      }
    } catch (err) {
      // User cancelled the native share dialog.
      if (err?.name !== "AbortError") {
        console.error(
          "Share Link Error:",
          err
        );
      }
    }
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "30px auto",
        padding: "30px",
        borderRadius: "16px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <h2
        style={{
          margin: "0 0 10px",
          color: "#111827",
        }}
      >
        🔗 Student Viva Link
      </h2>

      <p
        style={{
          margin: "0 0 25px",
          color: "#6b7280",
          lineHeight: "1.6",
        }}
      >
        Generate one link and share it with the
        entire class. Each student can open the
        same link on their own device.
      </p>

      {!link && (
        <button
          type="button"
          onClick={generateLink}
          disabled={loading || !sessionId}
          style={{
            width: "100%",
            padding: "14px 20px",
            border: "none",
            borderRadius: "10px",
            background:
              loading || !sessionId
                ? "#9ca3af"
                : "#2563eb",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: "600",
            cursor:
              loading || !sessionId
                ? "not-allowed"
                : "pointer",
          }}
        >
          {loading
            ? "Generating Link..."
            : "🔗 Generate Viva Link"}
        </button>
      )}

      {link && (
        <>
          <div
            style={{
              padding: "15px",
              borderRadius: "10px",
              background: "#f3f4f6",
              marginBottom: "15px",
              wordBreak: "break-all",
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              Student Link
            </strong>

            <span
              style={{
                color: "#2563eb",
              }}
            >
              {link}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={copyLink}
              style={{
                flex: "1 1 200px",
                padding: "13px 18px",
                border: "none",
                borderRadius: "10px",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {copied
                ? "✅ Copied!"
                : "📋 Copy Link"}
            </button>

            <button
              type="button"
              onClick={shareLink}
              style={{
                flex: "1 1 200px",
                padding: "13px 18px",
                border: "none",
                borderRadius: "10px",
                background: "#16a34a",
                color: "#ffffff",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              📤 Share Link
            </button>
          </div>
        </>
      )}

      {error && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px 15px",
            borderRadius: "8px",
            background: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default ShareVivaLink;