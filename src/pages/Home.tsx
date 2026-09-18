import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ShieldCheck,
  Factory,
  Truck,
  ChevronRight,
  Hammer,
  Briefcase,
  Package,
  ArrowRight,
  Wrench,
  Zap,
  Layers,
  Cpu,
  Shield
} from 'lucide-react';
import { getProducts, type Product } from '../utils/productService';
import { supabase } from '../supabaseClient';
import './Home.css';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const list = await getProducts();
        if (isMounted) {
          setProducts(list.filter(p => p.isActive));
          setIsLoadingProducts(false);
        }
      } catch (err) {
        console.error('Failed to load products on Home:', err);
        if (isMounted) setIsLoadingProducts(false);
      }
    }
    load();

    const handleStorage = () => load();
    window.addEventListener('storage', handleStorage);

    const realtimeChannel = supabase
      .channel('home_products_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        load();
      })
      .subscribe();

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorage);
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  return (
    <div className="home-page page-wrapper animate-fade-in">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-tag">ONE-STOP INDUSTRIAL SUPPLY PARTNER</span>
            <h1 className="hero-title">
              Gujarat’s Trusted Hub for <br />
              <span className="text-glow">Complete Industrial Supplies</span>
            </h1>
            
            <p className="hero-desc">
              Your single-source partner for Industrial Hardware, Safety & PPE, Valves & Piping, Electricals, Power Tools, Fasteners, Structural Steel, and Plant Maintenance Consumables — Serving Dahej PCPIR & Gujarat Industries.
            </p>

            <div className="hero-ctas">
              <Link to="/products" className="btn btn-primary">
                Explore Industrial Catalog <ArrowUpRight size={18} className="arrow-icon" />
              </Link>
              <Link to="/contact" className="btn btn-secondary">
                Request Quick Quote
              </Link>
            </div>

            <div className="hero-trustline">
              <span className="bullet">•</span> Complete Industrial Range 
              <span className="bullet">•</span> Fast GIDC Delivery 
              <span className="bullet">•</span> Genuine Quality & MTC
            </div>
          </div>
        </div>
      </section>

      {/* Brand Partners Marquee Scroll Bar */}
      <section id="brands-bar" className="brand-ticker-section">
        <div className="brand-ticker-inner">
          <div className="brand-ticker-header">
            <span className="brand-ticker-title">Working with top brands</span>
          </div>

          <div className="marquee-wrapper">
            <div className="marquee-fade-left"></div>
            <div className="marquee-track">
              {/* Set 1 */}
              {[
                { name: 'TATA TISCON', src: '/brands/tata-tiscon.png' },
                { name: 'Jindal Star', src: '/brands/jindal-star.jpg' },
                { name: 'APL APOLLO Steel Pipes', src: '/brands/apl-apollo.jpg' },
                { name: 'AM/NS INDIA', src: '/brands/amns-india.jpg' },
                { name: 'JSW Steel', src: '/brands/jsw-steel.png' },
                { name: 'Asian Tubes & Pipes', src: '/brands/asian-tubes.jpg' },
                { name: 'UltraTech Cement', src: '/brands/ultratech.png' },
                { name: 'Everest Roofing Solution', src: '/brands/everest.jpg' },
                { name: 'SAIL', src: '/brands/sail.png' },
                { name: 'VIZAG STEEL', src: '/brands/vizag-steel.png' },
                { name: 'Rudra TMX', src: '/brands/rudra-tmx.png' },
                { name: 'GALLANTT', src: '/brands/gallantt.jpg' }
              ].map((brand, idx) => (
                <div key={`brand-1-${idx}`} className="brand-logo-item" title={brand.name}>
                  <img src={brand.src} alt={brand.name} className="brand-logo-img-ticker" />
                </div>
              ))}
              {/* Set 2 (Duplicate for infinite seamless loop) */}
              {[
                { name: 'TATA TISCON', src: '/brands/tata-tiscon.png' },
                { name: 'Jindal Star', src: '/brands/jindal-star.jpg' },
                { name: 'APL APOLLO Steel Pipes', src: '/brands/apl-apollo.jpg' },
                { name: 'AM/NS INDIA', src: '/brands/amns-india.jpg' },
                { name: 'JSW Steel', src: '/brands/jsw-steel.png' },
                { name: 'Asian Tubes & Pipes', src: '/brands/asian-tubes.jpg' },
                { name: 'UltraTech Cement', src: '/brands/ultratech.png' },
                { name: 'Everest Roofing Solution', src: '/brands/everest.jpg' },
                { name: 'SAIL', src: '/brands/sail.png' },
                { name: 'VIZAG STEEL', src: '/brands/vizag-steel.png' },
                { name: 'Rudra TMX', src: '/brands/rudra-tmx.png' },
                { name: 'GALLANTT', src: '/brands/gallantt.jpg' }
              ].map((brand, idx) => (
                <div key={`brand-2-${idx}`} className="brand-logo-item" title={brand.name}>
                  <img src={brand.src} alt={brand.name} className="brand-logo-img-ticker" />
                </div>
              ))}
            </div>
            <div className="marquee-fade-right"></div>
          </div>
        </div>
      </section>

      {/* Dynamic Products Showcase Section (Animated Loop Marquee) */}
      <section className="home-products-section">
        <div className="container">
          <div className="home-products-header">
            <div>
              <div className="section-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Package size={15} /> Verified Supply Catalog
              </div>
              <h2 className="section-title" style={{ margin: 0 }}>Our Featured Products</h2>
            </div>
            <Link to="/products" className="btn btn-secondary home-products-view-all">
              Explore All Products <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Continuous Products Marquee Track (Left to Right Loop) */}
        <div className="products-marquee-container">
          <div className="products-marquee-fade-left"></div>
          <div className="products-marquee-track">
            {isLoadingProducts ? (
              // Loading skeleton placeholders
              [1, 2, 3, 4, 5, 6].map((sk) => (
                <div key={`sk-${sk}`} className="home-product-card skeleton-card">
                  <div className="home-product-img-box skeleton-box"></div>
                  <div className="home-product-body">
                    <div className="skeleton-line" style={{ width: '40%', height: '14px' }}></div>
                    <div className="skeleton-line" style={{ width: '85%', height: '20px', marginTop: '8px' }}></div>
                    <div className="skeleton-line" style={{ width: '65%', height: '14px', marginTop: '6px' }}></div>
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div style={{ padding: '32px', color: 'var(--text-secondary)', textAlign: 'center' }}>No active products available.</div>
            ) : (
              <>
                {/* Track Set 1 */}
                {products.map((prod, idx) => (
                  <div key={`prod-set1-${prod.id || idx}`} className="home-product-card">
                    <div className="home-product-img-box">
                      <img
                        src={prod.image || '/products/prod_tmt.jpg'}
                        alt={prod.name}
                        className="home-product-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/products/prod_tmt.jpg';
                        }}
                      />
                      <div className="home-product-cat-badge">
                        {prod.category === 'piping' ? 'Piping & Valves' : prod.category === 'safety' ? 'Safety & PPE' : prod.category === 'steel' ? 'Structural Steel' : prod.category === 'building' ? 'Civil & Building' : 'Industrial Supplies'}
                      </div>
                      {prod.measurement && (
                        <div className="home-product-unit-badge">
                          Per {prod.measurement.toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="home-product-body">
                      <div className="home-product-subcat">{prod.subcategory || 'General Material'}</div>
                      <h3 className="home-product-title" title={prod.name}>
                        {prod.name}
                      </h3>
                      <p className="home-product-desc">
                        {prod.description}
                      </p>

                      <div className="home-product-meta">
                        {prod.moq > 0 && (
                          <span className="home-product-pill">
                            MOQ: <strong>{prod.moq} {prod.measurement?.toUpperCase() || ''}</strong>
                          </span>
                        )}
                        {prod.hsn && (
                          <span className="home-product-pill">
                            HSN: <strong>{prod.hsn}</strong>
                          </span>
                        )}
                      </div>

                      {prod.sizes && prod.sizes.length > 0 && (
                        <div className="home-product-sizes-wrap">
                          {prod.sizes.slice(0, 3).map((s, sIdx) => (
                            <span key={sIdx} className="home-product-size-chip">
                              {s}
                            </span>
                          ))}
                          {prod.sizes.length > 3 && (
                            <span className="home-product-size-more">
                              +{prod.sizes.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="home-product-footer">
                        <Link
                          to={`/inquiry?product=${encodeURIComponent(prod.name)}`}
                          className="btn btn-primary btn-sm home-product-inq-btn"
                        >
                          Inquire Rate <ArrowUpRight size={14} />
                        </Link>
                        <Link
                          to={`/products?category=${encodeURIComponent(prod.category)}`}
                          className="home-product-details-link"
                        >
                          Specs <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Track Set 2 (Duplicate for continuous seamless loop) */}
                {products.map((prod, idx) => (
                  <div key={`prod-set2-${prod.id || idx}`} className="home-product-card">
                    <div className="home-product-img-box">
                      <img
                        src={prod.image || '/products/prod_tmt.jpg'}
                        alt={prod.name}
                        className="home-product-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/products/prod_tmt.jpg';
                        }}
                      />
                      <div className="home-product-cat-badge">
                        {prod.category === 'piping' ? 'Piping & Valves' : prod.category === 'safety' ? 'Safety & PPE' : prod.category === 'steel' ? 'Structural Steel' : prod.category === 'building' ? 'Civil & Building' : 'Industrial Supplies'}
                      </div>
                      {prod.measurement && (
                        <div className="home-product-unit-badge">
                          Per {prod.measurement.toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="home-product-body">
                      <div className="home-product-subcat">{prod.subcategory || 'General Material'}</div>
                      <h3 className="home-product-title" title={prod.name}>
                        {prod.name}
                      </h3>
                      <p className="home-product-desc">
                        {prod.description}
                      </p>

                      <div className="home-product-meta">
                        {prod.moq > 0 && (
                          <span className="home-product-pill">
                            MOQ: <strong>{prod.moq} {prod.measurement?.toUpperCase() || ''}</strong>
                          </span>
                        )}
                        {prod.hsn && (
                          <span className="home-product-pill">
                            HSN: <strong>{prod.hsn}</strong>
                          </span>
                        )}
                      </div>

                      {prod.sizes && prod.sizes.length > 0 && (
                        <div className="home-product-sizes-wrap">
                          {prod.sizes.slice(0, 3).map((s, sIdx) => (
                            <span key={sIdx} className="home-product-size-chip">
                              {s}
                            </span>
                          ))}
                          {prod.sizes.length > 3 && (
                            <span className="home-product-size-more">
                              +{prod.sizes.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="home-product-footer">
                        <Link
                          to={`/inquiry?product=${encodeURIComponent(prod.name)}`}
                          className="btn btn-primary btn-sm home-product-inq-btn"
                        >
                          Inquire Rate <ArrowUpRight size={14} />
                        </Link>
                        <Link
                          to={`/products?category=${encodeURIComponent(prod.category)}`}
                          className="home-product-details-link"
                        >
                          Specs <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="products-marquee-fade-right"></div>
        </div>
      </section>

      {/* 2. What We Do Section */}
      <section id="what-we-do" className="section-padding what-we-do-section">
        <div className="container">
          <div className="section-header text-center-sm">
            <span className="section-tag">Comprehensive Industrial Scope</span>
            <h2 className="section-title">What We Supply</h2>
            <p className="section-desc">
              From day-to-day plant consumables and safety gear to heavy piping, structural materials, and engineering hardware — we supply everything your facility needs.
            </p>
          </div>

          <div className="grid-4 services-grid">
            {/* Card 1 */}
            <div className="service-card">
              <div className="service-icon-box">
                <Factory size={28} className="service-icon" />
              </div>
              <h3 className="service-card-title">Piping, Valves & Fittings</h3>
              <p className="service-card-text">
                Seamless & ERW MS/SS/GI pipes, industrial ball valves, butterfly valves, forged flanges, elbows, tees, gaskets, and fluid handling supplies.
              </p>
              <Link to="/products" className="service-card-link" aria-label="Explore Piping & Valves">
                <ChevronRight size={18} />
              </Link>
              <div className="service-card-image industrial-supply-bg"></div>
            </div>

            {/* Card 2 */}
            <div className="service-card">
              <div className="service-icon-box">
                <Shield size={28} className="service-icon" />
              </div>
              <h3 className="service-card-title">Safety & PPE Supplies</h3>
              <p className="service-card-text">
                Certified safety helmets, safety shoes, high-visibility jackets, fall protection harnesses, gloves, eye protection, and plant safety gear.
              </p>
              <Link to="/products" className="service-card-link" aria-label="Explore Safety Supplies">
                <ChevronRight size={18} />
              </Link>
              <div className="service-card-image support-bg"></div>
            </div>

            {/* Card 3 */}
            <div className="service-card">
              <div className="service-icon-box">
                <Wrench size={28} className="service-icon" />
              </div>
              <h3 className="service-card-title">Industrial Hardware & Fasteners</h3>
              <p className="service-card-text">
                High-tensile bolts, nuts, washers, anchors, power tools, cutting wheels, welding electrodes, industrial paints, lubricants, and MRO spares.
              </p>
              <Link to="/products" className="service-card-link" aria-label="Explore Industrial Hardware">
                <ChevronRight size={18} />
              </Link>
              <div className="service-card-image building-materials-bg"></div>
            </div>

            {/* Card 4 */}
            <div className="service-card">
              <div className="service-icon-box">
                <Layers size={28} className="service-icon" />
              </div>
              <h3 className="service-card-title">Structural Steel & Fabrication</h3>
              <p className="service-card-text">
                Full range of TMT rebars (Fe 500D/550D), HR plates, beams, angles, channels, sheets, and civil materials backed by genuine Mill Test Certificates.
              </p>
              <Link to="/products" className="service-card-link" aria-label="Explore Structural Steel">
                <ChevronRight size={18} />
              </Link>
              <div className="service-card-image steel-supply-bg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Why Choose Us Section */}
      <section className="section-padding section-bg-alt why-choose-section">
        <div className="container">
          <div className="section-header text-center-sm">
            <span className="section-tag">Value Proposition</span>
            <h2 className="section-title">Why Choose Dahej Support?</h2>
            <p className="section-desc">
              We streamline industrial procurement with single-source convenience, strict quality compliance, and rapid on-ground delivery across Gujarat.
            </p>
          </div>

          <div className="grid-3 choose-grid">
            <div className="choose-card">
              <div className="choose-indicator">01</div>
              <h3 className="choose-title">Single-Source Sourcing</h3>
              <p className="choose-text">Consolidate safety gear, piping, hardware, structural items, and consumables under one reliable vendor partner.</p>
            </div>

            <div className="choose-card">
              <div className="choose-indicator">02</div>
              <h3 className="choose-title">Certified Quality & MTC</h3>
              <p className="choose-text">All engineering goods and materials comply with strict IS/ASTM standards, accompanied by authentic test reports.</p>
            </div>

            <div className="choose-card">
              <div className="choose-indicator">03</div>
              <h3 className="choose-title">Express GIDC Logistics</h3>
              <p className="choose-text">Swift dispatch across Dahej PCPIR, Bharuch, Ankleshwar, Panoli, Jhagadia, and Gujarat industrial corridors.</p>
            </div>

            <div className="choose-card">
              <div className="choose-indicator">04</div>
              <h3 className="choose-title">B2B Contract & Shutdown Supply</h3>
              <p className="choose-text">Tailored supply schedules for plant turnarounds, emergency breakdowns, annual contracts, and large project RFQs.</p>
            </div>

            <div className="choose-card">
              <div className="choose-indicator">05</div>
              <h3 className="choose-title">Strategic Dahej Hub</h3>
              <p className="choose-text">Located right in the heart of Dahej PCPIR for immediate material inspection, loading, and on-site support.</p>
            </div>

            <div className="choose-card">
              <div className="choose-indicator">06</div>
              <h3 className="choose-title">Transparent & Dedicated</h3>
              <p className="choose-text">Computerized weighbridge verification, competitive transparent pricing, and responsive account coordination.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Our Approach Section */}
      <section className="section-padding approach-section">
        <div className="container">
          <div className="grid-2 approach-grid">
            <div className="approach-left">
              <span className="section-tag">How We Work</span>
              <h2 className="section-title">Built Around Industrial Reliability</h2>
              <p className="approach-intro-text">
                At Dahej Support, we simplify complex plant procurement. From understanding exact engineering specifications and brand preferences to fast loading and documentation, we ensure your operations never stop.
              </p>
              <p className="approach-summary-text">
                Single Window Procurement. Dependable Execution.
              </p>
              <div className="approach-badge">
                <ShieldCheck size={24} className="text-orange" />
                <div>
                  <strong>100% Verified Sourcing</strong>
                  <p>Guaranteed quote turnaround within 1–2 hours for standard RFQs.</p>
                </div>
              </div>
            </div>

            <div className="approach-right">
              <div className="approach-steps">
                {/* Step 1 */}
                <div className="approach-step-item">
                  <div className="step-number-box">
                    <span>1</span>
                  </div>
                  <div className="step-content">
                    <h3 className="step-title">Understand & Match</h3>
                    <p className="step-desc">We review your BOM, technical specs, grade requirements, and delivery timeline.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="approach-step-item">
                  <div className="step-number-box">
                    <span>2</span>
                  </div>
                  <div className="step-content">
                    <h3 className="step-title">Procure & Inspect</h3>
                    <p className="step-desc">Materials are sourced directly from verified manufacturers and undergo strict yard quality checks.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="approach-step-item">
                  <div className="step-number-box">
                    <span>3</span>
                  </div>
                  <div className="step-content">
                    <h3 className="step-title">Express Dispatch</h3>
                    <p className="step-desc">Prompt loading with digital weighment slips, invoices, and MTC test certificates dispatched on site.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Industries We Serve Section */}
      <section className="section-padding section-bg-alt industries-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Markets We Support</span>
            <h2 className="section-title text-center-x">Industries We Serve</h2>
            <p className="section-desc mx-auto text-center-x">
              We regularly supply standard and specialized industrial materials across diverse manufacturing and infrastructure sectors.
            </p>
          </div>

          <div className="industries-grid">
            <div className="industry-badge-card">
              <Factory size={22} className="industry-icon" />
              <span>Chemical & Petrochemical</span>
            </div>
            <div className="industry-badge-card">
              <Zap size={22} className="industry-icon" />
              <span>Power & Energy Plants</span>
            </div>
            <div className="industry-badge-card">
              <Hammer size={22} className="industry-icon" />
              <span>Fabrication & Engineering</span>
            </div>
            <div className="industry-badge-card">
              <Truck size={22} className="industry-icon" />
              <span>Ports, Marine & Terminals</span>
            </div>
            <div className="industry-badge-card">
              <Briefcase size={22} className="industry-icon" />
              <span>EPC & Infrastructure Projects</span>
            </div>
            <div className="industry-badge-card">
              <Cpu size={22} className="industry-icon" />
              <span>Pharma & Manufacturing Units</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA Section */}
      <section className="cta-banner-section section-padding">
        <div className="cta-overlay"></div>
        <div className="container cta-container">
          <div className="cta-content text-center">
            <h2 className="cta-title">Looking for Complete Industrial Supplies in Dahej?</h2>
            <p className="cta-desc">
              Send us your required items — from safety & hardware to piping, valves, steel, and plant maintenance goods — and our sales team will share instant pricing and delivery schedules.
            </p>
            <Link to="/contact" className="btn btn-primary btn-large">
              Request Industrial Quotation <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
