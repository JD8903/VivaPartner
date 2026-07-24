import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../../../hooks/useAuth";
import {
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
} from "react-icons/fa";

import RoleSelector from "../RoleSelector/RoleSelector";
import api from "../../../services/api";

import "./LoginForm.css";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState("teacher");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateRequiredFields = () => {
    const newErrors = {};

    const email = formData.email.trim();

    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters.";
    } else if (formData.password.length > 32) {
      newErrors.password =
        "Password cannot exceed 32 characters.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateRequiredFields()) return;

    try {
      setLoading(true);

      const { data } = await api.post("/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // Validate selected role
      if (selectedRole !== data.user.role) {
        toast.error(
          `This account belongs to the ${data.user.role} role. Please select the correct role.`
        );
        return;
      }

      // Save Login
      login(data.token, data.user);

      toast.success("Login Successful!");

      // Redirect
      if (data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/teacher/dashboard");
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to login. Please try again.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-header">
        <span className="login-badge">
          <FaShieldAlt />
          Secure Login
        </span>

        <h2>Welcome Back</h2>

        <p className="login-subtitle">
          Sign in to access your VivaPartner dashboard and
          continue managing AI-powered viva examinations.
        </p>
      </div>

      <form
        className="login-form"
        onSubmit={handleSubmit}
      >
        <RoleSelector
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
        />

        {/* Email */}

        <div className="form-group">
          <label htmlFor="email">
            Email Address
          </label>

          <div
            className={`input-box ${
              errors.email ? "error" : ""
            }`}
          >
            <FaEnvelope className="input-icon" />

            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          {errors.email && (
            <p className="error-message">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}

        <div className="form-group">
          <label htmlFor="password">
            Password
          </label>

          <div
            className={`input-box password-input ${
              errors.password ? "error" : ""
            }`}
          >
            <FaLock className="input-icon" />

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={loading}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
              disabled={loading}
            >
              {showPassword ? (
                <FaEyeSlash />
              ) : (
                <FaEye />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="error-message">
              {errors.password}
            </p>
          )}
        </div>

        {/* Options */}

        <div className="login-options">
          <label className="remember-me">
            <input
              type="checkbox"
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
              disabled={loading}
            />
            <span>Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="forgot-password"
            onClick={(e) =>
              loading &&
              e.preventDefault()
            }
          >
            Forgot Password?
          </Link>
        </div>

        {/* Login Button */}

        <button
          type="submit"
          className="login-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Signing In...
            </>
          ) : (
            "Login to Dashboard"
          )}
        </button>
      </form>

      <div className="login-footer">
        <p>
          Protected by secure authentication and
          encrypted communication.
        </p>
      </div>
    </div>
  );
};

export default LoginForm;