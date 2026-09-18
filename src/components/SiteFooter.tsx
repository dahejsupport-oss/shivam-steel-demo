import { Link } from 'react-router-dom';
import { Mail, MapPin, ArrowUpRight, ShieldCheck, Clock, Phone, Building2, Warehouse, ExternalLink, MessageSquare } from 'lucide-react';
import './SiteFooter.css';

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  // WhatsApp click handler
  const handleWhatsAppClick = () => {
    const phoneNumber = "919601574966";
    const text = encodeURIComponent("Hello Dahej Support, I am looking for a material quote.");
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank');
  };

  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-grid-wrapper">
          {/* Column 1: Brand & Info */}
          <div className="footer-col brand-col">
            <Link to="/" className="footer-logo-link">
              <div className="footer-logo-combo">
                <img 
                  src="/logo/logo-icon.png" 
                  alt="Dahej Support" 
                  className="footer-brand-icon"
                />
                <img 
                  src="/logo/logo-wordmark.png" 
                  alt="Dahej Support" 
                  className="footer-brand-logo"
                />
              </div>
            </Link>
            <p className="footer-desc-text">
              A trusted complete industrial supplies and procurement partner serving chemical plants, manufacturing units, engineering workshops, and project contractors across Dahej and Gujarat.
            </p>

            <div className="footer-contact-highlights">
              <div className="contact-inline-item">
                <Phone size={16} className="contact-accent-icon" />
                <div className="contact-phones">
                  <a href="tel:+919601574966" className="footer-phone-link">+91 96015 74966</a>
                </div>
              </div>

              <div className="contact-inline-item">
                <Mail size={16} className="contact-accent-icon" />
                <a href="mailto:help@dahejsupport.com" className="email-link">
                  help@dahejsupport.com
                </a>
              </div>
            </div>

            <div className="trust-badges-wrap">
              <div className="trust-badge">
                <ShieldCheck className="badge-icon" size={17} />
                <span>Complete Industrial Supplies • Genuine Quality</span>
              </div>
              <div className="trust-badge">
                <Clock className="badge-icon" size={17} />
                <span>Fast GIDC Sourcing & Delivery</span>
              </div>
            </div>

            <button onClick={handleWhatsAppClick} className="btn-whatsapp-footer">
              <MessageSquare size={16} />
              <span>WhatsApp Quick Inquiry</span>
              <ArrowUpRight size={14} className="arrow-icon" />
            </button>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="footer-col link-col">
            <h4 className="footer-col-title">Navigation</h4>
            <ul className="footer-links">
              <li>
                <Link to="/">Home Page</Link>
              </li>
              <li>
                <Link to="/products">Explore Products</Link>
              </li>
              <li>
                <Link to="/calculator">Steel Calculator</Link>
              </li>
              <li>
                <Link to="/inquiry">Inquiry Portal</Link>
              </li>
              <li>
                <Link to="/about">About Dahej Support</Link>
              </li>
              <li>
                <Link to="/contact">Get in Touch</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company Address (Main Office) with Map Preview */}
          <div className="footer-col location-card-col">
            <div className="footer-location-card">
              <div className="location-card-header">
                <div className="location-header-title">
                  <Building2 size={18} className="location-type-icon" />
                  <span className="location-badge">Company Address</span>
                </div>
                <h5 className="location-name">Main Office (Dahej)</h5>
              </div>

              <div className="location-address-box">
                <MapPin size={16} className="address-pin-icon" />
                <p>
                  G/F/2, Rushiraj Complex, Bharuch - Dahej Rd, Rahiyad, Dahej, Gujarat – 392135
                </p>
              </div>

              <div className="footer-map-preview-wrap">
                <iframe
                  title="Dahej Support - Company Office Map Preview"
                  src="https://maps.google.com/maps?q=SHIVAM+STEEL+-+Dahej,+rushiraj+complex,+Bharuch+-+Dahej+Rd,+Rahiyad,+Gujarat+392135&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  className="footer-map-iframe"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <a
                href="https://maps.app.goo.gl/6EsHmKiWG6Gu6khQ9"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-map-direction"
              >
                <span>Open in Google Maps</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Column 4: Godown Address (Stockyard) with Map Preview */}
          <div className="footer-col location-card-col">
            <div className="footer-location-card">
              <div className="location-card-header">
                <div className="location-header-title">
                  <Warehouse size={18} className="location-type-icon" />
                  <span className="location-badge">Godown Address</span>
                </div>
                <h5 className="location-name">Godown 2 (Dahej GIDC)</h5>
              </div>

              <div className="location-address-box">
                <MapPin size={16} className="address-pin-icon" />
                <p>
                  D/2/E/331, Galenda Road, Near Suva Chokdi, GIDC, Dahej, Gujarat – 392130
                </p>
              </div>

              <div className="footer-map-preview-wrap">
                <iframe
                  title="Dahej Support - Godown 2 Map Preview"
                  src="https://maps.google.com/maps?q=SHIVAM+STEEL+-+2+(GODOWN),+2%2FE%2F331,+GALENDA+ROAD,+near+SUVA+CHOKDI,+Gidc,+Dahej,+Gujarat+392130&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  className="footer-map-iframe"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <a
                href="https://maps.app.goo.gl/1UMyTBMtmjnYkiAy6"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-map-direction"
              >
                <span>Open in Google Maps</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-container">
          <p className="copyright">
            &copy; {currentYear} Dahej Support. All rights reserved.
          </p>
          <div className="bottom-links">
            <span className="location-tag">Dahej • Bharuch • Gujarat • India</span>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="floating-actions-container">
        {/* Direct Inquiry Button */}
        <Link 
          to="/inquiry" 
          className="inquiry-widget"
          aria-label="Send Sourcing Inquiry"
          title="Send Sourcing Inquiry"
        >
          <MessageSquare size={26} />
        </Link>

        {/* WhatsApp Widget */}
        <button 
          onClick={handleWhatsAppClick} 
          className="whatsapp-widget"
          aria-label="Contact us on WhatsApp"
          title="Chat on WhatsApp"
        >
          <svg viewBox="0 0 448 512" width="30" height="30" fill="currentColor">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
          </svg>
        </button>
      </div>
    </footer>
  );
}
