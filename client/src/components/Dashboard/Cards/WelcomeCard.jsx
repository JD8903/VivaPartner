import { FaUserShield, FaCalendarAlt } from "react-icons/fa";
import useAuth from "../../../hooks/useAuth";

import "./WelcomeCard.css";

const WelcomeCard = () => {
  const { user } = useAuth();

  const currentHour = new Date().getHours();

  let greeting = "Good Evening";

  if (currentHour < 12) {
    greeting = "Good Morning";
  } else if (currentHour < 17) {
    greeting = "Good Afternoon";
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="welcome-card">
      <div className="welcome-left">
        <h1>
          {greeting},{" "}
          <span>{user?.name || "Administrator"} 👋</span>
        </h1>

        <p>
          Welcome back to <strong>VivaPartner</strong>. Manage teachers,
          departments, classes and AI-powered viva examinations efficiently.
        </p>

        <div className="welcome-info">

          <div className="info-item">
            <FaUserShield className="info-icon" />

            <div className="info-content">
              <small>Logged in as</small>
              <strong>{user?.role || "Administrator"}</strong>
            </div>
          </div>

          <div className="info-item">
            <FaCalendarAlt className="info-icon" />

            <div className="info-content">
              <small>Today</small>
              <strong>{today}</strong>
            </div>
          </div>

        </div>
      </div>

      <div className="welcome-right">

        <div className="welcome-circle">

          <span>
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </span>

        </div>

        <h3>{user?.name || "Administrator"}</h3>

        <p>{user?.role || "Admin"}</p>

      </div>
    </div>
  );
};

export default WelcomeCard;