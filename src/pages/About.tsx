import { Target, Compass, Users, Sparkles, Building, Landmark } from 'lucide-react';
import './About.css';

export default function About() {
  return (
    <div className="about-page page-wrapper animate-fade-in">
      {/* Page Header */}
      <section className="about-header-section">
        <div className="container">
          <span className="section-tag">About</span>
          <h1 className="section-title">About Dahej Support</h1>
          <p className="section-desc">
            Your single-source industrial supply and procurement solutions partner supporting manufacturing plants, petrochemical facilities, EPC projects, and engineering units in Dahej PCPIR and across Gujarat.
          </p>
        </div>
      </section>

      {/* Main Profile Section */}
      <section className="section-padding profile-section">
        <div className="container">
          <div className="grid-2 profile-grid">
            <div className="profile-left">
              <h2 className="profile-subtitle">Serving Dahej PCPIR & Gujarat Industries</h2>
              <p className="profile-para">
                Dahej Support is a comprehensive industrial supplies and procurement partner based in Dahej, Gujarat, fulfilling the operational, engineering, and project requirements of modern manufacturing plants, chemical complexes, fabricators, contractors, and industrial enterprises.
              </p>
              <p className="profile-para">
                From industrial safety PPE, piping, valves, and high-grade fasteners to power tools, welding consumables, electricals, structural steel, and plant maintenance goods — Dahej Support makes the sourcing of industrial materials streamlined, transparent, and completely dependable.
              </p>
              <p className="profile-para">
                Strategically positioned in Gujarat's premier PCPIR industrial hub, our team understands the critical importance of zero downtime, strict quality compliance (MTC), and rapid on-ground delivery. We partner closely with plant procurement managers, maintenance engineers, and project heads to deliver end-to-end supply chain reliability.
              </p>
              <p className="profile-para border-quote">
                "Our approach is straightforward — provide certified industrial products, maintain transparent pricing, and deliver swift on-ground service that plants can rely on 24/7."
              </p>
            </div>

            <div className="profile-right">
              <div className="about-image-wrapper">
                <img src="/about_company.jpg" alt="Dahej Support Logistics Yard" className="about-company-img" />
              </div>
            </div>
          </div>

          {/* Stats Grid - Full Width */}
          <div className="about-stats-section">
            <div className="grid-4 stats-grid">
              <div className="stat-card">
                <Building size={32} className="stat-icon" />
                <h4>Dahej PCPIR Hub</h4>
                <p>Strategically located right in the heart of GIDC Dahej, Bharuch region.</p>
              </div>
              <div className="stat-card">
                <Users size={32} className="stat-icon" />
                <h4>B2B Partnerships</h4>
                <p>Contract supply, plant maintenance MRO, and project-based procurement.</p>
              </div>
              <div className="stat-card">
                <Sparkles size={32} className="stat-icon" />
                <h4>100% Quality Assured</h4>
                <p>Standardized sourcing meeting IS / ASTM / DIN industrial engineering standards.</p>
              </div>
              <div className="stat-card">
                <Landmark size={32} className="stat-icon" />
                <h4>Decade of Presence</h4>
                <p>Trusted supplier for Dahej petrochemical & manufacturing corridor since 2015.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="section-padding section-bg-alt mission-vision-section">
        <div className="container">
          <div className="grid-2 mv-grid">
            {/* Mission */}
            <div className="mv-card">
              <div className="mv-icon-box">
                <Target size={36} className="mv-icon" />
              </div>
              <h3 className="mv-title">Our Mission</h3>
              <p className="mv-desc">
                To be Gujarat's most reliable and comprehensive industrial supply partner, delivering end-to-end industrial consumables, hardware, piping, safety, and raw materials with unmatched speed and quality.
              </p>
              <p className="mv-desc">
                We aim to eliminate procurement friction for plant managers and engineering teams through consolidated single-window sourcing, verified mill test reports, and dedicated account management.
              </p>
              <p className="mv-desc highlighted-mv-text">
                At Dahej Support, every purchase order is executed with precision — right material, exact specification, and prompt on-site delivery.
              </p>
            </div>

            {/* Vision */}
            <div className="mv-card">
              <div className="mv-icon-box">
                <Compass size={36} className="mv-icon" />
              </div>
              <h3 className="mv-title">Our Vision</h3>
              <p className="mv-desc">
                To build Dahej Support into the foremost industrial procurement and supply chain powerhouse across Dahej, Bharuch, and the state of Gujarat.
              </p>
              <p className="mv-desc">
                We envision an industrial ecosystem powered by trusted long-term relationships, certified products, instant availability, and technology-driven order fulfillment.
              </p>
              <p className="mv-desc highlighted-mv-text">
                Our ultimate goal is being the first-choice name industrial enterprises turn to for all plant and project material requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Operational Principles */}
      <section className="section-padding principles-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Foundations</span>
            <h2 className="section-title text-center-x">Our Core Values</h2>
            <p className="section-desc mx-auto text-center-x">
              Three pillars that guide our customer service, quality inspections, and express GIDC logistics.
            </p>
          </div>

          <div className="grid-3 principles-grid">
            <div className="principle-card">
              <h3 className="principle-title">Material Integrity & MTC</h3>
              <p className="principle-text">
                All engineering supplies, pipes, valves, and structural metals are sourced from certified manufacturers with verified test certificates.
              </p>
            </div>
            
            <div className="principle-card">
              <h3 className="principle-title">Express GIDC Dispatch</h3>
              <p className="principle-text">
                Real-time loading updates, digital weighment slips, and same-day delivery coordination to prevent plant downtime and construction delays.
              </p>
            </div>

            <div className="principle-card">
              <h3 className="principle-title">Responsive B2B Support</h3>
              <p className="principle-text">
                Instant quote turnarounds, dedicated relationship desks, and customized billing support for corporate and project clients.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
