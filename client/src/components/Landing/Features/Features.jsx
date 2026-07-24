import "./Features.css";
import {
  FaMicrophoneAlt,
  FaBrain,
  FaFilePdf,
  FaFileExcel,
  FaUsers,
  FaChartBar,
} from "react-icons/fa";

const features = [
  {
    icon: <FaMicrophoneAlt />,
    title: "AI Voice Viva",
    description:
      "Conduct interactive viva examinations through intelligent voice conversations.",
  },
  {
    icon: <FaBrain />,
    title: "Automatic Evaluation",
    description:
      "AI analyzes student responses and generates fair, unbiased assessments instantly.",
  },
  {
    icon: <FaFilePdf />,
    title: "PDF Question Generator",
    description:
      "Generate relevant viva questions directly from uploaded PDFs or study material.",
  },
  {
    icon: <FaFileExcel />,
    title: "Excel Upload",
    description:
      "Import student records quickly using Excel files with automatic data processing.",
  },
  {
    icon: <FaUsers />,
    title: "Student Pairing",
    description:
      "Conduct viva for one or multiple students with flexible pairing configurations.",
  },
  {
    icon: <FaChartBar />,
    title: "Report Generation",
    description:
      "Generate detailed performance reports, marksheets, and viva analytics instantly.",
  },
];

const Features = () => {
  return (
    <section className="features" id="features">

      <div className="features-header">

        <span className="features-badge">
          Powerful Features
        </span>

        <h2>
          Everything You Need For An
          <span> AI-Powered Viva</span>
        </h2>

        <p>
          VivaPartner combines Artificial Intelligence,
          voice interaction, automation, and analytics
          into one smart platform for modern viva examinations.
        </p>

      </div>

      <div className="features-grid">

        {features.map((feature, index) => (
          <div className="feature-card" key={index}>

            <div className="feature-icon">
              {feature.icon}
            </div>

            <h3>{feature.title}</h3>

            <p>{feature.description}</p>

          </div>
        ))}

      </div>

    </section>
  );
};

export default Features;