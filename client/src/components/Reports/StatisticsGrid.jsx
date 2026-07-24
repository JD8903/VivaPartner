import {
  FaUserTie,
  FaBuilding,
  FaBook,
  FaSchool,
  FaClipboardList,
} from "react-icons/fa";

import StatisticsCard from "./StatisticsCard";
import LoadingSkeleton from "./LoadingSkeleton";

const StatisticsGrid = ({
  statistics,
  loading,
}) => {
  const cards = [
    {
      title: "Total Teachers",
      value: statistics.teachers,
      icon: <FaUserTie />,
      color: "#2563eb",
    },
    {
      title: "Departments",
      value: statistics.departments,
      icon: <FaBuilding />,
      color: "#7c3aed",
    },
    {
      title: "Subjects",
      value: statistics.subjects,
      icon: <FaBook />,
      color: "#10b981",
    },
    {
      title: "Classes",
      value: statistics.classes,
      icon: <FaSchool />,
      color: "#f97316",
    },
    {
      title: "Assignments",
      value: statistics.assignments,
      icon: <FaClipboardList />,
      color: "#ef4444",
    },
  ];

  if (loading) {
    return (
      <div className="statistics-grid">
        {cards.map((_, index) => (
          <LoadingSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="statistics-grid">
      {cards.map((card, index) => (
        <StatisticsCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
        />
      ))}
    </div>
  );
};

export default StatisticsGrid;