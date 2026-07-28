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
  FaClipboardList,
  FaMicrophone,
} from "react-icons/fa";

import useAuth from "../../../hooks/useAuth";
import "./Sidebar.css";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
    navigate("/login");
  };

  // ================= Admin Menu =================
  const adminMenu = [
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

  // ================= Teacher Menu =================
  const teacherMenu = [
    {
      name: "Dashboard",
      path: "/teacher/dashboard",
      icon: <FaTachometerAlt />,
    },
    {
      name: "Assigned Classes",
      path: "/teacher/assigned-classes",
      icon: <FaClipboardList />,
    },
    {
      name: "Viva Setup",
      path: "/teacher/viva-setup",
      icon: <FaMicrophone />,
    },
  ];

  const menuItems =
    user?.role === "admin" ? adminMenu : teacherMenu;

  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>

      {/* Logo */}
      <div className="sidebar-logo">

        <FaGraduationCap className="logo-icon" />

        <div>
          <h2>VivaPartner</h2>
          <p>
            {user?.role === "admin"
              ? "Admin Panel"
              : "Teacher Panel"}
          </p>
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