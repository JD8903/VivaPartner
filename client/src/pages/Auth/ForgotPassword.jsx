import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedEmail = email.trim().toLowerCase();

    if (!formattedEmail) {
      return toast.error("Email is required.");
    }

    if (!validateEmail(formattedEmail)) {
      return toast.error("Please enter a valid email address.");
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/forgot-password", {
        email: formattedEmail,
      });

      if (data.success) {
        toast.success(data.message);

        setTimeout(() => {
          navigate("/verify-otp", {
            state: {
              email: formattedEmail,
            },
          });
        }, 1200);
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to send OTP. Please try again.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <div className="forgot-logo">
          VivaPartner
        </div>

        <h2>Forgot Password</h2>

        <p>
          Enter your registered email address to receive a
          password reset OTP.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <Link
          to="/login"
          className="back-link"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;