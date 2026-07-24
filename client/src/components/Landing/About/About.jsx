import "./About.css";
import {
  FaBullseye,
  FaEye,
  FaShieldAlt,
  FaRobot,
  FaMicrophoneAlt,
  FaChartLine,
} from "react-icons/fa";

const highlights = [
  {
    icon: <FaBullseye />,
    title: "Mission",
    description:
      "To modernize traditional viva examinations through Artificial Intelligence, automation, and voice technology.",
  },
  {
    icon: <FaEye />,
    title: "Vision",
    description:
      "To become the next-generation intelligent assessment platform for educational institutions worldwide.",
  },
];

const benefits = [
  {
    icon: <FaRobot />,
    title: "AI-Powered Questions",
  },
  {
    icon: <FaMicrophoneAlt />,
    title: "Voice-Based Viva",
  },
  {
    icon: <FaShieldAlt />,
    title: "Fair & Secure Evaluation",
  },
  {
    icon: <FaChartLine />,
    title: "Smart Reports & Analytics",
  },
];

const About = () => {
  return (
    <section className="about" id="about">

      <div className="about-container">

        {/* Left Side */}

        <div className="about-content">

          <span className="about-badge">
            About VivaPartner
          </span>

          <h2>
            Smarter Viva Examinations
            <span> Powered by AI</span>
          </h2>

          <p className="about-description">
            VivaPartner is an AI-powered platform designed to simplify
            and modernize viva examinations. From question generation
            and voice interaction to automatic evaluation and report
            generation, everything is managed intelligently in one place.
          </p>

          <div className="mission-grid">

            {highlights.map((item, index) => (
              <div className="mission-card" key={index}>

                <div className="mission-icon">
                  {item.icon}
                </div>

                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>

              </div>
            ))}

          </div>

        </div>

        {/* Right Side */}

        <div className="about-showcase">

          <div className="showcase-card">

            <h3>Why VivaPartner?</h3>

            <div className="benefit-list">

              {benefits.map((item, index) => (
                <div className="benefit-item" key={index}>

                  <div className="benefit-icon">
                    {item.icon}
                  </div>

                  <span>{item.title}</span>

                </div>
              ))}

            </div>

          </div>

        </div>

      </div>

    </section>
  );
};

export default About;