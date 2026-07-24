import "./Hero.css";
import {
  FaMicrophoneAlt,
  FaFilePdf,
  FaRobot,
  FaChartLine,
  FaArrowRight,
} from "react-icons/fa";

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="hero-container">

        {/* Left Side */}
        <div className="hero-content">

          <span className="hero-badge">
            🚀 AI Powered Viva Examination Platform
          </span>

          <h1>
            Transform Traditional
            <span> Viva Examination </span>
            with Artificial Intelligence
          </h1>

          <p>
            VivaPartner automates viva examinations using AI-generated
            questions, voice interaction, automatic answer evaluation,
            and instant report generation—making assessments smarter,
            faster, and more efficient.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn">
              Get Started
              <FaArrowRight />
            </button>

            <button className="secondary-btn">
              Teacher Login
            </button>
          </div>

          <div className="hero-stats">

            <div className="stat-card">
              <h3>AI Voice</h3>
              <p>Interactive Viva</p>
            </div>

            <div className="stat-card">
              <h3>PDF</h3>
              <p>Question Generator</p>
            </div>

            <div className="stat-card">
              <h3>Instant</h3>
              <p>Evaluation</p>
            </div>

          </div>

        </div>

        {/* Right Side */}

        <div className="hero-dashboard">

          <div className="glass-card card1">
            <FaMicrophoneAlt />
            <div>
              <h4>Voice AI</h4>
              <p>Listening...</p>
            </div>
          </div>

          <div className="glass-card card2">
            <FaFilePdf />
            <div>
              <h4>PDF Uploaded</h4>
              <p>120 Questions Generated</p>
            </div>
          </div>

          <div className="glass-card card3">
            <FaRobot />
            <div>
              <h4>AI Evaluation</h4>
              <p>Answer Processing</p>
            </div>
          </div>

          <div className="glass-card card4">
            <FaChartLine />
            <div>
              <h4>Result Ready</h4>
              <p>Marks Generated</p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Hero;