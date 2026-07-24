import { useEffect, useState } from "react";

import WelcomeCard from "../Cards/WelcomeCard";
import StatsCard from "../Cards/StatsCard";
import ExportButtons from "../ExportButtons/ExportButtons";

import {
  FaChalkboardTeacher,
  FaBuilding,
  FaBook,
  FaUsers,
  FaClipboardList,
  FaArrowUp,
  FaUserTie,
  FaUniversity,
  FaGraduationCap,
  FaSchool,
  FaTasks,
} from "react-icons/fa";

import { getTeacherCount } from "../../../services/teacherApi";
import { getDepartmentCount } from "../../../services/departmentApi";
import { getSubjectCount } from "../../../services/subjectApi";
import { getClassCount } from "../../../services/classApi";
import { getRecentActivities } from "../../../services/reportApi";

import exportDashboardPDF from "../../../utils/exportPDF";
import exportDashboardExcel from "../../../utils/exportExcel";

import "./DashboardHome.css";

const DashboardHome = () => {
  const [teacherCount, setTeacherCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [subjectCount, setSubjectCount] = useState(0);
  const [classCount, setClassCount] = useState(0);

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const results = await Promise.allSettled([
        getTeacherCount(),
        getDepartmentCount(),
        getSubjectCount(),
        getClassCount(),
        getRecentActivities(),
      ]);

      if (results[0].status === "fulfilled") {
        setTeacherCount(results[0].value.count || 0);
      }

      if (results[1].status === "fulfilled") {
        setDepartmentCount(results[1].value.count || 0);
      }

      if (results[2].status === "fulfilled") {
        setSubjectCount(results[2].value.count || 0);
      }

      if (results[3].status === "fulfilled") {
        setClassCount(results[3].value.count || 0);
      }

      if (results[4].status === "fulfilled") {
        setActivities(results[4].value.activities || []);
      }
    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Teachers",
      value: loading ? "..." : teacherCount,
      icon: <FaChalkboardTeacher />,
      color: "#2563eb",
    },
    {
      title: "Departments",
      value: loading ? "..." : departmentCount,
      icon: <FaBuilding />,
      color: "#10b981",
    },
    {
      title: "Subjects",
      value: loading ? "..." : subjectCount,
      icon: <FaBook />,
      color: "#f59e0b",
    },
    {
      title: "Classes",
      value: loading ? "..." : classCount,
      icon: <FaUsers />,
      color: "#8b5cf6",
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case "teacher":
        return <FaUserTie />;
      case "department":
        return <FaUniversity />;
      case "subject":
        return <FaGraduationCap />;
      case "class":
        return <FaSchool />;
      case "assignment":
        return <FaTasks />;
      default:
        return <FaClipboardList />;
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    const intervals = [
      { label: "year", value: 31536000 },
      { label: "month", value: 2592000 },
      { label: "day", value: 86400 },
      { label: "hour", value: 3600 },
      { label: "minute", value: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.value);

      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
      }
    }

    return "Just now";
  };

  // ===========================
  // Export PDF
  // ===========================

  const handleExportPDF = () => {
    exportDashboardPDF({
      adminName: "Administrator", // Replace later with logged-in admin
      statistics: {
        teachers: teacherCount,
        departments: departmentCount,
        subjects: subjectCount,
        classes: classCount,
      },
      activities,
    });
  };

  // ===========================
  // Export Excel
  // ===========================

  const handleExportExcel = () => {
    exportDashboardExcel({
      adminName: "Administrator", // Replace later with logged-in admin
      statistics: {
        teachers: teacherCount,
        departments: departmentCount,
        subjects: subjectCount,
        classes: classCount,
      },
      activities,
    });
  };

  return (
    <div className="dashboard-home">
      <WelcomeCard />

      <div className="stats-grid">
        {stats.map((item) => (
          <StatsCard key={item.title} {...item} />
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent Activities */}

        <div className="recent-card">
          <div className="section-header">
            <h3>Recent Activities</h3>

            <ExportButtons
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              loading={loading}
            />
          </div>

          {activities.length === 0 ? (
            <div className="empty-activity">
              <FaClipboardList className="empty-icon" />

              <h4>No Recent Activity</h4>

              <p>
                Teacher registrations, departments, subjects, classes and
                assignments will appear here.
              </p>
            </div>
          ) : (
            <div className="activity-list">
              {activities.map((activity, index) => (
                <div className="activity-item" key={index}>
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="activity-content">
                    <h4>{activity.title}</h4>
                    <span>{timeAgo(activity.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Overview */}

        <div className="overview-card">
          <div className="section-header">
            <h3>System Overview</h3>
          </div>

          <div className="overview-list">
            <div className="overview-item">
              <span>Teachers</span>
              <strong>{teacherCount}</strong>
            </div>

            <div className="overview-item">
              <span>Departments</span>
              <strong>{departmentCount}</strong>
            </div>

            <div className="overview-item">
              <span>Subjects</span>
              <strong>{subjectCount}</strong>
            </div>

            <div className="overview-item">
              <span>Classes</span>
              <strong>{classCount}</strong>
            </div>
          </div>

          <div className="overview-footer">
            <FaArrowUp />
            <span>System is running normally</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;