import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaChalkboardTeacher,
  FaBuilding,
  FaBook,
  FaUsers,
  FaTasks,
  FaChartBar,
  FaSignOutAlt,
  FaGraduationCap,
} from "react-icons/fa";

import useAuth from "../../../hooks/useAuth";
import "./Sidebar.css";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
    navigate("/login");
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <FaTachometerAlt />,
    },
    {
      name: "Teachers",
      path: "/admin/teachers",
      icon: <FaChalkboardTeacher />,
    },
    {
      name: "Departments",
      path: "/admin/departments",
      icon: <FaBuilding />,
    },
    {
      name: "Subjects",
      path: "/admin/subjects",
      icon: <FaBook />,
    },
    {
      name: "Classes",
      path: "/admin/classes",
      icon: <FaUsers />,
    },
    {
      name: "Assignments",
      path: "/admin/assignments",
      icon: <FaTasks />,
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: <FaChartBar />,
    },
  ];

  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <FaGraduationCap className="logo-icon" />

        <div>
          <h2>VivaPartner</h2>
          <p>Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              {item.icon}
            </span>

            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        className="logout-btn"
        onClick={handleLogout}
      >
        <FaSignOutAlt />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;