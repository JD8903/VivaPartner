import "./WhyChooseUs.css";
import {
  FaRobot,
  FaBolt,
  FaBalanceScale,
  FaChartLine,
  FaShieldAlt,
  FaCloud,
} from "react-icons/fa";

const reasons = [
  {
    icon: <FaRobot />,
    title: "AI Automation",
    description:
      "Automate the entire viva process from question generation to final evaluation using Artificial Intelligence.",
  },
  {
    icon: <FaBolt />,
    title: "Faster Assessment",
    description:
      "Reduce manual effort and complete viva examinations in significantly less time.",
  },
  {
    icon: <FaBalanceScale />,
    title: "Fair Evaluation",
    description:
      "AI evaluates every student consistently, ensuring accurate and unbiased assessments.",
  },
  {
    icon: <FaChartLine />,
    title: "Smart Analytics",
    description:
      "Generate insightful reports, marks, and performance analytics instantly after every viva.",
  },
  {
    icon: <FaShieldAlt />,
    title: "Secure Platform",
    description:
      "Role-based authentication keeps teacher, student, and administrative data secure.",
  },
  {
    icon: <FaCloud />,
    title: "Scalable Solution",
    description:
      "Designed to support departments, colleges, and universities with ease.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="why-section" id="why">

      <div className="why-header">

        <span className="why-badge">
          Why Choose VivaPartner
        </span>

        <h2>
          The Smarter Way to Conduct
          <span> AI-Powered Viva Examinations</span>
        </h2>

        <p>
          VivaPartner combines Artificial Intelligence, automation,
          and voice technology to deliver a faster, smarter, and
          more reliable viva examination experience.
        </p>

      </div>

      <div className="why-grid">

        {reasons.map((item, index) => (
          <div className="why-card" key={index}>

            <div className="why-icon">
              {item.icon}
            </div>

            <h3>{item.title}</h3>

            <p>{item.description}</p>

          </div>
        ))}

      </div>

    </section>
  );
};

export default WhyChooseUs;