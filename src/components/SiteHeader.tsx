import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Phone, ArrowUpRight } from 'lucide-react';
import MainSiteBanner from './MainSiteBanner';
import './SiteHeader.css';

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`site-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container header-container">
        <Link to="/" className="logo-area" onClick={() => setIsOpen(false)}>
          <img 
            src="/logo/logo-icon.png" 
            alt="Dahej Support" 
            className="brand-logo-icon"
          />
          <img 
            src="/logo/logo-wordmark.png" 
            alt="Dahej Support" 
            className="brand-logo-img"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Products
              </NavLink>
            </li>
            <li>
              <NavLink to="/calculator" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Calculator
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                About Us
              </NavLink>
            </li>
            <li>
              <NavLink to="/inquiry" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Inquiry
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Contact
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Contact info & Action button */}
        <div className="header-actions">
          <a href="tel:+919601574966" className="phone-link" title="Call Dahej Support: +91 96015 74966">
            <div className="phone-icon-box">
              <Phone size={16} className="phone-icon" />
            </div>
            <div className="phone-text">
              <span>Call Us</span>
              <strong>+91 96015 74966</strong>
            </div>
          </a>
          <Link to="/login" className="btn btn-primary quote-btn" title="Access Admin Panel">
            Admin Panel <ArrowUpRight size={16} className="arrow-icon" />
          </Link>
        </div>

        {/* Hamburger Menu Toggle */}
        <button 
          className="mobile-toggle" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Exact line/banner right below Navigation Bar */}
      <MainSiteBanner variant="header" />

      {/* Mobile Sidebar Navigation */}
      <div className={`mobile-nav-overlay ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
        <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-drawer-header">
            <div className="logo-area">
              <img 
                src="/logo/logo-icon.png" 
                alt="Dahej Support" 
                className="brand-logo-icon mobile-header-icon"
              />
              <img 
                src="/logo/logo-wordmark.png" 
                alt="Dahej Support" 
                className="brand-logo-img mobile-header-logo"
              />
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close menu">
              <X size={26} />
            </button>
          </div>

          <ul className="mobile-nav-links">
            <li>
              <NavLink 
                to="/" 
                className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
                onClick={() => setIsOpen(false)}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/products" 
                className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
                onClick={() => setIsOpen(false)}
              >
                Products
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/calculator" 
                className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
                onClick={() => setIsOpen(false)}
              >
                Calculator
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/about" 
                className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
                onClick={() => setIsOpen(false)}
              >
                About Us
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/inquiry" 
                className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
                onClick={() => setIsOpen(false)}
              >
                Inquiry
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/contact" 
                className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}
                onClick={() => setIsOpen(false)}
              >
                Contact
              </NavLink>
            </li>
          </ul>

          <div className="mobile-drawer-footer">
            <a
              href="https://www.dahejsupport.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary w-full text-center"
              style={{
                borderColor: '#f59e0b',
                color: '#b45309',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                fontWeight: 700
              }}
            >
              Back to Dahej Support Site <ArrowUpRight size={16} className="arrow-icon" />
            </a>

            <a href="tel:+919601574966" className="mobile-phone-link">
              <div className="phone-icon-box">
                <Phone size={18} className="phone-icon" />
              </div>
              <div>
                <p>Call Us For Requirement</p>
                <strong>+91 96015 74966</strong>
              </div>
            </a>
            <Link 
              to="/login" 
              className="btn btn-primary w-full text-center"
              onClick={() => setIsOpen(false)}
            >
              Admin Panel <ArrowUpRight size={16} className="arrow-icon" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
