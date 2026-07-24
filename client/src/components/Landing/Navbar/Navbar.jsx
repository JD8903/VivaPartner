import { useState } from "react";
import { FaBars, FaTimes, FaRobot } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="landing-navbar">
      <div className="landing-navbar-container">
        {/* Logo */}
        <div className="landing-logo">
          <FaRobot className="landing-logo-icon" />
          <span>VivaPartner</span>
        </div>

        {/* Desktop Menu */}
        <nav
          className={`landing-nav-links ${
            menuOpen ? "landing-active" : ""
          }`}
        >
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#technology">Technology</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>

          <button className="landing-login-btn">
            Login
          </button>
        </nav>

        {/* Mobile Menu Button */}
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