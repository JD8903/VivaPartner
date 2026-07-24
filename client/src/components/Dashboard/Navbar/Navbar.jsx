import { useLocation } from "react-router-dom";
import {
  FaSearch,
  FaBell,
  FaUserCircle,
  FaBars,
} from "react-icons/fa";

import useAuth from "../../../hooks/useAuth";

import "./Navbar.css";

const Navbar = ({ setSidebarOpen }) => {
  const location = useLocation();
  const { user } = useAuth();

  const pageTitles = {
    "/admin/dashboard": "Dashboard",
    "/admin/teachers": "Teachers",
    "/admin/departments": "Departments",
    "/admin/subjects": "Subjects",
    "/admin/classes": "Classes",
    "/admin/assignments": "Assignments",
    "/admin/reports": "Reports",
  };

  const pageTitle =
    pageTitles[location.pathname] || "Dashboard";

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="navbar">
      {/* Left Side */}
      <div className="navbar-left">
        <button
          className="menu-btn"
          onClick={() =>
            setSidebarOpen((prev) => !prev)
          }
        >
          <FaBars />
        </button>

        <div>
          <h2>{pageTitle}</h2>
          <p>{today}</p>
        </div>
      </div>

      {/* Right Side */}
      <div className="navbar-right">
        {/* Search */}
        <div className="search-box">
          <FaSearch />

          <input
            type="text"
            placeholder="Search..."
          />
        </div>

        {/* Notification */}
        <button className="icon-btn">
          <FaBell />
          <span className="notification-dot"></span>
        </button>

        {/* Profile */}
        <div className="profile">
          <FaUserCircle className="profile-icon" />

          <div className="profile-details">
            <h4>{user?.name || "Admin"}</h4>
            <p>{user?.role || "Administrator"}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;