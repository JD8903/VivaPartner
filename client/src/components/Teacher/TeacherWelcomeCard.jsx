import { FaChalkboardTeacher, FaCalendarAlt } from "react-icons/fa";
import "./TeacherWelcomeCard.css";

const TeacherWelcomeCard = () => {

    const user = JSON.parse(localStorage.getItem("user")) || {};

    const hour = new Date().getHours();

    let greeting = "Good Evening";

    if (hour < 12) greeting = "Good Morning";
    else if (hour < 18) greeting = "Good Afternoon";

    return (
        <div className="teacher-welcome-card">

            <div className="teacher-left">

                <h2>
                    {greeting}, {user.name || "Teacher"} 👋
                </h2>

                <p>
                    Welcome back to VivaPartner.
                </p>

                <div className="teacher-info">

                    <div className="info-box">
                        <FaChalkboardTeacher />
                        <span>Teacher</span>
                    </div>

                    <div className="info-box">
                        <FaCalendarAlt />
                        <span>{new Date().toLocaleDateString()}</span>
                    </div>

                </div>

            </div>

            <div className="teacher-avatar">

                <div className="avatar-circle">
                    {(user.name || "T").charAt(0).toUpperCase()}
                </div>

            </div>

        </div>
    );
};

export default TeacherWelcomeCard;