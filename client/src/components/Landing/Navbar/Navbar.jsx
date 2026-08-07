import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaRobot } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="landing-navbar">
      <div className="landing-navbar-container">

        {/* Logo */}
        <Link to="/" className="landing-logo">
          <FaRobot className="landing-logo-icon" />
          <span>VivaPartner</span>
        </Link>

        {/* Navigation */}
        <nav className={`landing-nav-links ${menuOpen ? "landing-active" : ""}`}>
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="#technology" onClick={() => setMenuOpen(false)}>Technology</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>

          <button
            className="landing-login-btn"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </nav>

        {/* Mobile Menu */}
        <div
          className="landing-menu-icon"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </div>

      </div>
    </header>
  );
};

export default Navbar;