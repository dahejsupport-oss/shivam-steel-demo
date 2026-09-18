import { supabase } from '../supabaseClient';

export interface InventoryItem {
  id: string;
  productId?: string;
  productName: string;
  category: string;
  subcategory?: string;
  currentStock: number;
  unit: string;
  minStockLevel: number;
  location: string;
  hsn?: string;
  lastUpdated: string;
}

export interface InventoryOrderInstallment {
  id: string;
  date: string;
  timestamp: string;
  quantity: number;
  vehicleOrChallanNo: string;
  notes?: string;
}

export interface InventoryPartialOrder {
  id: string;
  itemId: string;
  productName: string;
  type: 'IN' | 'OUT';
  partyName: string;            // Supplier (for IN) or Customer / Project (for OUT)
  referenceNo: string;          // PO / Challan / SO / Gate Pass No
  totalExpectedQty: number;     // Total expected/booked quantity (e.g. 10 MT)
  fulfilledQty: number;         // Delivered so far (e.g. 6 MT)
  pendingQty: number;           // Remaining to receive/dispatch (e.g. 4 MT)
  unit: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdDate: string;
  lastUpdated: string;
  notes?: string;
  installments: InventoryOrderInstallment[];
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  productName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  unit: string;
  previousStock: number;
  newStock: number;
  partyName: string; // Supplier (for IN) or Customer / Transporter (for OUT)
  referenceNo: string; // Challan / Vehicle / PO / Invoice No
  notes?: string;
  timestamp: string;
  date: string;
  orderId?: string;
  isPartial?: boolean;
  orderTotalQty?: number;
  orderPendingQty?: number;
}

const LOCAL_INVENTORY_ITEMS_KEY = 'shivam_steel_inventory_items';
const LOCAL_INVENTORY_LOGS_KEY = 'shivam_steel_inventory_transactions';
const LOCAL_INVENTORY_ORDERS_KEY = 'shivam_steel_inventory_partial_orders';
const LOCAL_INVENTORY_INIT_KEY = 'shivam_steel_inventory_initialized';

export const DEFAULT_LOCATIONS = [
  'Dahej Stockyard (Godown 2)',
  'Main Yard (Rahiyad Chokdi)',
  'Dahej GIDC Central Warehouse',
  'Secondary Storage Yard'
];

export const DEFAULT_UNITS = [
  { label: 'Metric Tonnes (MT / Ton)', value: 'MT' },
  { label: 'Kilograms (KG)', value: 'KG' },
  { label: 'Foot / Running Feet (Foot / FT)', value: 'Foot' },
  { label: 'Pieces / Numbers (Nos / Pcs)', value: 'Nos' },
  { label: 'Bundles', value: 'Bundles' },
  { label: 'Meters (Mtr)', value: 'Mtr' },
  { label: 'Sheets', value: 'Sheets' }
];

export function mapProductMeasurementToUnit(measurement?: string): string {
  if (!measurement) return 'MT';
  const m = measurement.toLowerCase().trim();
  if (m === 'ton' || m === 'tonne' || m === 'mt') return 'MT';
  if (m === 'kg' || m === 'kilogram' || m === 'kgs') return 'KG';
  if (m === 'foot' || m === 'feet' || m === 'ft' || m === 'rft') return 'Foot';
  if (m === 'nos' || m === 'numbers' || m === 'pcs' || m === 'pieces') return 'Nos';
  if (m === 'bundles' || m === 'bundle') return 'Bundles';
  if (m === 'mtr' || m === 'meter' || m === 'meters') return 'Mtr';
  if (m === 'sheets' || m === 'sheet') return 'Sheets';
  return measurement.toUpperCase();
}

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'inv-1',
    productId: 'prod-1',
    productName: 'TMT Steel Bars (Fe 500D / Fe 550D - 8mm to 32mm)',
    category: 'steel',
    subcategory: 'TMT Bars',
    currentStock: 0,
    unit: 'MT',
    minStockLevel: 25,
    location: 'Dahej Stockyard (Godown 2)',
    hsn: '72149990',
    lastUpdated: '2026-09-07T10:00:00.000Z'
  },
  {
    id: 'inv-2',
    productId: 'prod-2',
    productName: 'Mild Steel (MS) Angles & ISMC Channels',
    category: 'steel',
    subcategory: 'Angles & Channels',
    currentStock: 0,
    unit: 'KG',
    minStockLevel: 10000,
    location: 'Dahej Stockyard (Godown 2)',
    hsn: '72162100',
    lastUpdated: '2026-09-07T09:30:00.000Z'
  },
  {
    id: 'inv-3',
    productId: 'prod-3',
    productName: 'Hot Rolled Steel Plates (IS 2062 Grade)',
    category: 'steel',
    subcategory: 'Steel Plates',
    currentStock: 0,
    unit: 'MT',
    minStockLevel: 15,
    location: 'Dahej Stockyard (Godown 2)',
    hsn: '72083990',
    lastUpdated: '2026-09-06T16:00:00.000Z'
  },
  {
    id: 'inv-4',
    productId: 'prod-4',
    productName: 'MS Heavy Hollow Pipes & Structural Tubes (ERW)',
    category: 'steel',
    subcategory: 'Pipes',
    currentStock: 0,
    unit: 'Nos',
    minStockLevel: 300,
    location: 'Main Yard (Rahiyad Chokdi)',
    hsn: '73066100',
    lastUpdated: '2026-09-05T14:20:00.000Z'
  },
  {
    id: 'inv-5',
    productId: 'prod-5',
    productName: 'Galvanized Iron (GI) Plain & Corrugated Roofing Sheets',
    category: 'steel',
    subcategory: 'Sheets & Coils',
    currentStock: 0,
    unit: 'Sheets',
    minStockLevel: 150,
    location: 'Main Yard (Rahiyad Chokdi)',
    hsn: '72104900',
    lastUpdated: '2026-09-04T11:00:00.000Z'
  },
  {
    id: 'inv-6',
    productId: 'prod-6',
    productName: 'Universal Heavy Beams & Columns (ISMB / NPB)',
    category: 'steel',
    subcategory: 'Beams & Columns',
    currentStock: 0,
    unit: 'MT',
    minStockLevel: 10,
    location: 'Dahej Stockyard (Godown 2)',
    hsn: '72163300',
    lastUpdated: '2026-09-03T17:45:00.000Z'
  },
  {
    id: 'inv-7',
    productId: 'prod-7',
    productName: 'OPC & PPC 53 Grade Construction Cement (50kg Bags)',
    category: 'building-materials',
    subcategory: 'Cement & Binding',
    currentStock: 0,
    unit: 'Bundles',
    minStockLevel: 500,
    location: 'Dahej GIDC Central Warehouse',
    hsn: '25232910',
    lastUpdated: '2026-09-07T08:00:00.000Z'
  },
  {
    id: 'inv-8',
    productId: 'prod-8',
    productName: 'Stainless Steel (SS 304 / 316) Seamless Pipes & Flanges',
    category: 'pipes-fittings',
    subcategory: 'SS Pipes & Flanges',
    currentStock: 0,
    unit: 'Mtr',
    minStockLevel: 200,
    location: 'Dahej GIDC Central Warehouse',
    hsn: '73044100',
    lastUpdated: '2026-09-02T13:10:00.000Z'
  }
];

export const INITIAL_PARTIAL_ORDERS: InventoryPartialOrder[] = [];

export const INITIAL_TRANSACTIONS: InventoryTransaction[] = [];

/**
 * Fetch Inventory Items from Supabase Cloud Table with LocalStorage Fallback
 */
export async function fetchInventoryItemsFromCloud(): Promise<InventoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*');

    if (!error && Array.isArray(data)) {
      if (data.length > 0) {
        localStorage.setItem(LOCAL_INVENTORY_ITEMS_KEY, JSON.stringify(data));
        localStorage.setItem(LOCAL_INVENTORY_INIT_KEY, 'true');
        return data as InventoryItem[];
      } else {
        // Table exists but is empty - check if seed is needed
        const hasInit = localStorage.getItem(LOCAL_INVENTORY_INIT_KEY);
        if (!hasInit) {
          const { error: seedErr } = await supabase
            .from('inventory_items')
            .insert(INITIAL_INVENTORY_ITEMS);
          if (!seedErr) {
            localStorage.setItem(LOCAL_INVENTORY_ITEMS_KEY, JSON.stringify(INITIAL_INVENTORY_ITEMS));
            localStorage.setItem(LOCAL_INVENTORY_INIT_KEY, 'true');
            return INITIAL_INVENTORY_ITEMS;
          }
        }
        localStorage.setItem(LOCAL_INVENTORY_ITEMS_KEY, JSON.stringify([]));
        return [];
      }
    }
  } catch (err) {
    console.warn('Could not fetch inventory items from Supabase cloud:', err);
  }
  return getInventoryItems();
}

/**
 * Fetch Inventory Transactions from Supabase Cloud Table with LocalStorage Fallback
 */
export async function fetchInventoryTransactionsFromCloud(): Promise<InventoryTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .order('timestamp', { ascending: false });

    if (!error && Array.isArray(data)) {
      localStorage.setItem(LOCAL_INVENTORY_LOGS_KEY, JSON.stringify(data));
      return data as InventoryTransaction[];
    }
  } catch (err) {
    console.warn('Could not fetch inventory transactions from Supabase cloud:', err);
  }
  return getInventoryTransactions();
}

/**
 * Fetch Partial Orders from Supabase Cloud Table with LocalStorage Fallback
 */
export async function fetchInventoryPartialOrdersFromCloud(): Promise<InventoryPartialOrder[]> {
  try {
    const { data, error } = await supabase
      .from('inventory_partial_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      localStorage.setItem(LOCAL_INVENTORY_ORDERS_KEY, JSON.stringify(data));
      return data as InventoryPartialOrder[];
    }
  } catch (err) {
    console.warn('Could not fetch partial orders from Supabase cloud:', err);
  }
  return getInventoryPartialOrders();
}

/**
 * Get all inventory items from storage synchronously
 */
export function getInventoryItems(): InventoryItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_INVENTORY_ITEMS_KEY);
    if (saved !== null && saved !== undefined) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading inventory items from storage:', err);
  }

  const hasInitialized = localStorage.getItem(LOCAL_INVENTORY_INIT_KEY);
  if (!hasInitialized) {
    localStorage.setItem(LOCAL_INVENTORY_INIT_KEY, 'true');
    localStorage.setItem(LOCAL_INVENTORY_ITEMS_KEY, JSON.stringify(INITIAL_INVENTORY_ITEMS));
    return INITIAL_INVENTORY_ITEMS;
  }

  return [];
}

/**
 * Save inventory items to local storage
 */
export function saveInventoryItems(items: InventoryItem[]): void {
  try {
    localStorage.setItem(LOCAL_INVENTORY_ITEMS_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving inventory items to storage:', err);
  }
}

/**
 * Get all partial orders from storage
 */
export function getInventoryPartialOrders(): InventoryPartialOrder[] {
  try {
    const saved = localStorage.getItem(LOCAL_INVENTORY_ORDERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading partial orders from storage:', err);
  }
  localStorage.setItem(LOCAL_INVENTORY_ORDERS_KEY, JSON.stringify(INITIAL_PARTIAL_ORDERS));
  return INITIAL_PARTIAL_ORDERS;
}

/**
 * Save partial orders to local storage
 */
export function saveInventoryPartialOrders(orders: InventoryPartialOrder[]): void {
  try {
    localStorage.setItem(LOCAL_INVENTORY_ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Error saving partial orders to storage:', err);
  }
}

/**
 * Get all inventory transactions
 */
export function getInventoryTransactions(): InventoryTransaction[] {
  try {
    const saved = localStorage.getItem(LOCAL_INVENTORY_LOGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading inventory transactions from storage:', err);
  }
  localStorage.setItem(LOCAL_INVENTORY_LOGS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
  return INITIAL_TRANSACTIONS;
}

/**
 * Save inventory transactions
 */
export function saveInventoryTransactions(transactions: InventoryTransaction[]): void {
  try {
    localStorage.setItem(LOCAL_INVENTORY_LOGS_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Error saving inventory transactions to storage:', err);
  }
}

/**
 * Get pending orders for a specific item (or all pending orders)
 */
export function getPendingOrdersForItem(itemId?: string, type?: 'IN' | 'OUT'): InventoryPartialOrder[] {
  const orders = getInventoryPartialOrders();
  return orders.filter(o => {
    if (o.status !== 'PENDING') return false;
    if (itemId && o.itemId !== itemId) return false;
    if (type && o.type !== type) return false;
    return o.pendingQty > 0;
  });
}

/**
 * Calculate total pending incoming and outgoing quantities for a product
 */
export function getPendingStockSummary(itemId: string): {
  pendingIn: number;
  pendingOut: number;
  activeInOrdersCount: number;
  activeOutOrdersCount: number;
} {
  const openOrders = getPendingOrdersForItem(itemId);
  let pendingIn = 0;
  let pendingOut = 0;
  let activeInOrdersCount = 0;
  let activeOutOrdersCount = 0;

  openOrders.forEach(o => {
    if (o.type === 'IN') {
      pendingIn += o.pendingQty;
      activeInOrdersCount++;
    } else if (o.type === 'OUT') {
      pendingOut += o.pendingQty;
      activeOutOrdersCount++;
    }
  });

  return {
    pendingIn: Math.round(pendingIn * 100) / 100,
    pendingOut: Math.round(pendingOut * 100) / 100,
    activeInOrdersCount,
    activeOutOrdersCount
  };
}

/**
 * Record stock movement with automatic dual local & cloud synchronization
 */
export function recordStockMovement(params: {
  itemId: string;
  type: 'IN' | 'OUT';
  quantity: number;            // Quantity physically moving right now
  isPartial?: boolean;         // True if this is a partial shipment
  totalOrderQty?: number;      // Total expected/booked order quantity
  partyName?: string;          // Supplier or Customer
  referenceNo?: string;        // PO, Challan, Vehicle, Gate Pass
  notes?: string;
  existingOrderId?: string;    // If fulfilling a pending partial order
}): {
  success: boolean;
  message: string;
  updatedItem?: InventoryItem;
  newTransaction?: InventoryTransaction;
  partialOrder?: InventoryPartialOrder;
} {
  const items = getInventoryItems();
  const itemIndex = items.findIndex(i => i.id === params.itemId);

  if (itemIndex === -1) {
    return { success: false, message: 'Material/Product not found in inventory registry.' };
  }

  const targetItem = items[itemIndex];
  const movingQty = Number(params.quantity);

  if (isNaN(movingQty) || movingQty <= 0) {
    return { success: false, message: 'Please enter a valid positive quantity greater than 0.' };
  }

  // Stock Out Validation: prevent yard balance going negative
  if (params.type === 'OUT' && movingQty > targetItem.currentStock) {
    return {
      success: false,
      message: `Insufficient stock in yard! Available balance is ${targetItem.currentStock} ${targetItem.unit}, but dispatch quantity entered is ${movingQty} ${targetItem.unit}.`
    };
  }

  const previousStock = targetItem.currentStock;
  const newStock = params.type === 'IN'
    ? Math.round((previousStock + movingQty) * 100) / 100
    : Math.round((previousStock - movingQty) * 100) / 100;

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ', ' + now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const orders = getInventoryPartialOrders();
  let affectedOrder: InventoryPartialOrder | undefined;
  let orderTotalQty = params.totalOrderQty || movingQty;
  let orderPendingQty = 0;

  // Case A: Fulfilling an existing pending order
  if (params.existingOrderId) {
    const existingOrderIdx = orders.findIndex(o => o.id === params.existingOrderId);
    if (existingOrderIdx !== -1) {
      const order = orders[existingOrderIdx];
      const newFulfilled = Math.min(order.totalExpectedQty, Math.round((order.fulfilledQty + movingQty) * 100) / 100);
      const newPending = Math.max(0, Math.round((order.totalExpectedQty - newFulfilled) * 100) / 100);

      const installment: InventoryOrderInstallment = {
        id: 'inst-' + Date.now(),
        date: formattedDate,
        timestamp: now.toISOString(),
        quantity: movingQty,
        vehicleOrChallanNo: params.referenceNo?.trim() || 'Fulfillment installment',
        notes: params.notes?.trim()
      };

      affectedOrder = {
        ...order,
        fulfilledQty: newFulfilled,
        pendingQty: newPending,
        status: newPending === 0 ? 'COMPLETED' : 'PENDING',
        lastUpdated: now.toISOString(),
        installments: [...(order.installments || []), installment]
      };

      orders[existingOrderIdx] = affectedOrder;
      saveInventoryPartialOrders(orders);

      // Async push to Supabase
      (async () => {
        try {
          await supabase.from('inventory_partial_orders').upsert(affectedOrder);
        } catch {}
      })();

      orderTotalQty = affectedOrder.totalExpectedQty;
      orderPendingQty = affectedOrder.pendingQty;
    }
  }
  // Case B: Creating a new partial order
  else if (params.isPartial && params.totalOrderQty && params.totalOrderQty > movingQty) {
    const totalExpected = Number(params.totalOrderQty);
    const pending = Math.max(0, Math.round((totalExpected - movingQty) * 100) / 100);

    const installment: InventoryOrderInstallment = {
      id: 'inst-' + Date.now(),
      date: formattedDate,
      timestamp: now.toISOString(),
      quantity: movingQty,
      vehicleOrChallanNo: params.referenceNo?.trim() || '1st Installment',
      notes: params.notes?.trim()
    };

    affectedOrder = {
      id: 'ord-' + Date.now(),
      itemId: targetItem.id,
      productName: targetItem.productName,
      type: params.type,
      partyName: params.partyName?.trim() || (params.type === 'IN' ? 'Supplier' : 'Customer'),
      referenceNo: params.referenceNo?.trim() || 'PO/SO Order',
      totalExpectedQty: totalExpected,
      fulfilledQty: movingQty,
      pendingQty: pending,
      unit: targetItem.unit,
      status: pending === 0 ? 'COMPLETED' : 'PENDING',
      createdDate: formattedDate,
      lastUpdated: now.toISOString(),
      notes: params.notes?.trim(),
      installments: [installment]
    };

    orders.unshift(affectedOrder);
    saveInventoryPartialOrders(orders);

    // Async push to Supabase
    (async () => {
      try {
        await supabase.from('inventory_partial_orders').insert([affectedOrder]);
      } catch {}
    })();

    orderTotalQty = totalExpected;
    orderPendingQty = pending;
  }

  // 1. Create Transaction Log
  const newTransaction: InventoryTransaction = {
    id: 'tx-' + Date.now(),
    itemId: targetItem.id,
    productName: targetItem.productName,
    type: params.type,
    quantity: movingQty,
    unit: targetItem.unit,
    previousStock,
    newStock,
    partyName: params.partyName?.trim() || (params.type === 'IN' ? 'Stock Receipt / Inward' : 'Direct Dispatch / Sale'),
    referenceNo: params.referenceNo?.trim() || 'Direct Yard Entry',
    notes: params.notes?.trim(),
    timestamp: now.toISOString(),
    date: formattedDate,
    orderId: affectedOrder?.id,
    isPartial: params.isPartial || (affectedOrder !== undefined && orderPendingQty > 0),
    orderTotalQty,
    orderPendingQty
  };

  // 2. Update Item Current Stock
  const updatedItem: InventoryItem = {
    ...targetItem,
    currentStock: newStock,
    lastUpdated: now.toISOString()
  };

  items[itemIndex] = updatedItem;
  saveInventoryItems(items);

  const transactions = getInventoryTransactions();
  const updatedTransactions = [newTransaction, ...transactions];
  saveInventoryTransactions(updatedTransactions);

  // Async cloud push for item stock & transaction
  (async () => {
    try {
      await supabase
        .from('inventory_items')
        .update({
          currentStock: newStock,
          lastUpdated: now.toISOString()
        })
        .eq('id', targetItem.id);
    } catch {}

    try {
      await supabase
        .from('inventory_transactions')
        .insert([newTransaction]);
    } catch {}
  })();

  let successMsg = '';
  if (params.type === 'IN') {
    successMsg = `Added +${movingQty} ${targetItem.unit} to ${targetItem.productName}. Yard Balance: ${newStock} ${targetItem.unit}.`;
    if (orderPendingQty > 0) {
      successMsg += ` (Pending balance to arrive: ${orderPendingQty} ${targetItem.unit})`;
    }
  } else {
    successMsg = `Dispatched -${movingQty} ${targetItem.unit} from ${targetItem.productName}. Yard Balance: ${newStock} ${targetItem.unit}.`;
    if (orderPendingQty > 0) {
      successMsg += ` (Pending balance to dispatch: ${orderPendingQty} ${targetItem.unit})`;
    }
  }

  return {
    success: true,
    message: successMsg,
    updatedItem,
    newTransaction,
    partialOrder: affectedOrder
  };
}

/**
 * Cancel or close a pending order manually
 */
export function cancelPartialOrder(orderId: string): boolean {
  const orders = getInventoryPartialOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    const updatedOrder: InventoryPartialOrder = {
      ...orders[idx],
      status: 'CANCELLED',
      lastUpdated: new Date().toISOString()
    };
    orders[idx] = updatedOrder;
    saveInventoryPartialOrders(orders);

    (async () => {
      try {
        await supabase
          .from('inventory_partial_orders')
          .update({
            status: 'CANCELLED',
            lastUpdated: updatedOrder.lastUpdated
          })
          .eq('id', orderId);
      } catch {}
    })();

    return true;
  }
  return false;
}

/**
 * Add a new product to Inventory tracking with immediate cloud & local sync
 */
export function addInventoryItem(itemData: {
  productId?: string;
  productName: string;
  category: string;
  subcategory?: string;
  initialStock: number;
  unit: string;
  minStockLevel?: number;
  location?: string;
  hsn?: string;
}): InventoryItem {
  const items = getInventoryItems();
  const now = new Date();
  const newItemId = 'inv-' + Date.now();
  const initialQty = Math.max(0, Number(itemData.initialStock) || 0);

  const newItem: InventoryItem = {
    id: newItemId,
    productId: itemData.productId,
    productName: itemData.productName.trim(),
    category: itemData.category || 'steel',
    subcategory: itemData.subcategory || 'General Materials',
    currentStock: initialQty,
    unit: itemData.unit || 'MT',
    minStockLevel: Number(itemData.minStockLevel) >= 0 ? Number(itemData.minStockLevel) : 10,
    location: itemData.location || DEFAULT_LOCATIONS[0],
    hsn: itemData.hsn || '72149990',
    lastUpdated: now.toISOString()
  };

  // Remove any stale item with same id (safety) and prepend new item
  const updatedItems = [newItem, ...items.filter(i => i.id !== newItemId)];
  saveInventoryItems(updatedItems);

  // Clean up any old orphaned pending orders for this product so it starts 100% clean as new
  const orders = getInventoryPartialOrders();
  const targetName = newItem.productName.trim().toLowerCase();
  const cleanOrders = orders.filter(o => o.itemId !== newItemId && (!o.productName || o.productName.trim().toLowerCase() !== targetName));
  saveInventoryPartialOrders(cleanOrders);

  // Cloud push to Supabase
  (async () => {
    try {
      await supabase.from('inventory_items').insert([newItem]);
    } catch {}
  })();

  // If initial stock > 0, log an initial inward baseline transaction
  if (newItem.currentStock > 0) {
    const formattedDate = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const initTx: InventoryTransaction = {
      id: 'tx-' + Date.now(),
      itemId: newItem.id,
      productName: newItem.productName,
      type: 'IN',
      quantity: newItem.currentStock,
      unit: newItem.unit,
      previousStock: 0,
      newStock: newItem.currentStock,
      partyName: 'Opening Stock Baseline',
      referenceNo: 'Initial Setup',
      notes: 'Inventory tracking baseline setup by admin',
      timestamp: now.toISOString(),
      date: formattedDate
    };

    const txs = getInventoryTransactions();
    saveInventoryTransactions([initTx, ...txs]);

    (async () => {
      try {
        await supabase.from('inventory_transactions').insert([initTx]);
      } catch {}
    })();
  }

  return newItem;
}

/**
 * Update existing Inventory Item details
 */
export function updateInventoryItem(item: InventoryItem): void {
  const items = getInventoryItems();
  const index = items.findIndex(i => i.id === item.id);
  if (index !== -1) {
    const updated = {
      ...items[index],
      minStockLevel: Number(item.minStockLevel) || 0,
      location: item.location || items[index].location,
      lastUpdated: new Date().toISOString()
    };
    items[index] = updated;
    saveInventoryItems(items);

    (async () => {
      try {
        await supabase
          .from('inventory_items')
          .update({
            minStockLevel: updated.minStockLevel,
            location: updated.location,
            lastUpdated: updated.lastUpdated
          })
          .eq('id', item.id);
      } catch {}
    })();
  }
}

/**
 * Delete an inventory item with cloud and local purge
 */
export function deleteInventoryItem(id: string): void {
  const items = getInventoryItems();
  const targetItem = items.find(i => i.id === id);
  const filtered = items.filter(i => i.id !== id);
  saveInventoryItems(filtered);

  // Cancel or clean up all associated pending partial orders for this material (both IN and OUT)
  const orders = getInventoryPartialOrders();
  const targetName = targetItem?.productName?.trim().toLowerCase();
  const updatedOrders = orders.filter(o => {
    if (o.itemId === id) return false;
    if (targetName && o.productName && o.productName.trim().toLowerCase() === targetName) return false;
    return true;
  });
  saveInventoryPartialOrders(updatedOrders);

  // Cloud delete from Supabase
  (async () => {
    try {
      await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);
    } catch {}

    try {
      await supabase
        .from('inventory_partial_orders')
        .delete()
        .eq('itemId', id);
    } catch {}
  })();
}
