import { FaUserShield, FaChalkboardTeacher } from "react-icons/fa";
import "./RoleSelector.css";

const RoleSelector = ({ selectedRole, setSelectedRole }) => {
  return (
    <div className="role-selector">

      <button
        type="button"
        className={`role-btn ${
          selectedRole === "admin" ? "active" : ""
        }`}
        onClick={() => setSelectedRole("admin")}
      >
        <FaUserShield className="role-btn-icon" />

        <div className="role-content">
          <span className="role-title">
            Administrator
          </span>

          <span className="role-desc">
            Manage Platform
          </span>
        </div>
      </button>

      <button
        type="button"
        className={`role-btn ${
          selectedRole === "teacher" ? "active" : ""
        }`}
        onClick={() => setSelectedRole("teacher")}
      >
        <FaChalkboardTeacher className="role-btn-icon" />

        <div className="role-content">
          <span className="role-title">
            Teacher
          </span>

          <span className="role-desc">
            Conduct Viva
          </span>
        </div>
      </button>

    </div>
  );
};

export default RoleSelector;