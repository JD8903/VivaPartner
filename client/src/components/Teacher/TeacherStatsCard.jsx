import "./TeacherStats.css";

const TeacherStatsCard = ({ title, value, icon, color }) => {
    return (
        <div className="teacher-stats-card">

            <div
                className="teacher-stats-icon"
                style={{ background: color }}
            >
                {icon}
            </div>

            <div className="teacher-stats-content">
                <h3>{value}</h3>
                <p>{title}</p>
            </div>

        </div>
    );
};

export default TeacherStatsCard;