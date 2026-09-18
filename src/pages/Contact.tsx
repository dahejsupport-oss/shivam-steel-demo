import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Send, 
  ShieldAlert, 
  MessageSquare, 
  Building2, 
  Warehouse, 
  ExternalLink,
  User,
  Building,
  ArrowUpRight,
  Calculator,
  FileSpreadsheet,
  ShieldCheck,
  Scale,
  Truck,
  Award
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { sendInquiryConfirmationEmail } from '../utils/emailService';
import './Contact.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    requirement: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const newInquiry = {
      id: 'cq-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000),
      type: 'contact' as const,
      name: formData.name.trim(),
      company: formData.company.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      requirement: formData.requirement || 'General Contact Inquiry',
      message: formData.message.trim(),
      timestamp: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    try {
      // 1. Save to primary shivam_steel_inquiries storage for local cache
      try {
        const savedPrimary = localStorage.getItem('shivam_steel_inquiries');
        const listPrimary = savedPrimary ? JSON.parse(savedPrimary) : [];
        listPrimary.unshift(newInquiry);
        localStorage.setItem('shivam_steel_inquiries', JSON.stringify(listPrimary));
      } catch (err) {
        console.error('Storage error:', err);
      }

      // 2. Also keep sourcing_inquiries in sync
      try {
        const savedAlt = localStorage.getItem('sourcing_inquiries');
        const listAlt = savedAlt ? JSON.parse(savedAlt) : [];
        listAlt.unshift(newInquiry);
        localStorage.setItem('sourcing_inquiries', JSON.stringify(listAlt));
      } catch {}

      // 3. Sync to Supabase cloud table with await
      const supaPayload = {
        id: newInquiry.id,
        type: 'contact',
        name: newInquiry.name,
        company: newInquiry.company || '',
        phone: newInquiry.phone,
        email: newInquiry.email,
        requirement: newInquiry.message ? `${newInquiry.requirement} - ${newInquiry.message}` : newInquiry.requirement,
        quantity: null,
        unit: null,
        items: null,
        timestamp: newInquiry.timestamp || new Date().toLocaleString('en-IN')
      };

      const { error: supaErr } = await supabase.from('inquiries').insert([supaPayload]);
      if (supaErr) {
        console.error('Supabase contact insert error:', supaErr);
      }

      // Auto-dispatch confirmation email to customer (if email provided) AND instant lead alert to Admin
      sendInquiryConfirmationEmail(newInquiry).catch(mailErr => {
        console.warn('Contact inquiry auto-confirmation email dispatch warning:', mailErr);
      });

      // 4. Dispatch storage event for real-time admin sync
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsLoading(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="contact-page page-wrapper animate-fade-in">
      {/* Page Header */}
      <section className="contact-header-section">
        <div className="container">
          <span className="section-tag">Direct Communication</span>
          <h1 className="section-title">Get in Touch with Dahej Support</h1>
          <p className="section-desc">
            Connect directly with our sales, logistics, and billing teams in Dahej for material quotations, inventory status, yard pickup coordination, or administrative queries.
          </p>

          {/* Quick Header Highlights */}
          <div className="contact-quick-strip">
            <div className="quick-strip-item">
              <Phone size={18} className="strip-icon" />
              <div>
                <span className="strip-label">Direct Hotline</span>
                <span className="strip-val">+91 96015 74966</span>
              </div>
            </div>
            <div className="quick-strip-item">
              <MessageSquare size={18} className="strip-icon text-green" />
              <div>
                <span className="strip-label">WhatsApp Desk</span>
                <span className="strip-val">Instant Response Available</span>
              </div>
            </div>
            <div className="quick-strip-item">
              <Clock size={18} className="strip-icon" />
              <div>
                <span className="strip-label">Working Hours</span>
                <span className="strip-val">Mon - Sat: 09:00 AM - 06:30 PM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="section-padding contact-main-section">
        <div className="container">
          <div className="contact-layout-grid">
            
            {/* Left Column: Form & Key Sourcing Blocks */}
            <div className="contact-left-column">
              
              {/* Message Form Card */}
              {isSubmitted ? (
                <div className="contact-success-card text-center animate-fade-in">
                  <CheckCircle size={56} className="success-icon animate-scale-up" />
                  <h2>Message Successfully Sent</h2>
                  <p>
                    Thank you, <strong>{formData.name}</strong>. Your inquiry for <strong>{formData.company || 'your office'}</strong> has been registered with our team.
                  </p>
                  
                  <div className="inquiry-summary-box">
                    <h4>Inquiry Summary</h4>
                    <div className="summary-row">
                      <span>Contact Tel:</span>
                      <strong>{formData.phone}</strong>
                    </div>
                    {formData.email && (
                      <div className="summary-row">
                        <span>Email:</span>
                        <strong>{formData.email}</strong>
                      </div>
                    )}
                    {formData.requirement && (
                      <div className="summary-row">
                        <span>Subject:</span>
                        <strong>{formData.requirement}</strong>
                      </div>
                    )}
                  </div>

                  <p className="timeline-info-badge">
                    <Clock size={16} /> Our team usually reviews and responds within 1–2 business hours.
                  </p>
                  
                  <button 
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({ name: '', company: '', phone: '', email: '', requirement: '', message: '' });
                    }} 
                    className="btn btn-primary"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <div className="contact-form-card">
                  <div className="contact-form-header">
                    <h3>Send a Message</h3>
                    <p>Fill out the details below and our sales desk will get back to you promptly.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="contact-inquiry-form">
                    <div className="contact-form-row">
                      <div className="contact-form-group">
                        <label className="contact-form-label" htmlFor="name">
                          <User size={14} /> Your Name *
                        </label>
                        <input 
                          type="text" 
                          id="name" 
                          name="name" 
                          required 
                          className="contact-form-input" 
                          placeholder="e.g. Rajesh Patel" 
                          value={formData.name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="contact-form-group">
                        <label className="contact-form-label" htmlFor="company">
                          <Building size={14} /> Company / Firm Name *
                        </label>
                        <input 
                          type="text" 
                          id="company" 
                          name="company" 
                          required 
                          className="contact-form-input" 
                          placeholder="e.g. Gujarat Fabricators Pvt Ltd" 
                          value={formData.company}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="contact-form-row">
                      <div className="contact-form-group">
                        <label className="contact-form-label" htmlFor="phone">
                          <Phone size={14} /> Mobile / WhatsApp Number *
                        </label>
                        <input 
                          type="tel" 
                          id="phone" 
                          name="phone" 
                          required 
                          className="contact-form-input" 
                          placeholder="e.g. +91 99000 00000" 
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="contact-form-group">
                        <label className="contact-form-label" htmlFor="email">
                          <Mail size={14} /> Email Address (Optional)
                        </label>
                        <input 
                          type="email" 
                          id="email" 
                          name="email" 
                          className="contact-form-input" 
                          placeholder="e.g. rajesh@company.com" 
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="contact-form-group">
                      <label className="contact-form-label" htmlFor="requirement">
                        Inquiry Subject / Topic
                      </label>
                      <select 
                        id="requirement" 
                        name="requirement" 
                        className="contact-form-input contact-form-select"
                        value={formData.requirement}
                        onChange={handleChange}
                      >
                        <option value="">-- Choose Subject --</option>
                        <option value="Complete Industrial Supplies RFQ">Complete Industrial Supplies RFQ</option>
                        <option value="Piping, Valves & Fittings Quotation">Piping, Valves & Fittings Quotation</option>
                        <option value="Safety Gear & PPE Sourcing">Safety Gear & PPE Sourcing</option>
                        <option value="Industrial Hardware & Fasteners">Industrial Hardware & Fasteners</option>
                        <option value="Structural & Engineering Steel">Structural & Engineering Steel</option>
                        <option value="GIDC Logistics & Delivery Coordinates">GIDC Logistics & Delivery Coordinates</option>
                        <option value="Billing & Accounting Support">Billing & Accounting Support</option>
                        <option value="Test Certificates & MTC Request">Test Certificates & MTC Request</option>
                        <option value="Other Plant Maintenance Queries">Other Plant Maintenance Queries</option>
                      </select>
                    </div>

                    <div className="contact-form-group">
                      <label className="contact-form-label" htmlFor="message">
                        Message / Requirement Details *
                      </label>
                      <textarea 
                        id="message" 
                        name="message" 
                        required 
                        className="contact-form-input contact-form-textarea" 
                        placeholder="Please describe your industrial requirement, product names, sizes, quantity, or specific query..."
                        value={formData.message}
                        onChange={handleChange}
                      ></textarea>
                    </div>

                    <div className="contact-form-note">
                      <ShieldAlert size={16} className="note-alert-icon" />
                      <span>For instant itemized RFQs and proforma invoices, use our dedicated <strong>B2B Sourcing Portal</strong>.</span>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary contact-submit-btn" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending Message...' : 'Submit Message'}
                      {!isLoading && <Send size={16} />}
                    </button>
                  </form>
                </div>
              )}

              {/* Instant Self-Service Tools Card */}
              <div className="contact-tools-card">
                <div className="tools-card-header">
                  <div>
                    <span className="card-badge">Instant Self-Service</span>
                    <h3 className="tools-card-title">Need Instant Sourcing or Technical Calculations?</h3>
                    <p className="tools-card-desc">
                      Generate official multi-item RFQ inquiries or calculate material weights without waiting for sales response.
                    </p>
                  </div>
                </div>

                <div className="tools-card-actions">
                  <Link to="/inquiry" className="tool-btn btn-rfq">
                    <div className="tool-btn-icon">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div className="tool-btn-text">
                      <strong>B2B Industrial Sourcing Portal</strong>
                      <span>Build multi-item RFQ & submit complete plant BOM</span>
                    </div>
                    <ArrowUpRight size={16} className="tool-arrow" />
                  </Link>

                  <Link to="/calculator" className="tool-btn btn-calc">
                    <div className="tool-btn-icon">
                      <Calculator size={20} />
                    </div>
                    <div className="tool-btn-text">
                      <strong>Steel & Metals Weight Calculator</strong>
                      <span>Calculate standard weights & convert metric tons</span>
                    </div>
                    <ArrowUpRight size={16} className="tool-arrow" />
                  </Link>
                </div>
              </div>

              {/* 4-Point Supply Commitments Grid */}
              <div className="contact-commitments-card">
                <div className="commitments-header">
                  <ShieldCheck size={22} className="commitments-header-icon" />
                  <div>
                    <h4 className="commitments-title">Our Industrial Supply & Quality Assurance</h4>
                    <p className="commitments-subtitle">Why industrial plants & contractors in Gujarat trust Dahej Support</p>
                  </div>
                </div>

                <div className="commitments-grid">
                  <div className="commitment-item">
                    <div className="commitment-icon-wrap">
                      <Award size={18} />
                    </div>
                    <div>
                      <strong>100% Certified Industrial Goods</strong>
                      <p>Full traceability with genuine manufacturer test certificates & compliance.</p>
                    </div>
                  </div>

                  <div className="commitment-item">
                    <div className="commitment-icon-wrap">
                      <Scale size={18} />
                    </div>
                    <div>
                      <strong>Weighbridge & Batch Accuracy</strong>
                      <p>Computerized weighment slips and itemized checklists with every dispatch.</p>
                    </div>
                  </div>

                  <div className="commitment-item">
                    <div className="commitment-icon-wrap">
                      <Truck size={18} />
                    </div>
                    <div>
                      <strong>Express GIDC Logistics</strong>
                      <p>Express trailer and truck loading for Dahej PCPIR, Bharuch, and Gujarat industrial corridors.</p>
                    </div>
                  </div>

                  <div className="commitment-item">
                    <div className="commitment-icon-wrap">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <strong>Comprehensive Ready Inventory</strong>
                      <p>Piping, safety gear, fasteners, tools, valves, and structural metals ready for pickup.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Address, Map & Timeline Cards */}
            <div className="contact-sidebar-container">
              
              {/* Card 1: Company Main Office */}
              <div className="contact-card location-card">
                <div className="contact-card-header">
                  <div className="card-header-icon-wrap">
                    <Building2 size={20} className="card-header-icon" />
                  </div>
                  <div className="card-header-text">
                    <span className="card-badge">Main Office</span>
                    <h3 className="card-title">Company Main Office</h3>
                  </div>
                </div>

                <div className="card-body">
                  <div className="contact-detail-row">
                    <MapPin size={18} className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Address</span>
                      <p className="detail-text">
                        G/F/2, Rushiraj Complex, Bharuch - Dahej Rd, Rahiyad, Dahej, Gujarat – 392135
                      </p>
                    </div>
                  </div>

                  <div className="contact-detail-row">
                    <Phone size={18} className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Hotline & Phone</span>
                      <div className="detail-links-row">
                        <a href="tel:+919601574966" className="detail-link">+91 96015 74966</a>
                      </div>
                    </div>
                  </div>

                  <div className="contact-detail-row">
                    <Mail size={18} className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Email</span>
                      <a href="mailto:help@dahejsupport.com" className="detail-link email-color">
                        help@dahejsupport.com
                      </a>
                    </div>
                  </div>

                  {/* Map Preview Box */}
                  <div className="contact-map-preview">
                    <iframe
                      title="Dahej Support - Company Main Office Map"
                      src="https://maps.google.com/maps?q=SHIVAM+STEEL+-+Dahej,+rushiraj+complex,+Bharuch+-+Dahej+Rd,+Rahiyad,+Gujarat+392135&t=&z=14&ie=UTF8&iwloc=&output=embed"
                      className="contact-map-iframe"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <a 
                    href="https://maps.app.goo.gl/6EsHmKiWG6Gu6khQ9" 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-map-action"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Card 2: Dahej Supply Godown */}
              <div className="contact-card location-card">
                <div className="contact-card-header">
                  <div className="card-header-icon-wrap">
                    <Warehouse size={20} className="card-header-icon" />
                  </div>
                  <div className="card-header-text">
                    <span className="card-badge badge-godown">Stockyard & Logistics</span>
                    <h3 className="card-title">Dahej Supply Godown (Godown 2)</h3>
                  </div>
                </div>

                <div className="card-body">
                  <div className="contact-detail-row">
                    <MapPin size={18} className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Stockyard Address</span>
                      <p className="detail-text">
                        D/2/E/331, Galenda Road, Near Suva Chokdi, GIDC, Dahej, Gujarat – 392130
                      </p>
                    </div>
                  </div>

                  <div className="contact-detail-row">
                    <MessageSquare size={18} className="detail-icon text-green" />
                    <div className="detail-content">
                      <span className="detail-label">WhatsApp Logistics Desk</span>
                      <a 
                        href="https://wa.me/919601574966?text=Hello%20Dahej%20Support,%20I%20have%20an%20inquiry." 
                        target="_blank" 
                        rel="noreferrer"
                        className="whatsapp-desk-link"
                      >
                        <span>Chat on WhatsApp (+91 96015 74966)</span>
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </div>

                  {/* Map Preview Box */}
                  <div className="contact-map-preview">
                    <iframe
                      title="Dahej Support - Godown 2 Map"
                      src="https://maps.google.com/maps?q=SHIVAM+STEEL+-+2+(GODOWN),+2%2FE%2F331,+GALENDA+ROAD,+near+SUVA+CHOKDI,+Gidc,+Dahej,+Gujarat+392130&t=&z=14&ie=UTF8&iwloc=&output=embed"
                      className="contact-map-iframe"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <a 
                    href="https://maps.app.goo.gl/1UMyTBMtmjnYkiAy6" 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-map-action"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Card 3: Operating Hours */}
              <div className="contact-card timeline-card">
                <div className="contact-card-header">
                  <div className="card-header-icon-wrap">
                    <Clock size={20} className="card-header-icon" />
                  </div>
                  <div className="card-header-text">
                    <span className="card-badge">Working Schedule</span>
                    <h3 className="card-title">Operating Timeline</h3>
                  </div>
                </div>

                <div className="timeline-list">
                  <div className="timeline-item">
                    <div className="timeline-day">Monday – Saturday</div>
                    <div className="timeline-time badge-open">09:00 AM – 06:30 PM</div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-day">Sunday Logistics</div>
                    <div className="timeline-time badge-closed">Closed (Maintenance)</div>
                  </div>
                  <div className="timeline-footer-note">
                    <span className="dot-online"></span>
                    <span>WhatsApp quotes and portal inquiries are accepted 24/7.</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
