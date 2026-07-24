const LoadingSkeleton = () => {
  return (
    <div className="statistics-card skeleton">
      <div className="statistics-icon skeleton-icon"></div>

      <div className="statistics-content">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-value"></div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;