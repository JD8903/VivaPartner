import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import "./ResetPassword.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  // Password Validation Rules
  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid =
    Object.values(passwordRules).every(Boolean);

  // Password Strength
  const getStrength = () => {
    let score = 0;

    if (passwordRules.length) score++;
    if (passwordRules.uppercase) score++;
    if (passwordRules.lowercase) score++;
    if (passwordRules.number) score++;
    if (passwordRules.special) score++;

    if (score <= 2) {
      return {
        text: "Weak",
        className: "weak",
      };
    }

    if (score <= 4) {
      return {
        text: "Medium",
        className: "medium",
      };
    }

    return {
      text: "Strong",
      className: "strong",
    };
  };

  const strength = getStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      return toast.error("Please fill all fields.");
    }

    if (!isPasswordValid) {
      return toast.error(
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character."
      );
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    try {
      setLoading(true);

      const { data } = await api.post(
        "/auth/reset-password",
        {
          email,
          password,
        }
      );

      if (data.success) {
        toast.success("Password reset successfully.");

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to reset password.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <h1>Reset Password</h1>

        <p>Create a new password for</p>

        <strong>{email}</strong>

        <form onSubmit={handleSubmit}>
          {/* New Password */}

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Password Rules */}

          <div className="password-rules">
            <p
              className={
                passwordRules.length ? "valid" : ""
              }
            >
              ✓ Minimum 8 characters
            </p>

            <p
              className={
                passwordRules.uppercase
                  ? "valid"
                  : ""
              }
            >
              ✓ One uppercase letter
            </p>

            <p
              className={
                passwordRules.lowercase
                  ? "valid"
                  : ""
              }
            >
              ✓ One lowercase letter
            </p>

            <p
              className={
                passwordRules.number ? "valid" : ""
              }
            >
              ✓ One number
            </p>

            <p
              className={
                passwordRules.special
                  ? "valid"
                  : ""
              }
            >
              ✓ One special character
            </p>
          </div>

          {/* Password Strength */}

          <div
            className={`strength ${strength.className}`}
          >
            Password Strength :
            <strong> {strength.text}</strong>
          </div>

          {/* Confirm Password */}

          <div className="password-field">
            <input
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              placeholder="Confirm Password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
            >
              {showConfirmPassword
                ? "Hide"
                : "Show"}
            </button>
          </div>

          <button
            type="submit"
            className="reset-btn"
            disabled={
              loading || !isPasswordValid
            }
          >
            {loading
              ? "Updating..."
              : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;