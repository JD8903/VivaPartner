const ActivitySkeleton = () => {
  return (
    <div className="activity-card skeleton">
      <div className="activity-icon skeleton-icon"></div>

      <div className="activity-content">
        <div className="skeleton-line skeleton-heading"></div>

        <div className="skeleton-line skeleton-description"></div>

        <div className="skeleton-line skeleton-date"></div>
      </div>
    </div>
  );
};

export default ActivitySkeleton;