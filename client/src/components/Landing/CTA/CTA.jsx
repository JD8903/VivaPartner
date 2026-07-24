import "./CTA.css";
import { FaArrowRight, FaPlayCircle } from "react-icons/fa";

const CTA = () => {
  return (
    <section className="cta-section">

      <div className="cta-container">

        <span className="cta-badge">
          Ready to Transform Your Viva Process?
        </span>

        <h2>
          Experience the Future of
          <span> AI-Powered Viva Examinations</span>
        </h2>

        <p>
          Join educational institutions embracing Artificial Intelligence
          to simplify viva examinations with voice interaction, automatic
          evaluation, and intelligent report generation.
        </p>

        <div className="cta-buttons">

          <button className="cta-primary-btn">
            Get Started
            <FaArrowRight />
          </button>

          <button className="cta-secondary-btn">
            <FaPlayCircle />
            Learn More
          </button>

        </div>

      </div>

    </section>
  );
};

export default CTA;