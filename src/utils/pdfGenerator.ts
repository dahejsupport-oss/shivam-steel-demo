import jsPDF from 'jspdf';
import { SHIVAM_STAMP_BASE64 } from './stampAsset';

export interface ProformaItem {
  id: string;
  name: string; // e.g. "TMT / Round / Square - 7214 9990"
  description?: string; // e.g. "12 MM", "10 MM", "8 MM"
  hsn: string; // default "72149990"
  quantity: number; // e.g. 575.000
  unit: string; // "KG." | "TON." | "NOS."
  rate: number; // e.g. 51.19
  per: string; // "KG." | "TON." | "NOS."
  amount: number; // quantity * rate
}

export interface ProformaInvoice {
  id: string;
  invoiceNo: string; // e.g. "766" or "SS/PI/2026/766"
  date: string; // e.g. "1-Sep-26"
  modeOfPayment: string; // e.g. "SAME DAY", "ADVANCE", "7 DAYS CREDIT"
  referenceNoDate: string; // e.g. "Ref-102 dt 01/09/2026"
  otherReferences: string;
  buyersOrderNo: string; // e.g. "9724316439" or PO#
  buyersOrderDate: string; // e.g. "1-Sep-26"
  dispatchDocNo: string; // e.g. "PO- 1"
  deliveryNoteDate: string;
  dispatchedThrough: string; // e.g. "Road / Truck Transport"
  destination: string; // e.g. "Dahej" / "Bharuch"
  termsOfDelivery: string; // e.g. "9724316439"

  // Consignee (Ship to)
  consigneeName: string; // e.g. "Hari Buildcon - Ankleswer"
  consigneeAddress: string; // e.g. "Dahej"
  consigneeGstin: string; // e.g. "24CBJPP0843A1Z2"
  consigneeState: string; // "Gujarat"
  consigneeStateCode: string; // "24"

  // Buyer (Bill to)
  buyerName: string; // e.g. "Hari Buildcon - Ankleswer"
  buyerAddress: string; // e.g. "D-70 Sunflora Residency, Nr, Krishna B/h, Apple Plaza, Ankleswer -393002"
  buyerPhones: string; // e.g. "M - 7600475840\nM - 9724316439"
  buyerEmail?: string;
  buyerGstin: string; // e.g. "24CBJPP0843A1Z2"
  buyerState: string; // "Gujarat"
  buyerStateCode: string; // "24"

  // Line items
  items: ProformaItem[];

  // Charges & Calculations
  itemsSubtotal: number;
  loadingCharges: number; // e.g. 2420.00
  taxableValue: number; // itemsSubtotal + loadingCharges
  cgstRate: number; // 9%
  cgstAmount: number;
  sgstRate: number; // 9%
  sgstAmount: number;
  igstRate: number; // 0% or 18%
  igstAmount: number;
  roundOff: number; // e.g. -0.29
  grandTotal: number; // e.g. 159831.00
  totalQuantity: number; // e.g. 2575.000
  totalUnit: string; // "KG." | "TON." | "NOS."

  // In Words
  amountInWords: string;
  taxAmountInWords: string;

  // Company Details
  companyName: string;
  companyAddress: string;
  companyUdyam: string;
  companyGstin: string;
  companyPan: string;
  companyState: string;
  companyEmail: string;

  status: 'draft' | 'sent' | 'approved';
  createdAt: string;
  inquiryId?: string;
}

// Backward compatibility QuotationItem & Quotation interfaces
export interface QuotationItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  loadingPerUnit: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  date: string;
  validUntil: string;
  inquiryId?: string;
  clientName: string;
  clientCompany: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  clientGstin?: string;
  items: QuotationItem[];
  subtotal: number;
  totalLoading: number;
  transportCharges: number;
  discount: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
  notes: string;
  status: 'draft' | 'sent' | 'approved' | 'completed';
  createdAt: string;
}

// Convert Number to Indian Words with Paise support
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num === 0) return 'INR Zero Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(val: number): string {
    let str = '';
    if (val > 19) {
      str += b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '');
    } else {
      str += a[val];
    }
    return str;
  }

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  const crore = Math.floor(integerPart / 10000000);
  let rem = integerPart % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundred = Math.floor(rem / 100);
  const ones = rem % 100;

  let words = '';
  if (crore > 0) words += convertGroup(crore) + ' Crore ';
  if (lakh > 0) words += convertGroup(lakh) + ' Lakh ';
  if (thousand > 0) words += convertGroup(thousand) + ' Thousand ';
  if (hundred > 0) words += convertGroup(hundred) + ' Hundred ';
  if (ones > 0) words += (words !== '' ? '' : '') + convertGroup(ones) + ' ';

  words = words.trim();
  if (!words) words = 'Zero';

  let result = 'INR ' + words;
  if (decimalPart > 0) {
    result += ' and ' + convertGroup(decimalPart) + ' paise';
  }
  result += ' Only';
  return result;
}

// Format Currency with commas in Indian numbering
export function formatIndianNumber(val: number, decimals: number = 2): string {
  if (isNaN(val)) return '0.00';
  const parts = val.toFixed(decimals).split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return decimals > 0 ? `${formatted}.${parts[1]}` : formatted;
}

/**
 * Recalculate all totals, loading charges, CGST, SGST, IGST, Round-off, and Grand Total
 */
export function calculateProformaCalculations(
  items: ProformaItem[],
  loadingCharges: number = 0,
  isInterstate: boolean = false,
  taxRate: number = 18
): {
  itemsSubtotal: number;
  loadingCharges: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  roundOff: number;
  grandTotal: number;
  totalQuantity: number;
  amountInWords: string;
  taxAmountInWords: string;
} {
  let itemsSubtotal = 0;
  let totalQuantity = 0;

  items.forEach(it => {
    const itAmt = Number(it.quantity || 0) * Number(it.rate || 0);
    itemsSubtotal += itAmt;
    totalQuantity += Number(it.quantity || 0);
  });

  const taxableValue = itemsSubtotal + Number(loadingCharges || 0);

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isInterstate) {
    igstRate = taxRate;
    igstAmount = (taxableValue * igstRate) / 100;
  } else {
    cgstRate = taxRate / 2;
    sgstRate = taxRate / 2;
    cgstAmount = (taxableValue * cgstRate) / 100;
    sgstAmount = (taxableValue * sgstRate) / 100;
  }

  const rawTotal = taxableValue + cgstAmount + sgstAmount + igstAmount;
  const roundedGrandTotal = Math.round(rawTotal);
  const roundOff = Number((roundedGrandTotal - rawTotal).toFixed(2));
  const grandTotal = roundedGrandTotal;

  const totalTax = cgstAmount + sgstAmount + igstAmount;

  return {
    itemsSubtotal: Number(itemsSubtotal.toFixed(2)),
    loadingCharges: Number(Number(loadingCharges || 0).toFixed(2)),
    taxableValue: Number(taxableValue.toFixed(2)),
    cgstRate,
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstRate,
    sgstAmount: Number(sgstAmount.toFixed(2)),
    igstRate,
    igstAmount: Number(igstAmount.toFixed(2)),
    roundOff,
    grandTotal,
    totalQuantity: Number(totalQuantity.toFixed(3)),
    amountInWords: numberToIndianWords(grandTotal),
    taxAmountInWords: numberToIndianWords(totalTax)
  };
}

/**
 * Format Current Date in "1-Sep-26" standard invoice format
 */
export function formatProformaDate(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];

  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear().toString().slice(-2);

  return `${day}-${month}-${year}`;
}

/**
 * Build the jsPDF Document with 1:1 Official Company Template
 */
export function buildProformaPDFDocument(invoice: ProformaInvoice): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // A4 dimensions: 210 x 297 mm
  // Outer Border Box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(8, 8, 194, 280);

  // Top Header: "PROFORMA INVOICE"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('PROFORMA INVOICE', 105, 13, { align: 'center' });
  doc.line(8, 15, 202, 15);

  // Split left (company/buyer) and right (dispatch/order details) at X = 100
  doc.line(100, 15, 100, 100);

  // ----------------------------------------------------
  // LEFT COLUMN: Company Info + Consignee + Buyer
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(invoice.companyName || 'DAHEJ SUPPORT', 11, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  const companyLines = [
    'G/F/02, RUSHIRAJ COMPLEX,',
    'RAHIYAD CHOKDI',
    'DAHEJ ROAD',
    'TA-VARGRA -392130',
    'DI-BHARUCH',
    'UDYAM-GJ-06-0040252',
    `GSTIN/UIN: ${invoice.companyGstin || '24BCSPP4924R1ZN'}`,
    `State Name : ${invoice.companyState || 'Gujarat, Code : 24'}`,
    `E-Mail : ${invoice.companyEmail || 'shivamsteel2015@gmail.com'}`
  ];
  companyLines.forEach((l, i) => doc.text(l, 11, 23.5 + (i * 2.8)));

  // Consignee (Ship to)
  doc.line(8, 49, 100, 49);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Consignee (Ship to)', 11, 52.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(invoice.consigneeName || invoice.buyerName || 'Client Name', 11, 56, { maxWidth: 86 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const consigneeAddr = invoice.consigneeAddress || 'Dahej Site, Dahej';
  doc.text(consigneeAddr.substring(0, 50), 11, 59.5, { maxWidth: 86 });
  doc.text(`GSTIN/UIN   : ${invoice.consigneeGstin || invoice.buyerGstin || 'URP'}`, 11, 63.5);
  doc.text(`State Name  : ${invoice.consigneeState || 'Gujarat'}, Code : ${invoice.consigneeStateCode || '24'}`, 11, 66.5);

  // Buyer (Bill to)
  doc.line(8, 69.5, 100, 69.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Buyer (Bill to)', 11, 73);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(invoice.buyerName || 'Buyer Company / Client Name', 11, 76.5, { maxWidth: 86 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  const buyerAddr = invoice.buyerAddress || 'Dahej PCPIR Industrial Region, Gujarat';
  const addrLines = doc.splitTextToSize(buyerAddr, 86);
  if (addrLines.length > 0) doc.text(addrLines[0], 11, 80);
  if (addrLines.length > 1) doc.text(addrLines[1], 11, 83);

  const phoneText = invoice.buyerPhones || 'M - 9724316439';
  const phoneLines = doc.splitTextToSize(phoneText, 86);
  phoneLines.forEach((p: string, idx: number) => {
    doc.text(p, 11, 86 + (idx * 2.8));
  });

  const buyerGstY = 86 + (phoneLines.length * 2.8);
  doc.text(`GSTIN/UIN   : ${invoice.buyerGstin || 'URP'}`, 11, buyerGstY);
  doc.text(`State Name  : ${invoice.buyerState || 'Gujarat'}, Code : ${invoice.buyerStateCode || '24'}`, 11, buyerGstY + 3);

  // ----------------------------------------------------
  // RIGHT COLUMN: Invoice Metadata Grid (x = 100 to 202)
  // ----------------------------------------------------
  doc.line(151, 15, 151, 85);
  doc.line(100, 27, 202, 27);
  doc.line(100, 39, 202, 39);
  doc.line(100, 51, 202, 51);
  doc.line(100, 63, 202, 63);
  doc.line(100, 74, 202, 74);
  doc.line(100, 85, 202, 85);

  function drawGridCell(x: number, y: number, label: string, val: string, isBoldVal: boolean = true) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text(label, x + 2, y + 3.5);
    if (val) {
      doc.setFont('helvetica', isBoldVal ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      doc.text(val, x + 2, y + 8);
    }
  }

  drawGridCell(100, 15, 'Invoice No.', invoice.invoiceNo || '766');
  drawGridCell(151, 15, 'Dated', formatProformaDate(invoice.date));
  drawGridCell(100, 27, 'Delivery Note', '');
  drawGridCell(151, 27, 'Mode/Terms of Payment', invoice.modeOfPayment || 'SAME DAY');
  drawGridCell(100, 39, 'Reference No. & Date.', invoice.referenceNoDate || '');
  drawGridCell(151, 39, 'Other References', invoice.otherReferences || '');
  drawGridCell(100, 51, 'Buyer’s Order No.', invoice.buyersOrderNo || invoice.buyerPhones?.replace(/[^\d]/g, '').slice(0, 10) || '9724316439');
  drawGridCell(151, 51, 'Dated', formatProformaDate(invoice.buyersOrderDate || invoice.date));
  drawGridCell(100, 63, 'Dispatch Doc No.', invoice.dispatchDocNo || 'PO- 1');
  drawGridCell(151, 63, 'Delivery Note Date', invoice.deliveryNoteDate || '');
  drawGridCell(100, 74, 'Dispatched through', invoice.dispatchedThrough || 'Road Transport');
  drawGridCell(151, 74, 'Destination', invoice.destination || 'Dahej');
  drawGridCell(100, 85, 'Terms of Delivery', invoice.termsOfDelivery || invoice.buyersOrderNo || '9724316439');

  // ----------------------------------------------------
  // LINE ITEMS TABLE (y = 100 to 198)
  // ----------------------------------------------------
  doc.line(8, 100, 202, 100);
  doc.line(8, 107, 202, 107);

  // Column vertical lines
  const tableColX = [8, 16, 96, 118, 142, 164, 176, 202];
  tableColX.forEach(x => {
    if (x > 8 && x < 202) doc.line(x, 100, x, 198);
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Sl\nNo.', 12, 103, { align: 'center' });
  doc.text('Description of Goods', 18, 104.5);
  doc.text('HSN/SAC', 107, 104.5, { align: 'center' });
  doc.text('Quantity', 130, 104.5, { align: 'center' });
  doc.text('Rate', 153, 104.5, { align: 'center' });
  doc.text('per', 170, 104.5, { align: 'center' });
  doc.text('Amount', 189, 104.5, { align: 'center' });

  // Render Line Items
  let curItemY = 111;
  invoice.items.forEach((item, index) => {
    if (curItemY > 142) return;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text((index + 1).toString(), 12, curItemY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text(item.name, 18, curItemY, { maxWidth: 76 });

    if (item.description) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.8);
      doc.text(item.description, 18, curItemY + 3.5, { maxWidth: 76 });
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(item.hsn || '72149990', 107, curItemY, { align: 'center' });
    doc.text(`${formatIndianNumber(item.quantity, 3)} ${item.unit || 'KG.'}`, 140, curItemY, { align: 'right' });
    doc.text(formatIndianNumber(item.rate, 2), 162, curItemY, { align: 'right' });
    doc.text(item.per || item.unit || 'KG.', 170, curItemY, { align: 'center' });
    doc.text(formatIndianNumber(item.amount, 2), 198, curItemY, { align: 'right' });

    curItemY += item.description ? 8 : 6;
  });

  // Material Subtotal line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(formatIndianNumber(invoice.itemsSubtotal, 2), 198, 148, { align: 'right' });

  // Loading & Unloading Charges
  if (invoice.loadingCharges > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Loading & Unloading Charges', 94, 154, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(formatIndianNumber(invoice.loadingCharges, 2), 198, 154, { align: 'right' });
  }

  // Taxes
  if (invoice.igstAmount > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text(`IGST @ ${invoice.igstRate}%`, 94, 160, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice.igstRate} %`, 170, 160, { align: 'center' });
    doc.text(formatIndianNumber(invoice.igstAmount, 2), 198, 160, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text(`CGST @ ${invoice.cgstRate}%`, 94, 160, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice.cgstRate} %`, 170, 160, { align: 'center' });
    doc.text(formatIndianNumber(invoice.cgstAmount, 2), 198, 160, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(`SGST @ ${invoice.sgstRate}%`, 94, 166, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice.sgstRate} %`, 170, 166, { align: 'center' });
    doc.text(formatIndianNumber(invoice.sgstAmount, 2), 198, 166, { align: 'right' });
  }

  // Round Off
  if (invoice.roundOff !== 0) {
    doc.setFont('helvetica', 'normal');
    doc.text('Less :', 18, 172);
    doc.setFont('helvetica', 'bold');
    doc.text('Round Off', 94, 172, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    const roundOffStr = invoice.roundOff < 0 ? `(-)${Math.abs(invoice.roundOff).toFixed(2)}` : `(+) ${invoice.roundOff.toFixed(2)}`;
    doc.text(roundOffStr, 198, 172, { align: 'right' });
  }

  // Table Total Row
  doc.line(8, 198, 202, 198);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Total', 94, 202.5, { align: 'right' });
  doc.text(`${formatIndianNumber(invoice.totalQuantity, 3)} ${invoice.totalUnit || 'KG.'}`, 140, 202.5, { align: 'right' });
  doc.setFontSize(8.5);
  doc.text(formatIndianNumber(invoice.grandTotal, 2), 198, 202.5, { align: 'right' });
  doc.line(8, 205, 202, 205);

  // ----------------------------------------------------
  // AMOUNT IN WORDS BOX
  // ----------------------------------------------------
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text('Amount Chargeable (in words)', 11, 209);
  doc.text('E. & O.E', 198, 209, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(invoice.amountInWords || numberToIndianWords(invoice.grandTotal), 11, 213.5);
  doc.line(8, 216, 202, 216);

  // ----------------------------------------------------
  // HSN / SAC TAX BREAKDOWN TABLE
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('HSN/SAC', 24, 219.5, { align: 'center' });
  doc.text('Taxable\nValue', 57.5, 218.5, { align: 'center' });

  if (invoice.igstAmount > 0) {
    doc.text('Integrated Tax (IGST)', 120, 218.5, { align: 'center' });
  } else {
    doc.text('Central Tax', 97.5, 218.5, { align: 'center' });
    doc.text('State Tax', 143, 218.5, { align: 'center' });
  }
  doc.text('Total\nTax Amount', 184, 218.5, { align: 'center' });

  doc.line(8, 222, 202, 222);
  doc.setFontSize(6.2);
  if (invoice.igstAmount > 0) {
    doc.text('Rate', 108, 225, { align: 'center' });
    doc.text('Amount', 132, 225, { align: 'center' });
  } else {
    doc.text('Rate', 85.5, 225, { align: 'center' });
    doc.text('Amount', 108, 225, { align: 'center' });
    doc.text('Rate', 131, 225, { align: 'center' });
    doc.text('Amount', 154, 225, { align: 'center' });
  }
  doc.line(8, 226.5, 202, 226.5);

  // Tax Table Grid Lines
  const taxGridLines = [8, 40, 75, 96, 120, 142, 166, 202];
  taxGridLines.forEach(x => {
    if (x > 8 && x < 202) doc.line(x, 216, x, 237);
  });

  const totalTaxAmount = invoice.cgstAmount + invoice.sgstAmount + invoice.igstAmount;

  // Tax Table Row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(invoice.items[0]?.hsn || '72149990', 24, 230, { align: 'center' });
  doc.text(formatIndianNumber(invoice.taxableValue, 2), 73, 230, { align: 'right' });

  if (invoice.igstAmount > 0) {
    doc.text(`${invoice.igstRate}%`, 108, 230, { align: 'center' });
    doc.text(formatIndianNumber(invoice.igstAmount, 2), 140, 230, { align: 'right' });
  } else {
    doc.text(`${invoice.cgstRate}%`, 85.5, 230, { align: 'center' });
    doc.text(formatIndianNumber(invoice.cgstAmount, 2), 118, 230, { align: 'right' });
    doc.text(`${invoice.sgstRate}%`, 131, 230, { align: 'center' });
    doc.text(formatIndianNumber(invoice.sgstAmount, 2), 164, 230, { align: 'right' });
  }
  doc.text(formatIndianNumber(totalTaxAmount, 2), 198, 230, { align: 'right' });

  // Tax Table Total Row
  doc.line(8, 232.5, 202, 232.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 24, 235.5, { align: 'center' });
  doc.text(formatIndianNumber(invoice.taxableValue, 2), 73, 235.5, { align: 'right' });

  if (invoice.igstAmount > 0) {
    doc.text(formatIndianNumber(invoice.igstAmount, 2), 140, 235.5, { align: 'right' });
  } else {
    doc.text(formatIndianNumber(invoice.cgstAmount, 2), 118, 235.5, { align: 'right' });
    doc.text(formatIndianNumber(invoice.sgstAmount, 2), 164, 235.5, { align: 'right' });
  }
  doc.text(formatIndianNumber(totalTaxAmount, 2), 198, 235.5, { align: 'right' });
  doc.line(8, 237, 202, 237);

  // Tax Words & Company PAN
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text('Tax Amount (in words)  :  ', 11, 241);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.taxAmountInWords || numberToIndianWords(totalTaxAmount), 42, 241);

  doc.setFont('helvetica', 'normal');
  doc.text('Company’s PAN             :  ', 11, 245);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.companyPan || 'BCSPP4924R', 42, 245);
  doc.line(8, 247.5, 202, 247.5);

  // ----------------------------------------------------
  // DECLARATIONS & OFFICIAL SIGNATORY STAMP
  // ----------------------------------------------------
  doc.line(115, 247.5, 115, 281);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Declaration', 11, 251.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  const declarationLines = [
    '(1) Not responsible for short weight or measuree',
    'loss, Damage etc. After goods have been',
    'delivered from our godown. (2) 24% Intrest will be',
    'charged on All Account Remaining Unpaid after',
    'Delivery. (3) Payment Should be made in Rahiyad',
    '- Bharuch Only. (4) Goods once sold will note be taken back.'
  ];
  declarationLines.forEach((dl, i) => doc.text(dl, 11, 255 + (i * 2.8)));

  // Signatory Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`for ${invoice.companyName || 'DAHEJ SUPPORT'}`, 198, 252, { align: 'right' });

  // Embedded Official User Stamp Image (Exact stamp provided by user)
  doc.addImage(SHIVAM_STAMP_BASE64, 'PNG', 145, 253, 44, 23.25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Authorised Signatory', 198, 279, { align: 'right' });

  // Bottom text
  doc.setFontSize(6.8);
  doc.text('This is a Computer Generated Invoice', 105, 284.5, { align: 'center' });

  return doc;
}

/**
 * Generate and Download Official PROFORMA INVOICE PDF File
 */
export function generateProformaInvoicePDF(invoice: ProformaInvoice): void {
  const doc = buildProformaPDFDocument(invoice);
  const cleanInvNo = (invoice.invoiceNo || '766').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanClient = (invoice.buyerName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  const fileName = `Shivam_Steel_Proforma_Invoice_${cleanInvNo}_${cleanClient}.pdf`;

  try {
    const rawDataUri = doc.output('datauristring');
    const dataUri = rawDataUri.replace('filename=generated.pdf', `filename=${fileName}`);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.style.display = 'none';
    downloadAnchor.href = dataUri;
    downloadAnchor.download = fileName;
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();

    setTimeout(() => {
      if (document.body.contains(downloadAnchor)) {
        document.body.removeChild(downloadAnchor);
      }
    }, 1500);
  } catch (err) {
    console.warn('Data URI download fallback to doc.save:', err);
    doc.save(fileName);
  }
}

/**
 * Open Proforma Invoice directly in a new browser tab for immediate view/print
 */
export function openProformaPDFInNewTab(invoice: ProformaInvoice): void {
  const doc = buildProformaPDFDocument(invoice);
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const win = window.open(blobUrl, '_blank');
  if (!win) {
    doc.save(`Shivam_Steel_Proforma_Invoice_${invoice.invoiceNo || '766'}.pdf`);
  }
}

// Legacy PDF Generator for backward compatibility
export function generateQuotationPDF(quote: Quotation): void {
  // Convert Quotation into ProformaInvoice and generate the exact official template
  const proformaItems: ProformaItem[] = quote.items.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    hsn: '72149990',
    quantity: item.quantity,
    unit: item.unit.toUpperCase() === 'KG' ? 'KG.' : (item.unit.toUpperCase() === 'TON' ? 'TON.' : 'NOS.'),
    rate: item.unitPrice,
    per: item.unit.toUpperCase() === 'KG' ? 'KG.' : (item.unit.toUpperCase() === 'TON' ? 'TON.' : 'NOS.'),
    amount: item.quantity * item.unitPrice
  }));

  const calcs = calculateProformaCalculations(
    proformaItems,
    quote.totalLoading || 0,
    false,
    quote.gstRate || 18
  );

  const proforma: ProformaInvoice = {
    id: quote.id,
    invoiceNo: quote.quotationNumber.replace(/^SS\/EST\/\d+\//, '') || '766',
    date: quote.date,
    modeOfPayment: 'SAME DAY',
    referenceNoDate: '',
    otherReferences: '',
    buyersOrderNo: quote.clientPhone || '9724316439',
    buyersOrderDate: quote.date,
    dispatchDocNo: 'PO- 1',
    deliveryNoteDate: '',
    dispatchedThrough: 'Road Transport',
    destination: 'Dahej',
    termsOfDelivery: quote.clientPhone || '9724316439',
    consigneeName: quote.clientCompany || quote.clientName,
    consigneeAddress: quote.clientAddress || 'Dahej Site, Gujarat',
    consigneeGstin: quote.clientGstin || '24CBJPP0843A1Z2',
    consigneeState: 'Gujarat',
    consigneeStateCode: '24',
    buyerName: quote.clientCompany || quote.clientName,
    buyerAddress: quote.clientAddress || 'Dahej Site, Gujarat',
    buyerPhones: quote.clientPhone ? `M - ${quote.clientPhone}` : 'M - 9724316439',
    buyerEmail: quote.clientEmail,
    buyerGstin: quote.clientGstin || '24CBJPP0843A1Z2',
    buyerState: 'Gujarat',
    buyerStateCode: '24',
    items: proformaItems,
    itemsSubtotal: calcs.itemsSubtotal,
    loadingCharges: calcs.loadingCharges,
    taxableValue: calcs.taxableValue,
    cgstRate: calcs.cgstRate,
    cgstAmount: calcs.cgstAmount,
    sgstRate: calcs.sgstRate,
    sgstAmount: calcs.sgstAmount,
    igstRate: calcs.igstRate,
    igstAmount: calcs.igstAmount,
    roundOff: calcs.roundOff,
    grandTotal: calcs.grandTotal,
    totalQuantity: calcs.totalQuantity,
    totalUnit: proformaItems[0]?.unit || 'KG.',
    amountInWords: calcs.amountInWords,
    taxAmountInWords: calcs.taxAmountInWords,
    companyName: 'DAHEJ SUPPORT',
    companyAddress: 'G/F/02, RUSHIRAJ COMPLEX, RAHIYAD CHOKDI, DAHEJ ROAD, TA-VARGRA -392130, DI-BHARUCH',
    companyUdyam: 'UDYAM-GJ-06-0040252',
    companyGstin: '24BCSPP4924R1ZN',
    companyPan: 'BCSPP4924R',
    companyState: 'Gujarat, Code : 24',
    companyEmail: 'shivamsteel2015@gmail.com',
    status: quote.status === 'completed' ? 'approved' : quote.status,
    createdAt: quote.createdAt,
    inquiryId: quote.inquiryId
  };

  generateProformaInvoicePDF(proforma);
}
