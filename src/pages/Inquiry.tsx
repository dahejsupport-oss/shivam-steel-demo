import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  Send,
  ShieldAlert,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { type Category, type Product, getCategories, getProducts } from '../utils/productService';
import { sendInquiryConfirmationEmail } from '../utils/emailService';
import './Inquiry.css';

export interface RequirementItem {
  id: string;
  category: string;
  productName: string;
  customProductName?: string;
  isCustomProduct?: boolean;
  size: string;
  customSize: string;
  quantity: string;
  unit: string;
}

export default function Inquiry() {
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);

  // Contact Details
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    gst: '',
    location: '',
    notes: ''
  });

  // Dynamic Requirements List (Starts with 1 item, user can add unlimited items)
  const [requirements, setRequirements] = useState<RequirementItem[]>([
    {
      id: 'req_1',
      category: '',
      productName: '',
      customProductName: '',
      isCustomProduct: false,
      size: '',
      customSize: '',
      quantity: '',
      unit: 'TON'
    }
  ]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Inline Validation Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation Popup Modal State
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    message: string;
    focusFieldId?: string;
  } | null>(null);

  // Sync catalog and handle pre-filled parameters from catalog or calculator
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const [allCats, allProds] = await Promise.all([
          getCategories(),
          getProducts()
        ]);
        if (isMounted) {
          setCategories(allCats);
          const active = allProds.filter(p => p.isActive);
          setActiveProducts(active);

          // Handle URL query parameters (e.g. ?product=TMT+Steel+Bars&size=12mm&category=steel)
          const productParam = searchParams.get('product');
          const categoryParam = searchParams.get('category');
          const sizeParam = searchParams.get('size');

          if (productParam || categoryParam || sizeParam) {
            const matchedProd = active.find(
              p => p.name.toLowerCase() === (productParam || '').toLowerCase() || p.id === productParam
            );

            if (matchedProd) {
              setRequirements([
                {
                  id: 'req_1',
                  category: matchedProd?.category || categoryParam || '',
                  productName: matchedProd?.name || '',
                  customProductName: '',
                  isCustomProduct: false,
                  size: sizeParam || '',
                  customSize: '',
                  quantity: '',
                  unit: (matchedProd?.measurement || 'ton').toUpperCase()
                }
              ]);
            } else if (productParam) {
              setRequirements([
                {
                  id: 'req_1',
                  category: categoryParam || '',
                  productName: '__other__',
                  customProductName: productParam,
                  isCustomProduct: true,
                  size: sizeParam || '',
                  customSize: sizeParam || '',
                  quantity: '',
                  unit: 'TON'
                }
              ]);
            }
          }
        }
      } catch (err) {
        console.error('Error loading inquiry catalog:', err);
      }
    };
    fetchCatalog();

    const handleStorage = () => fetchCatalog();
    window.addEventListener('storage', handleStorage);

    const realtimeChannel = supabase
      .channel('inquiry_unified_catalog_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchCatalog();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCatalog();
      })
      .subscribe();

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorage);
      supabase.removeChannel(realtimeChannel);
    };
  }, [searchParams]);

  // Validation function
  const validateField = (name: string, value: string) => {
    let err = '';
    if (name === 'name') {
      if (!value.trim()) err = 'Contact Name is required.';
    } else if (name === 'phone') {
      if (!value.trim()) {
        err = 'Mobile number is required.';
      } else {
        const cleanPhone = value.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 13) {
          err = 'Please enter a valid 10-13 digit mobile number.';
        }
      }
    } else if (name === 'email') {
      if (!value.trim()) {
        err = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        err = 'Please enter a valid email address.';
      }
    } else if (name === 'gst') {
      if (!value.trim()) {
        err = 'GSTIN Number is required.';
      } else {
        const cleanGst = value.trim().toUpperCase();
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
        if (!gstRegex.test(cleanGst)) {
          err = 'Please enter a valid 15-character GSTIN (e.g. 24AAAAA0000A1Z5).';
        }
      }
    }

    setErrors(prev => {
      const updated = { ...prev };
      if (err) updated[name] = err;
      else delete updated[name];
      return updated;
    });

    return err;
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    let value = e.target.value;
    if (name === 'gst') value = value.toUpperCase();
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // Add a new product requirement row
  const handleAddRequirement = () => {
    setRequirements(prev => [
      ...prev,
      {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        category: '',
        productName: '',
        customProductName: '',
        isCustomProduct: false,
        size: '',
        customSize: '',
        quantity: '',
        unit: 'TON'
      }
    ]);
  };

  // Remove a product requirement row
  const handleRemoveRequirement = (id: string) => {
    if (requirements.length <= 1) return;
    setRequirements(prev => prev.filter(r => r.id !== id));
  };

  // Update a single requirement row's fields
  const handleRequirementChange = (id: string, field: keyof RequirementItem, value: any) => {
    setRequirements(prev =>
      prev.map(r => {
        if (r.id !== id) return r;

        const updated = { ...r, [field]: value };

        // If category changed, reset product and size unless category is custom
        if (field === 'category') {
          if (value === 'Custom Sourcing') {
            updated.productName = '__other__';
            updated.isCustomProduct = true;
          } else if (r.productName !== '__other__') {
            updated.productName = '';
            updated.customProductName = '';
            updated.isCustomProduct = false;
            updated.size = '';
            updated.customSize = '';
          }
        }

        // If product changed
        if (field === 'productName') {
          if (value === '__other__') {
            updated.isCustomProduct = true;
            updated.unit = updated.unit || 'TON';
            updated.size = '';
            updated.customSize = '';
          } else {
            updated.isCustomProduct = false;
            updated.customProductName = '';
            const matched = activeProducts.find(p => p.name === value);
            if (matched) {
              updated.category = matched.category;
              const m = (matched.measurement || 'ton').toLowerCase();
              if (m === 'foot' || m === 'feet' || m === 'ft' || m === 'rft') {
                updated.unit = 'FT';
              } else {
                updated.unit = (matched.measurement || 'ton').toUpperCase();
              }
            }
            updated.size = '';
            updated.customSize = '';
          }
        }

        return updated;
      })
    );
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Validate Contact Info
    const nameErr = validateField('name', formData.name);
    const phoneErr = validateField('phone', formData.phone);
    const emailErr = validateField('email', formData.email);
    const gstErr = validateField('gst', formData.gst);

    if (nameErr) {
      setValidationModal({ isOpen: true, message: nameErr, focusFieldId: 'inq-name' });
      return;
    }
    if (phoneErr) {
      setValidationModal({ isOpen: true, message: phoneErr, focusFieldId: 'inq-phone' });
      return;
    }
    if (emailErr) {
      setValidationModal({ isOpen: true, message: emailErr, focusFieldId: 'inq-email' });
      return;
    }
    if (gstErr) {
      setValidationModal({ isOpen: true, message: gstErr, focusFieldId: 'inq-gst' });
      return;
    }

    // 2. Validate Requirements List
    if (requirements.length === 0) {
      setValidationModal({ isOpen: true, message: 'Please add at least one material requirement.' });
      return;
    }

    const itemsToSubmit: Array<{ name: string; category?: string; size?: string; quantity: number; unit: string; isCustom?: boolean }> = [];

    for (let i = 0; i < requirements.length; i++) {
      const item = requirements[i];
      const isOther = item.productName === '__other__' || item.isCustomProduct;

      if (!item.productName) {
        setValidationModal({
          isOpen: true,
          message: `Requirement #${i + 1}: Please select a product from the catalog or choose "+ Other / Custom Material".`,
          focusFieldId: `req-product-${item.id}`
        });
        return;
      }

      if (isOther && (!item.customProductName || !item.customProductName.trim())) {
        setValidationModal({
          isOpen: true,
          message: `Requirement #${i + 1}: Please enter the custom product / material name.`,
          focusFieldId: `req-custom-name-${item.id}`
        });
        return;
      }

      const displayName = isOther ? item.customProductName!.trim() : item.productName;
      const qty = Number(item.quantity);

      if (!item.quantity || isNaN(qty) || qty <= 0) {
        setValidationModal({
          isOpen: true,
          message: `Requirement #${i + 1} (${displayName}): Please enter a valid quantity greater than 0.`,
          focusFieldId: `req-qty-${item.id}`
        });
        return;
      }

      const matchedProd = !isOther ? activeProducts.find(p => p.name === item.productName) : undefined;
      if (matchedProd && qty < matchedProd.moq) {
        setValidationModal({
          isOpen: true,
          message: `Requirement #${i + 1} (${item.productName}): Minimum order quantity (MOQ) is ${matchedProd.moq} ${matchedProd.measurement}. You entered ${qty} ${matchedProd.measurement}. Please adjust quantity.`,
          focusFieldId: `req-qty-${item.id}`
        });
        return;
      }

      const finalSize = isOther
        ? (item.customSize.trim() || undefined)
        : (item.size === 'Custom' || item.size === 'Other'
          ? (item.customSize.trim() || undefined)
          : (item.size.trim() || undefined));

      itemsToSubmit.push({
        name: displayName,
        category: item.category || matchedProd?.category || (isOther ? 'Custom Sourcing' : 'Steel'),
        size: finalSize,
        quantity: qty,
        unit: item.unit || matchedProd?.measurement?.toUpperCase() || 'TON',
        isCustom: isOther
      });
    }

    setIsLoading(true);

    const newInquiryId = 'inq-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
    const timestampStr = new Date().toLocaleString('en-IN');
    const formattedCompany = `${formData.company.trim()}${formData.gst ? ` (GST: ${formData.gst.trim().toUpperCase()})` : ''}`;
    const hasAnyCustom = itemsToSubmit.some(it => it.isCustom);

    // Create itemized summary string
    const requirementSummary = itemsToSubmit
      .map((it, idx) => `[${idx + 1}] ${it.isCustom ? '✨ [Custom] ' : ''}${it.name}${it.size ? ` (${it.size})` : ''} - ${it.quantity} ${it.unit}`)
      .join('; ');

    const totalQty = itemsToSubmit.reduce((acc, it) => acc + it.quantity, 0);
    const primaryUnit = itemsToSubmit[0]?.unit || 'TON';

    const newInquiry = {
      id: newInquiryId,
      type: 'bulk' as const, // stored with items array for maximum cross-device table rendering
      name: formData.name.trim(),
      company: formattedCompany,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      gst: formData.gst.trim().toUpperCase(),
      location: formData.location.trim() || undefined,
      category: itemsToSubmit.length === 1 ? (itemsToSubmit[0].category || (hasAnyCustom ? 'Custom Sourcing' : 'Steel')) : (hasAnyCustom ? 'Custom Multi-Product Sourcing' : 'Multi-Product Sourcing'),
      requirement: requirementSummary,
      size: itemsToSubmit.length === 1 ? itemsToSubmit[0].size : undefined,
      quantity: itemsToSubmit.length === 1 ? itemsToSubmit[0].quantity : totalQty,
      unit: itemsToSubmit.length === 1 ? itemsToSubmit[0].unit : (itemsToSubmit.every(it => it.unit === primaryUnit) ? primaryUnit : 'Items'),
      items: itemsToSubmit,
      hasCustomItems: hasAnyCustom,
      message: formData.notes.trim() || undefined,
      timestamp: timestampStr
    };

    // 1. Immediate localStorage save
    try {
      const existing = JSON.parse(localStorage.getItem('shivam_steel_inquiries') || '[]');
      localStorage.setItem('shivam_steel_inquiries', JSON.stringify([newInquiry, ...existing]));
      localStorage.setItem('sourcing_inquiries', JSON.stringify([newInquiry, ...existing]));
    } catch (e) {
      console.error('Error saving inquiry locally:', e);
    }

    // 2. Sync to Supabase cloud database
    const supaPayload = {
      id: newInquiry.id,
      type: 'bulk',
      name: newInquiry.name,
      company: newInquiry.company,
      phone: newInquiry.phone,
      email: newInquiry.email,
      gst: newInquiry.gst,
      category: newInquiry.category,
      requirement: newInquiry.requirement,
      size: newInquiry.size || null,
      quantity: newInquiry.quantity,
      unit: newInquiry.unit,
      items: itemsToSubmit,
      message: newInquiry.message || null,
      timestamp: newInquiry.timestamp
    };

    try {
      let { error: supaErr } = await supabase.from('inquiries').insert([supaPayload]);
      if (supaErr) {
        console.warn('Supabase inquiry insert warning:', supaErr.message);
        // Resilient fallback with safe schema
        await supabase.from('inquiries').insert([{
          id: newInquiry.id,
          type: 'bulk',
          name: newInquiry.name,
          company: newInquiry.company,
          phone: newInquiry.phone,
          email: newInquiry.email,
          requirement: newInquiry.requirement,
          items: itemsToSubmit,
          timestamp: newInquiry.timestamp
        }]);
      }
    } catch (supaEx) {
      console.error('Supabase inquiry insert exception:', supaEx);
    }

    // 3. Dispatch confirmation email & admin alert
    sendInquiryConfirmationEmail(newInquiry).catch(mailErr => {
      console.warn('Inquiry confirmation email dispatch warning:', mailErr);
    });

    // 4. Dispatch storage event for other open tabs
    window.dispatchEvent(new Event('storage'));

    setSubmittedInquiry(newInquiry);
    setIsLoading(false);
    setIsSubmitted(true);

    setTimeout(() => {
      document.getElementById('inquiry-success-view')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handleResetForm = () => {
    setIsSubmitted(false);
    setSubmittedInquiry(null);
    setFormData({ name: '', company: '', phone: '', email: '', gst: '', location: '', notes: '' });
    setRequirements([
      {
        id: 'req_1',
        category: '',
        productName: '',
        customProductName: '',
        isCustomProduct: false,
        size: '',
        customSize: '',
        quantity: '',
        unit: 'TON'
      }
    ]);
    setErrors({});
  };

  return (
    <div className="inquiry-page page-wrapper animate-fade-in">
      {/* Validation Modal Popup */}
      {validationModal && validationModal.isOpen && (
        <div className="validation-modal-overlay">
          <div className="validation-modal-card animate-scale-up">
            <div className="validation-modal-header">
              <ShieldAlert size={44} className="validation-modal-icon" />
              <h3>Validation Error</h3>
            </div>
            <p className="validation-modal-message">{validationModal.message}</p>
            <button
              onClick={() => {
                const fieldId = validationModal.focusFieldId;
                setValidationModal(null);
                if (fieldId) {
                  setTimeout(() => {
                    const el = document.getElementById(fieldId);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      setTimeout(() => {
                        el.focus();
                        el.classList.add('flash-highlight');
                        setTimeout(() => el.classList.remove('flash-highlight'), 1500);
                      }, 400);
                    }
                  }, 50);
                }
              }}
              className="btn btn-primary validation-modal-btn"
            >
              Understand & Fix
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <section className="inquiry-header-section">
        <div className="container">
          <span className="section-tag">Direct Sourcing Portal</span>
          <h1 className="section-title">Industrial Supplies Sourcing & RFQ</h1>
          <p className="section-desc">
            सोर्सिंग और ऑर्डर इन्क्वायरी — Submit your complete industrial supplies, piping, valves, safety PPE, hardware, structural steel, and plant maintenance requirements with custom sizes and quantities. Add multiple catalog or custom items in a single quotation request.
          </p>
        </div>
      </section>

      {/* Main Sourcing Content */}
      <section className="section-padding inquiry-main-section">
        <div className="container">
          <div className="inquiry-form-max-width">
            
            {isSubmitted && submittedInquiry ? (
              <div id="inquiry-success-view" className="success-card text-center animate-fade-in">
                <CheckCircle size={56} className="success-icon animate-scale-up" />
                <h2>Sourcing Inquiry Registered Successfully!</h2>
                <p>
                  Thank you, <strong>{submittedInquiry.name}</strong>. Your inquiry <strong>#{submittedInquiry.id}</strong> {formData.company.trim() ? `for ${formData.company}` : ''} has been queued at our Dahej desk.
                </p>

                <div className="inquiry-summary">
                  <h4>Requested Material Requirements ({submittedInquiry.items?.length || 1} Items):</h4>
                  
                  <div className="submitted-items-table-wrap">
                    <table className="submitted-items-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Material Name</th>
                          <th>Size / Specification</th>
                          <th style={{ textAlign: 'right' }}>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submittedInquiry.items?.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td><strong>{idx + 1}</strong></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <strong style={{ color: item.isCustom ? '#6d28d9' : 'inherit' }}>{item.name}</strong>
                                {item.isCustom && (
                                  <span className="inq-custom-badge-tag">
                                    <Sparkles size={11} /> Custom Sourcing
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              {item.size ? (
                                <span className="inq-size-badge">{item.size}</span>
                              ) : (
                                <span className="text-muted">Standard Grade</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <strong className="text-brand">{item.quantity} {item.unit}</strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="submitted-contact-meta">
                    <p><strong>Mobile:</strong> {submittedInquiry.phone}</p>
                    <p><strong>Email:</strong> {submittedInquiry.email}</p>
                    {submittedInquiry.gst && <p><strong>GSTIN:</strong> <code>{submittedInquiry.gst}</code></p>}
                    {submittedInquiry.location && <p><strong>Site:</strong> {submittedInquiry.location}</p>}
                  </div>
                </div>

                <p className="timeline-info animate-pulse">
                  <Clock size={16} /> Our dispatch desk coordinator will review your requirements and provide an official quotation & delivery timeline within 2 hours.
                </p>

                <div className="success-actions-row">
                  <button onClick={handleResetForm} className="btn btn-primary">
                    Submit Another Inquiry
                  </button>
                  <Link to="/products" className="btn btn-secondary">
                    Browse Catalog
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="form-card animate-fade-in" noValidate>
                
                <div className="form-card-header">
                  <h3>Submit Material Requirement & Price Quote</h3>
                  <p>
                    Fill in your business details, select products from catalog or choose <strong>"+ Other / Custom Material"</strong>, specify sizes, and click <strong>"+ Add Another Requirement"</strong> to consolidate multiple materials.
                  </p>
                </div>

                {error && (
                  <div className="error-alert">
                    <ShieldAlert size={18} />
                    <span>{error}</span>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* SECTION 1: CONTACT & BUSINESS DETAILS */}
                {/* ------------------------------------------------------------- */}
                <div className="inquiry-form-section">
                  <div className="inquiry-section-title">
                    <span className="sec-num">1</span>
                    <div>
                      <h4>Contact & Business Details</h4>
                      <span className="sec-sub">संपर्क और जीएसटी विवरण</span>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="inq-name">
                        Contact Name / Name of Person <span className="text-danger">*</span>
                      </label>
                      <input
                        id="inq-name"
                        type="text"
                        name="name"
                        className={`form-control ${errors['name'] ? 'is-invalid' : ''}`}
                        placeholder="e.g. Ramesh Patel"
                        value={formData.name}
                        onChange={handleContactChange}
                        required
                      />
                      {errors['name'] && <span className="field-error-text">{errors['name']}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="inq-company">
                        Company / Firm / Contractor Name
                      </label>
                      <input
                        id="inq-company"
                        type="text"
                        name="company"
                        className="form-control"
                        placeholder="e.g. Patel Infrastructure Pvt Ltd"
                        value={formData.company}
                        onChange={handleContactChange}
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label" htmlFor="inq-phone">
                        Mobile / Phone Number <span className="text-danger">*</span>
                      </label>
                      <input
                        id="inq-phone"
                        type="tel"
                        name="phone"
                        className={`form-control ${errors['phone'] ? 'is-invalid' : ''}`}
                        placeholder="e.g. 98250 12345"
                        value={formData.phone}
                        onChange={handleContactChange}
                        required
                      />
                      {errors['phone'] && <span className="field-error-text">{errors['phone']}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="inq-email">
                        Email Address (For Quote Delivery) <span className="text-danger">*</span>
                      </label>
                      <input
                        id="inq-email"
                        type="email"
                        name="email"
                        className={`form-control ${errors['email'] ? 'is-invalid' : ''}`}
                        placeholder="e.g. purchase@patelinfra.com"
                        value={formData.email}
                        onChange={handleContactChange}
                        required
                      />
                      {errors['email'] && <span className="field-error-text">{errors['email']}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="inq-gst">
                        GSTIN Number <span className="text-danger">*</span>
                      </label>
                      <input
                        id="inq-gst"
                        type="text"
                        name="gst"
                        maxLength={15}
                        className={`form-control ${errors['gst'] ? 'is-invalid' : ''}`}
                        placeholder="24AAAAA0000A1Z5"
                        value={formData.gst}
                        onChange={handleContactChange}
                        style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                        required
                      />
                      {errors['gst'] && <span className="field-error-text">{errors['gst']}</span>}
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="inq-location">
                        Project Site / Delivery Destination
                      </label>
                      <input
                        id="inq-location"
                        type="text"
                        name="location"
                        className="form-control"
                        placeholder="e.g. Dahej GIDC / Bharuch Site / Ankleshwar"
                        value={formData.location}
                        onChange={handleContactChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="inq-notes">
                        Special Delivery Notes / Instructions
                      </label>
                      <input
                        id="inq-notes"
                        type="text"
                        name="notes"
                        className="form-control"
                        placeholder="e.g. Immediate loading required, test certificate needed"
                        value={formData.notes}
                        onChange={handleContactChange}
                      />
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* SECTION 2: MATERIAL REQUIREMENTS (DYNAMIC MULTI-ITEM BUILDER) */}
                {/* ------------------------------------------------------------- */}
                <div className="inquiry-form-section">
                  <div className="inquiry-section-title-between">
                    <div className="inquiry-section-title">
                      <span className="sec-num">2</span>
                      <div>
                        <h4>Material Requirements ({requirements.length} {requirements.length === 1 ? 'Product' : 'Products'})</h4>
                        <span className="sec-sub">आवश्यक सामग्री, साइज़ और वज़न/मात्रा जोड़ें (कैटलॉग या कस्टम प्रोडक्ट)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="btn-add-more-requirement"
                    >
                      <Plus size={16} /> + Add More Requirement
                    </button>
                  </div>

                  {/* List of Requirement Cards */}
                  <div className="requirements-cards-list">
                    {requirements.map((req, index) => {
                      const isOther = req.productName === '__other__' || req.isCustomProduct;
                      const matchedProd = !isOther ? activeProducts.find(p => p.name === req.productName) : undefined;
                      const availableSizes = matchedProd?.sizes || [];
                      const displayTitle = isOther
                        ? (req.customProductName?.trim() ? `✨ ${req.customProductName.trim()}` : '✨ Custom Material (अन्य प्रोडक्ट)')
                        : (req.productName || 'Select Material Item');

                      return (
                        <div key={req.id} className={`requirement-row-card animate-fade-in ${isOther ? 'is-custom-requirement' : ''}`}>
                          <div className="req-card-header">
                            <div className="req-card-badge">
                              <span className={`req-number ${isOther ? 'req-number-custom' : ''}`}>#{index + 1}</span>
                              <span className="req-badge-title" style={{ color: isOther ? '#6d28d9' : undefined }}>
                                {displayTitle}
                              </span>
                              {isOther && (
                                <span className="req-custom-pill">
                                  <Sparkles size={12} /> Custom / Unlisted Material
                                </span>
                              )}
                            </div>

                            {requirements.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRequirement(req.id)}
                                className="req-remove-btn"
                                title="Remove this product requirement"
                              >
                                <Trash2 size={15} /> Remove
                              </button>
                            )}
                          </div>

                          <div className={`req-card-grid ${isOther ? 'has-no-preset-sizes' : (availableSizes.length > 0 ? 'has-sizes' : 'no-sizes')}`}>
                            {/* 1. Category Filter */}
                            <div className="form-group mb-0">
                              <label className="form-label">Category</label>
                              <select
                                className="form-control form-select"
                                value={req.category}
                                onChange={(e) => handleRequirementChange(req.id, 'category', e.target.value)}
                              >
                                <option value="">All Categories ({activeProducts.length} Items)</option>
                                {categories.map(cat => (
                                  <option key={cat.id} value={cat.slug || cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                                <option value="Custom Sourcing">✨ Other / Custom Material Sourcing</option>
                              </select>
                            </div>

                            {/* 2. Product Selection Dropdown (with 'Other' option) */}
                            <div className="form-group mb-0">
                              <label className="form-label">
                                Product / Material <span className="text-danger">*</span>
                              </label>
                              <select
                                id={`req-product-${req.id}`}
                                className={`form-control form-select ${isOther ? 'custom-select-active' : ''}`}
                                value={req.productName}
                                onChange={(e) => handleRequirementChange(req.id, 'productName', e.target.value)}
                                required
                              >
                                <option value="">-- Select Product --</option>
                                {activeProducts
                                  .filter(p => !req.category || req.category === 'Custom Sourcing' || p.category === req.category || p.category.toLowerCase() === req.category.toLowerCase())
                                  .map(prod => (
                                    <option key={prod.id} value={prod.name}>
                                      {prod.name} (Min: {prod.moq} {prod.measurement})
                                    </option>
                                  ))}
                                <option value="__other__" className="opt-other-product">
                                  ✨ + Other / Custom Material (अन्य प्रोडक्ट - Type Custom Name)
                                </option>
                              </select>
                            </div>

                            {/* 3. Size / Specification (Rendered for catalog items with configured sizes) */}
                            {!isOther && availableSizes.length > 0 && (
                              <div className="form-group mb-0">
                                <label className="form-label">Size / Dimension (Spec)</label>
                                <div className="req-size-select-wrap">
                                  <select
                                    className="form-control form-select"
                                    value={req.size}
                                    onChange={(e) => handleRequirementChange(req.id, 'size', e.target.value)}
                                  >
                                    <option value="">Standard Size / Default</option>
                                    {availableSizes.map((sz: string, szIdx: number) => (
                                      <option key={szIdx} value={sz}>{sz}</option>
                                    ))}
                                    <option value="Custom">+ Custom / Other Spec</option>
                                  </select>
                                  {req.size === 'Custom' && (
                                    <input
                                      type="text"
                                      className="form-control mt-1"
                                      placeholder="Type custom size / thickness"
                                      value={req.customSize}
                                      onChange={(e) => handleRequirementChange(req.id, 'customSize', e.target.value)}
                                    />
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 4. Quantity & Unit */}
                            <div className="form-group mb-0">
                              <label className="form-label">
                                Quantity ({req.unit || 'TON'}) <span className="text-danger">*</span>
                              </label>
                              <div className="req-qty-input-group">
                                <input
                                  id={`req-qty-${req.id}`}
                                  type="number"
                                  step="any"
                                  min={0.1}
                                  className="form-control font-bold text-brand"
                                  placeholder={matchedProd ? `Min: ${matchedProd.moq}` : 'Qty'}
                                  value={req.quantity}
                                  onChange={(e) => handleRequirementChange(req.id, 'quantity', e.target.value)}
                                  required
                                />
                                <span className="req-unit-badge">{req.unit || 'TON'}</span>
                              </div>
                            </div>
                          </div>

                          {/* 5. DEDICATED CUSTOM PRODUCT SPECIFICATION BLOCK (Active when "Other" is chosen) */}
                          {isOther && (
                            <div className="custom-product-fields-row animate-fade-in">
                              <div className="custom-fields-grid">
                                <div className="form-group mb-0 custom-field-main">
                                  <label className="form-label" htmlFor={`req-custom-name-${req.id}`}>
                                    <Sparkles size={13} style={{ color: '#7c3aed', marginRight: '4px', verticalAlign: 'middle' }} />
                                    Custom Product / Material Name <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    id={`req-custom-name-${req.id}`}
                                    type="text"
                                    className="form-control custom-prod-input"
                                    placeholder="e.g. MS Angles 65x65x6mm / Jindal Binding Wire / Custom Steel Plate / 100mm Pipe"
                                    value={req.customProductName || ''}
                                    onChange={(e) => handleRequirementChange(req.id, 'customProductName', e.target.value)}
                                    autoFocus
                                    required
                                  />
                                </div>

                                <div className="form-group mb-0">
                                  <label className="form-label">
                                    Size / Thickness / Spec <span className="text-muted">(Optional)</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. 12mm / 20 Feet / 6mm Thk"
                                    value={req.customSize || ''}
                                    onChange={(e) => handleRequirementChange(req.id, 'customSize', e.target.value)}
                                  />
                                </div>

                                <div className="form-group mb-0">
                                  <label className="form-label">Unit of Measurement</label>
                                  <select
                                    className="form-control form-select"
                                    value={req.unit || 'TON'}
                                    onChange={(e) => handleRequirementChange(req.id, 'unit', e.target.value)}
                                  >
                                    <option value="TON">TON (Metric Tonnes)</option>
                                    <option value="MT">MT (Metric Ton)</option>
                                    <option value="KG">KG (Kilograms)</option>
                                    <option value="FT">FT (Feet / RFT)</option>
                                    <option value="MTR">MTR (Meters)</option>
                                    <option value="PCS">PCS (Pieces)</option>
                                    <option value="BAG">BAG (Bags / 50KG)</option>
                                    <option value="SHEET">SHEET (Sheets)</option>
                                    <option value="BUNDLE">BUNDLE (Bundles)</option>
                                    <option value="NOS">NOS (Numbers)</option>
                                    <option value="SQ.FT.">SQ.FT. (Square Feet)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="custom-sourcing-note">
                                <Sparkles size={14} className="custom-sourcing-icon" />
                                <span>
                                  <strong>Custom Sourcing:</strong> Enter the exact material description, brand, or grade. Our desk will source direct mill rates and delivery timeline for your Bharuch / Dahej site.
                                </span>
                              </div>
                            </div>
                          )}

                          {matchedProd && !isOther && (
                            <div className="req-moq-hint">
                              <span>Minimum Order Quantity (MOQ): <strong>{matchedProd.moq} {matchedProd.measurement}</strong></span>
                              {matchedProd.description && <span> • {matchedProd.description}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Another Requirement Action Card */}
                  <div className="add-more-requirement-container">
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="btn-add-more-large"
                    >
                      <Plus size={18} />
                      <span>+ Add Another Material Requirement</span>
                    </button>
                    <span className="add-more-subtext">
                      You can add as many catalog or custom items as needed. All requirements will be consolidated in a single Proforma Quotation.
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="form-submit-container">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-full submit-inquiry-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>Processing & Registering Sourcing Request...</>
                    ) : (
                      <>
                        <Send size={18} /> Submit Sourcing Inquiry ({requirements.length} {requirements.length === 1 ? 'Material' : 'Materials'})
                      </>
                    )}
                  </button>
                  <p className="form-trust-footer">
                    🔒 All inquiries are confidential and verified against Indian Standard Specifications at our Dahej, Gujarat Stockyard.
                  </p>
                </div>

              </form>
            )}

          </div>
        </div>
      </section>
    </div>
  );
}
