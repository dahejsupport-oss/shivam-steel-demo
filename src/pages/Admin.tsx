import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  LayoutDashboard,
  Mail,
  Trash2,
  User,
  Edit3,
  X,
  Package,
  Layers3,
  FileText,
  Download,
  Plus,
  Search,
  RefreshCw,
  Receipt,
  Eye,
  Send,
  Copy,
  ExternalLink,
  MessageSquare,
  Phone,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Upload,
  Lock,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Warehouse,
  Clock,
  Truck,
  Info,
  Menu,
  Sparkles
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
  type Category,
  type Product,
  getProducts,
  getCategories,
  saveProduct,
  deleteProduct,
  toggleProductActive,
  saveCategory,
  deleteCategory
} from '../utils/productService';
import {
  type ProformaInvoice,
  type ProformaItem,
  buildProformaPDFDocument,
  generateProformaInvoicePDF,
  openProformaPDFInNewTab,
  calculateProformaCalculations,
  formatIndianNumber,
  formatProformaDate
} from '../utils/pdfGenerator';
import {
  fetchProformasFromCloud,
  saveProformaToCloud,
  deleteProformaFromCloud,
  getProformas
} from '../utils/proformaService';
import {
  getEmailConfig,
  fetchEmailConfigFromCloud,
  saveEmailConfig,
  getInquiryEmailConfig,
  fetchInquiryEmailConfigFromCloud,
  saveInquiryEmailConfig,
  sendDirectClientEmail,
  sendInquiryConfirmationEmail,
  type EmailConfig,
  type InquiryEmailConfig
} from '../utils/emailService';
import {
  type InventoryItem,
  type InventoryTransaction,
  type InventoryPartialOrder,
  getInventoryItems,
  getInventoryTransactions,
  getInventoryPartialOrders,
  fetchInventoryItemsFromCloud,
  fetchInventoryTransactionsFromCloud,
  fetchInventoryPartialOrdersFromCloud,
  recordStockMovement,
  getPendingOrdersForItem,
  getPendingStockSummary,
  cancelPartialOrder,
  addInventoryItem,
  updateInventoryItem,
  saveInventoryItems,
  deleteInventoryItem,
  mapProductMeasurementToUnit,
  DEFAULT_LOCATIONS
} from '../utils/inventoryService';
import {
  exportMaterialInquiriesToCSV,
  exportContactQueriesToCSV,
  exportInventoryLedgerToCSV,
  exportProductsToCSV
} from '../utils/exportUtils';
import './Admin.css';

interface Inquiry {
  id: string;
  type: 'single' | 'bulk' | 'contact';
  name: string;
  company: string;
  phone: string;
  email: string;
  gst?: string;
  category?: string;
  requirement: string;
  size?: string;
  message?: string;
  quantity?: number;
  unit?: string;
  hasCustomItems?: boolean;
  items?: Array<{ name: string; quantity: number; unit: string; size?: string; isCustom?: boolean; category?: string }>;
  timestamp: string;
}

const AVAILABLE_PRODUCT_IMAGES = [
  { label: 'TMT Steel Bars', path: '/products/prod_tmt.jpg' },
  { label: 'MS Angles & Channels', path: '/products/prod_angles.jpg' },
  { label: 'HR Steel Plates', path: '/products/prod_plates.jpg' },
  { label: 'MS Pipes & Tubes', path: '/products/prod_pipes.jpg' },
  { label: 'MS Plates & Sheets', path: '/products/prod_sheets.jpg' },
  { label: 'Binding Wire & Mesh', path: '/products/prod_wire.jpg' },
  { label: 'Construction Cement', path: '/products/prod_cement.jpg' },
  { label: 'Roofing Sheets', path: '/products/prod_roofing.jpg' },
  { label: 'MS Beams & Joists', path: '/products/prod_beams.jpg' },
  { label: 'Refractory Fire Bricks', path: '/products/prod_firebricks.jpg' }
];

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'categories' | 'products' | 'inquiries' | 'contact_queries' | 'profile'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryCategoryFilter, setInquiryCategoryFilter] = useState('all');
  const [contactSearch, setContactSearch] = useState('');
  const [contactSubjectFilter, setContactSubjectFilter] = useState('all');

  // Inventory Tracking, Movement & Partial Pipeline States
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);
  const [inventoryPartialOrders, setInventoryPartialOrders] = useState<InventoryPartialOrder[]>([]);
  const [inventoryViewMode, setInventoryViewMode] = useState<'stocks' | 'orders' | 'ledger'>('stocks');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [inventoryLocationFilter, setInventoryLocationFilter] = useState('all');
  const [inventoryOrderTypeFilter, setInventoryOrderTypeFilter] = useState<'all' | 'IN' | 'OUT'>('all');
  const [inventoryOrderStatusFilter, setInventoryOrderStatusFilter] = useState<'all' | 'PENDING' | 'COMPLETED'>('PENDING');

  // Stock Movement Modal (Complete vs Partial Stock IN / Maal Aana & Stock OUT / Maal Nikalna)
  const [stockMovementModal, setStockMovementModal] = useState<{
    isOpen: boolean;
    type: 'IN' | 'OUT';
    item: InventoryItem | null;
    mode: 'new' | 'fulfill_pending';
    selectedOrderId?: string;
    deliveryType: 'complete' | 'partial';
    totalOrderQty: string;
    quantity: string;
    partyName: string;
    referenceNo: string;
    notes: string;
    error?: string;
  }>({
    isOpen: false,
    type: 'IN',
    item: null,
    mode: 'new',
    selectedOrderId: undefined,
    deliveryType: 'complete',
    totalOrderQty: '',
    quantity: '',
    partyName: '',
    referenceNo: '',
    notes: '',
    error: undefined
  });

  // Add / Edit Inventory Item Modal State
  const [isInventoryItemModalOpen, setIsInventoryItemModalOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [inventoryItemForm, setInventoryItemForm] = useState({
    selectedProductId: '',
    productName: '',
    category: 'steel',
    subcategory: 'TMT Bars',
    initialStock: '',
    unit: 'MT',
    minStockLevel: '10',
    location: DEFAULT_LOCATIONS[0],
    hsn: '72149990'
  });

  // Proforma Invoices Modal State
  const [proformas, setProformas] = useState<ProformaInvoice[]>(getProformas());
  const [isProformaModalOpen, setIsProformaModalOpen] = useState(false);
  const [isInterstateTax, setIsInterstateTax] = useState(false);

  // Product Filter States
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // In-App Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'product' | 'category' | 'proforma' | 'inquiry' | 'bulk_inquiries' | 'inventory_item';
    id: string;
    name: string;
    count?: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Multi-Select Batch Inquiry Selection State
  const [selectedInquiryIds, setSelectedInquiryIds] = useState<string[]>([]);

  // Category Modal Form State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '' });

  // Product Modal Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    subcategory: 'General Supply',
    measurement: 'ton' as string,
    loadingCost: 0,
    moq: 1,
    hsn: '72149990',
    description: '',
    image: '/products/prod_tmt.jpg',
    isActive: true,
    sizes: [] as string[]
  });
  const [newSizeInput, setNewSizeInput] = useState('');
  const [imageSourceTab, setImageSourceTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handle direct file upload from user device with auto client-side image compression
  const handleProductImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
            setProductForm(prev => ({ ...prev, image: compressedDataUrl }));
          } else {
            setProductForm(prev => ({ ...prev, image: uploadEvent.target?.result as string }));
          }
        } catch (err) {
          console.error('Error compressing image:', err);
          setProductForm(prev => ({ ...prev, image: uploadEvent.target?.result as string }));
        } finally {
          setIsUploadingImage(false);
        }
      };
      img.onerror = () => {
        setUploadError('Failed to process the selected image.');
        setIsUploadingImage(false);
      };
      img.src = uploadEvent.target?.result as string;
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file from your device.');
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Automated Client Email Dispatcher State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTargetInvoice, setEmailTargetInvoice] = useState<ProformaInvoice | null>(null);
  const [emailForm, setEmailForm] = useState({
    recipient: '',
    subject: '',
    body: '',
    clientName: '',
    clientPhone: ''
  });
  const [isCopiedEmail, setIsCopiedEmail] = useState(false);
  const [isSendingCloudEmail, setIsSendingCloudEmail] = useState(false);
  const [emailDispatchStatus, setEmailDispatchStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Screen-Centered Zero Price Warning Modal State
  const [zeroPriceWarning, setZeroPriceWarning] = useState<{
    isOpen: boolean;
    proforma: ProformaInvoice;
    zeroItems: ProformaItem[];
    actionType: 'open_email_modal' | 'send_cloud_email' | 'open_gmail' | 'open_native_email' | 'send_whatsapp';
  } | null>(null);

  // Email Config State for Profile Tab (Invoices & Proforma)
  const [emailConfigForm, setEmailConfigForm] = useState<EmailConfig>(getEmailConfig());
  const [isTestingInvoiceEmail, setIsTestingInvoiceEmail] = useState(false);
  const [invoiceTestStatus, setInvoiceTestStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [testInvoiceEmailTarget, setTestInvoiceEmailTarget] = useState('');

  // Dedicated Inquiry Auto-Confirmation Email State (help@dahejsupport.com)
  const [inquiryEmailConfigForm, setInquiryEmailConfigForm] = useState<InquiryEmailConfig>(getInquiryEmailConfig());
  const [isTestingInquiryEmail, setIsTestingInquiryEmail] = useState(false);
  const [inquiryTestStatus, setInquiryTestStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [testInquiryEmailTarget, setTestInquiryEmailTarget] = useState('');

  // Active Proforma Invoice Form State
  const [proformaForm, setProformaForm] = useState<ProformaInvoice>({
    id: '',
    invoiceNo: '766',
    date: new Date().toISOString().split('T')[0],
    modeOfPayment: 'SAME DAY',
    referenceNoDate: '',
    otherReferences: '',
    buyersOrderNo: '',
    buyersOrderDate: new Date().toISOString().split('T')[0],
    dispatchDocNo: 'PO- 1',
    deliveryNoteDate: '',
    dispatchedThrough: 'Road Transport',
    destination: 'Dahej',
    termsOfDelivery: '',
    consigneeName: '',
    consigneeAddress: '',
    consigneeGstin: '24CBJPP0843A1Z2',
    consigneeState: 'Gujarat',
    consigneeStateCode: '24',
    buyerName: '',
    buyerAddress: '',
    buyerPhones: '',
    buyerGstin: '24CBJPP0843A1Z2',
    buyerState: 'Gujarat',
    buyerStateCode: '24',
    items: [],
    itemsSubtotal: 0,
    loadingCharges: 0,
    taxableValue: 0,
    cgstRate: 9,
    cgstAmount: 0,
    sgstRate: 9,
    sgstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    roundOff: 0,
    grandTotal: 0,
    totalQuantity: 0,
    totalUnit: 'KG.',
    amountInWords: '',
    taxAmountInWords: '',
    companyName: 'DAHEJ SUPPORT',
    companyAddress: 'G/F/02, RUSHIRAJ COMPLEX, RAHIYAD CHOKDI, DAHEJ ROAD, TA-VARGRA -392130, DI-BHARUCH',
    companyUdyam: 'UDYAM-GJ-06-0040252',
    companyGstin: '24BCSPP4924R1ZN',
    companyPan: 'BCSPP4924R',
    companyState: 'Gujarat, Code : 24',
    companyEmail: 'shivamsteel2015@gmail.com',
    status: 'draft',
    createdAt: new Date().toISOString()
  });

  // Synchronized Cloud Data Loader
  const loadAllData = async (showFeedback = false) => {
    setIsSyncing(true);
    try {
      const [prods, cats, , cloudItems, cloudTxs, cloudOrders, cloudInqEmailCfg, cloudEmailCfg, cloudProformas] = await Promise.all([
        getProducts(),
        getCategories(),
        fetchInquiries(),
        fetchInventoryItemsFromCloud(),
        fetchInventoryTransactionsFromCloud(),
        fetchInventoryPartialOrdersFromCloud(),
        fetchInquiryEmailConfigFromCloud(),
        fetchEmailConfigFromCloud(),
        fetchProformasFromCloud()
      ]);
      setProducts(prods);
      setCategories(cats);
      if (cloudItems) setInventoryItems(cloudItems);
      if (cloudTxs) setInventoryTransactions(cloudTxs);
      if (cloudOrders) setInventoryPartialOrders(cloudOrders);
      if (cloudInqEmailCfg) setInquiryEmailConfigForm(cloudInqEmailCfg);
      if (cloudEmailCfg) setEmailConfigForm(cloudEmailCfg);
      if (cloudProformas) setProformas(cloudProformas);
      if (showFeedback) {
        setSyncFeedback('All catalog materials, yard inventory, proforma invoices, and settings live-synced from cloud.');
        setTimeout(() => setSyncFeedback(null), 3500);
      }
    } catch (err) {
      console.error('Error synchronizing admin data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load initial data from Supabase / localStorage
  useEffect(() => {
    // Auth Check
    const isAuth = localStorage.getItem('shivam_admin_auth') || localStorage.getItem('isAdminLoggedIn');
    if (!isAuth) {
      navigate('/login');
      return;
    }

    loadAllData();

    // Auto-refresh on storage update from other tabs
    const handleStorage = () => loadAllData();
    window.addEventListener('storage', handleStorage);

    // Supabase Real-time listener across all devices for all admin data tables
    const realtimeChannel = supabase
      .channel('admin_live_sync_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => {
        fetchInquiries();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
        fetchInventoryItemsFromCloud().then(items => setInventoryItems(items));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_transactions' }, () => {
        fetchInventoryTransactionsFromCloud().then(txs => setInventoryTransactions(txs));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_partial_orders' }, () => {
        fetchInventoryPartialOrdersFromCloud().then(orders => setInventoryPartialOrders(orders));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        getProducts().then(prods => setProducts(prods));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        getCategories().then(cats => setCategories(cats));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_settings' }, () => {
        fetchInquiryEmailConfigFromCloud().then(cfg => cfg && setInquiryEmailConfigForm(cfg));
        fetchEmailConfigFromCloud().then(cfg => cfg && setEmailConfigForm(cfg));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proforma_invoices' }, () => {
        fetchProformasFromCloud().then(pfs => pfs && setProformas(pfs));
      })
      .subscribe();

    return () => {
      window.removeEventListener('storage', handleStorage);
      supabase.removeChannel(realtimeChannel);
    };
  }, [navigate]);

  // Fetch Inquiries from Supabase cloud database & synchronise across all devices
  const fetchInquiries = async () => {
    try {
      const { data: supaData, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('id', { ascending: false });

      if (!error && Array.isArray(supaData)) {
        const formattedSupa: Inquiry[] = supaData.map((d: any) => {
          let extractedGst = d.gst || '';
          if (!extractedGst && d.company && d.company.includes('GST:')) {
            const parts = d.company.split('GST:');
            extractedGst = parts[1]?.replace(')', '').trim() || '';
          }

          let extractedCategory = d.category || '';
          let extractedSize = d.size || '';
          let rawRequirement = d.requirement || '';

          // Extract category from "[Category Name] Product"
          if (rawRequirement.startsWith('[') && rawRequirement.includes(']')) {
            const closingIdx = rawRequirement.indexOf(']');
            if (!extractedCategory) {
              extractedCategory = rawRequirement.slice(1, closingIdx).trim();
            }
            rawRequirement = rawRequirement.slice(closingIdx + 1).trim();
          }

          // Extract size from "Product (Size: 12mm)"
          if (rawRequirement.includes('(Size:')) {
            const sizeParts = rawRequirement.split('(Size:');
            rawRequirement = sizeParts[0].trim();
            if (!extractedSize && sizeParts[1]) {
              extractedSize = sizeParts[1].replace(')', '').trim();
            }
          }

          let formattedRequirement = rawRequirement;
          let formattedMessage = d.message || '';
          if (d.type === 'contact' && rawRequirement.includes(' - ')) {
            const parts = rawRequirement.split(' - ');
            formattedRequirement = parts[0];
            formattedMessage = parts.slice(1).join(' - ');
          }

          const cleanCompany = d.company ? d.company.replace(/\s*\(GST:.*?\)/i, '').trim() : '';

          const hasCustom = Boolean(
            d.hasCustomItems ||
            (Array.isArray(d.items) && d.items.some((it: any) => it.isCustom || (typeof it.name === 'string' && it.name.toLowerCase().includes('[custom]')) || it.category === 'Custom Sourcing')) ||
            (typeof formattedRequirement === 'string' && (formattedRequirement.includes('[Custom]') || formattedRequirement.includes('[Custom/Other]'))) ||
            extractedCategory === 'Custom Sourcing' || extractedCategory === 'Custom Multi-Product Sourcing'
          );

          return {
            id: d.id,
            type: (d.type === 'contact' ? 'contact' : (d.items && d.items.length > 0 ? 'bulk' : 'single')),
            name: d.name || 'Unnamed Client',
            company: cleanCompany || d.company || '',
            phone: d.phone || '',
            email: d.email || '',
            gst: extractedGst,
            category: extractedCategory,
            requirement: formattedRequirement || (d.type === 'contact' ? 'General Contact Inquiry' : (d.items ? `${d.items.length} materials requested` : 'Industrial Steel Requirement')),
            size: extractedSize,
            message: formattedMessage,
            quantity: d.quantity,
            unit: d.unit,
            hasCustomItems: hasCustom,
            items: d.items,
            timestamp: d.timestamp || 'Recently'
          };
        });

        setInquiries(formattedSupa);
        localStorage.setItem('shivam_steel_inquiries', JSON.stringify(formattedSupa));
        localStorage.setItem('sourcing_inquiries', JSON.stringify(formattedSupa));
        return formattedSupa;
      }
    } catch (err) {
      console.warn('Supabase inquiries fetch warning:', err);
    }

    // Fallback to local storage ONLY if network/Supabase connection failed completely
    try {
      const localData = localStorage.getItem('shivam_steel_inquiries');
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInquiries(parsed);
          return parsed;
        }
      }
    } catch {}

    return [];
  };

  const handleLogout = () => {
    localStorage.removeItem('shivam_admin_auth');
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/login');
  };

  // ----------------------------------------------------
  // PROFORMA INVOICE & ESTIMATION ACTIONS
  // ----------------------------------------------------
  
  // Open Blank Proforma
  const handleOpenNewProforma = () => {
    const nextNo = String(766 + proformas.length);
    const initialItem: ProformaItem = {
      id: 'it-' + Date.now(),
      name: 'TMT / Round / Square - 7214 9990',
      description: '12 MM',
      hsn: '72149990',
      quantity: 500,
      unit: 'KG.',
      rate: 51.19,
      per: 'KG.',
      amount: 25595.00
    };

    const calcs = calculateProformaCalculations([initialItem], 1200, false, 18);

    setProformaForm({
      id: 'pi-' + Date.now(),
      invoiceNo: nextNo,
      date: new Date().toISOString().split('T')[0],
      modeOfPayment: 'SAME DAY',
      referenceNoDate: '',
      otherReferences: '',
      buyersOrderNo: '9724316439',
      buyersOrderDate: new Date().toISOString().split('T')[0],
      dispatchDocNo: 'PO- 1',
      deliveryNoteDate: '',
      dispatchedThrough: 'Road Transport',
      destination: 'Dahej',
      termsOfDelivery: '9724316439',
      consigneeName: '',
      consigneeAddress: 'Dahej Site, Dahej',
      consigneeGstin: '24CBJPP0843A1Z2',
      consigneeState: 'Gujarat',
      consigneeStateCode: '24',
      buyerName: '',
      buyerAddress: 'D-70 Sunflora Residency, Ankleswer',
      buyerPhones: 'M - 9724316439',
      buyerEmail: '',
      buyerGstin: '24CBJPP0843A1Z2',
      buyerState: 'Gujarat',
      buyerStateCode: '24',
      items: [initialItem],
      ...calcs,
      totalUnit: 'KG.',
      companyName: 'DAHEJ SUPPORT',
      companyAddress: 'G/F/02, RUSHIRAJ COMPLEX, RAHIYAD CHOKDI, DAHEJ ROAD, TA-VARGRA -392130, DI-BHARUCH',
      companyUdyam: 'UDYAM-GJ-06-0040252',
      companyGstin: '24BCSPP4924R1ZN',
      companyPan: 'BCSPP4924R',
      companyState: 'Gujarat, Code : 24',
      companyEmail: 'shivamsteel2015@gmail.com',
      status: 'draft',
      createdAt: new Date().toISOString()
    });

    setIsInterstateTax(false);
    setIsProformaModalOpen(true);
  };

  // Convert an Inbound Inquiry DIRECTLY into an Official Proforma Invoice or Re-open Saved Quoted Proforma
  const handleOpenProformaFromInquiry = (inq: Inquiry) => {
    // 1. Check if a saved Proforma Invoice already exists for this exact Inquiry ID with previously entered prices
    const existingPi = proformas.find(
      p => p.inquiryId === inq.id || 
           (p.otherReferences && p.otherReferences === `INQ:${inq.id}`) ||
           p.id === `pi-inq-${inq.id}`
    );

    if (existingPi) {
      setProformaForm(existingPi);
      setIsInterstateTax((existingPi.igstRate && existingPi.igstRate > 0) || false);
      setIsProformaModalOpen(true);
      return;
    }

    const nextNo = String(766 + proformas.length);
    const items: ProformaItem[] = [];

    const getHsnForProduct = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('pipe') || lower.includes('tube')) return '73066100';
      if (lower.includes('angle') || lower.includes('channel') || lower.includes('beam') || lower.includes('joist')) return '72162100';
      if (lower.includes('plate') || lower.includes('sheet') || lower.includes('hr')) return '72083990';
      if (lower.includes('cement')) return '25232900';
      if (lower.includes('brick') || lower.includes('refractory')) return '69022000';
      if (lower.includes('wire') || lower.includes('mesh')) return '72171010';
      return '72149990';
    };

    if (inq.items && inq.items.length > 0) {
      // Map all products requested in multi-item inquiry builder with rate defaulted to 0
      inq.items.forEach((item, idx) => {
        const matchedProduct = products.find(p =>
          p.name.toLowerCase() === item.name.toLowerCase() ||
          item.name.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(item.name.toLowerCase())
        );

        const rawUnit = (item.unit || matchedProduct?.measurement || 'ton').toUpperCase();
        let standardUnit = 'KG.';
        if (rawUnit === 'TON' || rawUnit === 'MT') standardUnit = 'TON.';
        else if (rawUnit === 'NOS' || rawUnit === 'PCS' || rawUnit === 'NUMBERS') standardUnit = 'NOS.';
        else if (rawUnit === 'FOOT' || rawUnit === 'FEET' || rawUnit === 'FT' || rawUnit === 'RFT') standardUnit = 'FT.';
        else if (rawUnit === 'MTR' || rawUnit === 'METER' || rawUnit === 'METERS') standardUnit = 'MTR.';
        else if (rawUnit === 'SQ.FT.' || rawUnit === 'SQFT') standardUnit = 'SQ.FT.';
        else if (rawUnit === 'KG' || rawUnit === 'KGS') standardUnit = 'KG.';
        else standardUnit = rawUnit.endsWith('.') ? rawUnit : `${rawUnit}.`;

        const qty = Number(item.quantity) || 1;

        const descriptionWithSpec = item.size
          ? `${matchedProduct?.subcategory || 'Standard Industrial Grade'} - Spec/Size: ${item.size}`
          : (matchedProduct?.subcategory || 'Standard Industrial Grade');

        items.push({
          id: `it-${Date.now()}-${idx}`,
          name: item.size ? `${item.name} (${item.size})` : item.name,
          description: descriptionWithSpec,
          hsn: getHsnForProduct(item.name),
          quantity: qty,
          unit: standardUnit,
          rate: 0,
          per: standardUnit,
          amount: 0
        });
      });
    } else {
      // Single product inquiry with rate defaulted to 0
      const matchedProduct = products.find(p =>
        p.name.toLowerCase() === inq.requirement.toLowerCase() ||
        inq.requirement.toLowerCase().includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(inq.requirement.toLowerCase())
      );

      const rawUnit = (inq.unit || matchedProduct?.measurement || 'ton').toUpperCase();
      let standardUnit = 'KG.';
      if (rawUnit === 'TON' || rawUnit === 'MT') standardUnit = 'TON.';
      else if (rawUnit === 'NOS' || rawUnit === 'PCS' || rawUnit === 'NUMBERS') standardUnit = 'NOS.';
      else if (rawUnit === 'FOOT' || rawUnit === 'FEET' || rawUnit === 'FT' || rawUnit === 'RFT') standardUnit = 'FT.';
      else if (rawUnit === 'MTR' || rawUnit === 'METER' || rawUnit === 'METERS') standardUnit = 'MTR.';
      else if (rawUnit === 'SQ.FT.' || rawUnit === 'SQFT') standardUnit = 'SQ.FT.';
      else if (rawUnit === 'KG' || rawUnit === 'KGS') standardUnit = 'KG.';
      else standardUnit = rawUnit.endsWith('.') ? rawUnit : `${rawUnit}.`;

      const qty = Number(inq.quantity) || 1;

      items.push({
        id: 'it-' + Date.now(),
        name: inq.requirement,
        description: inq.size ? `Size: ${inq.size}${inq.message ? ` | ${inq.message}` : ''}` : (inq.message || matchedProduct?.subcategory || 'Standard Industrial Grade'),
        hsn: getHsnForProduct(inq.requirement),
        quantity: qty,
        unit: standardUnit,
        rate: 0,
        per: standardUnit,
        amount: 0
      });
    }

    // Dynamic Loading calculation based on actual product's registered loadingCost
    let dynamicLoading = 0;
    items.forEach(it => {
      const matchedProduct = products.find(p =>
        p.name.toLowerCase() === it.name.toLowerCase() ||
        it.name.toLowerCase().includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(it.name.toLowerCase())
      );
      const unitLoading = matchedProduct?.loadingCost ?? (it.unit === 'TON.' ? 350 : (it.unit === 'KG.' ? 0.35 : 5));
      dynamicLoading += Number(it.quantity) * unitLoading;
    });
    dynamicLoading = Number(dynamicLoading.toFixed(2));

    const calcs = calculateProformaCalculations(items, dynamicLoading, false, 18);

    const clientDisplayName = inq.company ? `${inq.company} (${inq.name})` : inq.name;
    const phoneFormatted = inq.phone ? (inq.phone.startsWith('M -') ? inq.phone : `M - ${inq.phone}`) : '';

    setProformaForm({
      id: `pi-inq-${inq.id}`,
      invoiceNo: nextNo,
      date: new Date().toISOString().split('T')[0],
      modeOfPayment: 'SAME DAY',
      referenceNoDate: '',
      otherReferences: `INQ:${inq.id}`,
      buyersOrderNo: inq.phone ? inq.phone.replace(/[^\d]/g, '').slice(-10) : 'PO-01',
      buyersOrderDate: new Date().toISOString().split('T')[0],
      dispatchDocNo: 'PO- 1',
      deliveryNoteDate: '',
      dispatchedThrough: 'Road Transport',
      destination: 'Dahej',
      termsOfDelivery: inq.phone || 'Ex-Godown Dahej',
      consigneeName: inq.company || inq.name,
      consigneeAddress: inq.company ? `${inq.company} Project Site, Dahej` : 'Project Site, Dahej',
      consigneeGstin: inq.gst || '',
      consigneeState: 'Gujarat',
      consigneeStateCode: '24',
      buyerName: clientDisplayName,
      buyerAddress: inq.company ? `${inq.company} Office / Site, Gujarat` : `${inq.name} Site Delivery Address`,
      buyerPhones: phoneFormatted,
      buyerEmail: inq.email || '',
      buyerGstin: inq.gst || '',
      buyerState: 'Gujarat',
      buyerStateCode: '24',
      items,
      ...calcs,
      totalUnit: items[0]?.unit || 'KG.',
      companyName: 'DAHEJ SUPPORT',
      companyAddress: 'G/F/02, RUSHIRAJ COMPLEX, RAHIYAD CHOKDI, DAHEJ ROAD, TA-VARGRA -392130, DI-BHARUCH',
      companyUdyam: 'UDYAM-GJ-06-0040252',
      companyGstin: '24BCSPP4924R1ZN',
      companyPan: 'BCSPP4924R',
      companyState: 'Gujarat, Code : 24',
      companyEmail: 'shivamsteel2015@gmail.com',
      status: 'draft',
      createdAt: new Date().toISOString(),
      inquiryId: inq.id
    });

    setIsInterstateTax(false);
    setIsProformaModalOpen(true);
  };

  // Update Proforma Header Field
  const handleUpdateProformaField = (field: keyof ProformaInvoice, value: any) => {
    setProformaForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'loadingCharges') {
        const calcs = calculateProformaCalculations(updated.items, Number(value) || 0, isInterstateTax, 18);
        return { ...updated, ...calcs };
      }
      return updated;
    });
  };

  // Toggle Interstate IGST vs Intrastate CGST+SGST
  const handleToggleTaxType = (interstate: boolean) => {
    setIsInterstateTax(interstate);
    const calcs = calculateProformaCalculations(proformaForm.items, proformaForm.loadingCharges, interstate, 18);
    setProformaForm(prev => ({
      ...prev,
      ...calcs
    }));
  };

  // Update Item in Proforma
  const handleUpdateProformaItem = (itemId: string, field: keyof ProformaItem, value: any) => {
    const newItems = proformaForm.items.map(it => {
      if (it.id === itemId) {
        const updatedItem = { ...it, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = Number((Number(updatedItem.quantity || 0) * Number(updatedItem.rate || 0)).toFixed(2));
        }
        if (field === 'unit') {
          updatedItem.per = value;
        }
        return updatedItem;
      }
      return it;
    });

    const calcs = calculateProformaCalculations(newItems, proformaForm.loadingCharges, isInterstateTax, 18);
    setProformaForm(prev => ({
      ...prev,
      items: newItems,
      ...calcs
    }));
  };

  // Add Item to Proforma Form
  const handleAddProformaItem = () => {
    const newItem: ProformaItem = {
      id: 'it-' + Date.now(),
      name: 'TMT / Round / Square - 7214 9990',
      description: '10 MM',
      hsn: '72149990',
      quantity: 1,
      unit: 'KG.',
      rate: 0,
      per: 'KG.',
      amount: 0
    };

    const newItems = [...proformaForm.items, newItem];
    const calcs = calculateProformaCalculations(newItems, proformaForm.loadingCharges, isInterstateTax, 18);
    setProformaForm(prev => ({
      ...prev,
      items: newItems,
      ...calcs
    }));
  };

  // Remove Item from Proforma Form
  const handleRemoveProformaItem = (itemId: string) => {
    if (proformaForm.items.length <= 1) return;
    const newItems = proformaForm.items.filter(it => it.id !== itemId);
    const calcs = calculateProformaCalculations(newItems, proformaForm.loadingCharges, isInterstateTax, 18);
    setProformaForm(prev => ({
      ...prev,
      items: newItems,
      ...calcs
    }));
  };

  // Save Proforma Invoice and optionally download PDF
  const handleSaveProforma = async (downloadPdf: boolean = false) => {
    if (!proformaForm.buyerName) {
      alert('Please enter Buyer / Client Name.');
      return;
    }

    const finalProforma: ProformaInvoice = {
      ...proformaForm,
      id: proformaForm.id || ('pi-' + Date.now()),
      status: 'approved',
      createdAt: proformaForm.createdAt || new Date().toISOString()
    };

    const updated = await saveProformaToCloud(finalProforma);
    setProformas(updated);

    if (downloadPdf) {
      generateProformaInvoicePDF(finalProforma);
      setSyncFeedback(`Proforma Invoice #${finalProforma.invoiceNo} saved & PDF downloaded.`);
    } else {
      setSyncFeedback(`Proforma Invoice #${finalProforma.invoiceNo} saved to cloud database.`);
    }

    setTimeout(() => setSyncFeedback(null), 3500);
    setIsProformaModalOpen(false);
  };

  // ----------------------------------------------------
  // AUTOMATED CLIENT PROFORMA EMAIL GENERATOR & DISPATCH
  // ----------------------------------------------------
  const generateClientProformaEmail = (pi: ProformaInvoice) => {
    const clientName = pi.buyerName || 'Valued Customer';
    const activeEmailConfig = getEmailConfig();
    const contactEmail = activeEmailConfig.senderEmail || 'shivamsteel2015@gmail.com';
    const materialsSummary = pi.items
      .map((it, i) => `${i + 1}. ${it.name} - Qty: ${formatIndianNumber(it.quantity, 0)} ${it.unit || 'KG.'} @ Rs. ${formatIndianNumber(it.rate, 2)}/${it.per || it.unit || 'KG.'} (Amt: Rs. ${formatIndianNumber(it.amount, 2)})`)
      .join('\n');

    const subject = `Proforma Invoice #${pi.invoiceNo} - DAHEJ SUPPORT (Dahej)`;
    const body = `Dear ${clientName},

Thank you for your inquiry with DAHEJ SUPPORT, Dahej.

Please find attached your Proforma Invoice #${pi.invoiceNo} with detailed commercial rates and GST estimation.

Proforma Invoice Summary:
• Invoice Number: #${pi.invoiceNo}
• Date: ${formatProformaDate(pi.date)}
• Delivery Destination: ${pi.destination || 'Dahej Site'}
• Payment Terms: ${pi.modeOfPayment || 'SAME DAY'}

Materials & Estimation:
${materialsSummary}

Financial Details:
• Materials Subtotal: Rs. ${formatIndianNumber(pi.itemsSubtotal, 2)}
• Loading / Handling: Rs. ${formatIndianNumber(pi.loadingCharges, 2)}
• GST (18%): Rs. ${formatIndianNumber(pi.cgstAmount + pi.sgstAmount + pi.igstAmount, 2)}
• Grand Total: Rs. ${formatIndianNumber(pi.grandTotal, 2)}
• Amount in Words: ${pi.amountInWords}

Your official stamped Proforma Invoice PDF is attached with this email.

To confirm this order or schedule dispatch, please contact our Dahej office:
• Phone / WhatsApp: +91 96015 74966
• Email: ${contactEmail}
• Dispatch Office: G/F/02, Rushiraj Complex, Rahiyad Chokdi, Dahej Road, Ta-Vagra, Dist. Bharuch, Gujarat - 392130

Thank you for choosing DAHEJ SUPPORT.

Warm regards,
Sales & Dispatch Department
DAHEJ SUPPORT · DAHEJ
GSTIN: 24BCSPP4924R1ZN`;

    return {
      recipient: pi.buyerEmail || '',
      subject,
      body,
      clientName,
      clientPhone: pi.buyerPhones ? pi.buyerPhones.replace(/[^\d]/g, '').slice(-10) : ''
    };
  };

  // ----------------------------------------------------
  // ZERO PRICE WARNING DETECTION & RESOLUTION HELPERS
  // ----------------------------------------------------
  const getProformaZeroPriceItems = (pi?: ProformaInvoice | null): ProformaItem[] => {
    if (!pi || !pi.items || pi.items.length === 0) return [];
    return pi.items.filter(it => (Number(it.rate || 0) <= 0) || (Number(it.amount || 0) <= 0));
  };

  const isProformaZeroPrice = (pi?: ProformaInvoice | null): boolean => {
    if (!pi) return false;
    if ((Number(pi.grandTotal || 0) <= 0) || (Number(pi.itemsSubtotal || 0) <= 0)) {
      return true;
    }
    const zeroItems = getProformaZeroPriceItems(pi);
    return zeroItems.length > 0;
  };

  const handleOpenEmailModal = (pi: ProformaInvoice, skipZeroWarning: boolean = false) => {
    if (!skipZeroWarning && isProformaZeroPrice(pi)) {
      const zeroItems = getProformaZeroPriceItems(pi);
      setZeroPriceWarning({
        isOpen: true,
        proforma: pi,
        zeroItems,
        actionType: 'open_email_modal'
      });
      return;
    }
    const emailData = generateClientProformaEmail(pi);
    setEmailTargetInvoice(pi);
    setEmailForm(emailData);
    setIsCopiedEmail(false);
    setEmailDispatchStatus(null);
    setIsEmailModalOpen(true);
  };

  const handleOpenInquiryEmailModal = (inq: Inquiry) => {
    const existingPi = proformas.find(
      p => p.inquiryId === inq.id || 
           (p.otherReferences && p.otherReferences === `INQ:${inq.id}`) ||
           p.id === `pi-inq-${inq.id}` ||
           p.buyerName.includes(inq.name) ||
           (inq.company && p.buyerName.includes(inq.company))
    );
    if (existingPi) {
      handleOpenEmailModal(existingPi);
    } else {
      handleOpenProformaFromInquiry(inq);
    }
  };

  const handleConfirmZeroPriceProceed = () => {
    if (!zeroPriceWarning) return;
    const { actionType, proforma } = zeroPriceWarning;
    setZeroPriceWarning(null);

    if (actionType === 'open_email_modal') {
      handleOpenEmailModal(proforma, true);
    } else if (actionType === 'send_cloud_email') {
      handleSendCloudEmail(true);
    } else if (actionType === 'open_gmail') {
      handleOpenGmailWeb(true);
    } else if (actionType === 'open_native_email') {
      handleSendNativeEmail(true);
    } else if (actionType === 'send_whatsapp') {
      handleSendWhatsAppQuote(true);
    }
  };

  const handleEditPricesFromWarning = () => {
    if (!zeroPriceWarning) return;
    const targetPi = zeroPriceWarning.proforma;
    setZeroPriceWarning(null);
    setIsEmailModalOpen(false);
    setProformaForm(targetPi);
    setIsProformaModalOpen(true);
  };

  const handleOpenGmailWeb = async (skipZeroWarning: boolean = false) => {
    if (!emailTargetInvoice) return;
    if (!skipZeroWarning && isProformaZeroPrice(emailTargetInvoice)) {
      setZeroPriceWarning({
        isOpen: true,
        proforma: emailTargetInvoice,
        zeroItems: getProformaZeroPriceItems(emailTargetInvoice),
        actionType: 'open_gmail'
      });
      return;
    }

    generateProformaInvoicePDF(emailTargetInvoice);
    navigator.clipboard.writeText(emailForm.body);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailForm.recipient)}&su=${encodeURIComponent(emailForm.subject)}&body=${encodeURIComponent(emailForm.body)}`;
    window.open(gmailUrl, '_blank');

    const updatedInvoice: ProformaInvoice = { ...emailTargetInvoice, status: 'approved' as const };
    const updated = await saveProformaToCloud(updatedInvoice);
    setProformas(updated);

    setSyncFeedback(`Gmail compose opened & Stamped PDF downloaded for ${emailForm.clientName}. Message copied to clipboard.`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleSendNativeEmail = async (skipZeroWarning: boolean = false) => {
    if (!emailTargetInvoice) return;
    if (!skipZeroWarning && isProformaZeroPrice(emailTargetInvoice)) {
      setZeroPriceWarning({
        isOpen: true,
        proforma: emailTargetInvoice,
        zeroItems: getProformaZeroPriceItems(emailTargetInvoice),
        actionType: 'open_native_email'
      });
      return;
    }

    generateProformaInvoicePDF(emailTargetInvoice);

    const mailtoUrl = `mailto:${emailForm.recipient}?subject=${encodeURIComponent(emailForm.subject)}&body=${encodeURIComponent(emailForm.body)}`;
    window.location.href = mailtoUrl;

    const updatedInvoice: ProformaInvoice = { ...emailTargetInvoice, status: 'approved' as const };
    const updated = await saveProformaToCloud(updatedInvoice);
    setProformas(updated);

    setSyncFeedback(`Email draft opened and PDF downloaded for ${emailForm.clientName}.`);
    setTimeout(() => setSyncFeedback(null), 3500);
    setIsEmailModalOpen(false);
  };

  const handleCopyEmailMessage = () => {
    navigator.clipboard.writeText(emailForm.body);
    setIsCopiedEmail(true);
    setSyncFeedback('Personalized email message copied to clipboard!');
    setTimeout(() => {
      setIsCopiedEmail(false);
      setSyncFeedback(null);
    }, 3000);
  };

  const handleSendWhatsAppQuote = (skipZeroWarning: boolean = false) => {
    if (!emailTargetInvoice) return;
    if (!skipZeroWarning && isProformaZeroPrice(emailTargetInvoice)) {
      setZeroPriceWarning({
        isOpen: true,
        proforma: emailTargetInvoice,
        zeroItems: getProformaZeroPriceItems(emailTargetInvoice),
        actionType: 'send_whatsapp'
      });
      return;
    }

    const cleanPhone = emailForm.clientPhone || (emailTargetInvoice.buyerPhones ? emailTargetInvoice.buyerPhones.replace(/[^\d]/g, '').slice(-10) : '');
    if (!cleanPhone) {
      alert('Client phone number not available for WhatsApp.');
      return;
    }
    generateProformaInvoicePDF(emailTargetInvoice);

    const waText = `*DAHEJ SUPPORT - Official Proforma Invoice #${emailTargetInvoice.invoiceNo}*\n\nDear ${emailForm.clientName},\n\nWe have generated your Official Proforma Invoice #${emailTargetInvoice.invoiceNo}.\n\n*Grand Total:* ₹${formatIndianNumber(emailTargetInvoice.grandTotal, 2)} (Incl. GST & Loading)\n*Quantity:* ${formatIndianNumber(emailTargetInvoice.totalQuantity, 2)} ${emailTargetInvoice.totalUnit}\n*Payment Terms:* ${emailTargetInvoice.modeOfPayment}\n\nPlease find the attached official stamped PDF document.\n\nFor dispatch confirmation: +91 96015 74966\n*DAHEJ SUPPORT · DAHEJ*`;
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(waText)}`, '_blank');
  };

  const handleSendCloudEmail = async (skipZeroWarning: boolean = false) => {
    if (!emailTargetInvoice) return;
    if (!emailForm.recipient || !emailForm.recipient.includes('@')) {
      alert('Please enter a valid recipient email address.');
      return;
    }

    if (!skipZeroWarning && isProformaZeroPrice(emailTargetInvoice)) {
      setZeroPriceWarning({
        isOpen: true,
        proforma: emailTargetInvoice,
        zeroItems: getProformaZeroPriceItems(emailTargetInvoice),
        actionType: 'send_cloud_email'
      });
      return;
    }

    setIsSendingCloudEmail(true);
    setEmailDispatchStatus({ type: 'info', message: 'Generating PDF & dispatching official email to client...' });

    try {
      // Build PDF document and convert to Base64
      const doc = buildProformaPDFDocument(emailTargetInvoice);
      const dataUri = doc.output('datauristring');
      const cleanInvNo = (emailTargetInvoice.invoiceNo || '766').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanClient = (emailTargetInvoice.buyerName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
      const fileName = `Shivam_Steel_Proforma_Invoice_${cleanInvNo}_${cleanClient}.pdf`;

      // Call Automated Direct Email Dispatcher
      const result = await sendDirectClientEmail({
        to: emailForm.recipient,
        subject: emailForm.subject,
        body: emailForm.body,
        pdfBase64: dataUri,
        pdfFileName: fileName
      });

      if (result.success) {
        // Mark as approved / issued in cloud & local
        const updatedInvoice: ProformaInvoice = { ...emailTargetInvoice, status: 'approved' as const };
        const updated = await saveProformaToCloud(updatedInvoice);
        setProformas(updated);

        setEmailDispatchStatus({ type: 'success', message: result.message });
        setSyncFeedback(`Proforma Invoice #${emailTargetInvoice.invoiceNo} sent directly to ${emailForm.recipient}.`);

        setTimeout(() => {
          setIsSendingCloudEmail(false);
          setIsEmailModalOpen(false);
          setEmailDispatchStatus(null);
          setTimeout(() => setSyncFeedback(null), 3500);
        }, 2000);
      } else {
        setIsSendingCloudEmail(false);
        setEmailDispatchStatus({ type: 'error', message: result.message });
      }
    } catch (err: any) {
      setIsSendingCloudEmail(false);
      setEmailDispatchStatus({ type: 'error', message: err.message || 'Dispatch failed. Please use "Open in Gmail / Outlook".' });
    }
  };

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveEmailConfig(emailConfigForm);
    setSyncFeedback('Invoice email dispatcher configuration saved & synced to cloud.');
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const handleTestInvoiceEmailDispatch = async () => {
    const targetEmail = (testInvoiceEmailTarget || emailConfigForm.senderEmail || 'login@dahejsupport.com').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setInvoiceTestStatus({ type: 'error', message: 'Please enter a valid recipient email address for test dispatch.' });
      return;
    }

    setIsTestingInvoiceEmail(true);
    setInvoiceTestStatus({ type: 'info', message: `Generating sample Proforma Invoice & sending test email to ${targetEmail}...` });

    try {
      const sampleInvoice: ProformaInvoice = {
        id: 'pi-test',
        invoiceNo: 'TEST-001',
        date: new Date().toISOString().split('T')[0],
        modeOfPayment: '100% ADVANCE / SAME DAY',
        referenceNoDate: '',
        otherReferences: '',
        buyersOrderNo: 'SAMPLE-PO-99',
        buyersOrderDate: new Date().toISOString().split('T')[0],
        dispatchDocNo: 'TEST-DOC-1',
        deliveryNoteDate: '',
        dispatchedThrough: 'Road Transport',
        destination: 'Dahej Industrial Area',
        termsOfDelivery: 'Ex-Yard Dahej',
        consigneeName: 'Sample Client Enterprise',
        consigneeAddress: 'Plot 42, GIDC Dahej, Gujarat - 392130',
        consigneeGstin: '24AAAAA0000A1Z5',
        consigneeState: 'Gujarat',
        consigneeStateCode: '24',
        buyerName: 'Sample Client Enterprise',
        buyerAddress: 'Plot 42, GIDC Dahej, Gujarat - 392130',
        buyerGstin: '24AAAAA0000A1Z5',
        buyerState: 'Gujarat',
        buyerStateCode: '24',
        buyerPhones: '+91 99000 00000',
        items: [
          {
            id: 'item-1',
            name: 'TMT Steel Rebar (Fe 550D)',
            description: '12 MM Primary Producer Rebar',
            hsn: '72149990',
            quantity: 10,
            unit: 'TON.',
            rate: 52000,
            per: 'TON.',
            amount: 520000
          }
        ],
        itemsSubtotal: 520000,
        loadingCharges: 2500,
        taxableValue: 522500,
        cgstRate: 9,
        cgstAmount: 47025,
        sgstRate: 9,
        sgstAmount: 47025,
        igstRate: 0,
        igstAmount: 0,
        roundOff: 0,
        grandTotal: 616550,
        totalQuantity: 10,
        totalUnit: 'TON.',
        amountInWords: 'INR Six Lakh Sixteen Thousand Five Hundred Fifty Only',
        taxAmountInWords: 'INR Ninety Four Thousand Fifty Only',
        companyName: 'DAHEJ SUPPORT',
        companyAddress: 'G/F/02, RUSHIRAJ COMPLEX, RAHIYAD CHOKDI, DAHEJ ROAD, TA-VARGRA -392130, DI-BHARUCH',
        companyUdyam: 'UDYAM-GJ-06-0040252',
        companyGstin: '24BCSPP4924R1ZN',
        companyPan: 'BCSPP4924R',
        companyState: 'Gujarat, Code : 24',
        companyEmail: emailConfigForm.senderEmail || 'help@dahejsupport.com',
        status: 'approved',
        createdAt: new Date().toISOString()
      };

      const doc = buildProformaPDFDocument(sampleInvoice);
      const dataUri = doc.output('datauristring');

      const testResult = await sendDirectClientEmail({
        to: targetEmail,
        subject: `Sample Proforma Invoice #${sampleInvoice.invoiceNo} - DAHEJ SUPPORT (Test Dispatch)`,
        body: `Dear Client,\n\nPlease find attached sample Proforma Invoice #${sampleInvoice.invoiceNo} from DAHEJ SUPPORT.\n\nThis is an automated test dispatch to confirm system functionality.\n\nWarm regards,\nDAHEJ SUPPORT (Dahej)`,
        pdfBase64: dataUri,
        pdfFileName: 'Dahej_Support_Sample_Proforma_Invoice.pdf'
      });

      setIsTestingInvoiceEmail(false);
      if (testResult.success) {
        setInvoiceTestStatus({
          type: 'success',
          message: `Sample Proforma Invoice with PDF delivered to ${targetEmail} from ${emailConfigForm.senderEmail}!`
        });
      } else {
        setInvoiceTestStatus({ type: 'error', message: testResult.message });
      }
    } catch (err: any) {
      setIsTestingInvoiceEmail(false);
      setInvoiceTestStatus({ type: 'error', message: err.message || 'Test invoice dispatch failed.' });
    }
  };

  const handleSaveInquiryEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveInquiryEmailConfig(inquiryEmailConfigForm);
    setSyncFeedback('Inquiry auto-responder email configuration saved & synced to cloud.');
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const handleTestInquiryEmailDispatch = async () => {
    const targetEmail = (testInquiryEmailTarget || inquiryEmailConfigForm.adminNotificationEmail || inquiryEmailConfigForm.senderEmail || 'login@dahejsupport.com').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setInquiryTestStatus({ type: 'error', message: 'Please enter a valid recipient email address for test dispatch.' });
      return;
    }

    setIsTestingInquiryEmail(true);
    setInquiryTestStatus({ type: 'info', message: `Sending sample inquiry confirmation email to ${targetEmail}...` });

    try {
      const testResult = await sendInquiryConfirmationEmail({
        id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
        type: 'single',
        name: 'Valued Customer (Sample Test)',
        company: 'Shivam Fabricators Pvt Ltd',
        phone: '+91 99000 00000',
        email: targetEmail,
        gst: '24AAAAA0000A1Z5',
        requirement: 'TMT Steel Bars (Fe 550D)',
        quantity: 25,
        unit: 'ton',
        timestamp: new Date().toLocaleString('en-IN')
      });

      setIsTestingInquiryEmail(false);
      if (testResult.success) {
        setInquiryTestStatus({
          type: 'success',
          message: `Test confirmation email delivered to ${targetEmail} from ${inquiryEmailConfigForm.senderEmail}!`
        });
      } else {
        setInquiryTestStatus({ type: 'error', message: testResult.message });
      }
    } catch (err: any) {
      setIsTestingInquiryEmail(false);
      setInquiryTestStatus({ type: 'error', message: err.message || 'Test dispatch failed.' });
    }
  };

  // ----------------------------------------------------
  // MULTI-SELECT BATCH INQUIRY ACTIONS
  // ----------------------------------------------------
  const handleToggleSelectInquiry = (id: string) => {
    setSelectedInquiryIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllContact = () => {
    const visibleIds = filteredContactQueries.map(q => q.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedInquiryIds.includes(id));
    if (allSelected) {
      setSelectedInquiryIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedInquiryIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleSelectAllInbound = () => {
    const visibleIds = filteredInquiries.map(i => i.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedInquiryIds.includes(id));
    if (allSelected) {
      setSelectedInquiryIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedInquiryIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleOpenBulkDeleteModal = (label: string = 'selected entries') => {
    if (selectedInquiryIds.length === 0) return;
    setDeleteTarget({
      type: 'bulk_inquiries',
      id: 'bulk',
      name: `${selectedInquiryIds.length} ${label}`,
      count: selectedInquiryIds.length
    });
  };

  const handleClearSelection = () => {
    setSelectedInquiryIds([]);
  };

  // ----------------------------------------------------
  // DATA EXPORT HANDLERS (CSV / SPREADSHEET EXTRACTION)
  // ----------------------------------------------------
  const handleExportAllInquiries = () => {
    const materialInqs = inquiries.filter(i => i.type !== 'contact');
    if (materialInqs.length === 0) {
      setSyncFeedback('No material inquiries available to export.');
      setTimeout(() => setSyncFeedback(null), 3500);
      return;
    }
    const success = exportMaterialInquiriesToCSV(materialInqs);
    if (success) {
      setSyncFeedback(`Successfully exported all ${materialInqs.length} material inquiries to CSV!`);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  const handleExportSelectedInquiries = () => {
    const selectedList = filteredInquiries.filter(i => selectedInquiryIds.includes(i.id));
    if (selectedList.length === 0) {
      setSyncFeedback('Please select inquiries with checkboxes to export.');
      setTimeout(() => setSyncFeedback(null), 3500);
      return;
    }
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Shivam_Steel_Selected_Inquiries_${dateStr}.csv`;
    const success = exportMaterialInquiriesToCSV(selectedList, fileName);
    if (success) {
      setSyncFeedback(`Successfully exported ${selectedList.length} selected inquiries to CSV!`);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  const handleExportAllContactQueries = () => {
    const contactList = inquiries.filter(i => i.type === 'contact');
    if (contactList.length === 0) {
      setSyncFeedback('No contact page messages available to extract.');
      setTimeout(() => setSyncFeedback(null), 3500);
      return;
    }
    const success = exportContactQueriesToCSV(contactList);
    if (success) {
      setSyncFeedback(`Successfully extracted all ${contactList.length} contact desk messages to CSV!`);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  const handleExportSelectedContactQueries = () => {
    const selectedList = filteredContactQueries.filter(q => selectedInquiryIds.includes(q.id));
    if (selectedList.length === 0) {
      setSyncFeedback('Please select contact messages with checkboxes to export.');
      setTimeout(() => setSyncFeedback(null), 3500);
      return;
    }
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Shivam_Steel_Selected_Contact_Queries_${dateStr}.csv`;
    const success = exportContactQueriesToCSV(selectedList, fileName);
    if (success) {
      setSyncFeedback(`Successfully extracted ${selectedList.length} selected contact messages to CSV!`);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  const handleExportInventoryLedger = () => {
    const list = filteredInventoryTransactions.length > 0 ? filteredInventoryTransactions : inventoryTransactions;
    if (list.length === 0) {
      setSyncFeedback('No stock movement logs available to export.');
      setTimeout(() => setSyncFeedback(null), 3500);
      return;
    }
    const success = exportInventoryLedgerToCSV(list);
    if (success) {
      setSyncFeedback(`Successfully exported ${list.length} inventory movement records to Excel CSV!`);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  const handleExportProducts = () => {
    if (products.length === 0) {
      setSyncFeedback('No catalog products available to export.');
      setTimeout(() => setSyncFeedback(null), 3500);
      return;
    }
    const listToExport = filteredProducts.length > 0 ? filteredProducts : products;
    const dateStr = new Date().toISOString().split('T')[0];
    const success = exportProductsToCSV(
      listToExport,
      categories,
      `Shivam_Steel_Products_Catalog_${dateStr}.csv`
    );
    if (success) {
      setSyncFeedback(`Successfully exported ${listToExport.length} catalog materials to Excel CSV!`);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  // ----------------------------------------------------
  // UNIVERSAL DELETE CONFIRMATION HANDLER
  // ----------------------------------------------------
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, id, name } = deleteTarget;
    setIsDeleting(true);

    try {
      if (type === 'product') {
        setProducts(prev => prev.filter(p => p.id !== id));
        setDeleteTarget(null);
        await deleteProduct(id);

        // Also clean up from inventory tracking & pending orders if tracked
        const currentInv = getInventoryItems();
        const linkedItem = currentInv.find(inv => inv.productId === id || inv.productName.toLowerCase() === (name || '').toLowerCase());
        if (linkedItem) {
          deleteInventoryItem(linkedItem.id);
          setInventoryItems(getInventoryItems());
          setInventoryPartialOrders(getInventoryPartialOrders());
        }

        setSyncFeedback(`Material "${name}" deleted from database and website.`);
      } else if (type === 'category') {
        setCategories(prev => prev.filter(c => c.id !== id));
        setDeleteTarget(null);
        await deleteCategory(id);
        setSyncFeedback(`Category "${name}" removed.`);
      } else if (type === 'proforma') {
        const filtered = await deleteProformaFromCloud(id);
        setProformas(filtered);
        setDeleteTarget(null);
        setSyncFeedback('Proforma Invoice record deleted from cloud database.');
      } else if (type === 'inquiry') {
        // 1. Delete from Supabase cloud database
        try {
          const { error } = await supabase.from('inquiries').delete().eq('id', id);
          if (error) console.error('Supabase delete error:', error);
        } catch (supaErr) {
          console.error('Supabase delete exception:', supaErr);
        }

        // 2. Also delete linked proforma invoice from cloud if existing
        const linkedPi = proformas.find(p => p.inquiryId === id || (p.otherReferences && p.otherReferences === `INQ:${id}`) || p.id === `pi-inq-${id}`);
        if (linkedPi) {
          const updatedProformas = await deleteProformaFromCloud(linkedPi.id);
          setProformas(updatedProformas);
        }

        // 3. Update local state and local caches
        const filtered = inquiries.filter(i => i.id !== id);
        setInquiries(filtered);
        setSelectedInquiryIds(prev => prev.filter(selId => selId !== id));
        localStorage.setItem('shivam_steel_inquiries', JSON.stringify(filtered));
        localStorage.setItem('sourcing_inquiries', JSON.stringify(filtered));
        setDeleteTarget(null);
        setSyncFeedback(`Inquiry "${name}" permanently deleted.`);
      } else if (type === 'bulk_inquiries') {
        const count = selectedInquiryIds.length;
        if (count > 0) {
          // 1. Batch delete all selected IDs from Supabase cloud database
          try {
            const { error } = await supabase.from('inquiries').delete().in('id', selectedInquiryIds);
            if (error) console.error('Supabase bulk delete error:', error);
          } catch (supaErr) {
            console.error('Supabase bulk delete exception:', supaErr);
          }

          // 2. Also delete linked proformas for the deleted inquiries
          for (const selId of selectedInquiryIds) {
            const linkedPi = proformas.find(p => p.inquiryId === selId || (p.otherReferences && p.otherReferences === `INQ:${selId}`) || p.id === `pi-inq-${selId}`);
            if (linkedPi) {
              await deleteProformaFromCloud(linkedPi.id);
            }
          }
          const freshProformas = getProformas();
          setProformas(freshProformas);

          // 3. Update local state and local caches
          const filtered = inquiries.filter(i => !selectedInquiryIds.includes(i.id));
          setInquiries(filtered);
          localStorage.setItem('shivam_steel_inquiries', JSON.stringify(filtered));
          localStorage.setItem('sourcing_inquiries', JSON.stringify(filtered));
          setSelectedInquiryIds([]);
          setDeleteTarget(null);
          setSyncFeedback(`${count} entries permanently deleted from cloud database.`);
        }
      } else if (type === 'inventory_item') {
        deleteInventoryItem(id);
        setInventoryItems(getInventoryItems());
        setInventoryPartialOrders(getInventoryPartialOrders());
        setDeleteTarget(null);
        setSyncFeedback(`Material "${name}" removed from inventory tracking.`);
      }
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // ----------------------------------------------------
  // INVENTORY MANAGEMENT ACTIONS
  // ----------------------------------------------------
  const handleOpenStockMovement = (item: InventoryItem, type: 'IN' | 'OUT', existingOrderId?: string) => {
    const openOrdersForItem = getPendingOrdersForItem(item.id, type);
    const targetOrder = existingOrderId ? openOrdersForItem.find(o => o.id === existingOrderId) : (openOrdersForItem.length > 0 ? openOrdersForItem[0] : undefined);

    if (existingOrderId && targetOrder) {
      setStockMovementModal({
        isOpen: true,
        type,
        item,
        mode: 'fulfill_pending',
        selectedOrderId: targetOrder.id,
        deliveryType: 'complete',
        totalOrderQty: targetOrder.totalExpectedQty.toString(),
        quantity: targetOrder.pendingQty.toString(),
        partyName: targetOrder.partyName,
        referenceNo: targetOrder.referenceNo,
        notes: '',
        error: undefined
      });
    } else {
      setStockMovementModal({
        isOpen: true,
        type,
        item,
        mode: 'new',
        selectedOrderId: openOrdersForItem.length > 0 ? openOrdersForItem[0].id : undefined,
        deliveryType: 'complete',
        totalOrderQty: '',
        quantity: '',
        partyName: '',
        referenceNo: '',
        notes: '',
        error: undefined
      });
    }
  };

  const handleOpenFulfillOrder = (order: InventoryPartialOrder) => {
    const item = inventoryItems.find(i => i.id === order.itemId);
    if (!item) return;

    setStockMovementModal({
      isOpen: true,
      type: order.type,
      item,
      mode: 'fulfill_pending',
      selectedOrderId: order.id,
      deliveryType: 'complete',
      totalOrderQty: order.totalExpectedQty.toString(),
      quantity: order.pendingQty.toString(),
      partyName: order.partyName,
      referenceNo: order.referenceNo,
      notes: '',
      error: undefined
    });
  };

  const handleCancelOrder = (orderId: string, refNo: string) => {
    if (window.confirm(`Are you sure you want to close/cancel the pending balance for Order #${refNo}?`)) {
      cancelPartialOrder(orderId);
      setInventoryPartialOrders(getInventoryPartialOrders());
      setSyncFeedback(`Order #${refNo} pending balance closed.`);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  const handleSubmitStockMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockMovementModal.item) return;

    const qty = parseFloat(stockMovementModal.quantity);
    if (isNaN(qty) || qty <= 0) {
      setStockMovementModal(prev => ({ ...prev, error: 'Please enter a valid positive quantity greater than 0.' }));
      return;
    }

    if (stockMovementModal.type === 'OUT' && qty > stockMovementModal.item.currentStock) {
      setStockMovementModal(prev => ({
        ...prev,
        error: `Cannot dispatch ${qty} ${stockMovementModal.item?.unit}. Available yard balance is only ${stockMovementModal.item?.currentStock} ${stockMovementModal.item?.unit}.`
      }));
      return;
    }

    let isPartial = false;
    let totalOrderQty: number | undefined = undefined;
    let existingOrderId: string | undefined = undefined;

    if (stockMovementModal.mode === 'fulfill_pending' && stockMovementModal.selectedOrderId) {
      existingOrderId = stockMovementModal.selectedOrderId;
      const order = inventoryPartialOrders.find(o => o.id === existingOrderId);
      if (order && qty > order.pendingQty) {
        setStockMovementModal(prev => ({
          ...prev,
          error: `Entered quantity (${qty} ${stockMovementModal.item?.unit}) exceeds remaining pending balance (${order.pendingQty} ${stockMovementModal.item?.unit}).`
        }));
        return;
      }
    } else if (stockMovementModal.mode === 'new') {
      if (stockMovementModal.deliveryType === 'partial') {
        isPartial = true;
        const total = parseFloat(stockMovementModal.totalOrderQty);
        if (isNaN(total) || total <= qty) {
          setStockMovementModal(prev => ({
            ...prev,
            error: `For partial deliveries, Total Expected Quantity (${stockMovementModal.totalOrderQty}) must be greater than Quantity Arriving Now (${qty}).`
          }));
          return;
        }
        totalOrderQty = total;
      }
    }

    const res = recordStockMovement({
      itemId: stockMovementModal.item.id,
      type: stockMovementModal.type,
      quantity: qty,
      isPartial,
      totalOrderQty,
      existingOrderId,
      partyName: stockMovementModal.partyName,
      referenceNo: stockMovementModal.referenceNo,
      notes: stockMovementModal.notes
    });

    if (res.success) {
      setInventoryItems(getInventoryItems());
      setInventoryTransactions(getInventoryTransactions());
      setInventoryPartialOrders(getInventoryPartialOrders());
      setSyncFeedback(res.message);
      setTimeout(() => setSyncFeedback(null), 4000);
      setStockMovementModal({
        isOpen: false,
        type: 'IN',
        item: null,
        mode: 'new',
        selectedOrderId: undefined,
        deliveryType: 'complete',
        totalOrderQty: '',
        quantity: '',
        partyName: '',
        referenceNo: '',
        notes: '',
        error: undefined
      });
    } else {
      setStockMovementModal(prev => ({ ...prev, error: res.message }));
    }
  };

  const handleOpenAddInventoryItem = (item?: InventoryItem) => {
    if (item) {
      setEditingInventoryItem(item);
      setInventoryItemForm({
        selectedProductId: item.productId || '',
        productName: item.productName,
        category: item.category,
        subcategory: item.subcategory || 'General Supply',
        initialStock: item.currentStock.toString(),
        unit: item.unit,
        minStockLevel: item.minStockLevel.toString(),
        location: item.location || DEFAULT_LOCATIONS[0],
        hsn: item.hsn || '72149990'
      });
    } else {
      setEditingInventoryItem(null);
      // Auto-select first catalog product that is not yet tracked in inventory, or fallback to first catalog product
      const untrackedProduct = products.find(p => !inventoryItems.some(inv => inv.productId === p.id || inv.productName.toLowerCase() === p.name.toLowerCase())) || products[0];

      if (untrackedProduct) {
        const defaultUnit = mapProductMeasurementToUnit(untrackedProduct.measurement);
        setInventoryItemForm({
          selectedProductId: untrackedProduct.id,
          productName: untrackedProduct.name,
          category: untrackedProduct.category,
          subcategory: untrackedProduct.subcategory || 'General Supply',
          initialStock: '0',
          unit: defaultUnit,
          minStockLevel: '10',
          location: DEFAULT_LOCATIONS[0],
          hsn: untrackedProduct.hsn || '72149990'
        });
      } else {
        setInventoryItemForm({
          selectedProductId: '',
          productName: '',
          category: 'steel',
          subcategory: 'TMT Bars',
          initialStock: '0',
          unit: 'MT',
          minStockLevel: '10',
          location: DEFAULT_LOCATIONS[0],
          hsn: '72149990'
        });
      }
    }
    setIsInventoryItemModalOpen(true);
  };

  const handleSelectCatalogProduct = (prodId: string) => {
    if (!prodId) {
      setInventoryItemForm(prev => ({
        ...prev,
        selectedProductId: '',
        productName: '',
        category: 'steel',
        subcategory: 'General Supply',
        hsn: '72149990',
        unit: 'MT'
      }));
      return;
    }

    const found = products.find(p => p.id === prodId);
    if (found) {
      const defaultUnit = mapProductMeasurementToUnit(found.measurement);
      setInventoryItemForm(prev => ({
        ...prev,
        selectedProductId: found.id,
        productName: found.name,
        category: found.category,
        subcategory: found.subcategory || 'General Supply',
        hsn: found.hsn || '72149990',
        unit: defaultUnit
      }));
    }
  };

  const handleSubmitInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingInventoryItem) {
      // Current Stock, Product Name, Category, Subcategory, Unit, and HSN remain strictly locked
      const updated: InventoryItem = {
        ...editingInventoryItem,
        minStockLevel: parseFloat(inventoryItemForm.minStockLevel) || 10,
        location: inventoryItemForm.location
      };
      updateInventoryItem(updated);
      setSyncFeedback(`Updated yard settings for "${updated.productName}".`);
    } else {
      if (!inventoryItemForm.selectedProductId) {
        alert('Please select a product from the Products Catalog.');
        return;
      }
      const selectedProd = products.find(p => p.id === inventoryItemForm.selectedProductId);
      if (!selectedProd) {
        alert('Selected catalog product not found.');
        return;
      }

      const initialQty = Math.max(0, parseFloat(inventoryItemForm.initialStock) || 0);
      const newItem = addInventoryItem({
        productId: selectedProd.id,
        productName: selectedProd.name,
        category: selectedProd.category,
        subcategory: selectedProd.subcategory || 'General Supply',
        initialStock: initialQty,
        unit: mapProductMeasurementToUnit(selectedProd.measurement),
        minStockLevel: parseFloat(inventoryItemForm.minStockLevel) || 10,
        location: inventoryItemForm.location,
        hsn: selectedProd.hsn || '72149990'
      });
      setSyncFeedback(`Added "${newItem.productName}" to inventory with opening stock ${newItem.currentStock} ${newItem.unit}.`);
    }

    setInventoryItems(getInventoryItems());
    setInventoryTransactions(getInventoryTransactions());
    setInventoryPartialOrders(getInventoryPartialOrders());
    setTimeout(() => setSyncFeedback(null), 3500);
    setIsInventoryItemModalOpen(false);
  };

  const handleDeleteInventoryItemClick = (item: InventoryItem) => {
    setDeleteTarget({
      type: 'inventory_item',
      id: item.id,
      name: item.productName
    });
  };

  // ----------------------------------------------------
  // CATEGORY ACTIONS
  // ----------------------------------------------------
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({ name: cat.name });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '' });
    }
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    const trimmedName = categoryForm.name.trim();
    if (editingCategory) {
      const updatedCat: Category = {
        ...editingCategory,
        name: trimmedName,
        slug: trimmedName.toLowerCase().replace(/\s+/g, '-')
      };
      const updatedCats = await saveCategory(updatedCat, false);
      setCategories(updatedCats);
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: trimmedName,
        slug: trimmedName.toLowerCase().replace(/\s+/g, '-')
      };
      const updatedCats = await saveCategory(newCat, true);
      setCategories(updatedCats);
    }

    setSyncFeedback('Category successfully saved and synced with website.');
    setTimeout(() => setSyncFeedback(null), 3000);
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (id: string, name?: string) => {
    const cat = categories.find(c => c.id === id);
    setDeleteTarget({
      type: 'category',
      id,
      name: name || cat?.name || 'this category'
    });
  };

  const handleDeleteInquiry = (id: string, name?: string) => {
    setDeleteTarget({
      type: 'inquiry',
      id,
      name: name || 'this inquiry'
    });
  };

  // ----------------------------------------------------
  // PRODUCT ACTIONS
  // ----------------------------------------------------
  const handleOpenProductModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        name: prod.name,
        category: prod.category,
        subcategory: prod.subcategory || 'General Supply',
        measurement: prod.measurement,
        loadingCost: prod.loadingCost,
        moq: prod.moq,
        hsn: prod.hsn || '72149990',
        description: prod.description,
        image: prod.image || '/products/prod_tmt.jpg',
        isActive: prod.isActive,
        sizes: prod.sizes ? [...prod.sizes] : []
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category: categories[0]?.slug || 'steel',
        subcategory: 'General Supply',
        measurement: 'ton',
        loadingCost: 350,
        moq: 5,
        hsn: '72149990',
        description: '',
        image: '/products/prod_tmt.jpg',
        isActive: true,
        sizes: []
      });
    }
    setNewSizeInput('');
    setIsProductModalOpen(true);
  };

  const handleAddProductSize = (customSize?: string) => {
    const raw = (customSize !== undefined ? customSize : newSizeInput).trim();
    if (!raw) return;
    if (!productForm.sizes.includes(raw)) {
      setProductForm(prev => ({
        ...prev,
        sizes: [...prev.sizes, raw]
      }));
    }
    setNewSizeInput('');
  };

  const handleRemoveProductSize = (sizeToRemove: string) => {
    setProductForm(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== sizeToRemove)
    }));
  };

  const handleAddSizePresets = (presetSizes: string[]) => {
    setProductForm(prev => {
      const merged = [...prev.sizes];
      presetSizes.forEach(s => {
        if (!merged.includes(s)) merged.push(s);
      });
      return { ...prev, sizes: merged };
    });
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    // Immediately close modal so admin is never stuck
    setIsProductModalOpen(false);

    if (editingProduct) {
      const updatedProd: Product = {
        ...editingProduct,
        name: productForm.name.trim(),
        category: productForm.category,
        subcategory: productForm.subcategory.trim() || 'General Supply',
        measurement: productForm.measurement,
        loadingCost: Number(productForm.loadingCost) || 0,
        moq: Number(productForm.moq) || 1,
        hsn: productForm.hsn.trim() || '72149990',
        description: productForm.description.trim(),
        image: productForm.image,
        isActive: productForm.isActive,
        sizes: productForm.sizes || []
      };
      setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
      setSyncFeedback(`Material "${updatedProd.name}" updated successfully.`);
      const updatedList = await saveProduct(updatedProd, false);
      setProducts(updatedList);

      // Automatically sync metadata with linked inventory items in local storage and Supabase cloud
      const currentInv = getInventoryItems();
      let hasInvChange = false;
      const syncedInv = currentInv.map(inv => {
        if (inv.productId === updatedProd.id || inv.productName.toLowerCase() === editingProduct.name.toLowerCase()) {
          hasInvChange = true;
          const updatedInv = {
            ...inv,
            productId: updatedProd.id,
            productName: updatedProd.name,
            category: updatedProd.category,
            subcategory: updatedProd.subcategory,
            unit: mapProductMeasurementToUnit(updatedProd.measurement),
            hsn: updatedProd.hsn || inv.hsn,
            lastUpdated: new Date().toISOString()
          };
          // Push update to Supabase cloud table
          supabase
            .from('inventory_items')
            .update({
              productId: updatedInv.productId,
              productName: updatedInv.productName,
              category: updatedInv.category,
              subcategory: updatedInv.subcategory,
              unit: updatedInv.unit,
              hsn: updatedInv.hsn,
              lastUpdated: updatedInv.lastUpdated
            })
            .eq('id', inv.id)
            .then();

          return updatedInv;
        }
        return inv;
      });
      if (hasInvChange) {
        saveInventoryItems(syncedInv);
        setInventoryItems(syncedInv);
      }
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: productForm.name.trim(),
        category: productForm.category || categories[0]?.slug || 'steel',
        subcategory: productForm.subcategory.trim() || 'General Supply',
        description: productForm.description.trim(),
        specs: ['Standard Industrial Grade', 'Manufactured to IS Standards'],
        measurement: productForm.measurement,
        loadingCost: Number(productForm.loadingCost) || 0,
        moq: Number(productForm.moq) || 1,
        hsn: productForm.hsn.trim() || '72149990',
        image: productForm.image || '/products/prod_tmt.jpg',
        isActive: productForm.isActive,
        sizes: productForm.sizes || []
      };
      setProducts(prev => [newProd, ...prev]);
      setSyncFeedback(`Material "${newProd.name}" added to catalog and public website.`);
      const updatedList = await saveProduct(newProd, true);
      setProducts(updatedList);
    }

    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const handleToggleProductStatus = async (id: string) => {
    const target = products.find(p => p.id === id);
    if (!target) return;
    const updatedList = await toggleProductActive(id, !target.isActive);
    setProducts(updatedList);
    setSyncFeedback(`Material status changed to ${!target.isActive ? 'Active (Visible on website)' : 'Hidden'}.`);
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleDeleteProduct = (id: string, name?: string) => {
    const prod = products.find(p => p.id === id);
    setDeleteTarget({
      type: 'product',
      id,
      name: name || prod?.name || 'this material'
    });
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.subcategory?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.description?.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory =
      productCategoryFilter === 'all' ? true : p.category === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtered Inventory Items
  const filteredInventoryItems = inventoryItems.filter(item => {
    const matchesSearch =
      item.productName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      (item.subcategory && item.subcategory.toLowerCase().includes(inventorySearch.toLowerCase())) ||
      (item.hsn && item.hsn.toLowerCase().includes(inventorySearch.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(inventorySearch.toLowerCase()));

    const matchesCategory = inventoryCategoryFilter === 'all' || item.category === inventoryCategoryFilter;
    const matchesLocation = inventoryLocationFilter === 'all' || item.location === inventoryLocationFilter;

    let matchesStatus = true;
    if (inventoryStatusFilter === 'in_stock') {
      matchesStatus = item.currentStock > item.minStockLevel;
    } else if (inventoryStatusFilter === 'low_stock') {
      matchesStatus = item.currentStock > 0 && item.currentStock <= item.minStockLevel;
    } else if (inventoryStatusFilter === 'out_of_stock') {
      matchesStatus = item.currentStock === 0;
    }

    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  });

  // Filtered Inventory Ledger Transactions
  const filteredInventoryTransactions = inventoryTransactions.filter(tx => {
    const matchesSearch =
      tx.productName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      tx.partyName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      tx.referenceNo.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(inventorySearch.toLowerCase()));
    return matchesSearch;
  });

  // Filtered Inventory Partial Orders (Pending & Complete Installments)
  const filteredInventoryPartialOrders = inventoryPartialOrders.filter(order => {
    const matchesSearch =
      order.productName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      order.partyName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      order.referenceNo.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      (order.notes && order.notes.toLowerCase().includes(inventorySearch.toLowerCase()));

    const matchesType = inventoryOrderTypeFilter === 'all' || order.type === inventoryOrderTypeFilter;
    const matchesStatus = inventoryOrderStatusFilter === 'all' || order.status === inventoryOrderStatusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Filtered Contact Queries
  const filteredContactQueries = inquiries.filter(inq => {
    if (inq.type !== 'contact') return false;
    const matchesSearch =
      inq.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      inq.company?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      inq.phone?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      inq.email?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      inq.requirement?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      inq.message?.toLowerCase().includes(contactSearch.toLowerCase());
    const matchesSubject =
      contactSubjectFilter === 'all' ? true : inq.requirement === contactSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  // Filtered Material Inquiries (Unified multi-item & single requirements)
  const filteredInquiries = inquiries.filter(inq => {
    if (inq.type === 'contact') return false;
    const query = inquirySearch.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      inq.name.toLowerCase().includes(query) ||
      (inq.company && inq.company.toLowerCase().includes(query)) ||
      (inq.phone && inq.phone.includes(query)) ||
      (inq.email && inq.email.toLowerCase().includes(query)) ||
      (inq.gst && inq.gst.toLowerCase().includes(query)) ||
      (inq.requirement && inq.requirement.toLowerCase().includes(query)) ||
      (inq.items && inq.items.some(it =>
        it.name.toLowerCase().includes(query) ||
        (it.size && it.size.toLowerCase().includes(query))
      ));

    let matchesCategory = true;
    if (inquiryCategoryFilter === 'all') {
      matchesCategory = true;
    } else if (inquiryCategoryFilter === '__custom__') {
      matchesCategory = Boolean(
        inq.hasCustomItems ||
        (inq.items && inq.items.some(it => it.isCustom || (typeof it.name === 'string' && it.name.toLowerCase().includes('[custom]')) || it.category === 'Custom Sourcing')) ||
        (inq.requirement && (inq.requirement.includes('[Custom]') || inq.requirement.includes('[Custom/Other]'))) ||
        inq.category === 'Custom Sourcing' || inq.category === 'Custom Multi-Product Sourcing'
      );
    } else {
      matchesCategory = Boolean(
        (inq.category && inq.category.toLowerCase() === inquiryCategoryFilter.toLowerCase()) ||
        (inq.items && inq.items.some(it => {
          const prod = products.find(p => p.name.toLowerCase() === it.name.toLowerCase());
          return prod?.category.toLowerCase() === inquiryCategoryFilter.toLowerCase();
        }))
      );
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="admin-page">
        {/* 1. Header Navigation Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="admin-brand-logo">
              <img src="/logo/logo-icon.png" alt="Dahej Support" className="admin-header-logo-icon" />
              <span className="admin-brand-title-full">Dahej Support Admin Control Room</span>
              <span className="admin-brand-title-short">Dahej Support Admin</span>
            </div>
          </div>
          <div className="admin-profile-snippet">
            <button
              onClick={() => loadAllData(true)}
              className="btn btn-secondary btn-sm admin-sync-btn"
              disabled={isSyncing}
              title="Synchronize database & catalog cache"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span className="admin-btn-text">{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>
            <span className="profile-role">Secure B2B Session</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm logout-btn">
              <LogOut size={14} /> <span className="admin-btn-text">Log Out</span>
            </button>
          </div>
        </header>

        {/* Global Feedback Banner */}
        {syncFeedback && (
          <div
            style={{
              backgroundColor: '#e6fffa',
              color: '#047857',
              padding: '10px 24px',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderBottom: '1px solid #a7f3d0'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* 2. Sidebar Workspace Layout */}
        <div className="admin-workspace">
          {/* Mobile drawer backdrop */}
          <div
            className={`admin-sidebar-backdrop ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Left Navigation Sidebar */}
          <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <div className="admin-sidebar-mobile-header">
              <div className="admin-brand-logo">
                <img src="/logo/logo-icon.png" alt="Dahej Support" className="admin-header-logo-icon" />
                <span>Admin Navigation</span>
              </div>
              <button
                type="button"
                className="admin-sidebar-close-btn"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="sidebar-nav">
              <button
                className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              >
                <LayoutDashboard size={18} /> Dashboard Overview
              </button>
              <button
                className={`sidebar-link ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }}
              >
                <Boxes size={18} /> Inventory Management
                {inventoryItems.length > 0 && <span className="sidebar-count-badge">{inventoryItems.length}</span>}
              </button>
              <button
                className={`sidebar-link ${activeTab === 'contact_queries' ? 'active' : ''}`}
                onClick={() => { setActiveTab('contact_queries'); setIsMobileMenuOpen(false); }}
              >
                <MessageSquare size={18} /> Contact Page Queries
                {inquiries.filter(i => i.type === 'contact').length > 0 && (
                  <span className="sidebar-count-badge">
                    {inquiries.filter(i => i.type === 'contact').length}
                  </span>
                )}
              </button>
              <button
                className={`sidebar-link ${activeTab === 'inquiries' ? 'active' : ''}`}
                onClick={() => { setActiveTab('inquiries'); setIsMobileMenuOpen(false); }}
              >
                <Mail size={18} /> Inbound Inquiries (RFQ)
                {inquiries.filter(i => i.type !== 'contact').length > 0 && (
                  <span className="sidebar-count-badge">
                    {inquiries.filter(i => i.type !== 'contact').length}
                  </span>
                )}
              </button>
              <button
                className={`sidebar-link ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => { setActiveTab('products'); setIsMobileMenuOpen(false); }}
              >
                <Package size={18} /> Products Manager
                {products.length > 0 && <span className="sidebar-count-badge">{products.length}</span>}
              </button>
              <button
                className={`sidebar-link ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => { setActiveTab('categories'); setIsMobileMenuOpen(false); }}
              >
                <Layers3 size={18} /> Categories Manager
                {categories.length > 0 && <span className="sidebar-count-badge">{categories.length}</span>}
              </button>
              <button
                className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
              >
                <User size={18} /> Administrator Profile
              </button>
            </nav>

            <div className="sidebar-footer-brand">
              <p className="brand-copy">&copy; Dahej Support B2B Panel</p>
              <span className="v-label">v2.4 Proforma GST Enabled</span>
            </div>
          </aside>

          {/* Right Active Work Content Pane */}
          <main className="admin-content-pane">
            {/* A. DASHBOARD TAB VIEW */}
            {activeTab === 'dashboard' && (
              <div className="view-container">
                <div className="view-title-block">
                  <h2>Control Room Statistics</h2>
                  <p>Overview of material catalog, yard inventory, inquiries, and B2B requirements.</p>
                </div>

                <section className="stats-summary-grid">
                  <div
                    className="admin-stat-card clickable-stat-card"
                    onClick={() => setActiveTab('inventory')}
                    style={{ cursor: 'pointer' }}
                    title="Click to manage Live Yard Inventory"
                  >
                    <span className="stat-label">Live Yard Inventory</span>
                    <strong className="stat-number">
                      {inventoryItems.length} Materials
                    </strong>
                    <span className="stat-sub">
                      {inventoryItems.filter(i => i.currentStock <= i.minStockLevel).length > 0
                        ? `${inventoryItems.filter(i => i.currentStock <= i.minStockLevel).length} low stock alerts`
                        : 'All stocks safely above threshold →'}
                    </span>
                  </div>

                  <div
                    className="admin-stat-card clickable-stat-card"
                    onClick={() => setActiveTab('contact_queries')}
                    style={{ cursor: 'pointer' }}
                    title="Click to view Contact Page messages"
                  >
                    <span className="stat-label">Contact Page Queries</span>
                    <strong className="stat-number">
                      {inquiries.filter(i => i.type === 'contact').length}
                    </strong>
                    <span className="stat-sub">Website contact form messages →</span>
                  </div>

                  <div className="admin-stat-card">
                    <span className="stat-label">Total Inbound Inquiries</span>
                    <strong className="stat-number">{inquiries.length}</strong>
                    <span className="stat-sub">Active client sourcing queries</span>
                  </div>

                  <div className="admin-stat-card">
                    <span className="stat-label">Standard Product Queries</span>
                    <strong className="stat-number">
                      {inquiries.filter(i => i.type === 'single').length}
                    </strong>
                    <span className="stat-sub">Direct material quote requests</span>
                  </div>

                  <div className="admin-stat-card">
                    <span className="stat-label">Bulk Sourcing Sheets</span>
                    <strong className="stat-number">
                      {inquiries.filter(i => i.type === 'bulk').length}
                    </strong>
                    <span className="stat-sub">Multi-item procurement lists</span>
                  </div>

                  <div className="admin-stat-card">
                    <span className="stat-label">Live Catalog Materials</span>
                    <strong className="stat-number">{products.filter(p => p.isActive).length}</strong>
                    <span className="stat-sub">Available & visible on website</span>
                  </div>
                </section>

                {/* Quick Action Banner */}
                <div className="quick-action-banner" style={{ marginTop: '24px', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1.5px solid var(--border-admin)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: 'var(--brand-navy)' }}>
                      Need to create an Instant Proforma Invoice (PDF)?
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-admin-secondary)', fontSize: '0.9rem' }}>
                      Calculate materials, loading charges, CGST/SGST, and download the exact company-branded Proforma Invoice PDF on demand.
                    </p>
                  </div>
                  <button onClick={handleOpenNewProforma} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> + New Proforma Invoice
                  </button>
                </div>
              </div>
            )}

            {/* B. INVENTORY MANAGEMENT TAB VIEW */}
            {activeTab === 'inventory' && (
              <div className="view-container inventory-container">
                <div className="view-title-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2>Live Material Inventory & Yard Stock</h2>
                    <p>
                      <strong>Private Admin Cockpit</strong> · Real-time yard stock balances, material receipts (<span style={{ color: '#16a34a', fontWeight: 700 }}>Maal Aana</span>), customer dispatches (<span style={{ color: '#00286a', fontWeight: 700 }}>Maal Nikalna</span>), and partial order pipeline tracking.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="inventory-view-switcher">
                      <button
                        className={`inventory-view-tab ${inventoryViewMode === 'stocks' ? 'active' : ''}`}
                        onClick={() => setInventoryViewMode('stocks')}
                      >
                        <Boxes size={15} /> Current Stocks ({inventoryItems.length})
                      </button>
                      <button
                        className={`inventory-view-tab ${inventoryViewMode === 'orders' ? 'active' : ''}`}
                        onClick={() => setInventoryViewMode('orders')}
                        style={{ position: 'relative' }}
                      >
                        <Clock size={15} /> Pending Orders ({inventoryPartialOrders.filter(o => o.status === 'PENDING').length})
                        {inventoryPartialOrders.filter(o => o.status === 'PENDING').length > 0 && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#f59e0b',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginLeft: '4px'
                          }} />
                        )}
                      </button>
                      <button
                        className={`inventory-view-tab ${inventoryViewMode === 'ledger' ? 'active' : ''}`}
                        onClick={() => setInventoryViewMode('ledger')}
                      >
                        <History size={15} /> Movement Ledger ({inventoryTransactions.length})
                      </button>
                    </div>
                    <button
                      onClick={() => handleOpenAddInventoryItem()}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #00286a 0%, #0369a1 100%)' }}
                    >
                      <Plus size={16} /> + Add Material to Track
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Summary Strip */}
                <div className="inventory-kpi-grid">
                  <div className="inventory-kpi-card">
                    <span className="inventory-kpi-label">Tracked Materials</span>
                    <strong className="inventory-kpi-value">{inventoryItems.length}</strong>
                    <span className="inventory-kpi-sub">Distinct steel & building items</span>
                  </div>

                  <div className="inventory-kpi-card">
                    <span className="inventory-kpi-label">Total Stock in MT</span>
                    <strong className="inventory-kpi-value">
                      {formatIndianNumber(
                        inventoryItems.filter(i => i.unit === 'MT' || i.unit.toLowerCase() === 'ton').reduce((acc, curr) => acc + curr.currentStock, 0),
                        1
                      )} <span style={{ fontSize: '1rem', fontWeight: 600 }}>MT</span>
                    </strong>
                    <span className="inventory-kpi-sub">TMT bars, plates & beams balance</span>
                  </div>

                  <div className="inventory-kpi-card">
                    <span className="inventory-kpi-label">Pending Inward Pipeline</span>
                    <strong className="inventory-kpi-value">
                      {inventoryPartialOrders.filter(o => o.status === 'PENDING' && o.type === 'IN').length} Orders
                    </strong>
                    <span className="inventory-kpi-sub">
                      {inventoryPartialOrders.filter(o => o.status === 'PENDING' && o.type === 'IN').reduce((acc, o) => acc + (o.unit === 'MT' ? o.pendingQty : 0), 0) > 0
                        ? `+${inventoryPartialOrders.filter(o => o.status === 'PENDING' && o.type === 'IN').reduce((acc, o) => acc + (o.unit === 'MT' ? o.pendingQty : 0), 0)} MT expected`
                        : 'Active supplier partial deliveries'}
                    </span>
                  </div>

                  <div
                    className="inventory-kpi-card"
                    style={{
                      borderColor: inventoryItems.some(i => i.currentStock <= i.minStockLevel) ? '#fcd34d' : 'var(--border-admin)',
                      backgroundColor: inventoryItems.some(i => i.currentStock <= i.minStockLevel) ? '#fffdf7' : '#ffffff',
                      cursor: 'pointer'
                    }}
                    onClick={() => setInventoryStatusFilter(prev => prev === 'low_stock' ? 'all' : 'low_stock')}
                    title="Click to filter low stock items"
                  >
                    <span className="inventory-kpi-label">
                      Low Stock Alerts
                    </span>
                    <strong className="inventory-kpi-value">
                      {inventoryItems.filter(i => i.currentStock <= i.minStockLevel).length}
                    </strong>
                    <span className="inventory-kpi-sub">
                      {inventoryItems.filter(i => i.currentStock <= i.minStockLevel).length > 0 ? 'Click to filter reorder items' : 'All stocks above safe threshold'}
                    </span>
                  </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#ffffff', padding: '14px 18px', borderRadius: '12px', border: '1.5px solid var(--border-admin)' }}>
                  <div className="admin-search-box" style={{ flex: 1, minWidth: '240px' }}>
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search material by name, party, PO/Challan, subcategory or location..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      className="admin-search-input"
                    />
                    {inventorySearch && (
                      <button onClick={() => setInventorySearch('')} className="search-clear-btn">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {inventoryViewMode === 'stocks' && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div className="contact-filter-group" style={{ margin: 0 }}>
                        <label className="contact-filter-label" style={{ fontSize: '0.8rem' }}>Category:</label>
                        <select
                          value={inventoryCategoryFilter}
                          onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                          className="admin-select-input"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                          <option value="all">All Categories</option>
                          <option value="steel">Steel Products</option>
                          <option value="building">Building Materials</option>
                          <option value="industrial">Industrial Materials</option>
                        </select>
                      </div>

                      <div className="contact-filter-group" style={{ margin: 0 }}>
                        <label className="contact-filter-label" style={{ fontSize: '0.8rem' }}>Stock Status:</label>
                        <select
                          value={inventoryStatusFilter}
                          onChange={(e) => setInventoryStatusFilter(e.target.value as any)}
                          className="admin-select-input"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                          <option value="all">All Stock Statuses</option>
                          <option value="in_stock">In Stock (Safe)</option>
                          <option value="low_stock">Low Stock Alert</option>
                          <option value="out_of_stock">Out of Stock</option>
                        </select>
                      </div>

                      <div className="contact-filter-group" style={{ margin: 0 }}>
                        <label className="contact-filter-label" style={{ fontSize: '0.8rem' }}>Location:</label>
                        <select
                          value={inventoryLocationFilter}
                          onChange={(e) => setInventoryLocationFilter(e.target.value)}
                          className="admin-select-input"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                          <option value="all">All Yards & Godowns</option>
                          {DEFAULT_LOCATIONS.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {inventoryViewMode === 'orders' && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div className="contact-filter-group" style={{ margin: 0 }}>
                        <label className="contact-filter-label" style={{ fontSize: '0.8rem' }}>Direction:</label>
                        <select
                          value={inventoryOrderTypeFilter}
                          onChange={(e) => setInventoryOrderTypeFilter(e.target.value as any)}
                          className="admin-select-input"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                          <option value="all">All Orders (IN & OUT)</option>
                          <option value="IN">Inward Receipts (+ IN)</option>
                          <option value="OUT">Outward Dispatches (- OUT)</option>
                        </select>
                      </div>

                      <div className="contact-filter-group" style={{ margin: 0 }}>
                        <label className="contact-filter-label" style={{ fontSize: '0.8rem' }}>Status:</label>
                        <select
                          value={inventoryOrderStatusFilter}
                          onChange={(e) => setInventoryOrderStatusFilter(e.target.value as any)}
                          className="admin-select-input"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                          <option value="PENDING">Active Pending (Open)</option>
                          <option value="COMPLETED">Fully Completed</option>
                          <option value="all">All Statuses</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* VIEW MODE 1: CURRENT STOCKS CARDS */}
                {inventoryViewMode === 'stocks' && (
                  <>
                    {filteredInventoryItems.length === 0 ? (
                      <div className="empty-state-card" style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1.5px dashed var(--border-admin)' }}>
                        <Boxes size={48} style={{ color: 'var(--text-admin-muted)', margin: '0 auto 12px auto' }} />
                        <h3 style={{ margin: '0 0 6px 0', color: 'var(--brand-navy)' }}>No Inventory Materials Match</h3>
                        <p style={{ margin: '0 0 16px 0', color: 'var(--text-admin-secondary)', fontSize: '0.9rem' }}>
                          Try clearing search filters or add a new material to start tracking.
                        </p>
                        <button
                          onClick={() => handleOpenAddInventoryItem()}
                          className="btn btn-primary btn-sm"
                        >
                          <Plus size={14} /> + Add Material to Track
                        </button>
                      </div>
                    ) : (
                      <div className="inventory-items-grid">
                        {filteredInventoryItems.map((item) => {
                          const isLowStock = item.currentStock > 0 && item.currentStock <= item.minStockLevel;
                          const isOutOfStock = item.currentStock === 0;
                          const pendingSummary = getPendingStockSummary(item.id);

                          return (
                            <div
                              key={item.id}
                              className={`inventory-card animate-fade-in ${isLowStock ? 'is-low-stock' : isOutOfStock ? 'is-out-of-stock' : ''}`}
                            >
                              <div>
                                {/* Card Top Badges & Actions */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(0, 40, 106, 0.08)', color: 'var(--brand-navy)' }}>
                                      {item.subcategory || item.category}
                                    </span>
                                    {item.hsn && (
                                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                                        HSN: {item.hsn}
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddInventoryItem(item)}
                                      className="btn btn-secondary btn-xs"
                                      title="Edit material details / min alert level"
                                      style={{ padding: '4px 6px' }}
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteInventoryItemClick(item)}
                                      className="btn btn-secondary btn-xs"
                                      title="Remove from inventory tracking"
                                      style={{ padding: '4px 6px', color: '#dc2626' }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>

                                {/* Material Title */}
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--brand-navy)', lineHeight: 1.35 }}>
                                  {item.productName}
                                </h3>

                                <div style={{ fontSize: '0.78rem', color: 'var(--text-admin-secondary)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '14px' }}>
                                  <Warehouse size={13} style={{ color: '#0284c7' }} />
                                  <span>{item.location}</span>
                                </div>

                                {/* Current Stock Display Box */}
                                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', marginBottom: '6px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                                      Live Yard Stock
                                    </span>
                                    {isOutOfStock ? (
                                      <span className="stock-badge stock-badge-out">
                                        <span className="status-indicator-dot dot-red" /> Out of Stock
                                      </span>
                                    ) : isLowStock ? (
                                      <span className="stock-badge stock-badge-low">
                                        <span className="status-indicator-dot dot-red" /> Low Stock
                                      </span>
                                    ) : (
                                      <span className="stock-badge stock-badge-safe">
                                        <span className="status-indicator-dot dot-green" /> In Stock (Safe)
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : 'var(--brand-navy)', fontFamily: 'var(--font-headings)' }}>
                                      {formatIndianNumber(item.currentStock, item.unit === 'MT' ? 2 : 0)}
                                    </span>
                                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-admin-secondary)' }}>
                                      {item.unit}
                                    </span>
                                    {pendingSummary.pendingIn > 0 && (
                                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#16a34a', marginLeft: '4px' }} title={`+${pendingSummary.pendingIn} ${item.unit} incoming from pending orders`}>
                                        (+{formatIndianNumber(pendingSummary.pendingIn, item.unit === 'MT' ? 2 : 0)})
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Min Alert Threshold: <strong>{item.minStockLevel} {item.unit}</strong></span>
                                  </div>

                                  {/* Pending Inward Pipeline Pill */}
                                  {pendingSummary.pendingIn > 0 && (
                                    <div className="pending-stock-pill-in">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={12} />
                                        <span>+{formatIndianNumber(pendingSummary.pendingIn, item.unit === 'MT' ? 2 : 0)} {item.unit} Pending Inward</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const openOrders = getPendingOrdersForItem(item.id, 'IN');
                                          if (openOrders.length > 0) handleOpenFulfillOrder(openOrders[0]);
                                          else handleOpenStockMovement(item, 'IN');
                                        }}
                                        className="btn-quick-fulfill"
                                        title="Receive next batch from open purchase order"
                                      >
                                        Receive ({pendingSummary.activeInOrdersCount})
                                      </button>
                                    </div>
                                  )}

                                  {/* Pending Outward Dispatch Pill */}
                                  {pendingSummary.pendingOut > 0 && (
                                    <div className="pending-stock-pill-out">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Truck size={12} />
                                        <span>-{formatIndianNumber(pendingSummary.pendingOut, item.unit === 'MT' ? 2 : 0)} {item.unit} Pending Dispatch</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const openOrders = getPendingOrdersForItem(item.id, 'OUT');
                                          if (openOrders.length > 0) handleOpenFulfillOrder(openOrders[0]);
                                          else handleOpenStockMovement(item, 'OUT');
                                        }}
                                        className="btn-quick-fulfill"
                                        title="Dispatch next batch for open sales order"
                                      >
                                        Dispatch ({pendingSummary.activeOutOrdersCount})
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* THE 2 ACTIONS: MAAL AANA (STOCK IN) & MAAL NIKALNA (STOCK OUT) */}
                              <div className="inventory-actions-row">
                                <button
                                  type="button"
                                  onClick={() => handleOpenStockMovement(item, 'IN')}
                                  className="btn-stock-in"
                                  title="Maal Aa Raha Hai (Record Inward Receipt / Partial Inward)"
                                >
                                  <ArrowDownLeft size={16} />
                                  <span>+ Maal Aaya (IN)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenStockMovement(item, 'OUT')}
                                  className="btn-stock-out"
                                  disabled={isOutOfStock}
                                  style={{ opacity: isOutOfStock ? 0.5 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                                  title={isOutOfStock ? 'No stock available to dispatch' : 'Maal Nikal Raha Hai (Record Outward Dispatch / Partial Dispatch)'}
                                >
                                  <ArrowUpRight size={16} />
                                  <span>- Maal Nikla (OUT)</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* VIEW MODE 2: PENDING PARTIAL ORDERS (OPEN SHIPMENTS) */}
                {inventoryViewMode === 'orders' && (
                  <div>
                    {filteredInventoryPartialOrders.length === 0 ? (
                      <div className="empty-state-card" style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1.5px dashed var(--border-admin)' }}>
                        <Clock size={48} style={{ color: 'var(--text-admin-muted)', margin: '0 auto 12px auto' }} />
                        <h3 style={{ margin: '0 0 6px 0', color: 'var(--brand-navy)' }}>No Orders Match this Filter</h3>
                        <p style={{ margin: '0 0 16px 0', color: 'var(--text-admin-secondary)', fontSize: '0.9rem' }}>
                          Whenever you record a partial receipt (+ Maal Aaya) or partial dispatch (- Maal Nikla), open orders will be automatically tracked here until 100% completed.
                        </p>
                      </div>
                    ) : (
                      <div className="partial-orders-grid">
                        {filteredInventoryPartialOrders.map(order => {
                          const percentage = Math.min(100, Math.round((order.fulfilledQty / order.totalExpectedQty) * 100));
                          const isIn = order.type === 'IN';

                          return (
                            <div
                              key={order.id}
                              className={`partial-order-card animate-fade-in ${isIn ? 'is-inward' : 'is-outward'}`}
                            >
                              <div>
                                {/* Order Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.74rem',
                                      fontWeight: 800,
                                      backgroundColor: isIn ? '#dcfce7' : '#e0f2fe',
                                      color: isIn ? '#166534' : '#0369a1'
                                    }}>
                                      {isIn ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                      {isIn ? 'INWARD RECEIPT' : 'OUTWARD DISPATCH'}
                                    </span>
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      backgroundColor: order.status === 'COMPLETED' ? '#f0fdf4' : '#fffdf0',
                                      color: order.status === 'COMPLETED' ? '#15803d' : '#b45309',
                                      border: `1px solid ${order.status === 'COMPLETED' ? '#bbf7d0' : '#fde68a'}`
                                    }}>
                                      <span className={`status-indicator-dot ${order.status === 'COMPLETED' ? 'dot-green' : 'dot-yellow'}`} />
                                      {order.status === 'COMPLETED' ? 'Completed' : `${percentage}% Fulfilled (Pending)`}
                                    </span>
                                  </div>

                                  {order.status === 'PENDING' && (
                                    <button
                                      type="button"
                                      onClick={() => handleCancelOrder(order.id, order.referenceNo)}
                                      className="btn btn-secondary btn-xs"
                                      title="Close / Cancel remaining pending balance"
                                      style={{ padding: '2px 6px', fontSize: '0.7rem', color: '#64748b' }}
                                    >
                                      Close
                                    </button>
                                  )}
                                </div>

                                {/* Order Reference & Material */}
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--brand-navy)', marginBottom: '4px' }}>
                                  {order.productName}
                                </div>

                                <div style={{ fontSize: '0.85rem', color: '#1e293b', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{isIn ? 'Supplier / Mill:' : 'Customer / Site:'} <strong>{order.partyName}</strong></span>
                                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Ref: <code>{order.referenceNo}</code></span>
                                </div>

                                {/* Progress Bar */}
                                <div className="partial-progress-wrap">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                                    <span style={{ color: isIn ? '#16a34a' : '#0284c7' }}>
                                      {isIn ? 'Received' : 'Dispatched'}: {order.fulfilledQty} {order.unit}
                                    </span>
                                    <span style={{ color: '#64748b' }}>
                                      Total Order: {order.totalExpectedQty} {order.unit}
                                    </span>
                                  </div>
                                  <div className="partial-progress-track">
                                    <div
                                      className={`partial-progress-fill ${isIn ? 'fill-in' : 'fill-out'}`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Pending Highlight Box */}
                                {order.status === 'PENDING' ? (
                                  <div style={{
                                    backgroundColor: isIn ? '#f0fdf4' : '#f0f9ff',
                                    border: `1px solid ${isIn ? '#bbf7d0' : '#bae6fd'}`,
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    marginTop: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div>
                                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                                        Remaining to {isIn ? 'Arrive' : 'Dispatch'}:
                                      </div>
                                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isIn ? '#15803d' : '#0369a1' }}>
                                        {formatIndianNumber(order.pendingQty, order.unit === 'MT' ? 2 : 0)} <span style={{ fontSize: '0.85rem' }}>{order.unit}</span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenFulfillOrder(order)}
                                      className="btn btn-primary btn-sm"
                                      style={{
                                        backgroundColor: isIn ? '#16a34a' : '#00286a',
                                        borderColor: isIn ? '#16a34a' : '#00286a',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}
                                    >
                                      {isIn ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                      {isIn ? '+ Receive Batch' : '- Dispatch Batch'}
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#15803d', fontWeight: 700, marginTop: '8px' }}>
                                    <span className="status-indicator-dot dot-green" />
                                    <span>Order 100% completed across {order.installments.length} deliveries.</span>
                                  </div>
                                )}

                                {/* Installment history log snippet */}
                                {order.installments && order.installments.length > 0 && (
                                  <div style={{ marginTop: '12px', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                                    <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
                                      Delivery Batches ({order.installments.length}):
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {order.installments.map((inst, idx) => (
                                        <div key={inst.id || idx} style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '4px 8px', borderRadius: '4px' }}>
                                          <span>Batch {idx + 1}: <strong>{inst.quantity} {order.unit}</strong> ({inst.vehicleOrChallanNo})</span>
                                          <span style={{ color: '#64748b', fontSize: '0.72rem' }}>{inst.date.split(',')[0]}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '12px', textAlign: 'right' }}>
                                Created: {order.createdDate}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW MODE 3: AUDIT MOVEMENT LEDGER */}
                {inventoryViewMode === 'ledger' && (
                  <div className="ledger-table-container">
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 2px 0', fontSize: '1.05rem', color: 'var(--brand-navy)' }}>
                          Stock Inward & Outward Audit Ledger
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-admin-secondary)' }}>
                          Every stock entry and dispatch transaction is permanently logged with timestamp, vehicle/party reference and order status.
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-navy)', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '6px' }}>
                          Showing {filteredInventoryTransactions.length} Transactions
                        </span>
                        <button
                          type="button"
                          onClick={handleExportInventoryLedger}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, borderColor: '#cbd5e1' }}
                          title="Export all stock movement records to Excel (CSV format)"
                        >
                          <Download size={14} /> Export to Excel (CSV)
                        </button>
                      </div>
                    </div>

                    {filteredInventoryTransactions.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-admin-muted)' }}>
                        No stock movement logs found for this search criteria.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="ledger-table">
                          <thead>
                            <tr>
                              <th>Date & Time</th>
                              <th>Action Type</th>
                              <th>Material Name</th>
                              <th>Quantity</th>
                              <th>Stock Change</th>
                              <th>Party / Supplier / Customer</th>
                              <th>Ref / Vehicle No</th>
                              <th>Delivery Mode</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredInventoryTransactions.map(tx => (
                              <tr key={tx.id}>
                                <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: '#64748b' }}>
                                  {tx.date}
                                </td>
                                <td>
                                  {tx.type === 'IN' ? (
                                    <span className="movement-tag-in">
                                      <ArrowDownLeft size={12} /> INWARD
                                    </span>
                                  ) : (
                                    <span className="movement-tag-out">
                                      <ArrowUpRight size={12} /> DISPATCH
                                    </span>
                                  )}
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>
                                  {tx.productName}
                                </td>
                                <td style={{ fontWeight: 800, color: tx.type === 'IN' ? '#15803d' : '#b91c1c' }}>
                                  {tx.type === 'IN' ? `+${formatIndianNumber(tx.quantity, tx.unit === 'MT' ? 2 : 0)}` : `-${formatIndianNumber(tx.quantity, tx.unit === 'MT' ? 2 : 0)}`} {tx.unit}
                                </td>
                                <td style={{ fontSize: '0.82rem', color: '#475569', whiteSpace: 'nowrap' }}>
                                  {formatIndianNumber(tx.previousStock, 0)} ➔ <strong style={{ color: '#00286a' }}>{formatIndianNumber(tx.newStock, 0)} {tx.unit}</strong>
                                </td>
                                <td style={{ fontWeight: 600 }}>
                                  {tx.partyName || '—'}
                                </td>
                                <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                  <code>{tx.referenceNo || '—'}</code>
                                </td>
                                <td>
                                  {tx.isPartial ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', fontWeight: 700, backgroundColor: '#fffdf0', color: '#b45309', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', border: '1px solid #fde68a' }}>
                                      <span className="status-indicator-dot dot-yellow" />
                                      <span>Partial ({tx.orderPendingQty && tx.orderPendingQty > 0 ? `${tx.orderPendingQty} ${tx.unit} pending` : 'Installment'})</span>
                                    </span>
                                  ) : (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', fontWeight: 700, backgroundColor: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                                      <span className="status-indicator-dot dot-green" />
                                      <span>Complete</span>
                                    </span>
                                  )}
                                </td>
                                <td style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '200px' }}>
                                  {tx.notes || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* C. CONTACT PAGE QUERIES TAB VIEW */}
            {activeTab === 'contact_queries' && (
              <div className="view-container compact-view">
                <div className="view-title-block" style={{ marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '2px' }}>Contact Page Messages & Inquiries</h2>
                  <p style={{ margin: 0, fontSize: '0.84rem' }}>
                    Direct inquiries and questions submitted through the website's <strong>Get in Touch / Contact Us</strong> page.
                  </p>
                </div>

                {/* Search, Subject Filter, Extract CSV, Sync & Select All Unified Toolbar */}
                <div className="contact-queries-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '4px 0 10px 0', padding: '8px 12px' }}>
                  <div className="admin-search-box" style={{ flex: '1 1 180px', maxWidth: '280px', minWidth: '160px' }}>
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search name, phone, email, query..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="admin-search-input"
                      style={{ padding: '6px 28px 6px 32px', fontSize: '0.82rem', height: '34px' }}
                    />
                    {contactSearch && (
                      <button onClick={() => setContactSearch('')} className="search-clear-btn" style={{ right: '8px' }}>
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <div className="contact-filter-group" style={{ margin: 0, gap: '6px' }}>
                    <label htmlFor="contact-filter-select" className="contact-filter-label" style={{ fontSize: '0.76rem' }}>
                      Filter:
                    </label>
                    <select
                      id="contact-filter-select"
                      value={contactSubjectFilter}
                      onChange={(e) => setContactSubjectFilter(e.target.value)}
                      className="admin-select-input"
                      style={{ padding: '5px 28px 5px 10px', fontSize: '0.8rem', height: '34px', minWidth: '140px' }}
                    >
                      <option value="all">All Subjects ({inquiries.filter(i => i.type === 'contact').length})</option>
                      <option value="Material Price Quotation">Material Price Quotation</option>
                      <option value="GIDC Logistics & Delivery Coordinates">GIDC Logistics & Delivery</option>
                      <option value="Billing & Accounting Support">Billing & Accounting</option>
                      <option value="Test Certificates & MTC Request">Test Certificates / MTC</option>
                      <option value="Other Administrative Questions">Other Queries</option>
                    </select>
                  </div>

                  <button
                    onClick={handleExportAllContactQueries}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 700, padding: '6px 12px', fontSize: '0.8rem', height: '34px' }}
                    title="Extract all Contact page form submissions to CSV / Excel spreadsheet"
                  >
                    <Download size={13} /> Extract CSV
                  </button>

                  <button
                    onClick={() => loadAllData(true)}
                    className="btn btn-secondary btn-sm"
                    disabled={isSyncing}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', fontSize: '0.8rem', height: '34px' }}
                  >
                    <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} /> Sync
                  </button>

                  {/* Batch Action Buttons when items are selected */}
                  {selectedInquiryIds.filter(id => filteredContactQueries.some(q => q.id === id)).length > 0 && (
                    <div className="inq-bulk-right" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="inq-selected-badge" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                        {selectedInquiryIds.filter(id => filteredContactQueries.some(q => q.id === id)).length} Selected
                      </span>
                      <button
                        type="button"
                        onClick={handleExportSelectedContactQueries}
                        className="btn-bulk-export"
                        style={{ padding: '5px 10px', fontSize: '0.78rem', height: '32px' }}
                        title="Export selected contact messages to CSV"
                      >
                        <Download size={12} /> Export Selected
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenBulkDeleteModal('contact messages')}
                        className="btn-bulk-delete"
                        style={{ padding: '5px 10px', fontSize: '0.78rem', height: '32px' }}
                        title="Permanently delete selected messages"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="btn-bulk-clear"
                        style={{ padding: '5px 8px', fontSize: '0.78rem', height: '32px' }}
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Select All Checkbox on the most right */}
                  {filteredContactQueries.length > 0 && (
                    <label className="inq-select-all-inline-btn" style={{ marginLeft: 'auto' }} title="Select all contact messages in this view">
                      <input
                        type="checkbox"
                        className="inq-checkbox-input"
                        checked={
                          filteredContactQueries.length > 0 &&
                          filteredContactQueries.every(q => selectedInquiryIds.includes(q.id))
                        }
                        onChange={handleToggleSelectAllContact}
                      />
                      <span>Select All ({filteredContactQueries.length})</span>
                    </label>
                  )}
                </div>

                <div className="admin-inquiries-log">
                  {filteredContactQueries.length > 0 ? (
                    filteredContactQueries.map(inq => (
                      <div
                        key={inq.id}
                        className={`inquiry-message-card contact-query-card ${selectedInquiryIds.includes(inq.id) ? 'is-selected' : ''}`}
                      >
                        <div className="inq-card-header">
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <label className="inq-card-checkbox-label" title="Select entry">
                              <input
                                type="checkbox"
                                className="inq-checkbox-input"
                                checked={selectedInquiryIds.includes(inq.id)}
                                onChange={() => handleToggleSelectInquiry(inq.id)}
                              />
                            </label>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <h4 style={{ margin: 0, fontSize: '1.15rem' }}>{inq.name}</h4>
                                <span className="status-pill pill-contact">
                                  {inq.requirement || 'Contact Query'}
                                </span>
                              </div>
                              <span className="inq-company" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--brand-navy)', marginTop: '4px' }}>
                                {inq.company || 'Direct Customer / Individual'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteInquiry(inq.id, inq.name)}
                            className="btn-delete-inq"
                            title="Delete this query"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="inq-meta-grid">
                          <div>
                            <span>Contact Phone:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '0.95rem' }}>{inq.phone}</strong>
                              <a
                                href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${inq.name}, regarding your message on Dahej Support...`)}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#1ea952', display: 'inline-flex', alignItems: 'center' }}
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare size={14} />
                              </a>
                            </div>
                          </div>
                          <div>
                            <span>Email Address:</span>
                            <strong>{inq.email || 'Not provided'}</strong>
                          </div>
                          <div>
                            <span>Subject / Topic:</span>
                            <strong style={{ color: 'var(--brand-navy)' }}>{inq.requirement}</strong>
                          </div>
                        </div>

                        {/* Message Details */}
                        <div className="inq-message-box contact-msg-quote-box">
                          <span className="msg-box-label" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-admin-muted)', letterSpacing: '0.05em' }}>
                            Client Message Details:
                          </span>
                          <p style={{ margin: '6px 0 0 0', fontSize: '0.92rem', color: 'var(--text-admin-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {inq.message || 'No additional message details provided.'}
                          </p>
                        </div>

                        <div className="inq-card-footer">
                          <span className="inq-time">Received: {inq.timestamp}</span>
                          <div className="inq-actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            <a
                              href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${inq.name}, thank you for contacting Dahej Support regarding "${inq.requirement}". How may we assist you today?`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-xs btn-whatsapp-action"
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#25d366', color: '#ffffff', fontWeight: 600, textDecoration: 'none', padding: '6px 12px' }}
                            >
                              <MessageSquare size={13} /> WhatsApp Reply
                            </a>
                            <a href={`tel:${inq.phone}`} className="btn btn-secondary btn-xs" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={13} /> Call Client
                            </a>
                            {inq.email && (
                              <a
                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(inq.email)}&su=${encodeURIComponent(`DAHEJ SUPPORT: Regarding your inquiry (${inq.requirement})`)}&body=${encodeURIComponent(`Dear ${inq.name},\n\nThank you for contacting DAHEJ SUPPORT regarding "${inq.requirement}".\n\n`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary btn-xs"
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', borderColor: '#fecaca' }}
                                title="Open Gmail Web compose in new tab"
                              >
                                <Mail size={13} /> Email in Gmail
                              </a>
                            )}
                            <button
                              onClick={() => handleOpenProformaFromInquiry(inq)}
                              className="btn btn-primary btn-xs"
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                              title="Generate Official Proforma Invoice from this inquiry"
                            >
                              <Receipt size={14} /> Create Proforma
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-inquiries-card" style={{ padding: '50px 20px', textAlign: 'center' }}>
                      <MessageSquare size={44} className="empty-icon" style={{ color: 'var(--brand-navy)', marginBottom: '12px' }} />
                      <h4>No Contact Page queries found</h4>
                      <p>Messages submitted through the website's Contact page will automatically appear here in real time.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* C. INBOUND INQUIRIES TAB VIEW (Unified Multi-Item & Single Requirements) */}
            {activeTab === 'inquiries' && (
              <div className="view-container compact-view">
                <div className="view-title-block" style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', marginBottom: '2px' }}>Client Inquiries & Quote Requests</h2>
                      <p style={{ margin: 0, fontSize: '0.84rem' }}>
                        Real-time incoming material quote requests with multi-item sourcing details. Click <strong>"Proforma Invoice"</strong> to generate an official branded PDF.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        onClick={handleExportAllInquiries}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#059669', borderColor: '#059669', fontWeight: 700, padding: '6px 12px', fontSize: '0.8rem', height: '34px' }}
                        title="Export all Material Inquiries to CSV / Excel spreadsheet"
                      >
                        <Download size={13} /> Export All (CSV)
                      </button>
                      <button
                        onClick={() => loadAllData(true)}
                        className="btn btn-secondary btn-sm"
                        disabled={isSyncing}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', fontSize: '0.8rem', height: '34px' }}
                      >
                        <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} /> Sync
                      </button>
                    </div>
                  </div>
                </div>

                {/* Unified Search & Filter Toolbar */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border-admin)', marginBottom: '12px' }}>
                  <div className="admin-search-box" style={{ flex: 1, minWidth: '220px' }}>
                    <Search size={15} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search inquiries by client name, company, phone, email, GSTIN, or material..."
                      value={inquirySearch}
                      onChange={(e) => setInquirySearch(e.target.value)}
                      className="admin-search-input"
                    />
                    {inquirySearch && (
                      <button onClick={() => setInquirySearch('')} className="search-clear-btn">
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <select
                    value={inquiryCategoryFilter}
                    onChange={(e) => setInquiryCategoryFilter(e.target.value)}
                    className="admin-filter-select"
                    style={{ minWidth: '160px' }}
                  >
                    <option value="all">All Categories</option>
                    <option value="__custom__">✨ Custom / Unlisted Material Inquiries</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>

                  {filteredInquiries.length > 0 && (
                    <label className="inq-select-all-inline-btn" title="Select all filtered inquiries">
                      <input
                        type="checkbox"
                        className="inq-checkbox-input"
                        checked={
                          filteredInquiries.length > 0 &&
                          filteredInquiries.every(i => selectedInquiryIds.includes(i.id))
                        }
                        onChange={handleToggleSelectAllInbound}
                      />
                      <span>Select All ({filteredInquiries.length})</span>
                    </label>
                  )}

                  {selectedInquiryIds.filter(id => filteredInquiries.some(i => i.id === id)).length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', width: '100%', paddingTop: '8px', borderTop: '1px solid var(--border-admin)' }}>
                      <span className="inq-selected-badge" style={{ fontSize: '0.75rem', padding: '3px 9px' }}>
                        {selectedInquiryIds.filter(id => filteredInquiries.some(i => i.id === id)).length} Selected
                      </span>
                      <button
                        type="button"
                        onClick={handleExportSelectedInquiries}
                        className="btn-bulk-export"
                        style={{ padding: '5px 10px', fontSize: '0.78rem', height: '30px' }}
                        title="Export selected inquiries to CSV"
                      >
                        <Download size={12} /> Export Selected
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenBulkDeleteModal('material inquiries')}
                        className="btn-bulk-delete"
                        style={{ padding: '5px 10px', fontSize: '0.78rem', height: '30px' }}
                        title="Permanently delete selected inquiries"
                      >
                        <Trash2 size={12} /> Delete Selected
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="btn-bulk-clear"
                        style={{ padding: '5px 8px', fontSize: '0.78rem', height: '30px' }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <div className="admin-inquiries-log">
                  {filteredInquiries.length > 0 ? (
                    filteredInquiries.map(inq => {
                      const linkedPi = proformas.find(
                        p => p.inquiryId === inq.id || 
                             (p.otherReferences && p.otherReferences === `INQ:${inq.id}`) ||
                             p.id === `pi-inq-${inq.id}`
                      );
                      const itemCount = inq.items && inq.items.length > 0 ? inq.items.length : 1;
                      const isCustomInq = Boolean(
                        inq.hasCustomItems ||
                        (inq.items && inq.items.some(it => it.isCustom || (typeof it.name === 'string' && it.name.toLowerCase().includes('[custom]')) || it.category === 'Custom Sourcing')) ||
                        (inq.requirement && (inq.requirement.includes('[Custom]') || inq.requirement.includes('[Custom/Other]'))) ||
                        inq.category === 'Custom Sourcing' || inq.category === 'Custom Multi-Product Sourcing'
                      );

                      return (
                        <div
                          key={inq.id}
                          className={`inquiry-message-card ${isCustomInq ? 'is-custom-inquiry' : ''} ${selectedInquiryIds.includes(inq.id) ? 'is-selected' : ''}`}
                        >
                          <div className="inq-card-header">
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                              <label className="inq-card-checkbox-label" title="Select entry">
                                <input
                                  type="checkbox"
                                  className="inq-checkbox-input"
                                  checked={selectedInquiryIds.includes(inq.id)}
                                  onChange={() => handleToggleSelectInquiry(inq.id)}
                                />
                              </label>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <h4 style={{ margin: 0, color: isCustomInq ? '#5b21b6' : undefined }}>{inq.name}</h4>
                                  {isCustomInq && (
                                    <span className="status-pill pill-custom-source">
                                      <Sparkles size={12} /> Custom / Other Material
                                    </span>
                                  )}
                                  <span className="status-pill pill-active" style={{ backgroundColor: itemCount > 1 ? 'rgba(0, 40, 106, 0.08)' : 'rgba(217, 119, 6, 0.1)', color: itemCount > 1 ? 'var(--brand-navy)' : '#b45309', fontWeight: 700 }}>
                                    {itemCount > 1 ? `${itemCount} Items Requested` : '1 Item Requested'}
                                  </span>
                                  {linkedPi && (
                                    <span className="status-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(5, 150, 105, 0.12)', color: '#059669', borderColor: 'rgba(5, 150, 105, 0.3)', fontWeight: 700 }}>
                                      <Check size={12} /> Quoted: ₹{formatIndianNumber(linkedPi.grandTotal, 2)} (Inv #{linkedPi.invoiceNo})
                                    </span>
                                  )}
                                </div>
                                <span className="inq-company">{inq.company || 'Individual Client'}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteInquiry(inq.id, inq.name)}
                              className="btn-delete-inq"
                              title="Delete this inquiry"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="inq-meta-grid">
                            <div>
                              <span>Contact Phone:</span>
                              <strong>{inq.phone}</strong>
                            </div>
                            {inq.email && (
                              <div>
                                <span>Email:</span>
                                <strong>{inq.email}</strong>
                              </div>
                            )}
                            {inq.gst && (
                              <div>
                                <span>GSTIN:</span>
                                <strong style={{ color: 'var(--brand-navy)', letterSpacing: '0.04em' }}>{inq.gst}</strong>
                              </div>
                            )}
                            {inq.category && (
                              <div>
                                <span>Category / Domain:</span>
                                <strong style={{ color: isCustomInq ? '#6d28d9' : 'var(--brand-navy)' }}>{inq.category}</strong>
                              </div>
                            )}
                            {(!inq.items || inq.items.length <= 1) && inq.size && (
                              <div>
                                <span>Selected Size / Spec:</span>
                                <span style={{ display: 'inline-block', backgroundColor: isCustomInq ? '#f3e8ff' : '#fef3c7', color: isCustomInq ? '#6d28d9' : '#92400e', fontWeight: 700, padding: '1px 7px', borderRadius: '4px', fontSize: '0.8rem', border: `1px solid ${isCustomInq ? '#d8b4fe' : '#fde68a'}` }}>
                                  {inq.size}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Itemized Requirements Table (if items array exists) */}
                          {inq.items && inq.items.length > 0 ? (
                            <div className="inq-message-box" style={{ padding: 0, overflow: 'hidden', backgroundColor: 'transparent', border: 'none', marginTop: '10px' }}>
                              <table className="inq-bulk-table" style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${isCustomInq ? '#ddd6fe' : 'var(--border-admin)'}`, borderRadius: '6px', overflow: 'hidden' }}>
                                <thead>
                                  <tr style={{ backgroundColor: isCustomInq ? 'rgba(139, 92, 246, 0.08)' : 'rgba(0, 40, 106, 0.04)' }}>
                                    <th style={{ padding: '8px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-admin-secondary)', borderBottom: `1px solid ${isCustomInq ? '#ddd6fe' : 'var(--border-admin)'}`, textAlign: 'left', width: '38%' }}>Material / Product</th>
                                    <th style={{ padding: '8px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-admin-secondary)', borderBottom: `1px solid ${isCustomInq ? '#ddd6fe' : 'var(--border-admin)'}`, textAlign: 'left', width: '24%' }}>Size / Spec</th>
                                    <th style={{ padding: '8px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-admin-secondary)', borderBottom: `1px solid ${isCustomInq ? '#ddd6fe' : 'var(--border-admin)'}`, textAlign: 'left', width: '18%' }}>Quantity</th>
                                    {linkedPi && (
                                      <>
                                        <th style={{ padding: '8px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-admin-secondary)', borderBottom: `1px solid ${isCustomInq ? '#ddd6fe' : 'var(--border-admin)'}`, textAlign: 'left' }}>Saved Rate</th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-admin-secondary)', borderBottom: `1px solid ${isCustomInq ? '#ddd6fe' : 'var(--border-admin)'}`, textAlign: 'right' }}>Amount</th>
                                      </>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {inq.items.map((item, idx) => {
                                    const isItemCustom = Boolean(item.isCustom || (typeof item.name === 'string' && item.name.includes('[Custom]')) || item.category === 'Custom Sourcing');
                                    const cleanName = typeof item.name === 'string' ? item.name.replace(/^✨\s*\[Custom\]\s*/i, '').replace(/^\[Custom\]\s*/i, '') : item.name;
                                    const piItem = linkedPi?.items[idx] || linkedPi?.items.find(it => it.name.toLowerCase().includes(String(cleanName).toLowerCase()));
                                    return (
                                      <tr key={idx} style={{ borderBottom: idx === inq.items!.length - 1 ? 'none' : '1px solid rgba(0, 40, 106, 0.06)', backgroundColor: isItemCustom ? 'rgba(139, 92, 246, 0.04)' : undefined }}>
                                        <td style={{ padding: '8px 12px', fontSize: '0.84rem' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <strong style={{ color: isItemCustom ? '#6d28d9' : 'var(--brand-navy)' }}>{cleanName}</strong>
                                            {isItemCustom && (
                                              <span className="badge-custom-tag-admin">
                                                <Sparkles size={10} /> Custom
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td style={{ padding: '8px 12px', fontSize: '0.84rem' }}>
                                          {item.size ? (
                                            <span style={{ display: 'inline-block', backgroundColor: isItemCustom ? '#f3e8ff' : '#fef3c7', color: isItemCustom ? '#6d28d9' : '#92400e', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', fontSize: '0.75rem', border: `1px solid ${isItemCustom ? '#d8b4fe' : '#fde68a'}` }}>
                                              {item.size}
                                            </span>
                                          ) : (
                                            <span style={{ color: 'var(--text-admin-secondary)', fontSize: '0.75rem' }}>Standard Grade</span>
                                          )}
                                        </td>
                                        <td style={{ padding: '8px 12px', fontSize: '0.84rem' }}>
                                          <strong style={{ color: '#d97706' }}>{item.quantity} {item.unit || 'MT'}</strong>
                                        </td>
                                        {linkedPi && (
                                          <>
                                            <td style={{ padding: '8px 12px', fontSize: '0.84rem', color: '#059669', fontWeight: 600 }}>
                                              {piItem ? `₹${formatIndianNumber(piItem.rate, 2)}/${piItem.per || piItem.unit || 'KG.'}` : '-'}
                                            </td>
                                            <td style={{ padding: '8px 12px', fontSize: '0.84rem', textAlign: 'right', fontWeight: 700 }}>
                                              {piItem ? `₹${formatIndianNumber(piItem.amount, 2)}` : '-'}
                                            </td>
                                          </>
                                        )}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="inq-message-box" style={{ borderColor: isCustomInq ? '#ddd6fe' : undefined, backgroundColor: isCustomInq ? 'rgba(139, 92, 246, 0.04)' : undefined }}>
                              {inq.quantity ? (
                                <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                  <span>
                                    Requested Requirement: <strong style={{ color: isCustomInq ? '#6d28d9' : undefined }}>{inq.requirement}</strong> ({inq.quantity} {inq.unit})
                                    {isCustomInq && (
                                      <span className="badge-custom-tag-admin" style={{ marginLeft: '8px' }}>
                                        <Sparkles size={10} /> Custom Unlisted Sourcing
                                      </span>
                                    )}
                                  </span>
                                  {linkedPi && linkedPi.items.length > 0 && (
                                    <span style={{ color: '#059669', fontWeight: 700 }}>
                                      Saved Rate: ₹${formatIndianNumber(linkedPi.items[0].rate, 2)}/${linkedPi.items[0].per || linkedPi.items[0].unit} (Total: ₹${formatIndianNumber(linkedPi.grandTotal, 2)})
                                    </span>
                                  )}
                                </p>
                              ) : (
                                <p style={{ margin: 0 }}>
                                  <strong>Requirement:</strong> <span style={{ color: isCustomInq ? '#6d28d9' : 'inherit' }}>{inq.requirement}</span>
                                  {isCustomInq && (
                                    <span className="badge-custom-tag-admin" style={{ marginLeft: '8px' }}>
                                      <Sparkles size={10} /> Custom Unlisted Sourcing
                                    </span>
                                  )}
                                  {inq.message && <span style={{ display: 'block', marginTop: '4px', color: 'var(--text-admin-secondary)' }}>Note: {inq.message}</span>}
                                  {linkedPi && (
                                    <span style={{ display: 'block', marginTop: '6px', color: '#059669', fontWeight: 700 }}>
                                      Quoted Total: ₹${formatIndianNumber(linkedPi.grandTotal, 2)} (Invoice #{linkedPi.invoiceNo})
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="inq-card-footer">
                            <span className="inq-time">Received: {inq.timestamp}</span>
                            <div className="inq-actions">
                              <button
                                onClick={() => handleOpenProformaFromInquiry(inq)}
                                className="btn btn-primary btn-xs"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontWeight: 700,
                                  backgroundColor: linkedPi ? '#00286a' : (isCustomInq ? '#6d28d9' : undefined),
                                  borderColor: isCustomInq && !linkedPi ? '#6d28d9' : undefined
                                }}
                                title={linkedPi ? `Open saved Proforma Invoice #${linkedPi.invoiceNo} with your entered prices` : "Turn inquiry into Official Proforma Invoice"}
                              >
                                <Receipt size={14} /> {linkedPi ? 'Edit Proforma (Saved)' : 'Proforma Invoice'}
                              </button>
                              <button
                                onClick={() => handleOpenInquiryEmailModal(inq)}
                                className="btn btn-secondary btn-xs"
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284c7' }}
                                title="Email Proforma Invoice to Client"
                              >
                                <Mail size={13} /> Email Proforma
                              </button>
                              {inq.email && (
                                <a
                                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(inq.email)}&su=${encodeURIComponent(`DAHEJ SUPPORT: Quotation for ${inq.requirement}`)}&body=${encodeURIComponent(`Dear ${inq.name},\n\nThank you for reaching out to DAHEJ SUPPORT regarding your requirement for "${inq.requirement}"${inq.category ? ` under ${inq.category}` : ''}.\n\nPlease let us know your required delivery schedule so we can share the best commercial terms.\n\nBest Regards,\nDAHEJ SUPPORT (Dahej, Gujarat)\nContact: +91 96015 74966\nEmail: help@dahejsupport.com`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-secondary btn-xs"
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', borderColor: '#fecaca' }}
                                  title="Open Gmail Web compose in new tab"
                                >
                                  <Mail size={13} /> Email in Gmail
                                </a>
                              )}
                              <a
                                href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${inq.name}, thank you for contacting Dahej Support regarding "${inq.requirement}"${inq.category ? ` (${inq.category})` : ''}. How may we assist you today?`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-xs btn-whatsapp-action"
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#25d366', color: '#ffffff', fontWeight: 600, textDecoration: 'none', padding: '5px 10px' }}
                              >
                                <MessageSquare size={13} /> WhatsApp
                              </a>
                              <a href={`tel:${inq.phone}`} className="btn btn-secondary btn-xs">Call Client</a>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-inquiries-card">
                      <Mail size={40} className="empty-icon" />
                      <h4>No material inquiries found</h4>
                      <p>
                        {inquirySearch || inquiryCategoryFilter !== 'all'
                          ? 'No quote requests match your current search or category filter.'
                          : 'New incoming material inquiries from clients will automatically appear here in real-time.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* D. PRODUCTS MANAGER */}
            {activeTab === 'products' && (
              <div className="view-container">
                <div className="view-title-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2>Products & Supply Catalog</h2>
                    <p>Manage standard industrial catalog materials, live stock visibility, and MOQ parameters.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      onClick={handleExportProducts}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#059669', borderColor: '#059669', fontWeight: 700 }}
                      title="Export full Products & Materials Catalog to Excel (CSV format)"
                    >
                      <Download size={14} /> Export Catalog (CSV)
                    </button>
                    <button
                      onClick={() => loadAllData(true)}
                      className="btn btn-secondary btn-sm"
                      disabled={isSyncing}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                      {isSyncing ? 'Syncing...' : 'Sync Cloud'}
                    </button>
                    <button onClick={() => handleOpenProductModal()} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plus size={15} /> Add New Material
                    </button>
                  </div>
                </div>

                {/* Products Filter Bar */}
                <div className="quote-filter-bar" style={{ display: 'flex', gap: '16px', margin: '20px 0', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-admin-muted)' }} />
                    <input
                      type="text"
                      className="form-control admin-input"
                      placeholder="Search materials by name or description..."
                      style={{ paddingLeft: '36px', width: '100%' }}
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className={`btn btn-xs ${productCategoryFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setProductCategoryFilter('all')}
                    >
                      All Categories ({products.length})
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        className={`btn btn-xs ${productCategoryFilter === cat.slug ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setProductCategoryFilter(cat.slug)}
                      >
                        {cat.name} ({products.filter(p => p.category === cat.slug).length})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-table-container">
                  {filteredProducts.length > 0 ? (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Category</th>
                          <th>HSN / SAC</th>
                          <th>Unit</th>
                          <th>Internal Loading</th>
                          <th>MOQ</th>
                          <th>Website Visibility</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(prod => (
                          <tr key={prod.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                  src={prod.image || '/products/prod_tmt.jpg'}
                                  alt={prod.name}
                                  style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '6px',
                                    objectFit: 'cover',
                                    border: '1px solid var(--border-admin)',
                                    backgroundColor: '#f1f5f9'
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/products/prod_tmt.jpg';
                                  }}
                                />
                                <div>
                                  <strong>{prod.name}</strong>
                                  {prod.subcategory && (
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-admin-secondary)' }}>
                                      {prod.subcategory}
                                    </div>
                                  )}
                                  {prod.sizes && prod.sizes.length > 0 && (
                                    <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '3px', maxWidth: '320px' }}>
                                      {prod.sizes.slice(0, 3).map((s, sIdx) => (
                                        <span key={sIdx} style={{ fontSize: '0.7rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '3px', border: '1px solid #fde68a', fontWeight: 600 }}>
                                          {s}
                                        </span>
                                      ))}
                                      {prod.sizes.length > 3 && (
                                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, padding: '1px 3px' }}>
                                          +{prod.sizes.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="status-pill pill-active" style={{ fontSize: '0.75rem', textTransform: 'capitalize', backgroundColor: 'rgba(0, 40, 106, 0.08)', color: 'var(--brand-navy)' }}>
                                {categories.find(c => c.slug === prod.category)?.name || prod.category}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-navy)', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                                {prod.hsn || '72149990'}
                              </span>
                            </td>
                            <td style={{ textTransform: 'uppercase', fontWeight: 600 }}>{prod.measurement}</td>
                            <td>₹{prod.loadingCost} / {prod.measurement}</td>
                            <td>{prod.moq} {prod.measurement}</td>
                            <td>
                              <button
                                onClick={() => handleToggleProductStatus(prod.id)}
                                className={`status-pill ${prod.isActive ? 'pill-active' : 'pill-inactive'}`}
                                style={{ cursor: 'pointer', border: 'none', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                title="Click to toggle website visibility"
                              >
                                <span className={`status-indicator-dot ${prod.isActive ? 'dot-green' : 'dot-muted'}`} />
                                {prod.isActive ? 'Active (Visible)' : 'Hidden'}
                              </button>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button onClick={() => handleOpenProductModal(prod)} className="btn btn-secondary btn-xs" title="Edit Material">
                                  <Edit3 size={13} />
                                </button>
                                <button onClick={() => handleDeleteProduct(prod.id, prod.name)} className="btn-delete-inq" style={{ padding: '6px' }} title="Delete Material">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-inquiries-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <Package size={44} style={{ margin: '0 auto 12px auto', color: 'var(--brand-navy)', opacity: 0.4 }} />
                      <h4>No Products Found</h4>
                      <p>No catalog materials match your search or filter.</p>
                      <button onClick={() => handleOpenProductModal()} className="btn btn-primary" style={{ marginTop: '12px' }}>
                        <Plus size={16} /> Add New Material
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* E. CATEGORIES MANAGER */}
            {activeTab === 'categories' && (
              <div className="view-container">
                <div className="view-title-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2>Categories Manager</h2>
                    <p>Organize product classifications across the public catalog.</p>
                  </div>
                  <button onClick={() => handleOpenCategoryModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> Add New Category
                  </button>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>Slug Identifier</th>
                        <th>Products Linked</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(cat => (
                        <tr key={cat.id}>
                          <td><strong>{cat.name}</strong></td>
                          <td><code>{cat.slug}</code></td>
                          <td>{products.filter(p => p.category === cat.slug).length} items</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleOpenCategoryModal(cat)} className="btn btn-secondary btn-xs">
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="btn-delete-inq" style={{ padding: '6px' }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* F. PROFILE & SETTINGS VIEW */}
            {activeTab === 'profile' && (
              <div className="view-container">
                <div className="view-title-block">
                  <h2>System & Email Settings</h2>
                  <p>Automated client dispatchers, Brevo API configuration, and transactional notification settings.</p>
                </div>

                {/* AUTOMATED EMAIL DISPATCH SETTINGS CARD */}
                <div className="profile-details-card animate-fade-in" style={{ backgroundColor: '#ffffff', border: '1.5px solid var(--border-admin)', borderRadius: '12px', padding: '24px', maxWidth: '780px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Send size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--brand-navy)' }}>Brevo Automated Client Email Dispatcher</h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-admin-secondary)' }}>
                        Powered by Brevo Transactional Engine for 100% Primary Inbox deliverability (0% spam).
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveEmailConfig} style={{ borderTop: '1px solid var(--border-admin)', paddingTop: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Email Provider / Engine *</label>
                        <select
                          className="form-control admin-input"
                          value={emailConfigForm.provider || 'brevo_api'}
                          onChange={(e) => setEmailConfigForm(prev => ({ ...prev, provider: e.target.value as any }))}
                        >
                          <option value="brevo_api">Brevo API (Recommended - 100% Primary Inbox Delivery, No Spam)</option>
                          <option value="brevo_smtp">Brevo SMTP Relay (smtp-relay.brevo.com:587)</option>
                          <option value="gmail">Google Gmail / Google Workspace</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Sender Email ID *</label>
                        <input
                          type="email"
                          required
                          className="form-control admin-input"
                          placeholder="help@dahejsupport.com"
                          value={emailConfigForm.senderEmail}
                          onChange={(e) => setEmailConfigForm(prev => ({ ...prev, senderEmail: e.target.value }))}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Sender Display Name *</label>
                        <input
                          type="text"
                          required
                          className="form-control admin-input"
                          placeholder="DAHEJ SUPPORT (Demo)"
                          value={emailConfigForm.senderName}
                          onChange={(e) => setEmailConfigForm(prev => ({ ...prev, senderName: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                          {emailConfigForm.provider?.startsWith('brevo') 
                            ? 'Brevo API Key (Master Key starting with "xkeysib-") *' 
                            : 'Gmail / Google App Password (16-Digit) *'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                          Active ({emailConfigForm.provider?.startsWith('brevo') ? 'Brevo High-Reputation Gateway' : 'Google SMTP'})
                        </span>
                      </label>
                      <input
                        type="password"
                        required
                        className="form-control admin-input"
                        placeholder={
                          emailConfigForm.provider?.startsWith('brevo')
                            ? "xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            : "16-character Google App Password"
                        }
                        value={emailConfigForm.smtpPass || ''}
                        onChange={(e) => setEmailConfigForm(prev => ({ ...prev, smtpPass: e.target.value }))}
                      />
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-admin-muted)', marginTop: '6px', lineHeight: '1.5' }}>
                        Connected to sender <strong>{emailConfigForm.senderEmail}</strong> via <strong>Brevo Transactional Engine</strong>. Brevo applies cryptographic DKIM/SPF signatures to guarantee delivery directly to client Primary Inboxes.
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
                      <Check size={16} /> Save Email Dispatch Settings
                    </button>
                  </form>

                  {/* Test Invoice Dispatch Sub-Box */}
                  <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8fafc', border: '1px dashed var(--border-admin)', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--brand-navy)', fontWeight: 700 }}>
                      ⚡ Test Proforma / Invoice Dispatch
                    </h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--text-admin-secondary)' }}>
                      Send a sample Proforma Invoice with attached stamped PDF to test invoice delivery:
                    </p>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="email"
                        className="form-control admin-input"
                        style={{ maxWidth: '320px', height: '38px', fontSize: '0.85rem' }}
                        placeholder="e.g. your-email@gmail.com"
                        value={testInvoiceEmailTarget}
                        onChange={(e) => setTestInvoiceEmailTarget(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleTestInvoiceEmailDispatch}
                        disabled={isTestingInvoiceEmail}
                        className="btn btn-secondary"
                        style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
                      >
                        <Send size={14} /> {isTestingInvoiceEmail ? 'Sending Test...' : 'Send Test Invoice Email (with PDF)'}
                      </button>
                    </div>

                    {invoiceTestStatus && (
                      <div style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        backgroundColor: invoiceTestStatus.type === 'success' ? '#f0fdf4' : invoiceTestStatus.type === 'error' ? '#fef2f2' : '#f0f9ff',
                        color: invoiceTestStatus.type === 'success' ? '#166534' : invoiceTestStatus.type === 'error' ? '#991b1b' : '#075985',
                        border: `1px solid ${invoiceTestStatus.type === 'success' ? '#bbf7d0' : invoiceTestStatus.type === 'error' ? '#fecaca' : '#bae6fd'}`
                      }}>
                        {invoiceTestStatus.message}
                      </div>
                    )}
                  </div>
                </div>

                {/* DEDICATED INQUIRY AUTO-CONFIRMATION EMAIL SETTINGS (help@dahejsupport.com) */}
                <div className="profile-details-card animate-fade-in" style={{ backgroundColor: '#ffffff', border: '1.5px solid var(--border-admin)', borderRadius: '12px', padding: '24px', maxWidth: '780px', marginTop: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--brand-navy)' }}>Inquiry Auto-Confirmation Dispatcher</h3>
                          <span style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                            Dedicated Sender
                          </span>
                        </div>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-admin-secondary)' }}>
                          Automatically sends a 24-hour turnaround confirmation email to any customer who submits an inquiry.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '18px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <CheckCircle2 size={18} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#166534', lineHeight: '1.5' }}>
                      <strong>Separate Brevo Key Support:</strong> You can enter a different Brevo account API key here for <code>help@dahejsupport.com</code>. This gives you an extra <strong>300 free emails/day (total 600/day)</strong> and keeps invoice limits untouched!
                    </div>
                  </div>

                  <form onSubmit={handleSaveInquiryEmailConfig} style={{ borderTop: '1px solid var(--border-admin)', paddingTop: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Email Provider / Engine *</label>
                        <select
                          className="form-control admin-input"
                          value={inquiryEmailConfigForm.provider || 'brevo_api'}
                          onChange={(e) => setInquiryEmailConfigForm(prev => ({ ...prev, provider: e.target.value as any }))}
                        >
                          <option value="brevo_api">Brevo API (Recommended - 100% Primary Inbox Delivery)</option>
                          <option value="brevo_smtp">Brevo SMTP Relay (smtp-relay.brevo.com:587)</option>
                          <option value="gmail">Google Gmail / Google Workspace</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Inquiry Sender Email ID *</label>
                        <input
                          type="email"
                          required
                          className="form-control admin-input"
                          placeholder="help@dahejsupport.com"
                          value={inquiryEmailConfigForm.senderEmail}
                          onChange={(e) => setInquiryEmailConfigForm(prev => ({ ...prev, senderEmail: e.target.value }))}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Inquiry Sender Display Name *</label>
                        <input
                          type="text"
                          required
                          className="form-control admin-input"
                          placeholder="Dahej Support (Inquiry Desk)"
                          value={inquiryEmailConfigForm.senderName}
                          onChange={(e) => setInquiryEmailConfigForm(prev => ({ ...prev, senderName: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                          {inquiryEmailConfigForm.provider?.startsWith('brevo') 
                            ? 'Brevo API Key for Inquiry Account (starts with "xkeysib-")' 
                            : 'Gmail / Google App Password (16-Digit)'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                          {inquiryEmailConfigForm.smtpPass ? 'Custom Key Set' : 'Fallback to Main Key if empty'}
                        </span>
                      </label>
                      <input
                        type="password"
                        className="form-control admin-input"
                        placeholder={
                          inquiryEmailConfigForm.provider?.startsWith('brevo')
                            ? "xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (Leave empty to use main key)"
                            : "16-character Google App Password"
                        }
                        value={inquiryEmailConfigForm.smtpPass || ''}
                        onChange={(e) => setInquiryEmailConfigForm(prev => ({ ...prev, smtpPass: e.target.value }))}
                      />
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-admin-muted)', marginTop: '6px', lineHeight: '1.5' }}>
                        Emails sent from <strong>{inquiryEmailConfigForm.senderEmail}</strong> will notify customers immediately upon submitting single/bulk material inquiries or contact messages.
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '12px' }}>
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Admin Lead Alert Notification Email (Where you receive incoming leads)</span>
                        <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Instant Lead Alert</span>
                      </label>
                      <input
                        type="email"
                        className="form-control admin-input"
                        placeholder="e.g. help@dahejsupport.com or your-email@gmail.com"
                        value={inquiryEmailConfigForm.adminNotificationEmail || ''}
                        onChange={(e) => setInquiryEmailConfigForm(prev => ({ ...prev, adminNotificationEmail: e.target.value }))}
                      />
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-admin-muted)', marginTop: '6px', lineHeight: '1.5' }}>
                        Whenever any customer submits an inquiry or contact message on the website, a full lead summary with 1-click Call and WhatsApp buttons will be instantly sent to this email.
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                      <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={16} /> Save Inquiry Email Settings
                      </button>
                    </div>
                  </form>

                  {/* Test Dispatch Sub-Box */}
                  <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8fafc', border: '1px dashed var(--border-admin)', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--brand-navy)', fontWeight: 700 }}>
                      ⚡ Test Inquiry Confirmation Dispatch
                    </h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--text-admin-secondary)' }}>
                      Send a sample automated confirmation email to check formatting and inbox deliverability:
                    </p>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="email"
                        className="form-control admin-input"
                        style={{ maxWidth: '320px', height: '38px', fontSize: '0.85rem' }}
                        placeholder="e.g. your-email@gmail.com"
                        value={testInquiryEmailTarget}
                        onChange={(e) => setTestInquiryEmailTarget(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleTestInquiryEmailDispatch}
                        disabled={isTestingInquiryEmail}
                        className="btn btn-secondary"
                        style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
                      >
                        <Send size={14} /> {isTestingInquiryEmail ? 'Sending Test...' : 'Send Test Confirmation Email'}
                      </button>
                    </div>

                    {inquiryTestStatus && (
                      <div style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        backgroundColor: inquiryTestStatus.type === 'success' ? '#f0fdf4' : inquiryTestStatus.type === 'error' ? '#fef2f2' : '#f0f9ff',
                        color: inquiryTestStatus.type === 'success' ? '#166534' : inquiryTestStatus.type === 'error' ? '#991b1b' : '#075985',
                        border: `1px solid ${inquiryTestStatus.type === 'success' ? '#bbf7d0' : inquiryTestStatus.type === 'error' ? '#fecaca' : '#bae6fd'}`
                      }}>
                        {inquiryTestStatus.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. OFFICIAL PROFORMA INVOICE EDITOR & CALCULATOR MODAL    */}
      {/* ======================================================== */}
      {isProformaModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card animate-fade-in" style={{ maxWidth: '1380px', width: '96vw', maxHeight: '92vh', overflowY: 'auto', padding: '24px 30px' }}>
            <div className="modal-header" style={{ borderBottom: '2px solid var(--brand-navy)', paddingBottom: '14px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={22} style={{ color: 'var(--brand-navy)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--brand-navy)' }}>
                    Official Proforma Invoice Calculator
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-admin-secondary)' }}>
                  Pre-filled with customer inquiry data. Enter or adjust prices to instantly generate the print-ready company Proforma Invoice.
                </p>
              </div>
              <button onClick={() => setIsProformaModalOpen(false)} className="btn-close-modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveProforma(true); }} className="modal-form" style={{ paddingTop: '8px' }}>
              
              {/* SECTION 1: INVOICE & DISPATCH METADATA */}
              <div style={{ backgroundColor: 'rgba(0, 40, 106, 0.03)', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--border-admin)', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.84rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-navy)', fontWeight: 700 }}>
                  1. Invoice & Dispatch Metadata
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Invoice No. *</label>
                    <input
                      type="text"
                      required
                      className="form-control admin-input"
                      value={proformaForm.invoiceNo}
                      onChange={(e) => handleUpdateProformaField('invoiceNo', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Invoice Date *</label>
                    <input
                      type="date"
                      required
                      className="form-control admin-input"
                      value={proformaForm.date}
                      onChange={(e) => handleUpdateProformaField('date', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Mode / Terms of Payment</label>
                    <input
                      type="text"
                      className="form-control admin-input"
                      placeholder="e.g. SAME DAY / 100% ADVANCE"
                      value={proformaForm.modeOfPayment}
                      onChange={(e) => handleUpdateProformaField('modeOfPayment', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Buyer's Order No. / Ref</label>
                    <input
                      type="text"
                      className="form-control admin-input"
                      placeholder="e.g. 9724316439 / PO-01"
                      value={proformaForm.buyersOrderNo}
                      onChange={(e) => handleUpdateProformaField('buyersOrderNo', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Dispatch Doc No.</label>
                    <input
                      type="text"
                      className="form-control admin-input"
                      value={proformaForm.dispatchDocNo}
                      onChange={(e) => handleUpdateProformaField('dispatchDocNo', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Destination / Site</label>
                    <input
                      type="text"
                      className="form-control admin-input"
                      value={proformaForm.destination}
                      onChange={(e) => handleUpdateProformaField('destination', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CLIENT (BUYER & CONSIGNEE) DETAILS */}
              <div style={{ marginBottom: '20px', backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--border-admin)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.84rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-navy)', fontWeight: 700 }}>
                  2. Buyer & Consignee (Client) Information
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Buyer (Bill to) Name *</label>
                    <input
                      type="text"
                      required
                      className="form-control admin-input"
                      placeholder="e.g. Hari Buildcon - Ankleswer"
                      value={proformaForm.buyerName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProformaForm(prev => ({
                          ...prev,
                          buyerName: val,
                          consigneeName: prev.consigneeName ? prev.consigneeName : val
                        }));
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Buyer Contact Phone(s) *</label>
                    <input
                      type="text"
                      required
                      className="form-control admin-input"
                      placeholder="e.g. M - 9724316439"
                      value={proformaForm.buyerPhones}
                      onChange={(e) => handleUpdateProformaField('buyerPhones', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Client GSTIN / UIN</label>
                    <input
                      type="text"
                      className="form-control admin-input"
                      placeholder="e.g. 24CBJPP0843A1Z2 (or URP)"
                      value={proformaForm.buyerGstin}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProformaForm(prev => ({
                          ...prev,
                          buyerGstin: val,
                          consigneeGstin: val
                        }));
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Consignee (Ship to) Address</label>
                    <input
                      type="text"
                      className="form-control admin-input"
                      placeholder="e.g. Dahej Site / GIDC"
                      value={proformaForm.consigneeAddress}
                      onChange={(e) => handleUpdateProformaField('consigneeAddress', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Buyer Billing Address</label>
                  <input
                    type="text"
                    className="form-control admin-input"
                    placeholder="e.g. D-70 Sunflora Residency, Nr Krishna, Ankleswer - 393002"
                    value={proformaForm.buyerAddress}
                    onChange={(e) => handleUpdateProformaField('buyerAddress', e.target.value)}
                  />
                </div>
              </div>

              {/* SECTION 3: LINE ITEMS TABLE & PRICE CALCULATOR */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.86rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-navy)', fontWeight: 700 }}>
                    3. Material Requirements & Price Calculator
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddProformaItem}
                    className="btn btn-secondary btn-xs"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, padding: '6px 12px' }}
                  >
                    <Plus size={14} /> + Add Another Item
                  </button>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid var(--border-admin)', borderRadius: '8px', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <table className="admin-table" style={{ margin: 0, minWidth: '1080px', width: '100%' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(0, 40, 106, 0.05)' }}>
                        <th style={{ minWidth: '260px', padding: '10px 12px', fontSize: '0.8rem', fontWeight: 800 }}>Description of Goods</th>
                        <th style={{ minWidth: '180px', padding: '10px 12px', fontSize: '0.8rem', fontWeight: 800 }}>Specification / Size</th>
                        <th style={{ minWidth: '130px', padding: '10px 12px', fontSize: '0.8rem', fontWeight: 800 }}>HSN / SAC</th>
                        <th style={{ minWidth: '110px', padding: '10px 12px', fontSize: '0.8rem', fontWeight: 800 }}>Quantity</th>
                        <th style={{ minWidth: '100px', padding: '10px 12px', fontSize: '0.8rem', fontWeight: 800 }}>Unit</th>
                        <th style={{ minWidth: '130px', padding: '10px 12px', fontSize: '0.8rem', fontWeight: 800 }}>Rate (₹/Unit) *</th>
                        <th style={{ minWidth: '130px', textAlign: 'right', padding: '10px 12px', fontSize: '0.8rem', fontWeight: 800 }}>Amount (₹)</th>
                        <th style={{ width: '44px', textAlign: 'center', padding: '10px 6px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {proformaForm.items.map((it) => (
                        <tr key={it.id}>
                          <td style={{ padding: '8px 10px' }}>
                            <input
                              type="text"
                              className="form-control admin-input"
                              style={{ fontSize: '0.88rem', padding: '8px 10px', width: '100%' }}
                              placeholder="e.g. Galvanized Corrugated Sheets"
                              value={it.name}
                              onChange={(e) => handleUpdateProformaItem(it.id, 'name', e.target.value)}
                            />
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <input
                              type="text"
                              className="form-control admin-input"
                              style={{ fontSize: '0.88rem', padding: '8px 10px', width: '100%' }}
                              placeholder="e.g. Building Material / 12 MM"
                              value={it.description || ''}
                              onChange={(e) => handleUpdateProformaItem(it.id, 'description', e.target.value)}
                            />
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <input
                              type="text"
                              className="form-control admin-input"
                              style={{ fontSize: '0.88rem', padding: '8px 10px', width: '100%' }}
                              placeholder="72149990"
                              value={it.hsn}
                              onChange={(e) => handleUpdateProformaItem(it.id, 'hsn', e.target.value)}
                            />
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <input
                              type="number"
                              min={0.001}
                              step="any"
                              className="form-control admin-input"
                              style={{ fontSize: '0.9rem', padding: '8px 10px', fontWeight: 700, width: '100%' }}
                              value={it.quantity}
                              onChange={(e) => handleUpdateProformaItem(it.id, 'quantity', Number(e.target.value))}
                            />
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <select
                              className="form-control admin-input"
                              style={{ fontSize: '0.88rem', padding: '8px 8px', width: '100%', cursor: 'pointer' }}
                              value={it.unit}
                              onChange={(e) => handleUpdateProformaItem(it.id, 'unit', e.target.value)}
                            >
                              <option value="KG.">KG.</option>
                              <option value="TON.">TON.</option>
                              <option value="FT.">FT. (Foot / Running Feet)</option>
                              <option value="NOS.">NOS.</option>
                              <option value="MTR.">MTR.</option>
                              <option value="RFT.">RFT.</option>
                              <option value="SQ.FT.">SQ.FT.</option>
                              <option value="PCS.">PCS.</option>
                            </select>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              className="form-control admin-input"
                              style={{ fontSize: '0.92rem', padding: '8px 10px', fontWeight: 700, borderColor: '#0284c7', backgroundColor: '#f0f9ff', width: '100%' }}
                              placeholder="₹ 0.00"
                              value={it.rate === 0 ? '' : it.rate}
                              onChange={(e) => handleUpdateProformaItem(it.id, 'rate', e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.98rem', padding: '8px 12px', whiteSpace: 'nowrap' }}>
                            ₹{formatIndianNumber(it.amount, 2)}
                          </td>
                          <td style={{ textAlign: 'center', padding: '8px 6px' }}>
                            {proformaForm.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveProformaItem(it.id)}
                                className="btn-delete-inq"
                                style={{ padding: '6px', color: '#dc2626' }}
                                title="Remove item"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 4: CHARGES, GST & FINANCIAL SUMMARY */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-admin)', marginBottom: '20px' }}>
                {/* Left: Extra Charges & Tax Option */}
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.84rem', textTransform: 'uppercase', color: 'var(--brand-navy)', fontWeight: 700 }}>
                    Loading Charges & GST Options
                  </h4>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Loading & Unloading Charges (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="form-control admin-input"
                      placeholder="₹ 0.00"
                      value={proformaForm.loadingCharges === 0 ? '' : proformaForm.loadingCharges}
                      onChange={(e) => handleUpdateProformaField('loadingCharges', e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Tax Mode (GST)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleTaxType(false)}
                        className={`btn btn-xs ${!isInterstateTax ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1 }}
                      >
                        Gujarat (CGST 9% + SGST 9%)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleTaxType(true)}
                        className={`btn btn-xs ${isInterstateTax ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1 }}
                      >
                        Out of State (IGST 18%)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Live Calculated Summary */}
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1.5px solid var(--border-admin)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--brand-navy)', borderBottom: '1px solid var(--border-admin)', paddingBottom: '6px' }}>
                    Calculated Invoice Summary
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-admin-secondary)' }}>Material Subtotal:</span>
                    <strong>₹{formatIndianNumber(proformaForm.itemsSubtotal, 2)}</strong>
                  </div>

                  {proformaForm.loadingCharges > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-admin-secondary)' }}>Loading & Unloading:</span>
                      <strong>₹{formatIndianNumber(proformaForm.loadingCharges, 2)}</strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-admin-secondary)' }}>Taxable Value:</span>
                    <strong>₹{formatIndianNumber(proformaForm.taxableValue, 2)}</strong>
                  </div>

                  {!isInterstateTax ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-admin-secondary)' }}>CGST @ 9%:</span>
                        <strong>₹{formatIndianNumber(proformaForm.cgstAmount, 2)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-admin-secondary)' }}>SGST @ 9%:</span>
                        <strong>₹{formatIndianNumber(proformaForm.sgstAmount, 2)}</strong>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-admin-secondary)' }}>IGST @ 18%:</span>
                      <strong>₹{formatIndianNumber(proformaForm.igstAmount, 2)}</strong>
                    </div>
                  )}

                  {proformaForm.roundOff !== 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '0.85rem', color: '#64748b' }}>
                      <span>Round Off:</span>
                      <strong>{proformaForm.roundOff < 0 ? `(-)${Math.abs(proformaForm.roundOff).toFixed(2)}` : `(+) ${proformaForm.roundOff.toFixed(2)}`}</strong>
                    </div>
                  )}

                  <div style={{ borderTop: '2px solid var(--brand-navy)', paddingTop: '10px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--brand-navy)', textTransform: 'uppercase' }}>
                        Grand Total:
                      </span>
                      <span style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--brand-navy)' }}>
                        ₹{formatIndianNumber(proformaForm.grandTotal, 2)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-admin-secondary)', fontStyle: 'italic', marginTop: '4px' }}>
                      {proformaForm.amountInWords}
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border-admin)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsProformaModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => openProformaPDFInNewTab(proformaForm)}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Open PDF directly in new tab to inspect before saving"
                  >
                    <Eye size={15} /> Preview PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveProforma(false)}
                    className="btn btn-secondary"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveProforma(false);
                      handleOpenEmailModal(proformaForm);
                    }}
                    className="btn btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      borderColor: '#0284c7'
                    }}
                    title="Save Proforma and open direct Email Dispatcher to Client"
                  >
                    <Mail size={16} /> Email to Client
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
                  >
                    <Download size={16} /> Save & Download PDF
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. CATEGORY CRUD MODAL                                    */}
      {/* ======================================================== */}
      {isCategoryModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card animate-fade-in">
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="btn-close-modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="cat-name">Category Name *</label>
                <input
                  type="text"
                  id="cat-name"
                  required
                  className="form-control admin-input"
                  placeholder="e.g. Structural Steel, Cement Products"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ name: e.target.value })}
                />
              </div>

              <div className="modal-action-row">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. PRODUCT CRUD MODAL                                     */}
      {/* ======================================================== */}
      {isProductModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card product-modal animate-fade-in" style={{ maxWidth: '680px', width: '95vw', maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Catalog Material' : 'Add New Catalog Material'}</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="btn-close-modal" title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Material Name *</label>
                <input
                  type="text"
                  required
                  className="form-control admin-input"
                  placeholder="e.g. TMT Steel Bars (Fe 500D / Fe 550D)"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-control admin-input"
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">HSN / SAC Code *</label>
                  <input
                    type="text"
                    required
                    className="form-control admin-input"
                    placeholder="e.g. 72149990"
                    value={productForm.hsn}
                    onChange={(e) => setProductForm(prev => ({ ...prev, hsn: e.target.value.replace(/[^0-9]/g, '') }))}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Subcategory / Tag</label>
                  <input
                    type="text"
                    className="form-control admin-input"
                    placeholder="e.g. TMT Bars, Structural Steel"
                    value={productForm.subcategory}
                    onChange={(e) => setProductForm(prev => ({ ...prev, subcategory: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit of Measurement *</label>
                  <select
                    className="form-control admin-input"
                    value={productForm.measurement}
                    onChange={(e) => setProductForm(prev => ({ ...prev, measurement: e.target.value as any }))}
                  >
                    <option value="ton">ton (Metric Tonne / MT)</option>
                    <option value="kg">kg (Kilograms / KG)</option>
                    <option value="foot">foot (Feet / Running Feet / FT)</option>
                    <option value="nos">nos (Numbers / Pcs)</option>
                    <option value="bundles">bundles (Bundles)</option>
                    <option value="mtr">mtr (Meters / Mtr)</option>
                    <option value="sheets">sheets (Sheets)</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Internal Loading Cost (₹ / Unit) *</label>
                  <input
                    type="number"
                    min={0}
                    className="form-control admin-input"
                    value={productForm.loadingCost}
                    onChange={(e) => setProductForm(prev => ({ ...prev, loadingCost: Number(e.target.value) }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Minimum Order Quantity (MOQ)</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control admin-input"
                    value={productForm.moq}
                    onChange={(e) => setProductForm(prev => ({ ...prev, moq: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Product Image Photo *</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-admin-secondary)' }}>
                    Add photos from your side
                  </span>
                </label>

                {/* Sub-tabs for Image Source */}
                <div className="admin-img-tabs">
                  <button
                    type="button"
                    className={`admin-img-tab-btn ${imageSourceTab === 'upload' ? 'active' : ''}`}
                    onClick={() => setImageSourceTab('upload')}
                  >
                    <Upload size={14} /> Upload from My Device
                  </button>
                  <button
                    type="button"
                    className={`admin-img-tab-btn ${imageSourceTab === 'preset' ? 'active' : ''}`}
                    onClick={() => setImageSourceTab('preset')}
                  >
                    <Package size={14} /> Stock Catalog
                  </button>
                  <button
                    type="button"
                    className={`admin-img-tab-btn ${imageSourceTab === 'url' ? 'active' : ''}`}
                    onClick={() => setImageSourceTab('url')}
                  >
                    <ExternalLink size={14} /> Custom Web Link
                  </button>
                </div>

                {/* 1. Direct File Upload Box */}
                {imageSourceTab === 'upload' && (
                  <div className="admin-dropzone-box">
                    <input
                      type="file"
                      id="product-photo-upload"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleProductImageFileUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="product-photo-upload" className="admin-dropzone-label">
                      <div className="admin-dropzone-icon-wrap">
                        <Upload size={26} className="text-brand" />
                      </div>
                      <div className="admin-dropzone-text">
                        <strong>Click to Browse Photos from Computer / Phone</strong>
                      </div>
                      <div className="admin-dropzone-sub">
                        Select any image from your gallery or drive (PNG, JPG, JPEG, WEBP)
                      </div>
                    </label>
                    {isUploadingImage && (
                      <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#0284c7', fontWeight: 600, textAlign: 'center' }}>
                        Processing & optimizing image...
                      </div>
                    )}
                    {uploadError && (
                      <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#dc2626', fontWeight: 600, textAlign: 'center' }}>
                        {uploadError}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Stock Library Dropdown */}
                {imageSourceTab === 'preset' && (
                  <select
                    className="form-control admin-input"
                    value={productForm.image}
                    onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                  >
                    {AVAILABLE_PRODUCT_IMAGES.map((img, idx) => (
                      <option key={idx} value={img.path}>{img.label} ({img.path})</option>
                    ))}
                  </select>
                )}

                {/* 3. Custom Web URL Input */}
                {imageSourceTab === 'url' && (
                  <input
                    type="text"
                    className="form-control admin-input"
                    placeholder="Paste image web link (e.g. https://... or /products/...)"
                    value={productForm.image}
                    onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                  />
                )}
              </div>

              {/* Image Preview */}
              {productForm.image && (
                <div className="admin-img-preview-card">
                  <img
                    src={productForm.image}
                    alt="Preview"
                    className="admin-img-preview-thumb"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/products/prod_tmt.jpg'; }}
                  />
                  <div className="admin-img-preview-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={15} color="#16a34a" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                        Selected Product Photo
                      </span>
                    </div>
                    <div className="admin-img-preview-src">
                      {productForm.image.startsWith('data:') 
                        ? 'Custom photo uploaded from your device (Optimized & Ready)'
                        : productForm.image}
                    </div>
                  </div>
                  <label htmlFor="product-photo-upload" className="btn btn-secondary btn-xs" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Change Photo
                  </label>
                </div>
              )}

              {/* Size / Dimension Variants Manager */}
              <div className="form-group admin-size-manager-box" style={{ backgroundColor: 'rgba(0, 40, 106, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-admin)', margin: '16px 0' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-navy)', fontWeight: 700 }}>
                    <Layers3 size={16} color="#d97706" /> Available Sizes / Dimensions (Optional)
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-admin-secondary)' }}>
                    {productForm.sizes.length} size{productForm.sizes.length !== 1 ? 's' : ''} added
                  </span>
                </label>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: 'var(--text-admin-secondary)', lineHeight: 1.4 }}>
                  Add multiple sizes/dimensions (e.g. 8mm, 10mm, 2" NB, 25x25x3 mm) so buyers can pick their exact specification on the website & inquiry portal. Leave empty if this product has no size variations.
                </p>

                {/* Tag Input Field */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    className="form-control admin-input"
                    placeholder="Type size/dimension (e.g. 12mm, 50x50x5 mm, 2 inch) & press Add"
                    value={newSizeInput}
                    onChange={(e) => setNewSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProductSize();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAddProductSize()}
                    style={{ whiteSpace: 'nowrap', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={15} /> Add Size
                  </button>
                </div>

                {/* Quick Presets */}
                <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-admin-secondary)' }}>
                    ⚡ Quick Add Presets:
                  </span>
                  <button
                    type="button"
                    className="btn-size-preset"
                    onClick={() => handleAddSizePresets(['8mm', '10mm', '12mm', '16mm', '20mm', '25mm', '32mm'])}
                    title="Add standard TMT rebar sizes"
                  >
                    + TMT Rebar (8mm - 32mm)
                  </button>
                  <button
                    type="button"
                    className="btn-size-preset"
                    onClick={() => handleAddSizePresets(['25x25x3 mm', '40x40x5 mm', '50x50x5 mm', '65x65x6 mm', '75x75x6 mm', '100x100x8 mm'])}
                    title="Add standard MS Angle sizes"
                  >
                    + Angles (25x25 to 100x100)
                  </button>
                  <button
                    type="button"
                    className="btn-size-preset"
                    onClick={() => handleAddSizePresets(['1/2" (15mm)', '3/4" (20mm)', '1" (25mm)', '1.5" (40mm)', '2" (50mm)', '2.5" (65mm)', '3" (80mm)', '4" (100mm)'])}
                    title="Add standard Pipe diameters"
                  >
                    + Pipes (1/2" to 4")
                  </button>
                  <button
                    type="button"
                    className="btn-size-preset"
                    onClick={() => handleAddSizePresets(['2mm', '3mm', '4mm', '5mm', '6mm', '8mm', '10mm', '12mm', '16mm', '20mm', '25mm'])}
                    title="Add standard Plate & Sheet thicknesses"
                  >
                    + Plates (2mm - 25mm)
                  </button>
                  {productForm.sizes.length > 0 && (
                    <button
                      type="button"
                      className="btn-size-preset"
                      style={{ color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
                      onClick={() => setProductForm(prev => ({ ...prev, sizes: [] }))}
                      title="Clear all sizes"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Added Size Chips */}
                {productForm.sizes.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    {productForm.sizes.map((sz, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #fde68a',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '0.82rem',
                          fontWeight: 600
                        }}
                      >
                        {sz}
                        <button
                          type="button"
                          onClick={() => handleRemoveProductSize(sz)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#b45309',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0,
                            marginLeft: '2px'
                          }}
                          title={`Remove ${sz}`}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px dashed #cbd5e1' }}>
                    No sizes added yet. (Product will appear as a single standard item without size dropdown)
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Material Description</label>
                <textarea
                  rows={2}
                  className="form-control admin-input"
                  placeholder="Describe material specifications, standard grades, or applications..."
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', marginBottom: '14px' }}>
                <input
                  type="checkbox"
                  id="prod-is-active"
                  checked={productForm.isActive}
                  onChange={(e) => setProductForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="prod-is-active" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-admin-primary)' }}>
                  Active in Catalog (Immediately visible on public website)
                </label>
              </div>

              <div className="modal-action-row" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-admin)' }}>
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Save Modifications' : 'Add Material to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. AUTOMATED CLIENT PROFORMA EMAIL DISPATCHER MODAL       */}
      {/* ======================================================== */}
      {isEmailModalOpen && emailTargetInvoice && (
        <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="admin-modal-card email-modal-card animate-fade-in" style={{ maxWidth: '740px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Send Proforma Invoice to Client</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-admin-secondary)' }}>
                    Personalized dispatch for Invoice #{emailTargetInvoice.invoiceNo}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)} className="btn-close-modal" title="Close">
                <X size={18} />
              </button>
            </div>

            {/* Email Metadata Card */}
            <div className="email-meta-header">
              <div className="email-meta-row">
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-admin-secondary)', fontWeight: 700 }}>Client Name:</span>
                  <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1rem' }}>{emailForm.clientName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-admin-secondary)', fontWeight: 700 }}>Grand Total:</span>
                  <div style={{ fontWeight: 900, color: (emailTargetInvoice.grandTotal <= 0) ? '#dc2626' : 'var(--brand-navy)', fontSize: '1.1rem' }}>
                    ₹{formatIndianNumber(emailTargetInvoice.grandTotal, 2)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-admin-secondary)', fontWeight: 700 }}>Items Count:</span>
                  <div style={{ fontWeight: 700, color: '#0284c7' }}>{emailTargetInvoice.items.length} Product{emailTargetInvoice.items.length > 1 ? 's' : ''} ({formatIndianNumber(emailTargetInvoice.totalQuantity, 0)} {emailTargetInvoice.totalUnit})</div>
                </div>
              </div>
            </div>

            {/* Prominent In-Modal Zero Price Banner */}
            {isProformaZeroPrice(emailTargetInvoice) && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#fffbeb',
                  color: '#92400e',
                  border: '1.5px solid #f59e0b',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={22} style={{ color: '#d97706', flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: '#b45309' }}>
                      ⚠️ Price is ₹0.00 / Unpriced Invoice
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#78350f' }}>
                      One or more items have zero commercial rates. Please update prices if required.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEmailModalOpen(false);
                    setProformaForm(emailTargetInvoice);
                    setIsProformaModalOpen(true);
                  }}
                  className="btn btn-secondary btn-xs"
                  style={{
                    fontWeight: 700,
                    borderColor: '#f59e0b',
                    color: '#92400e',
                    backgroundColor: '#fef3c7',
                    whiteSpace: 'nowrap',
                    padding: '6px 10px'
                  }}
                >
                  <Edit3 size={12} /> Edit Prices
                </button>
              </div>
            )}

            {/* Status Alert if any */}
            {emailDispatchStatus && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: emailDispatchStatus.type === 'success' ? '#f0fdf4' : emailDispatchStatus.type === 'error' ? '#fef2f2' : '#f0f9ff',
                  color: emailDispatchStatus.type === 'success' ? '#15803d' : emailDispatchStatus.type === 'error' ? '#b91c1c' : '#0369a1',
                  border: `1px solid ${emailDispatchStatus.type === 'success' ? '#bbf7d0' : emailDispatchStatus.type === 'error' ? '#fecaca' : '#bae6fd'}`,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '16px',
                  lineHeight: '1.5'
                }}
              >
                {emailDispatchStatus.type === 'success' ? (
                  <Check size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                ) : emailDispatchStatus.type === 'error' ? (
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                ) : (
                  <RefreshCw size={18} className="animate-spin" style={{ flexShrink: 0, marginTop: '2px' }} />
                )}
                <div style={{ flex: 1 }}>{emailDispatchStatus.message}</div>
              </div>
            )}

            <div className="modal-form">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Recipient Client Email *</span>
                  <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>Auto-extracted from inquiry</span>
                </label>
                <input
                  type="email"
                  required
                  className="form-control admin-input"
                  placeholder="e.g. client@company.com"
                  value={emailForm.recipient}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, recipient: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject Line *</label>
                <input
                  type="text"
                  required
                  className="form-control admin-input"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              {/* PDF Attachment Notice */}
              <div className="email-attachment-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={22} style={{ color: '#dc2626' }} />
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--brand-navy)' }}>
                      Shivam_Steel_Proforma_Invoice_{emailTargetInvoice.invoiceNo}_{emailTargetInvoice.buyerName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 25)}.pdf
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-admin-secondary)' }}>
                      Official Stamped Commercial Document • Ready to Attach
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openProformaPDFInNewTab(emailTargetInvoice)}
                  className="btn btn-secondary btn-xs"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Eye size={12} /> Inspect PDF
                </button>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Automated Personalized Email Message Body</label>
                  <button
                    type="button"
                    onClick={handleCopyEmailMessage}
                    className="btn btn-secondary btn-xs"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {isCopiedEmail ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    {isCopiedEmail ? 'Copied!' : 'Copy Text'}
                  </button>
                </div>
                <textarea
                  rows={9}
                  className="email-body-editor"
                  value={emailForm.body}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                />
              </div>

              <div className="email-dispatch-buttons">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppQuote(false)}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}
                    title="Send instant quote summary via WhatsApp"
                  >
                    <MessageSquare size={15} /> Send WhatsApp Quote
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenGmailWeb(false)}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#dc2626', borderColor: '#fecaca', backgroundColor: '#fef2f2' }}
                    title="Open Gmail Web in a new tab with pre-filled message and downloaded PDF"
                  >
                    <Mail size={15} /> Open in Gmail Web
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendNativeEmail(false)}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                    title="Open Outlook or default desktop mail app with pre-filled content and downloaded PDF"
                  >
                    <ExternalLink size={15} /> Outlook / Mail App
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendCloudEmail(false)}
                    disabled={isSendingCloudEmail}
                    className="btn btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      borderColor: '#0284c7'
                    }}
                  >
                    <Send size={15} className={isSendingCloudEmail ? 'animate-spin' : ''} />
                    {isSendingCloudEmail ? 'Sending...' : 'Instant Send (Cloud API)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. SCREEN-CENTERED ZERO PRICE WARNING MODAL              */}
      {/* ======================================================== */}
      {zeroPriceWarning && zeroPriceWarning.isOpen && (
        <div className="admin-modal-overlay" style={{ zIndex: 1350, backgroundColor: 'rgba(15, 23, 42, 0.78)' }}>
          <div
            className="admin-modal-card animate-fade-in"
            style={{
              maxWidth: '520px',
              width: '92vw',
              border: '2px solid #f59e0b',
              boxShadow: '0 25px 60px -12px rgba(217, 119, 6, 0.4)',
              padding: '28px 24px',
              borderRadius: '16px',
              backgroundColor: '#ffffff'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                border: '3px solid #fde68a',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.25)'
              }}>
                <AlertTriangle size={36} />
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', color: '#92400e', fontWeight: 800 }}>
                Warning: Price is ₹0.00
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#78350f', lineHeight: 1.5 }}>
                The rate / price for items in Proforma Invoice <strong>#{zeroPriceWarning.proforma.invoiceNo}</strong> is currently set to <strong>₹0.00</strong> (Grand Total: <strong>₹{formatIndianNumber(zeroPriceWarning.proforma.grandTotal, 2)}</strong>).
              </p>
            </div>

            {/* Zero Price Item List Preview */}
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1.5px dashed #f59e0b',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '18px'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Unpriced Items List:
              </div>
              <div style={{ maxHeight: '130px', overflowY: 'auto' }}>
                {zeroPriceWarning.zeroItems.length > 0 ? (
                  zeroPriceWarning.zeroItems.map((it, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem', color: '#451a03', padding: '4px 0', display: 'flex', justifyContent: 'space-between', borderBottom: idx < zeroPriceWarning.zeroItems.length - 1 ? '1px solid #fef3c7' : 'none' }}>
                      <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                        • {it.name}
                      </span>
                      <span style={{ fontWeight: 800, color: '#dc2626' }}>
                        ₹{it.rate || 0} / {it.per || it.unit}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 700 }}>
                    Grand Total is ₹0.00
                  </div>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', margin: '0 0 20px 0', lineHeight: 1.4 }}>
              Sending an invoice with ₹0 price will dispatch the document without commercial rates. We strongly recommend entering commercial rates before emailing the client.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleEditPricesFromWarning}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #00286a 0%, #0369a1 100%)',
                  boxShadow: '0 4px 12px rgba(0, 40, 106, 0.25)'
                }}
              >
                <Edit3 size={16} /> Edit & Enter Prices First
              </button>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setZeroPriceWarning(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmZeroPriceProceed}
                  className="btn btn-secondary"
                  style={{
                    flex: 1.3,
                    padding: '10px',
                    fontWeight: 600,
                    color: '#d97706',
                    borderColor: '#fde68a',
                    backgroundColor: '#fffbeb'
                  }}
                  title="Proceed sending despite ₹0 price"
                >
                  Send Anyway (₹0 Quote)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. STOCK MOVEMENT MODAL (STOCK IN / OUT)                 */}
      {/* ======================================================== */}
      {stockMovementModal.isOpen && stockMovementModal.item && (() => {
        const item = stockMovementModal.item;
        const openOrders = getPendingOrdersForItem(item.id, stockMovementModal.type);
        const selectedOrder = stockMovementModal.selectedOrderId ? openOrders.find(o => o.id === stockMovementModal.selectedOrderId) : (openOrders.length > 0 ? openOrders[0] : undefined);
        const isIn = stockMovementModal.type === 'IN';
        const movingQty = parseFloat(stockMovementModal.quantity) || 0;
        const totalExpected = parseFloat(stockMovementModal.totalOrderQty) || 0;

        return (
          <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
            <div className="admin-modal-card animate-fade-in" style={{ maxWidth: '580px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: isIn ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 40, 106, 0.12)',
                    color: isIn ? '#16a34a' : '#00286a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isIn ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: isIn ? '#166534' : '#00286a' }}>
                      {isIn ? 'Record Inward Stock (+ Maal Aaya)' : 'Record Outward Dispatch (- Maal Nikla)'}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-admin-secondary)' }}>
                      {isIn ? 'Supplier Receipt / Mill Inward / Gate Pass' : 'Customer Dispatch / Loading / Outward'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setStockMovementModal(prev => ({ ...prev, isOpen: false, item: null, error: undefined }))}
                  className="btn-close-modal"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Material Current Stock Banner */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                    Selected Material:
                  </span>
                  <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.98rem' }}>
                    {item.productName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Yard: {item.location}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                    Current Yard Balance:
                  </span>
                  <div style={{ fontWeight: 900, color: 'var(--brand-navy)', fontSize: '1.25rem', fontFamily: 'var(--font-headings)' }}>
                    {formatIndianNumber(item.currentStock, item.unit === 'MT' ? 2 : 0)} <span style={{ fontSize: '0.85rem' }}>{item.unit}</span>
                  </div>
                </div>
              </div>

              {/* Movement Mode Switcher (If pending orders exist) */}
              {openOrders.length > 0 && (
                <div className="movement-mode-toggle">
                  <button
                    type="button"
                    className={`movement-mode-btn ${stockMovementModal.mode === 'new' ? 'active' : ''}`}
                    onClick={() => setStockMovementModal(prev => ({
                      ...prev,
                      mode: 'new',
                      quantity: '',
                      totalOrderQty: '',
                      selectedOrderId: undefined,
                      partyName: '',
                      referenceNo: '',
                      error: undefined
                    }))}
                  >
                    <Plus size={14} /> Naya Order / Direct Entry
                  </button>
                  <button
                    type="button"
                    className={`movement-mode-btn ${stockMovementModal.mode === 'fulfill_pending' ? 'active' : ''}`}
                    onClick={() => {
                      const firstOrd = openOrders[0];
                      setStockMovementModal(prev => ({
                        ...prev,
                        mode: 'fulfill_pending',
                        selectedOrderId: firstOrd.id,
                        totalOrderQty: firstOrd.totalExpectedQty.toString(),
                        quantity: firstOrd.pendingQty.toString(),
                        partyName: firstOrd.partyName,
                        referenceNo: firstOrd.referenceNo,
                        error: undefined
                      }));
                    }}
                  >
                    <Clock size={14} /> Pending Orders Se Receive ({openOrders.length})
                  </button>
                </div>
              )}

              {/* Error banner if any */}
              {stockMovementModal.error && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <AlertCircle size={16} />
                  <span>{stockMovementModal.error}</span>
                </div>
              )}

              <form onSubmit={handleSubmitStockMovement} className="modal-form">
                {/* CASE 1: FULFILLING FROM PENDING OPEN ORDER */}
                {stockMovementModal.mode === 'fulfill_pending' && (
                  <div style={{ backgroundColor: '#f0f9ff', padding: '14px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '16px' }}>
                    <label className="form-label" style={{ color: '#0369a1', fontWeight: 700, margin: '0 0 6px 0' }}>
                      📋 Select Active Pending Order:
                    </label>
                    <select
                      className="form-control admin-input"
                      value={stockMovementModal.selectedOrderId || (openOrders[0]?.id || '')}
                      onChange={(e) => {
                        const ord = openOrders.find(o => o.id === e.target.value);
                        if (ord) {
                          setStockMovementModal(prev => ({
                            ...prev,
                            selectedOrderId: ord.id,
                            totalOrderQty: ord.totalExpectedQty.toString(),
                            quantity: ord.pendingQty.toString(),
                            partyName: ord.partyName,
                            referenceNo: ord.referenceNo,
                            error: undefined
                          }));
                        }
                      }}
                    >
                      {openOrders.map(ord => (
                        <option key={ord.id} value={ord.id}>
                          {ord.referenceNo} - {ord.partyName} (Total: {ord.totalExpectedQty} {ord.unit} | Pending: {ord.pendingQty} {ord.unit})
                        </option>
                      ))}
                    </select>

                    {selectedOrder && (
                      <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#0369a1', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #bae6fd', paddingTop: '8px' }}>
                        <span>Order Total: <strong>{selectedOrder.totalExpectedQty} {selectedOrder.unit}</strong></span>
                        <span>Already Received: <strong>{selectedOrder.fulfilledQty} {selectedOrder.unit}</strong></span>
                        <span style={{ fontWeight: 800, color: '#0284c7' }}>Pending: {selectedOrder.pendingQty} {selectedOrder.unit}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* CASE 2: NEW DIRECT / PIPELINE ORDER - SELECT COMPLETE VS PARTIAL */}
                {stockMovementModal.mode === 'new' && (
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: '#64748b' }}>
                      Delivery Mode (Complete ya Partial):
                    </label>
                    <div className="delivery-type-grid">
                      <div
                        className={`delivery-type-card ${stockMovementModal.deliveryType === 'complete' ? 'active' : ''}`}
                        onClick={() => setStockMovementModal(prev => ({ ...prev, deliveryType: 'complete', error: undefined }))}
                      >
                        <input
                          type="radio"
                          name="deliveryType"
                          checked={stockMovementModal.deliveryType === 'complete'}
                          onChange={() => {}}
                          style={{ marginTop: '3px' }}
                        />
                        <div>
                          <div className="delivery-type-title">Complete Delivery</div>
                          <div className="delivery-type-sub">Pura stock ek hi gaadi/challan me deliver/dispatch ho raha hai.</div>
                        </div>
                      </div>

                      <div
                        className={`delivery-type-card ${stockMovementModal.deliveryType === 'partial' ? 'active' : ''}`}
                        onClick={() => setStockMovementModal(prev => ({ ...prev, deliveryType: 'partial', error: undefined }))}
                      >
                        <input
                          type="radio"
                          name="deliveryType"
                          checked={stockMovementModal.deliveryType === 'partial'}
                          onChange={() => {}}
                          style={{ marginTop: '3px' }}
                        />
                        <div>
                          <div className="delivery-type-title">Partial Delivery (Installment)</div>
                          <div className="delivery-type-sub">Pura order bada hai, abhi pehla truck/installment aaya hai.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* If Partial: Enter Total Order Expected Quantity */}
                {stockMovementModal.mode === 'new' && stockMovementModal.deliveryType === 'partial' && (
                  <div className="form-group" style={{ backgroundColor: '#fffdf7', padding: '12px 14px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', color: '#92400e' }}>
                      <span>1. Total Expected Order Quantity (Total PO / Deal) *</span>
                      <span style={{ fontWeight: 700 }}>Unit: {item.unit}</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      required
                      className="form-control admin-input"
                      placeholder={`e.g. 10 (Pura kitna order hua tha)`}
                      style={{ fontSize: '1.05rem', fontWeight: 700 }}
                      value={stockMovementModal.totalOrderQty}
                      onChange={(e) => setStockMovementModal(prev => ({ ...prev, totalOrderQty: e.target.value, error: undefined }))}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '4px' }}>
                      Total quantity to be delivered in multiple installments/trucks.
                    </div>
                  </div>
                )}

                {/* Quantity Arriving / Moving Right Now */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {stockMovementModal.mode === 'fulfill_pending'
                        ? (isIn ? 'Quantity Arriving in this Batch (+)' : 'Quantity to Dispatch in this Batch (-)')
                        : stockMovementModal.deliveryType === 'partial'
                        ? (isIn ? '2. Quantity Arrived in 1st Truck (+)' : '2. Quantity Dispatched in 1st Truck (-)')
                        : (isIn ? 'Quantity Arriving (+)' : 'Quantity to Dispatch (-)')} *
                    </span>
                    <span style={{ color: 'var(--brand-navy)', fontWeight: 700 }}>Unit: {item.unit}</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      max={!isIn ? item.currentStock : undefined}
                      required
                      autoFocus
                      className="form-control admin-input"
                      placeholder={stockMovementModal.mode === 'fulfill_pending' ? selectedOrder?.pendingQty.toString() : 'e.g. 5'}
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        paddingRight: '50px',
                        borderColor: !isIn && movingQty > item.currentStock ? '#dc2626' : undefined,
                        backgroundColor: !isIn && movingQty > item.currentStock ? '#fef2f2' : undefined
                      }}
                      value={stockMovementModal.quantity}
                      onChange={(e) => setStockMovementModal(prev => ({ ...prev, quantity: e.target.value, error: undefined }))}
                    />
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: !isIn && movingQty > item.currentStock ? '#dc2626' : '#64748b' }}>
                      {item.unit}
                    </span>
                  </div>

                  {/* Strict Dispatch Exceeded Error Banner */}
                  {!isIn && movingQty > item.currentStock && (
                    <div style={{
                      marginTop: '8px',
                      padding: '10px 14px',
                      backgroundColor: '#fef2f2',
                      border: '1.5px solid #fecaca',
                      borderRadius: '8px',
                      color: '#b91c1c',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                      <span>
                        <strong>Stock Limit Exceeded:</strong> Yard balance is only <strong>{item.currentStock} {item.unit}</strong>. You cannot dispatch {movingQty} {item.unit}!
                      </span>
                    </div>
                  )}

                  {/* Dynamic Calculation & Balance Preview */}
                  {movingQty > 0 && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                      <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>New Yard Stock:</span>
                        <strong style={{ color: isIn ? '#15803d' : (item.currentStock - movingQty < 0 ? '#b91c1c' : '#00286a'), fontSize: '0.95rem' }}>
                          {formatIndianNumber(
                            isIn ? item.currentStock + movingQty : item.currentStock - movingQty,
                            item.unit === 'MT' ? 2 : 0
                          )} {item.unit}
                        </strong>
                      </div>

                      {stockMovementModal.deliveryType === 'partial' && totalExpected > movingQty && (
                        <div style={{ fontSize: '0.82rem', color: '#b45309', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '4px', marginTop: '4px' }}>
                          <span>Pending Balance to Track:</span>
                          <strong style={{ color: '#d97706', fontSize: '0.95rem' }}>
                            {formatIndianNumber(totalExpected - movingQty, item.unit === 'MT' ? 2 : 0)} {item.unit} (Pending)
                          </strong>
                        </div>
                      )}

                      {stockMovementModal.mode === 'fulfill_pending' && selectedOrder && (
                        <div style={{ fontSize: '0.82rem', color: '#0369a1', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '4px', marginTop: '4px' }}>
                          <span>Remaining Order Balance:</span>
                          <strong style={{ color: selectedOrder.pendingQty - movingQty <= 0 ? '#15803d' : '#0284c7', fontSize: '0.95rem' }}>
                            {selectedOrder.pendingQty - movingQty <= 0 ? '0 (Order 100% Completed)' : `${formatIndianNumber(selectedOrder.pendingQty - movingQty, item.unit === 'MT' ? 2 : 0)} ${item.unit} remaining`}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {isIn ? 'Supplier / Source / Mill Name' : 'Customer / Buyer / Project Name'}
                  </label>
                  <input
                    type="text"
                    className="form-control admin-input"
                    placeholder={isIn ? 'e.g. Jindal Steel / Tata Steel / Direct Rake' : 'e.g. Hari Buildcon / Petrochem Dahej Site'}
                    value={stockMovementModal.partyName}
                    onChange={(e) => setStockMovementModal(prev => ({ ...prev, partyName: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {isIn ? 'PO Number / Challan No / Vehicle Number' : 'Invoice / Delivery Challan / Gate Pass / Vehicle'}
                  </label>
                  <input
                    type="text"
                    className="form-control admin-input"
                    placeholder="e.g. PO-8812 / GJ-16-AX-4821"
                    value={stockMovementModal.referenceNo}
                    onChange={(e) => setStockMovementModal(prev => ({ ...prev, referenceNo: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks / Loading Notes</label>
                  <input
                    type="text"
                    className="form-control admin-input"
                    placeholder="e.g. 1st trailer unloaded at Dahej Stockyard..."
                    value={stockMovementModal.notes}
                    onChange={(e) => setStockMovementModal(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="modal-action-row" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-admin)' }}>
                  <button
                    type="button"
                    onClick={() => setStockMovementModal(prev => ({ ...prev, isOpen: false, item: null, error: undefined }))}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={(!isIn && movingQty > item.currentStock) || movingQty <= 0}
                    className="btn"
                    style={{
                      backgroundColor: (!isIn && movingQty > item.currentStock) ? '#94a3b8' : (isIn ? '#16a34a' : '#00286a'),
                      color: '#ffffff',
                      fontWeight: 700,
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: (!isIn && movingQty > item.currentStock) ? 'not-allowed' : 'pointer',
                      opacity: (!isIn && movingQty > item.currentStock) ? 0.6 : 1
                    }}
                  >
                    {isIn ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    {stockMovementModal.mode === 'fulfill_pending'
                      ? (isIn ? 'Confirm Batch Receipt (+)' : 'Confirm Batch Dispatch (-)')
                      : stockMovementModal.deliveryType === 'partial'
                      ? (isIn ? 'Save Partial Inward (+)' : 'Save Partial Dispatch (-)')
                      : (isIn ? 'Save Inward Receipt (+)' : 'Confirm Outward Dispatch (-)')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* 9. ADD / EDIT INVENTORY ITEM MODAL                       */}
      {/* ======================================================== */}
      {isInventoryItemModalOpen && (
        <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="admin-modal-card animate-fade-in" style={{ maxWidth: '620px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(0, 40, 106, 0.1)', color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Boxes size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                    {editingInventoryItem ? 'Edit Inventory Material Details' : 'Add Material to Live Inventory'}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-admin-secondary)' }}>
                    Set up material tracking, opening baseline stock, and storage yard
                  </div>
                </div>
              </div>
              <button onClick={() => setIsInventoryItemModalOpen(false)} className="btn-close-modal" title="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitInventoryItem} className="modal-form">
              {/* Quick Select from Website Products */}
              {!editingInventoryItem && (
                <div className="form-group" style={{ backgroundColor: '#f0f9ff', padding: '14px', borderRadius: '8px', border: '1.5px solid #bae6fd', marginBottom: '16px' }}>
                  <label className="form-label" style={{ color: '#0369a1', fontWeight: 700, margin: '0 0 6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📦 Select Material from Products Catalog *</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284c7' }}>Only Catalog Products</span>
                  </label>
                  <select
                    required
                    className="form-control admin-input"
                    value={inventoryItemForm.selectedProductId}
                    onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="">-- Choose Product from Catalog --</option>
                    {products.map(p => {
                      const isAlreadyTracked = inventoryItems.some(inv => inv.productId === p.id || inv.productName.toLowerCase() === p.name.toLowerCase());
                      return (
                        <option key={p.id} value={p.id} disabled={isAlreadyTracked}>
                          {p.name} ({p.subcategory || p.category}){isAlreadyTracked ? ' — [Already Live in Inventory]' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Locked Product Specifications Card (Read-Only) */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    <Lock size={13} style={{ color: '#d97706' }} />
                    <span>Product Specifications (Read-Only)</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                    🔒 Managed in Products Tab
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Material / Product Name:</span>
                    <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1rem', marginTop: '2px' }}>
                      {inventoryItemForm.productName || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Please select a product from the catalog above</span>}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Category & Subcategory:</span>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.88rem', marginTop: '2px' }}>
                      {categories.find(c => c.slug === inventoryItemForm.category)?.name || inventoryItemForm.category} &bull; {inventoryItemForm.subcategory || 'General'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Measurement Unit:</span>
                    <div style={{ fontWeight: 800, color: '#00286a', fontSize: '0.88rem', marginTop: '2px' }}>
                      {inventoryItemForm.unit} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>(From Product)</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>HSN / SAC Code:</span>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#00286a', fontSize: '0.88rem', marginTop: '2px' }}>
                      {inventoryItemForm.hsn || '72149990'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={13} style={{ color: '#0284c7', flexShrink: 0 }} />
                  <span>Product name, category, and measurement unit are non-editable here. To modify them, please edit the item from the <strong>Products</strong> tab.</span>
                </div>
              </div>

              {/* CASE 1: EDITING EXISTING ITEM -> CURRENT STOCK IS STRICTLY LOCKED */}
              {editingInventoryItem && (
                <>
                  <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                        Current Live Yard Stock (Non-Editable):
                      </div>
                      <div style={{ fontWeight: 900, color: 'var(--brand-navy)', fontSize: '1.35rem', fontFamily: 'var(--font-headings)', marginTop: '2px' }}>
                        {formatIndianNumber(editingInventoryItem.currentStock, editingInventoryItem.unit === 'MT' ? 2 : 0)} <span style={{ fontSize: '0.9rem' }}>{editingInventoryItem.unit}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#e2e8f0', color: '#475569', padding: '5px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Lock size={12} /> Stock is updated via IN / OUT only
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Min Alert Threshold *</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        className="form-control admin-input"
                        placeholder="e.g. 20"
                        value={inventoryItemForm.minStockLevel}
                        onChange={(e) => setInventoryItemForm(prev => ({ ...prev, minStockLevel: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Storage Yard / Location *</label>
                      <select
                        className="form-control admin-input"
                        value={inventoryItemForm.location}
                        onChange={(e) => setInventoryItemForm(prev => ({ ...prev, location: e.target.value }))}
                      >
                        {DEFAULT_LOCATIONS.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* CASE 2: ADDING NEW INVENTORY ITEM -> SET INITIAL OPENING STOCK ONCE */}
              {!editingInventoryItem && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Initial Opening Stock *</span>
                        <span style={{ color: 'var(--brand-navy)', fontWeight: 700 }}>Unit: {inventoryItemForm.unit}</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        className="form-control admin-input"
                        placeholder="0"
                        value={inventoryItemForm.initialStock}
                        onChange={(e) => setInventoryItemForm(prev => ({ ...prev, initialStock: e.target.value }))}
                      />
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                        Initial baseline is set only once. Future updates happen via Inward/Dispatch.
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Min Alert Threshold *</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        className="form-control admin-input"
                        placeholder="e.g. 20"
                        value={inventoryItemForm.minStockLevel}
                        onChange={(e) => setInventoryItemForm(prev => ({ ...prev, minStockLevel: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Storage Yard / Location *</label>
                    <select
                      className="form-control admin-input"
                      value={inventoryItemForm.location}
                      onChange={(e) => setInventoryItemForm(prev => ({ ...prev, location: e.target.value }))}
                    >
                      {DEFAULT_LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="modal-action-row" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-admin)' }}>
                <button type="button" onClick={() => setIsInventoryItemModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingInventoryItem ? 'Save Settings' : 'Start Tracking Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. UNIVERSAL IN-APP DELETE CONFIRMATION MODAL            */}
      {/* ======================================================== */}
      {deleteTarget && (
        <div className="admin-modal-overlay" style={{ zIndex: 1200 }}>
          <div className="admin-modal-card animate-fade-in" style={{ maxWidth: '460px', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '1px solid #fecaca' }}>
              <AlertTriangle size={28} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#1e293b' }}>
              {deleteTarget.type === 'bulk_inquiries' ? 'Confirm Batch Deletion' : 'Confirm Permanent Deletion'}
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{deleteTarget.name}</strong>?
              {deleteTarget.type === 'bulk_inquiries' && ' All selected inquiries will be permanently removed from the Supabase cloud database and will never reappear upon syncing.'}
              {deleteTarget.type === 'inquiry' && ' This inquiry will be permanently deleted from the Supabase cloud database.'}
              {deleteTarget.type === 'product' && ' This will remove it from both the admin dashboard and the live website.'}
              {deleteTarget.type === 'inventory_item' && ' This will remove this material and its balance from inventory tracking.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn btn-secondary"
                disabled={isDeleting}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn"
                disabled={isDeleting}
                style={{
                  flex: 1,
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeleting ? 'Deleting...' : (deleteTarget.type === 'bulk_inquiries' ? `Delete ${deleteTarget.count || ''} Selected` : 'Yes, Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
