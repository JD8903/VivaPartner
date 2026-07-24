import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../services/api";
import "./VerifyOTP.css";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [timer, setTimer] = useState(30);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Redirect if page is opened directly
  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  // Countdown Timer
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Verify OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!otp.trim()) {
      return setError("Please enter the OTP.");
    }

    if (otp.length !== 6) {
      return setError("OTP must be 6 digits.");
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/verify-otp", {
        email,
        otp,
      });

      if (data.success) {
        navigate("/reset-password", {
          state: { email },
        });
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to verify OTP.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    try {
      setResending(true);
      setError("");
      setMessage("");

      const { data } = await api.post("/auth/forgot-password", {
        email,
      });

      if (data.success) {
        setMessage("A new OTP has been sent to your email.");
        setTimer(30);
        setOtp("");
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to resend OTP.";

      setError(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-container">
      <div className="verify-card">
        <h1>Verify OTP</h1>

        <p>
          Enter the 6-digit OTP sent to
          <br />
          <strong>{email}</strong>
        </p>

        {error && <div className="error">{error}</div>}

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            maxLength={6}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, ""))
            }
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="resend-section">
          {timer > 0 ? (
            <p>
              Resend OTP in <strong>{timer}s</strong>
            </p>
          ) : (
            <button
              type="button"
              className="resend-btn"
              onClick={handleResendOTP}
              disabled={resending}
            >
              {resending ? "Sending..." : "Resend OTP"}
            </button>
          )}
        </div>

        <Link
          to="/forgot-password"
          className="back-link"
        >
          ← Change Email
        </Link>
      </div>
    </div>
  );
};

export default VerifyOTP;