const ActivityCard = ({
  icon,
  title,
  description,
  date,
}) => {

  const formatDate = (dateString) => {
    const activityDate = new Date(dateString);
    const now = new Date();

    const diff = Math.floor((now - activityDate) / 1000);

    if (diff < 60) return "Just now";

    if (diff < 3600)
      return `${Math.floor(diff / 60)} min ago`;

    if (diff < 86400)
      return `${Math.floor(diff / 3600)} hour${
        Math.floor(diff / 3600) > 1 ? "s" : ""
      } ago`;

    if (diff < 172800) return "Yesterday";

    return activityDate.toLocaleDateString();
  };

  return (
    <div className="activity-card">
      <div className="activity-icon">
        {icon}
      </div>

      <div className="activity-content">
        <div className="activity-top">
          <h4>{title}</h4>

          <span className="activity-date">
            {formatDate(date)}
          </span>
        </div>

        <p>{description}</p>
      </div>
    </div>
  );
};

export default ActivityCard;