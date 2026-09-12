import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toggleDropdown = () => setIsDropdownOpen((s) => !s);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.pageYOffset ?? document.documentElement.scrollTop;
      setScrolled(y > 50);
    };

    // call once on mount so initial state is correct
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="nav-container">
        <img src={logo} alt="TanzAI Logo" className="nav-logo" />
       <ul className="nav-links">
  <li>
    <Link to="/">Home</Link>
  </li>

  <li>
    <Link to="/about">About</Link> 
  </li>

  <li>
    <Link to="/features">Features</Link>
  </li>

  <li>
    <Link to="/contact">Contact</Link>
  </li>

  <div className="hero-buttons">
<div className="hero-buttons">
  <a href="/book-demo" className="btn">Request a Demo</a>
</div>
    <button className="btn btn-outline">Log-in</button>
  </div>
</ul>

      </div>

      <style>{`
        /* --- Navbar --- */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
           background: rgba(171, 48, 48, 0);
          transition: background 0.3s ease, box-shadow 0.3s ease;
          z-index: 1000;
        }

        .navbar-scrolled {
          background: #fff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0.8rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-logo {
          width: 160px;
          height: 70px;
        }

        .nav-links {
          list-style: none;
          display: flex;
          gap: 1.5rem;
          margin-top: 50px;
        }

        .nav-links li a {
          text-decoration: none;
          color: #000;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .nav-links li a:hover {
          color: #8b91abff;
        }

        /* --- Buttons --- */
        .hero-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .btn {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 25px;
          background: linear-gradient(135deg, #1a1f36, #2c3e50);
          color: #edeff1ff;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        }

        .btn:hover {
          transform: translateY(-3px);
          background: linear-gradient(135deg, #5e5f63ff, #c3cad2ff);
          color: #0a0a0aff;
        }

        .btn-outline {
          background: linear-gradient(135deg, #1a1f36, #2c3e50);
          color: #e5e8efff;
        }

        .btn-outline:hover {
          background: linear-gradient(65deg, #5e5f63ff, #c3cad2ff);
          color: #0a0a0aff;
        }

        /* --- Dropdown --- */
        .dropdown {
          position: relative;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          background-color: #fff;
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
          min-width: 1000px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          padding: 1rem;
          z-index: 1000;
        }

        .dropdown-column h4 {
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }

        .dropdown-column ul {
          list-style: none;
          padding: 0;
        }

        .dropdown-column ul li {
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }
      `}</style>
    </nav>
  );
}
