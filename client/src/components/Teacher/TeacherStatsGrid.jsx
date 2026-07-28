import {
    FaUsers,
    FaBook,
    FaMicrophone,
    FaClipboardCheck,
} from "react-icons/fa";

import TeacherStatsCard from "./TeacherStatsCard";

const TeacherStatsGrid = () => {

    // Temporary data
    const statistics = {
        classes: 4,
        subjects: 6,
        today: 2,
        sessions: 18,
    };

    return (
        <div className="teacher-stats-grid">

            <TeacherStatsCard
                title="Assigned Classes"
                value={statistics.classes}
                icon={<FaUsers />}
                color="#2563eb"
            />

            <TeacherStatsCard
                title="Assigned Subjects"
                value={statistics.subjects}
                icon={<FaBook />}
                color="#10b981"
            />

            <TeacherStatsCard
                title="Today's Viva"
                value={statistics.today}
                icon={<FaMicrophone />}
                color="#f59e0b"
            />

            <TeacherStatsCard
                title="Total Sessions"
                value={statistics.sessions}
                icon={<FaClipboardCheck />}
                color="#8b5cf6"
            />

        </div>
    );
};

export default TeacherStatsGrid;