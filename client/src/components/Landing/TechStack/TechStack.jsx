import "./TechStack.css";
import {
  FaReact,
  FaNodeJs,
  FaMicrophoneAlt,
  FaRobot,
  FaBrain,
} from "react-icons/fa";

import {
  SiExpress,
  SiMongodb,
} from "react-icons/si";

const technologies = [
  {
    icon: <FaReact />,
    name: "React",
    description: "Modern frontend for a fast and responsive user interface.",
  },
  {
    icon: <FaNodeJs />,
    name: "Node.js",
    description: "High-performance backend runtime for scalable applications.",
  },
  {
    icon: <SiExpress />,
    name: "Express.js",
    description: "Lightweight API framework powering backend services.",
  },
  {
    icon: <SiMongodb />,
    name: "MongoDB",
    description: "Flexible NoSQL database for storing application data.",
  },
  {
    icon: <FaBrain />,
    name: "OpenAI",
    description:
      "Generates intelligent viva questions, evaluates answers, and powers AI-driven interactions.",
  },
  {
    icon: <FaMicrophoneAlt />,
    name: "Speech-to-Text",
    description: "Converts student speech into text for AI analysis.",
  },
  {
    icon: <FaRobot />,
    name: "Text-to-Speech",
    description: "Allows the AI assistant to communicate naturally.",
  },
];

const TechStack = () => {
  return (
    <section className="tech-stack" id="technology">
      <div className="tech-header">
        <span className="tech-badge">
          Modern Technology Stack
        </span>

        <h2>
          Built With <span>Powerful Technologies</span>
        </h2>

        <p>
          VivaPartner combines modern web technologies with Artificial
          Intelligence to deliver a seamless, intelligent, and scalable
          viva examination platform.
        </p>
      </div>

      <div className="tech-grid">
        {technologies.map((tech, index) => (
          <div className="tech-card" key={index}>
            <div className="tech-icon">
              {tech.icon}
            </div>

            <h3>{tech.name}</h3>

            <p>{tech.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TechStack;