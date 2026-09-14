import { useState, useEffect } from "react";
import {
    FaUsers,
    FaBook,
    FaMicrophone,
    FaClipboardCheck,
} from "react-icons/fa";
import { getTeacherDashboardStats } from "../../services/teacherApi";
import TeacherStatsCard from "./TeacherStatsCard";

const TeacherStatsGrid = () => {
    const [stats, setStats] = useState({
        classes: 0,
        subjects: 0,
        today: 0,
        sessions: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await getTeacherDashboardStats();
                if (data && data.stats) {
                    setStats(data.stats);
                }
            } catch (err) {
                console.error("Failed to load teacher stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="teacher-stats-grid">
            <TeacherStatsCard
                title="Assigned Classes"
                value={loading ? "..." : stats.classes}
                icon={<FaUsers />}
                color="#2563eb"
            />

            <TeacherStatsCard
                title="Assigned Subjects"
                value={loading ? "..." : stats.subjects}
                icon={<FaBook />}
                color="#10b981"
            />

            <TeacherStatsCard
                title="Today's Viva"
                value={loading ? "..." : stats.today}
                icon={<FaMicrophone />}
                color="#f59e0b"
            />

            <TeacherStatsCard
                title="Total Sessions"
                value={loading ? "..." : stats.sessions}
                icon={<FaClipboardCheck />}
                color="#8b5cf6"
            />
        </div>
    );
};

export default TeacherStatsGrid;