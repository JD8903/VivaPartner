import "./StatsCard.css";

const StatsCard = ({ title, value, icon, color = "#2563eb" }) => {
  return (
    <div className="stats-card">
      <div
        className="stats-icon"
        style={{ background: color }}
      >
        {icon}
      </div>

      <div className="stats-content">
        <span className="stats-title">{title}</span>

        <div className="stats-value">{value}</div>
      </div>
    </div>
  );
};

export default StatsCard;