import { Globe, ArrowUpRight, Sparkles } from 'lucide-react';
import './MainSiteBanner.css';

interface MainSiteBannerProps {
  variant?: 'header' | 'admin' | 'standalone';
  className?: string;
}

export default function MainSiteBanner({ variant = 'header', className = '' }: MainSiteBannerProps) {
  return (
    <aside 
      className={`main-site-banner-strip banner-variant-${variant} ${className}`}
      aria-label="Main Website Navigation Notice"
    >
      <div className="main-site-banner-container">
        {/* Left Side: Important Pulse Tag & Informative Text */}
        <div className="banner-info-wrap">
          <div className="banner-important-badge">
            <span className="pulse-indicator">
              <span className="pulse-dot"></span>
              <span className="pulse-ring"></span>
            </span>
            <Sparkles size={12} className="badge-sparkle-icon" />
            <span className="badge-label">MAIN PORTAL</span>
          </div>

          <div className="banner-message">
            <span className="banner-heading">
              Back to Dahej Support Site
            </span>
            <span className="banner-divider" aria-hidden="true">|</span>
            <span className="banner-tagline">
              Official B2B Industrial Supply Platform for Dahej PCPIR & Gujarat
            </span>
          </div>
        </div>

        {/* Right Side: Prominent Return CTA Button */}
        <div className="banner-action-wrap">
          <a
            href="https://www.dahejsupport.com"
            target="_blank"
            rel="noopener noreferrer"
            className="main-site-return-btn"
            title="Open www.dahejsupport.com in new tab"
          >
            <Globe size={14} className="btn-globe-icon" />
            <span className="btn-text">Back to Dahej Support Site</span>
            <span className="btn-url-tag">www.dahejsupport.com</span>
            <ArrowUpRight size={15} className="btn-arrow-icon" />
          </a>
        </div>
      </div>
    </aside>
  );
}
