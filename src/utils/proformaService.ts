import { supabase } from '../supabaseClient';
import type { ProformaInvoice, ProformaItem } from './pdfGenerator';

export const LOCAL_PROFORMAS_KEY = 'shivam_steel_proformas';

export const INITIAL_PROFORMAS: ProformaInvoice[] = [
  {
    id: 'pi-766',
    invoiceNo: '766',
    date: '2026-09-01',
    modeOfPayment: 'SAME DAY',
    referenceNoDate: '',
    otherReferences: '',
    buyersOrderNo: '9724316439',
    buyersOrderDate: '2026-09-01',
    dispatchDocNo: 'PO- 1',
    deliveryNoteDate: '',
    dispatchedThrough: 'Road Transport',
    destination: 'Dahej',
    termsOfDelivery: '9724316439',
    consigneeName: 'Hari Buildcon - Ankleswer',
    consigneeAddress: 'Dahej',
    consigneeGstin: '24CBJPP0843A1Z2',
    consigneeState: 'Gujarat',
    consigneeStateCode: '24',
    buyerName: 'Hari Buildcon - Ankleswer',
    buyerAddress: 'D-70 Sunflora Residency, Nr, Krishna B/h, Apple Plaza, Ankleswer -393002',
    buyerPhones: 'M - 7600475840\nM - 9724316439',
    buyerEmail: 'haribuildcon@gmail.com',
    buyerGstin: '24CBJPP0843A1Z2',
    buyerState: 'Gujarat',
    buyerStateCode: '24',
    items: [
      {
        id: 'it-1',
        name: 'TMT / Round / Square - 7214 9990',
        description: '12 MM',
        hsn: '72149990',
        quantity: 575,
        unit: 'KG.',
        rate: 51.19,
        per: 'KG.',
        amount: 29434.25
      },
      {
        id: 'it-2',
        name: 'TMT / Round / Square - 7214 9990',
        description: '10 MM',
        hsn: '72149990',
        quantity: 1200,
        unit: 'KG.',
        rate: 51.19,
        per: 'KG.',
        amount: 61428.00
      },
      {
        id: 'it-3',
        name: 'TMT / Round / Square - 7214 9990',
        description: '8 MM',
        hsn: '72149990',
        quantity: 800,
        unit: 'KG.',
        rate: 52.71,
        per: 'KG.',
        amount: 42168.00
      }
    ],
    itemsSubtotal: 133030.25,
    loadingCharges: 2420.00,
    taxableValue: 135450.25,
    cgstRate: 9,
    cgstAmount: 12190.52,
    sgstRate: 9,
    sgstAmount: 12190.52,
    igstRate: 0,
    igstAmount: 0,
    roundOff: -0.29,
    grandTotal: 159831.00,
    totalQuantity: 2575,
    totalUnit: 'KG.',
    amountInWords: 'INR One Lakh Fifty Nine Thousand Eight Hundred Thirty One Only',
    taxAmountInWords: 'INR Twenty Four Thousand Three Hundred Eighty One and Four paise Only',
    companyName: 'DAHEJ SUPPORT',
    companyAddress: 'G/F/02, RUSHIRAJ COMPLEX, RAHIYAD CHOKDI, DAHEJ ROAD, TA-VARGRA -392130, DI-BHARUCH',
    companyUdyam: 'UDYAM-GJ-06-0040252',
    companyGstin: '24BCSPP4924R1ZN',
    companyPan: 'BCSPP4924R',
    companyState: 'Gujarat, Code : 24',
    companyEmail: 'shivamsteel2015@gmail.com',
    status: 'approved',
    createdAt: '2026-09-01T10:00:00.000Z'
  }
];

export function toProformaDbPayload(pi: ProformaInvoice) {
  const otherRefs = pi.otherReferences || (pi.inquiryId ? `INQ:${pi.inquiryId}` : '');
  return {
    id: pi.id || (pi.inquiryId ? `pi-inq-${pi.inquiryId}` : ('pi-' + Date.now())),
    invoiceNo: pi.invoiceNo || '766',
    date: pi.date || new Date().toISOString().split('T')[0],
    modeOfPayment: pi.modeOfPayment || 'SAME DAY',
    referenceNoDate: pi.referenceNoDate || '',
    otherReferences: otherRefs,
    buyersOrderNo: pi.buyersOrderNo || '',
    buyersOrderDate: pi.buyersOrderDate || '',
    dispatchDocNo: pi.dispatchDocNo || 'PO- 1',
    deliveryNoteDate: pi.deliveryNoteDate || '',
    dispatchedThrough: pi.dispatchedThrough || 'Road Transport',
    destination: pi.destination || 'Dahej',
    termsOfDelivery: pi.termsOfDelivery || '',
    consigneeName: pi.consigneeName || '',
    consigneeAddress: pi.consigneeAddress || '',
    consigneeGstin: pi.consigneeGstin || '',
    consigneeState: pi.consigneeState || 'Gujarat',
    consigneeStateCode: pi.consigneeStateCode || '24',
    buyerName: pi.buyerName || '',
    buyerAddress: pi.buyerAddress || '',
    buyerPhones: pi.buyerPhones || '',
    buyerEmail: pi.buyerEmail || '',
    buyerGstin: pi.buyerGstin || '',
    buyerState: pi.buyerState || 'Gujarat',
    buyerStateCode: pi.buyerStateCode || '24',
    items: pi.items || [],
    loadingTotal: pi.loadingCharges || 0,
    cgstRate: pi.cgstRate || 9,
    cgstAmount: pi.cgstAmount || 0,
    sgstRate: pi.sgstRate || 9,
    sgstAmount: pi.sgstAmount || 0,
    igstRate: pi.igstRate || 0,
    igstAmount: pi.igstAmount || 0,
    subTotal: pi.itemsSubtotal || 0,
    taxableAmount: pi.taxableValue || 0,
    roundOff: pi.roundOff || 0,
    grandTotal: pi.grandTotal || 0,
    amountInWords: pi.amountInWords || '',
    companyPan: pi.companyPan || 'BCSPP4924R',
    companyGstin: pi.companyGstin || '24BCSPP4924R1ZN',
    companyState: pi.companyState || 'Gujarat, Code : 24',
    created_at: pi.createdAt || new Date().toISOString()
  };
}

export function fromProformaDbRow(row: any): ProformaInvoice {
  const items: ProformaItem[] = Array.isArray(row.items) ? row.items : [];
  const totalQty = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  const totalUnit = (items.length > 0 && items[0].unit) ? items[0].unit : 'KG.';

  let derivedInquiryId = row.inquiryId;
  if (!derivedInquiryId && typeof row.otherReferences === 'string' && row.otherReferences.startsWith('INQ:')) {
    derivedInquiryId = row.otherReferences.replace('INQ:', '').trim();
  }
  if (!derivedInquiryId && typeof row.id === 'string' && row.id.startsWith('pi-inq-')) {
    derivedInquiryId = row.id.replace('pi-inq-', '').trim();
  }

  return {
    id: row.id,
    invoiceNo: row.invoiceNo || '766',
    date: row.date || new Date().toISOString().split('T')[0],
    modeOfPayment: row.modeOfPayment || 'SAME DAY',
    referenceNoDate: row.referenceNoDate || '',
    otherReferences: row.otherReferences || '',
    buyersOrderNo: row.buyersOrderNo || '',
    buyersOrderDate: row.buyersOrderDate || '',
    dispatchDocNo: row.dispatchDocNo || 'PO- 1',
    deliveryNoteDate: row.deliveryNoteDate || '',
    dispatchedThrough: row.dispatchedThrough || 'Road Transport',
    destination: row.destination || 'Dahej',
    termsOfDelivery: row.termsOfDelivery || '',
    consigneeName: row.consigneeName || '',
    consigneeAddress: row.consigneeAddress || '',
    consigneeGstin: row.consigneeGstin || '',
    consigneeState: row.consigneeState || 'Gujarat',
    consigneeStateCode: row.consigneeStateCode || '24',
    buyerName: row.buyerName || '',
    buyerAddress: row.buyerAddress || '',
    buyerPhones: row.buyerPhones || '',
    buyerEmail: row.buyerEmail || '',
    buyerGstin: row.buyerGstin || '',
    buyerState: row.buyerState || 'Gujarat',
    buyerStateCode: row.buyerStateCode || '24',
    items,
    itemsSubtotal: Number(row.subTotal) || 0,
    loadingCharges: Number(row.loadingTotal) || 0,
    taxableValue: Number(row.taxableAmount) || 0,
    cgstRate: Number(row.cgstRate) || 9,
    cgstAmount: Number(row.cgstAmount) || 0,
    sgstRate: Number(row.sgstRate) || 9,
    sgstAmount: Number(row.sgstAmount) || 0,
    igstRate: Number(row.igstRate) || 0,
    igstAmount: Number(row.igstAmount) || 0,
    roundOff: Number(row.roundOff) || 0,
    grandTotal: Number(row.grandTotal) || 0,
    totalQuantity: totalQty,
    totalUnit,
    amountInWords: row.amountInWords || '',
    taxAmountInWords: '',
    companyName: 'DAHEJ SUPPORT',
    companyAddress: 'G/F/02, RUSHIRAJ COMPLEX, RAHIYAD CHOKDI, DAHEJ ROAD, TA-VARGRA -392130, DI-BHARUCH',
    companyUdyam: 'UDYAM-GJ-06-0040252',
    companyGstin: row.companyGstin || '24BCSPP4924R1ZN',
    companyPan: row.companyPan || 'BCSPP4924R',
    companyState: row.companyState || 'Gujarat, Code : 24',
    companyEmail: 'shivamsteel2015@gmail.com',
    status: 'approved',
    createdAt: row.created_at || new Date().toISOString(),
    inquiryId: derivedInquiryId
  };
}

/**
 * Fetch all Proforma Invoices from Supabase cloud database with local storage caching
 */
export async function fetchProformasFromCloud(): Promise<ProformaInvoice[]> {
  try {
    const { data, error } = await supabase
      .from('proforma_invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      if (data.length > 0) {
        const formatted = data.map(fromProformaDbRow);
        localStorage.setItem(LOCAL_PROFORMAS_KEY, JSON.stringify(formatted));
        return formatted;
      } else {
        // Seed default proforma to cloud if empty
        const initialSeed = INITIAL_PROFORMAS.map(toProformaDbPayload);
        const { error: seedErr } = await supabase
          .from('proforma_invoices')
          .insert(initialSeed);

        if (!seedErr) {
          localStorage.setItem(LOCAL_PROFORMAS_KEY, JSON.stringify(INITIAL_PROFORMAS));
          return INITIAL_PROFORMAS;
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch proforma invoices from Supabase cloud:', err);
  }
  return getProformas();
}

/**
 * Get cached proformas from local storage synchronously
 */
export function getProformas(): ProformaInvoice[] {
  try {
    const saved = localStorage.getItem(LOCAL_PROFORMAS_KEY) || localStorage.getItem('shivam_steel_quotations');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading proformas from storage:', err);
  }
  return INITIAL_PROFORMAS;
}

/**
 * Save / Upsert a Proforma Invoice to Supabase Cloud and Local Storage
 */
export async function saveProformaToCloud(proforma: ProformaInvoice): Promise<ProformaInvoice[]> {
  const currentList = getProformas();
  const dbPayload = toProformaDbPayload(proforma);

  try {
    const { error } = await supabase
      .from('proforma_invoices')
      .upsert([dbPayload]);

    if (error) {
      console.error('Supabase upsert proforma error:', error);
    }
  } catch (err) {
    console.error('Supabase save proforma exception:', err);
  }

  const existingIdx = currentList.findIndex(p => p.id === proforma.id);
  let updatedList: ProformaInvoice[];
  if (existingIdx !== -1) {
    updatedList = currentList.map(p => p.id === proforma.id ? proforma : p);
  } else {
    updatedList = [proforma, ...currentList];
  }

  try {
    localStorage.setItem(LOCAL_PROFORMAS_KEY, JSON.stringify(updatedList));
    localStorage.setItem('shivam_steel_quotations', JSON.stringify(updatedList));
  } catch {}

  return updatedList;
}

/**
 * Delete a Proforma Invoice from Supabase Cloud and Local Storage
 */
export async function deleteProformaFromCloud(id: string): Promise<ProformaInvoice[]> {
  try {
    const { error } = await supabase
      .from('proforma_invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete proforma error:', error);
    }
  } catch (err) {
    console.error('Supabase delete proforma exception:', err);
  }

  const currentList = getProformas();
  const filtered = currentList.filter(p => p.id !== id);

  try {
    localStorage.setItem(LOCAL_PROFORMAS_KEY, JSON.stringify(filtered));
    localStorage.setItem('shivam_steel_quotations', JSON.stringify(filtered));
  } catch {}

  return filtered;
}
