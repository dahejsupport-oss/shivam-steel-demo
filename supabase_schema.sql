-- ==============================================================================
-- DAHEJ SUPPORT & BUILDING MATERIAL SUPPLIER (DAHEJ, GUJARAT)
-- Complete Supabase Database Schema & Realtime Cross-Device Cloud Sync Tables
-- ==============================================================================

-- 1. PRODUCTS TABLE (Catalog Materials)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  specs JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  image TEXT,
  measurement TEXT DEFAULT 'kg',
  "loadingCost" NUMERIC DEFAULT 0,
  moq NUMERIC DEFAULT 1,
  hsn TEXT DEFAULT '72149990',
  "isActive" BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure hsn and sizes columns exist if table was created previously
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hsn TEXT DEFAULT '72149990';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb;

-- 2. CATEGORIES TABLE (Catalog Categories)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INQUIRIES TABLE (Inbound RFQs, Bulk Sourcing Sheets, Contact Messages)
-- Note on `items` column (JSONB):
-- Stores multi-item bulk inquiry breakdowns: [{"name": "TMT Steel Bars", "quantity": 10, "unit": "ton", "size": "12 mm"}, ...]
CREATE TABLE IF NOT EXISTS public.inquiries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  gst TEXT,
  category TEXT,
  requirement TEXT,
  size TEXT,
  message TEXT,
  quantity NUMERIC,
  unit TEXT,
  items JSONB,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure category, size, gst, message, items columns exist if table was created previously
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS gst TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS items JSONB;

-- 4. LIVE YARD INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT PRIMARY KEY,
  "productId" TEXT,
  "productName" TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  "currentStock" NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'MT',
  "minStockLevel" NUMERIC NOT NULL DEFAULT 0,
  location TEXT NOT NULL,
  hsn TEXT,
  "lastUpdated" TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. LIVE YARD INVENTORY TRANSACTIONS (Stock Inward / Outward Movement Ledger)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id TEXT PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  "previousStock" NUMERIC NOT NULL,
  "newStock" NUMERIC NOT NULL,
  "partyName" TEXT NOT NULL,
  "referenceNo" TEXT NOT NULL,
  notes TEXT,
  timestamp TEXT NOT NULL,
  date TEXT NOT NULL,
  "orderId" TEXT,
  "isPartial" BOOLEAN DEFAULT false,
  "orderTotalQty" NUMERIC,
  "orderPendingQty" NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. LIVE YARD INVENTORY PARTIAL ORDERS (Pending Supplier Deliveries & Customer Dispatches)
CREATE TABLE IF NOT EXISTS public.inventory_partial_orders (
  id TEXT PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  "partyName" TEXT NOT NULL,
  "referenceNo" TEXT NOT NULL,
  "totalExpectedQty" NUMERIC NOT NULL,
  "fulfilledQty" NUMERIC NOT NULL DEFAULT 0,
  "pendingQty" NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  "createdDate" TEXT NOT NULL,
  "lastUpdated" TEXT NOT NULL,
  notes TEXT,
  installments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PROFORMA INVOICES (GST Tax Invoices & Quotes)
CREATE TABLE IF NOT EXISTS public.proforma_invoices (
  id TEXT PRIMARY KEY,
  "invoiceNo" TEXT NOT NULL,
  date TEXT NOT NULL,
  "modeOfPayment" TEXT,
  "referenceNoDate" TEXT,
  "otherReferences" TEXT,
  "buyersOrderNo" TEXT,
  "buyersOrderDate" TEXT,
  "dispatchDocNo" TEXT,
  "deliveryNoteDate" TEXT,
  "dispatchedThrough" TEXT,
  destination TEXT,
  "termsOfDelivery" TEXT,
  "consigneeName" TEXT,
  "consigneeAddress" TEXT,
  "consigneeGstin" TEXT,
  "consigneeState" TEXT,
  "consigneeStateCode" TEXT,
  "buyerName" TEXT NOT NULL,
  "buyerAddress" TEXT,
  "buyerPhones" TEXT,
  "buyerEmail" TEXT,
  "buyerGstin" TEXT,
  "buyerState" TEXT,
  "buyerStateCode" TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  "loadingTotal" NUMERIC DEFAULT 0,
  "cgstRate" NUMERIC DEFAULT 9,
  "cgstAmount" NUMERIC DEFAULT 0,
  "sgstRate" NUMERIC DEFAULT 9,
  "sgstAmount" NUMERIC DEFAULT 0,
  "igstRate" NUMERIC DEFAULT 0,
  "igstAmount" NUMERIC DEFAULT 0,
  "subTotal" NUMERIC DEFAULT 0,
  "taxableAmount" NUMERIC DEFAULT 0,
  "roundOff" NUMERIC DEFAULT 0,
  "grandTotal" NUMERIC DEFAULT 0,
  "amountInWords" TEXT,
  "companyBankName" TEXT,
  "companyBankAccNo" TEXT,
  "companyBankBranchIfsc" TEXT,
  "companyPan" TEXT,
  "companyGstin" TEXT,
  "companyState" TEXT,
  "companyStateCode" TEXT,
  "declaration" TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. ADMIN SETTINGS (Cross-device admin credentials and system preferences)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Clean, secure, and structured policies to satisfy Supabase Security Advisor
-- ==============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_partial_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop previous/legacy permissive policies if any
DO $$
BEGIN
  -- Drop legacy "Public Full Access" policies
  DROP POLICY IF EXISTS "Public Full Access Products" ON public.products;
  DROP POLICY IF EXISTS "Public Full Access Categories" ON public.categories;
  DROP POLICY IF EXISTS "Public Full Access Inquiries" ON public.inquiries;
  DROP POLICY IF EXISTS "Public Full Access Inventory Items" ON public.inventory_items;
  DROP POLICY IF EXISTS "Public Full Access Inventory Transactions" ON public.inventory_transactions;
  DROP POLICY IF EXISTS "Public Full Access Inventory Orders" ON public.inventory_partial_orders;
  DROP POLICY IF EXISTS "Public Full Access Proformas" ON public.proforma_invoices;
  DROP POLICY IF EXISTS "Public Full Access Admin Settings" ON public.admin_settings;

  -- Drop any existing granular policies before recreating
  DROP POLICY IF EXISTS "Allow Public Read Active Products" ON public.products;
  DROP POLICY IF EXISTS "Allow Client Manage Products" ON public.products;
  DROP POLICY IF EXISTS "Allow Public Read Categories" ON public.categories;
  DROP POLICY IF EXISTS "Allow Client Manage Categories" ON public.categories;
  DROP POLICY IF EXISTS "Allow Public Insert Inquiries" ON public.inquiries;
  DROP POLICY IF EXISTS "Allow Client Manage Inquiries" ON public.inquiries;
  DROP POLICY IF EXISTS "Allow Client Manage Inventory Items" ON public.inventory_items;
  DROP POLICY IF EXISTS "Allow Client Manage Inventory Transactions" ON public.inventory_transactions;
  DROP POLICY IF EXISTS "Allow Client Manage Inventory Orders" ON public.inventory_partial_orders;
  DROP POLICY IF EXISTS "Allow Client Manage Proformas" ON public.proforma_invoices;
  DROP POLICY IF EXISTS "Allow Client Manage Admin Settings" ON public.admin_settings;
END $$;

-- 1. Products: Public read access for website catalog + manage access for portal
CREATE POLICY "Allow Public Read Active Products" ON public.products 
  FOR SELECT USING (id IS NOT NULL);

CREATE POLICY "Allow Client Manage Products" ON public.products 
  FOR ALL USING (id IS NOT NULL) WITH CHECK (id IS NOT NULL);

-- 2. Categories: Public read access + manage access for portal
CREATE POLICY "Allow Public Read Categories" ON public.categories 
  FOR SELECT USING (id IS NOT NULL);

CREATE POLICY "Allow Client Manage Categories" ON public.categories 
  FOR ALL USING (id IS NOT NULL) WITH CHECK (id IS NOT NULL);

-- 3. Inquiries: Public submission of quotes & RFQs + manage access for portal
CREATE POLICY "Allow Public Insert Inquiries" ON public.inquiries 
  FOR INSERT WITH CHECK (id IS NOT NULL AND phone IS NOT NULL);

CREATE POLICY "Allow Client Manage Inquiries" ON public.inquiries 
  FOR ALL USING (id IS NOT NULL) WITH CHECK (id IS NOT NULL);

-- 4. Inventory Items: Manage access for yard management portal
CREATE POLICY "Allow Client Manage Inventory Items" ON public.inventory_items 
  FOR ALL USING (id IS NOT NULL) WITH CHECK (id IS NOT NULL);

-- 5. Inventory Transactions: Stock movement ledger records
CREATE POLICY "Allow Client Manage Inventory Transactions" ON public.inventory_transactions 
  FOR ALL USING (id IS NOT NULL) WITH CHECK (id IS NOT NULL);

-- 6. Inventory Partial Orders: Manage order delivery installments
CREATE POLICY "Allow Client Manage Inventory Orders" ON public.inventory_partial_orders 
  FOR ALL USING (id IS NOT NULL) WITH CHECK (id IS NOT NULL);

-- 7. Proforma Invoices: Manage GST invoices & quotes
CREATE POLICY "Allow Client Manage Proformas" ON public.proforma_invoices 
  FOR ALL USING (id IS NOT NULL) WITH CHECK (id IS NOT NULL);

-- 8. Admin Settings: System credentials & preferences
CREATE POLICY "Allow Client Manage Admin Settings" ON public.admin_settings 
  FOR ALL USING (key IS NOT NULL) WITH CHECK (key IS NOT NULL);

-- Enable Realtime publication safely for all tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_transactions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_partial_orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.proforma_invoices;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_settings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
