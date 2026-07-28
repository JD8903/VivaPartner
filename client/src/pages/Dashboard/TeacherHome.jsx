import TeacherWelcomeCard from "../../components/Teacher/TeacherWelcomeCard";
import TeacherStatsGrid from "../../components/Teacher/TeacherStatsGrid";

const TeacherHome = () => {
    return (
        <div className="teacher-home">

            <h1 className="teacher-home-title">
                Teacher Dashboard
            </h1>

            <div className="teacher-home-content">
                <TeacherWelcomeCard />
                <TeacherStatsGrid />
            </div>

        </div>
    );
};

export default TeacherHome;