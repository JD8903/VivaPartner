import "./Charts.css";

const ChartCard = ({ title, children }) => {
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      {children}
    </div>
  );
};

export default ChartCard;