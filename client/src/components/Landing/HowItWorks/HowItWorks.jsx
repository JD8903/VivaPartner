import "./HowItWorks.css";
import {
  FaUserShield,
  FaChalkboardTeacher,
  FaFileExcel,
  FaFilePdf,
  FaRobot,
  FaBrain,
  FaChartLine,
} from "react-icons/fa";

const steps = [
  {
    icon: <FaUserShield />,
    title: "Admin Assigns Teacher",
    description:
      "The administrator assigns teachers to departments, subjects, and classes.",
  },
  {
    icon: <FaChalkboardTeacher />,
    title: "Teacher Selects Class",
    description:
      "Teachers choose their assigned class and configure the viva session.",
  },
  {
    icon: <FaFileExcel />,
    title: "Upload Student Excel",
    description:
      "Import student details quickly using an Excel spreadsheet.",
  },
  {
    icon: <FaFilePdf />,
    title: "Upload PDF / Topic",
    description:
      "Upload study material or provide a topic for AI-based question generation.",
  },
  {
    icon: <FaRobot />,
    title: "AI Conducts Viva",
    description:
      "The AI Voice Assistant asks questions and interacts with students naturally.",
  },
  {
    icon: <FaBrain />,
    title: "AI Evaluates Answers",
    description:
      "Student answers are analyzed automatically to ensure consistent evaluation.",
  },
  {
    icon: <FaChartLine />,
    title: "Generate Reports",
    description:
      "Detailed marks, feedback, and performance reports are generated instantly.",
  },
];

const HowItWorks = () => {
  return (
    <section className="workflow" id="how">

      <div className="workflow-header">

        <span className="workflow-badge">
          Simple Workflow
        </span>

        <h2>
          How <span>VivaPartner</span> Works
        </h2>

        <p>
          Conduct AI-powered viva examinations in just a few simple steps.
        </p>

      </div>

      <div className="workflow-container">

        {steps.map((step, index) => (
          <div className="workflow-item" key={index}>

            <div className="workflow-icon">
              {step.icon}
            </div>

            {index !== steps.length - 1 && (
              <div className="workflow-line"></div>
            )}

            <div className="workflow-card">

              <span className="step-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3>{step.title}</h3>

              <p>{step.description}</p>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
};

export default HowItWorks;