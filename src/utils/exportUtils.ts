/**
 * Dahej Support & Infrastructure - Data Export Utility
 * Handles professional CSV / Excel formatted export of Inbound Material Inquiries and Contact Messages.
 */

export interface ExportInquiryItem {
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
  items?: Array<{ name: string; quantity: number; unit: string; size?: string }>;
  timestamp: string;
}

/**
 * Escapes a single cell safely for CSV (enclosing in quotes, escaping existing quotes).
 */
export function escapeCSVCell(val: string | number | undefined | null): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).trim();
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Initiates client-side file download for CSV content with UTF-8 BOM.
 */
export function downloadCSV(csvContent: string, fileName: string): void {
  // UTF-8 Byte Order Mark (\uFEFF) ensures Excel renders accented characters & Indian numbering correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports Material Inquiries (Single and/or Bulk inquiries) to a structured CSV file.
 */
export function exportMaterialInquiriesToCSV(
  inquiries: ExportInquiryItem[],
  customFileName?: string
): boolean {
  if (!inquiries || inquiries.length === 0) return false;

  const headers = [
    'Inquiry Ref ID',
    'Date & Time Received',
    'Inquiry Type',
    'Material Category',
    'Client / Contact Name',
    'Company / Firm Name',
    'GSTIN Number',
    'Contact Phone',
    'Email Address',
    'Material Requirement',
    'Size / Specification',
    'Quantity',
    'Unit',
    'Bulk Item Breakdown Details',
    'Client Notes / Message'
  ];

  const rows = inquiries.map(inq => {
    const isMultiItem = inq.items && inq.items.length > 1;
    const inquiryType = isMultiItem
      ? `Multi-Item Sourcing (${inq.items?.length} items)`
      : (inq.type === 'bulk' ? 'Bulk Sourcing Sheet' : 'Material Inquiry');
    const category = inq.category?.trim() || (isMultiItem ? 'Multi-Product Sourcing' : 'General Steel');
    const company = inq.company?.trim() || 'Individual Client';
    const gst = inq.gst?.trim() || 'N/A';
    const email = inq.email?.trim() || 'N/A';
    const size = inq.size?.trim() || 'N/A';
    const qty = inq.quantity !== undefined && inq.quantity !== null ? inq.quantity : '';
    const unit = inq.unit?.trim() || '';

    let bulkBreakdown = '';
    if (inq.items && inq.items.length > 0) {
      bulkBreakdown = inq.items
        .map((item, idx) => `[${idx + 1}] ${item.name}${item.size ? ` (${item.size})` : ''} (${item.quantity} ${item.unit || ''})`)
        .join('; ');
    } else {
      bulkBreakdown = inq.quantity ? `${inq.quantity} ${inq.unit || ''}` : 'N/A';
    }

    const notes = inq.message?.trim() || '';

    return [
      escapeCSVCell(inq.id),
      escapeCSVCell(inq.timestamp),
      escapeCSVCell(inquiryType),
      escapeCSVCell(category),
      escapeCSVCell(inq.name),
      escapeCSVCell(company),
      escapeCSVCell(gst),
      escapeCSVCell(inq.phone),
      escapeCSVCell(email),
      escapeCSVCell(inq.requirement),
      escapeCSVCell(size),
      escapeCSVCell(qty),
      escapeCSVCell(unit),
      escapeCSVCell(bulkBreakdown),
      escapeCSVCell(notes)
    ].join(',');
  });

  const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = customFileName || `Dahej_Support_Material_Inquiries_${dateStr}.csv`;

  downloadCSV(csvContent, fileName);
  return true;
}

/**
 * Extracts Contact Desk Form Submissions to a structured CSV file.
 */
export function exportContactQueriesToCSV(
  queries: ExportInquiryItem[],
  customFileName?: string
): boolean {
  if (!queries || queries.length === 0) return false;

  const headers = [
    'Message Ref ID',
    'Date & Time Received',
    'Sender Name',
    'Company / Firm Name',
    'Contact Phone',
    'Email Address',
    'Inquiry Subject',
    'Message Body / Query'
  ];

  const rows = queries.map(q => {
    const company = q.company?.trim() || 'N/A';
    const email = q.email?.trim() || 'N/A';
    const message = q.message?.trim() || q.requirement || '';

    return [
      escapeCSVCell(q.id),
      escapeCSVCell(q.timestamp),
      escapeCSVCell(q.name),
      escapeCSVCell(company),
      escapeCSVCell(q.phone),
      escapeCSVCell(email),
      escapeCSVCell(q.requirement),
      escapeCSVCell(message)
    ].join(',');
  });

  const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = customFileName || `Dahej_Support_Contact_Queries_${dateStr}.csv`;

  downloadCSV(csvContent, fileName);
  return true;
}

export interface ExportInventoryTransactionItem {
  id: string;
  itemId: string;
  productName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  unit: string;
  previousStock: number;
  newStock: number;
  partyName: string;
  referenceNo: string;
  notes?: string;
  timestamp: string;
  date: string;
  orderId?: string;
  isPartial?: boolean;
  orderTotalQty?: number;
  orderPendingQty?: number;
}

/**
 * Exports Live Yard Inventory Stock Movement Ledger (Inward & Outward Transactions) to a formatted CSV file.
 */
export function exportInventoryLedgerToCSV(
  transactions: ExportInventoryTransactionItem[],
  customFileName?: string
): boolean {
  if (!transactions || transactions.length === 0) return false;

  const headers = [
    'Txn ID',
    'Date & Time',
    'Action / Movement Type',
    'Material / Product Name',
    'Moved Quantity',
    'Unit',
    'Previous Stock Balance',
    'New Balance Stock',
    'Supplier / Party / Customer Name',
    'Challan / PO / Vehicle Ref No',
    'Delivery Mode',
    'Total Order Booked Qty',
    'Remaining Pending Qty',
    'Notes / Remarks'
  ];

  const rows = transactions.map(tx => {
    const movementType = tx.type === 'IN' ? 'INWARD (+ Maal Aaya)' : 'OUTWARD (- Maal Nikla)';
    const deliveryMode = tx.isPartial 
      ? `Partial Batch (${tx.orderPendingQty !== undefined ? `${tx.orderPendingQty} ${tx.unit} Pending` : 'Installment'})`
      : 'Complete / Full Delivery';
    const totalOrderQty = tx.orderTotalQty !== undefined && tx.orderTotalQty !== null ? `${tx.orderTotalQty} ${tx.unit}` : '-';
    const pendingQty = tx.orderPendingQty !== undefined && tx.orderPendingQty !== null ? `${tx.orderPendingQty} ${tx.unit}` : '-';
    const notes = tx.notes?.trim() || '';

    return [
      escapeCSVCell(tx.id),
      escapeCSVCell(tx.date || tx.timestamp),
      escapeCSVCell(movementType),
      escapeCSVCell(tx.productName),
      escapeCSVCell(tx.quantity),
      escapeCSVCell(tx.unit),
      escapeCSVCell(tx.previousStock),
      escapeCSVCell(tx.newStock),
      escapeCSVCell(tx.partyName),
      escapeCSVCell(tx.referenceNo),
      escapeCSVCell(deliveryMode),
      escapeCSVCell(totalOrderQty),
      escapeCSVCell(pendingQty),
      escapeCSVCell(notes)
    ].join(',');
  });

  const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = customFileName || `Dahej_Support_Inventory_Movement_Ledger_${dateStr}.csv`;

  downloadCSV(csvContent, fileName);
  return true;
}

export interface ExportProductItem {
  id: string;
  name: string;
  category: string;
  categoryName?: string;
  subcategory?: string;
  hsn?: string;
  measurement: string;
  loadingCost?: number;
  moq?: number;
  isActive: boolean;
  description?: string;
  image?: string;
}

/**
 * Exports Products & Materials Catalog to a structured CSV / Excel file.
 */
export function exportProductsToCSV(
  products: ExportProductItem[],
  categories?: Array<{ id: string; name: string; slug: string }>,
  customFileName?: string
): boolean {
  if (!products || products.length === 0) return false;

  const headers = [
    'Material Code / ID',
    'Product / Material Name',
    'Category',
    'Subcategory / Grade',
    'HSN / SAC Code',
    'Unit of Measurement',
    'Internal Loading Charge (₹/Unit)',
    'Minimum Order Quantity (MOQ)',
    'Website Visibility Status',
    'Technical Description & Specifications'
  ];

  const rows = products.map(prod => {
    const catName = prod.categoryName || categories?.find(c => c.slug === prod.category)?.name || prod.category;
    const subcat = prod.subcategory?.trim() || '-';
    const hsn = prod.hsn?.trim() || '72149990';
    const unit = prod.measurement?.toUpperCase() || 'KG';
    const loading = prod.loadingCost !== undefined && prod.loadingCost !== null ? `₹${prod.loadingCost}` : '₹0';
    const moq = prod.moq !== undefined && prod.moq !== null ? `${prod.moq} ${unit}` : `1 ${unit}`;
    const status = prod.isActive ? 'Active (Live on Website)' : 'Hidden / Inactive';
    const desc = prod.description?.trim() || '-';

    return [
      escapeCSVCell(prod.id),
      escapeCSVCell(prod.name),
      escapeCSVCell(catName),
      escapeCSVCell(subcat),
      escapeCSVCell(hsn),
      escapeCSVCell(unit),
      escapeCSVCell(loading),
      escapeCSVCell(moq),
      escapeCSVCell(status),
      escapeCSVCell(desc)
    ].join(',');
  });

  const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = customFileName || `Dahej_Support_Products_Catalog_${dateStr}.csv`;

  downloadCSV(csvContent, fileName);
  return true;
}

