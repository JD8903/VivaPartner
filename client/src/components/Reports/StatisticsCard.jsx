const StatisticsCard = ({
  icon,
  title,
  value,
  color,
}) => {
  return (
    <div className="statistics-card">
      <div
        className="statistics-icon"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        }}
      >
        {icon}
      </div>

      <div className="statistics-content">
        <span className="statistics-title">
          {title}
        </span>

        <h2>{value}</h2>
      </div>
    </div>
  );
};

export default StatisticsCard;