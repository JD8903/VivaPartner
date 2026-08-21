import LoginForm from "../../components/Auth/LoginForm/LoginForm";

import {
  FaRobot,
  FaMicrophoneAlt,
  FaChartLine,
} from "react-icons/fa";

import "./Login.css";

const Login = () => {
  return (
    <section className="login-page">
      <div className="login-wrapper">

        {/* ==================================================
            LEFT SIDE
        ================================================== */}

        <div className="login-left">

          <div className="bg-circle circle1"></div>
          <div className="bg-circle circle2"></div>

          <div className="branding">

            <div className="logo-box">
              VP
            </div>

            <span className="brand-badge">
              AI Powered Platform
            </span>

            <h1>
              VivaPartner
            </h1>

            <p className="tagline">
              Conduct smarter viva examinations with
              AI-powered question generation, voice
              interaction and automatic evaluation.
            </p>

            <div className="feature-list">

              <div className="feature-item">
                <FaRobot />
                <span>
                  AI Question Generation
                </span>
              </div>

              <div className="feature-item">
                <FaMicrophoneAlt />
                <span>
                  Voice Based Viva
                </span>
              </div>

              <div className="feature-item">
                <FaChartLine />
                <span>
                  Automatic Evaluation
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* ==================================================
            RIGHT SIDE
        ================================================== */}

        <div className="login-right">
          <LoginForm />
        </div>

      </div>
    </section>
  );
};

export default Login;