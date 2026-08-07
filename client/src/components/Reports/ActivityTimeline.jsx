import {
  FaUserTie,
  FaBuilding,
  FaBook,
  FaSchool,
  FaClipboardList,
} from "react-icons/fa";

import ActivityCard from "./ActivityCard";
import ActivitySkeleton from "./ActivitySkeleton";

const ActivityTimeline = ({
  loading,
  activities = {},
}) => {
  if (loading) {
    return (
      <>
        {[...Array(5)].map((_, index) => (
          <ActivitySkeleton key={index} />
        ))}
      </>
    );
  }

  const teachers = activities?.teachers || [];
  const departments = activities?.departments || [];
  const subjects = activities?.subjects || [];
  const classes = activities?.classes || [];
  const assignments = activities?.assignments || [];

  const activityList = [
    ...teachers.map((teacher) => ({
      id: teacher._id,
      icon: <FaUserTie />,
      title: "Teacher Added",
      description: `${teacher.name} was added to the system`,
      date: teacher.createdAt,
    })),

    ...departments.map((department) => ({
      id: department._id,
      icon: <FaBuilding />,
      title: "Department Created",
      description: `${department.name} department created`,
      date: department.createdAt,
    })),

    ...subjects.map((subject) => ({
      id: subject._id,
      icon: <FaBook />,
      title: "Subject Added",
      description: `${subject.name} subject added`,
      date: subject.createdAt,
    })),

    ...classes.map((cls) => ({
      id: cls._id,
      icon: <FaSchool />,
      title: "Class Created",
      description: `${cls.name} class created`,
      date: cls.createdAt,
    })),

    ...assignments.map((assignment) => ({
      id: assignment._id,
      icon: <FaClipboardList />,
      title: "Assignment Created",
      description: `${assignment.teacher?.name || "Teacher"} assigned to ${
        assignment.class?.name || "Class"
      }`,
      date: assignment.createdAt,
    })),
  ];

  activityList.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <div className="activity-timeline">
      {activityList.length > 0 ? (
        activityList.map((activity) => (
          <ActivityCard
            key={activity.id}
            icon={activity.icon}
            title={activity.title}
            description={activity.description}
            date={activity.date}
          />
        ))
      ) : (
        <div className="no-activity">
          No recent activities found.
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;