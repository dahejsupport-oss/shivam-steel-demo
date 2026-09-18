import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Info, ShoppingBag, Download } from 'lucide-react';
import {
  type Category,
  type Product,
  getCategories,
  getProducts
} from '../utils/productService';
import { exportProductsToCSV } from '../utils/exportUtils';
import { supabase } from '../supabaseClient';
import './Products.css';

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const [cats, prods] = await Promise.all([
          getCategories(),
          getProducts()
        ]);
        if (isMounted) {
          setCategories(cats);
          setProducts(prods);
        }
      } catch (err) {
        console.error('Error fetching catalog data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCatalog();

    // Listen to storage events across tabs on the same device
    const handleStorageChange = () => {
      fetchCatalog();
    };
    window.addEventListener('storage', handleStorageChange);

    // Supabase Real-time cross-device listener
    const realtimeChannel = supabase
      .channel('products_page_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        getProducts().then(prods => {
          if (isMounted) setProducts(prods);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        getCategories().then(cats => {
          if (isMounted) setCategories(cats);
        });
      })
      .subscribe();

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  // Filter products based on active tab and search query
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && product.isActive;
  });

  const handleInquiryRedirect = (productName: string, size?: string) => {
    const params = new URLSearchParams();
    params.set('product', productName);
    if (size) params.set('size', size);
    navigate(`/inquiry?${params.toString()}`);
  };

  return (
    <div className="products-page page-wrapper animate-fade-in">
      {/* Page Header */}
      <section className="products-header-section">
        <div className="container">
          <span className="section-tag">Industrial Catalog</span>
          <h1 className="section-title">Industrial Supplies & Materials</h1>
          <p className="section-desc">
            Explore our comprehensive range of industrial supplies, safety gear & PPE, piping, valves, fasteners, tools, structural steel, and plant maintenance materials available for commercial, manufacturing, and EPC project requirements.
          </p>
        </div>
      </section>

      {/* Filtering and Products Grid */}
      <section className="catalog-section section-padding">
        <div className="container">
          <div className="filters-bar">
            {/* Category Tabs */}
            <div className="filter-tabs">
              <button 
                className={`filter-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                All Materials
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  className={`filter-tab-btn ${activeCategory === cat.slug ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="search-box-container">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Active Items Counter & Export Button */}
          <div className="catalog-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
            <p style={{ margin: 0 }}>Showing <strong>{filteredProducts.length}</strong> active materials in catalog</p>
            {filteredProducts.length > 0 && (
              <button
                onClick={() => exportProductsToCSV(filteredProducts, categories)}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  padding: '7px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
                title="Download full material specifications list to Excel / CSV"
              >
                <Download size={14} /> Download Catalog (CSV)
              </button>
            )}
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="empty-catalog text-center" style={{ padding: '60px 20px' }}>
              <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Loading catalog materials...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid-3 products-grid">
              {filteredProducts.map(product => (
                <div key={product.id} className="product-card animate-fade-in">
                  <div className="product-image-container">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/products/prod_tmt.jpg'; }}
                    />
                  </div>
                  <div className="product-card-body">
                    <div className="product-badge">{product.subcategory}</div>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-desc">{product.description}</p>
                    
                    {/* Unit and Supply Details */}
                    <div className="product-logistics-details">
                      <div className="detail-pill">
                        <span className="pill-lbl">Unit:</span>
                        <strong className="pill-val">{product.measurement}</strong>
                      </div>
                      <div className="detail-pill">
                        <span className="pill-lbl">Supply Mode:</span>
                        <strong className="pill-val text-brand">Wholesale / Direct</strong>
                      </div>
                    </div>

                    {/* Available Sizes / Variants */}
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="product-sizes-container">
                        <h4 className="sizes-title">Available Sizes / Dimensions:</h4>
                        <div className="sizes-chips-wrap">
                          {product.sizes.map((sz, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              className="size-chip-btn"
                              onClick={() => handleInquiryRedirect(product.name, sz)}
                              title={`Inquire for ${product.name} (${sz})`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="specs-container">
                      <h4 className="specs-title">Technical Specifications:</h4>
                      <ul className="specs-list">
                        {(product.specs || []).map((spec, index) => (
                          <li key={index}>
                            <span className="bullet">•</span> {spec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="product-card-footer">
                    <button 
                      onClick={() => handleInquiryRedirect(product.name)} 
                      className="btn btn-secondary w-full get-quote-btn"
                    >
                      Request Availability & Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-catalog text-center">
              <ShoppingBag size={48} className="text-muted" />
              <h3>No Active Products Found</h3>
              <p className="section-desc mx-auto text-center-x">
                No materials match your current category and search filter. Check back shortly.
              </p>
            </div>
          )}

          {/* Custom Material Request Banner */}
          <div className="custom-material-box">
            <div className="custom-material-content">
              <Info className="info-icon" size={24} />
              <div>
                <h3>Need a specific material?</h3>
                <p>
                  Tell us what you need. Our logistics team can check custom sizes, grades, structural designs and organize logistics coordination for your site location.
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleInquiryRedirect("Custom Steel / Material Requirement")}
              className="btn btn-white"
            >
              Submit Custom Spec Inquiry
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
