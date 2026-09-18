import { supabase } from '../supabaseClient';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export type MeasurementUnit = 'nos' | 'kg' | 'ton' | 'foot' | 'bundles' | 'mtr' | 'sheets' | string;

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  specs: string[];
  sizes?: string[]; // Multiple available sizes / dimensions
  isActive: boolean;
  image: string;
  measurement: MeasurementUnit;
  loadingCost: number;
  moq: number;
  hsn?: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-industrial', name: 'Industrial Hardware & Tools', slug: 'industrial' },
  { id: 'cat-piping', name: 'Piping, Valves & Fittings', slug: 'piping' },
  { id: 'cat-safety', name: 'Safety & PPE Supplies', slug: 'safety' },
  { id: 'cat-steel', name: 'Structural & Fabrication Steel', slug: 'steel' },
  { id: 'cat-building', name: 'Civil & Building Materials', slug: 'building' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-piping-valves',
    name: 'Industrial Class 150/300 Flanged Ball & Butterfly Valves',
    category: 'piping',
    subcategory: 'Valves & Flow Control',
    description: 'Heavy duty forged carbon steel and stainless steel industrial valves for chemical, steam, and water pipeline systems.',
    specs: ['Ratings: Class 150, Class 300, PN16', 'Sizes: 1" to 12" NB', 'MOC: WCB, CF8M (SS316), CI'],
    sizes: ['1" NB (25mm)', '1.5" NB (40mm)', '2" NB (50mm)', '3" NB (80mm)', '4" NB (100mm)', '6" NB (150mm)', '8" NB (200mm)'],
    isActive: true,
    image: '/products/prod_pipes.jpg',
    measurement: 'nos',
    loadingCost: 50,
    moq: 2,
    hsn: '84818030'
  },
  {
    id: 'prod-safety-gear',
    name: 'Industrial Safety PPE Kit (ISI Helmets, Shoes & Fall Harness)',
    category: 'safety',
    subcategory: 'PPE & Plant Safety',
    description: 'Complete certified industrial safety kits including IS-compliant safety helmets, steel-toe shoes, full body harness, and hi-vis reflective vests.',
    specs: ['Standards: IS 2925, IS 15298, EN 361', 'Pack: Standard plant safety bundle', 'High durability & chemical resistance'],
    sizes: ['Size 7 (Shoes)', 'Size 8 (Shoes)', 'Size 9 (Shoes)', 'Size 10 (Shoes)', 'Universal Fit Helmets', 'Double Lanyard Harness'],
    isActive: true,
    image: '/customer_support.jpg',
    measurement: 'nos',
    loadingCost: 10,
    moq: 10,
    hsn: '65061090'
  },
  {
    id: 'prod-fasteners',
    name: 'High-Tensile Industrial Fasteners & Hex Bolts (Grade 8.8 / 10.9)',
    category: 'industrial',
    subcategory: 'Fasteners & Hardware',
    description: 'Precision hot-dip galvanized and black phosphated high tensile bolts, stud bolts, and nuts for structural and mechanical joints.',
    specs: ['Grades: 8.8, 10.9, 12.9, SS 304/316', 'Thread: Metric coarse / fine standard', 'Anti-corrosive coating available'],
    sizes: ['M12 x 50mm', 'M16 x 65mm', 'M20 x 80mm', 'M24 x 100mm', 'M30 x 120mm', 'Foundation J-Bolts'],
    isActive: true,
    image: '/products/prod_angles.jpg',
    measurement: 'kg',
    loadingCost: 5,
    moq: 50,
    hsn: '73181500'
  },
  {
    id: 'prod-4',
    name: 'MS & GI Industrial Pipes (ERW, Seamless & Structural Tubes)',
    category: 'piping',
    subcategory: 'Pipes & Fittings',
    description: 'Heavy duty round, square, and rectangular hollow sections and schedule pipes for plant utility lines, framing, and fabrication.',
    specs: ['Types: ERW Heavy Class, Seamless, RHS, SHS', 'Wall Thickness: 2mm to 12mm', 'Standards: IS 1239, IS 3589, ASTM A106'],
    sizes: ['1/2" (15mm NB)', '3/4" (20mm NB)', '1" (25mm NB)', '1.5" (40mm NB)', '2" (50mm NB)', '3" (80mm NB)', '4" (100mm NB)', '6" (150mm NB)', '50x50 SHS', '80x40 RHS'],
    isActive: true,
    image: '/products/prod_pipes.jpg',
    measurement: 'nos',
    loadingCost: 15,
    moq: 20,
    hsn: '73066100'
  },
  {
    id: 'prod-1',
    name: 'TMT Steel Bars (Fe 500D / Fe 550D)',
    category: 'steel',
    subcategory: 'TMT Bars',
    description: 'High-strength thermo-mechanically treated reinforcement bars for concrete structures, infrastructure, and heavy foundations.',
    specs: ['Grades: Fe 500D, Fe 550D, Fe 600', 'Sizes: 8mm to 32mm diameter', 'Standard length: 12 meters'],
    sizes: ['8 mm', '10 mm', '12 mm', '16 mm', '20 mm', '25 mm', '32 mm'],
    isActive: true,
    image: '/products/prod_tmt.jpg',
    measurement: 'ton',
    loadingCost: 350,
    moq: 5,
    hsn: '72149990'
  },
  {
    id: 'prod-2',
    name: 'Mild Steel (MS) Angles & Channels',
    category: 'steel',
    subcategory: 'Angles & Channels',
    description: 'Structural steel components designed for construction framing, fabrication supports, and general engineering work.',
    specs: ['Angles: 25x25x3mm to 200x200x20mm', 'Channels: ISMC 75 to ISMC 400', 'Grades: IS 2062 E250 / E350'],
    sizes: ['25x25x3 mm', '35x35x5 mm', '40x40x5 mm', '50x50x6 mm', '65x65x6 mm', '75x75x6 mm', 'ISMC 75', 'ISMC 100', 'ISMC 125', 'ISMC 150', 'ISMC 200'],
    isActive: true,
    image: '/products/prod_angles.jpg',
    measurement: 'kg',
    loadingCost: 2,
    moq: 200,
    hsn: '72162100'
  },
  {
    id: 'prod-3',
    name: 'Hot Rolled Steel Plates (HR Plates)',
    category: 'steel',
    subcategory: 'Steel Plates',
    description: 'Thick steel plates for industrial fabrication, storage tanks, machinery foundations, and structural loads.',
    specs: ['Thickness: 5mm to 100mm', 'Width: 1250mm to 2500mm', 'Grades: IS 2062, ASTM A36'],
    sizes: ['5 mm', '6 mm', '8 mm', '10 mm', '12 mm', '16 mm', '20 mm', '25 mm', '32 mm', '40 mm', '50 mm'],
    isActive: true,
    image: '/products/prod_plates.jpg',
    measurement: 'ton',
    loadingCost: 400,
    moq: 3,
    hsn: '72083990'
  },
  {
    id: 'prod-9',
    name: 'Structural MS Beams & Joists (I-Beams / H-Beams)',
    category: 'steel',
    subcategory: 'Structural Beams',
    description: 'Heavy duty steel beams providing load-bearing support for roofs, ceilings, industrial sheds, and multi-story structures.',
    specs: ['Sizes: NPB 100 to NPB 600', 'Grades: E250 / E350 BR', 'Available in standard lengths'],
    sizes: ['ISMB 100', 'ISMB 125', 'ISMB 150', 'ISMB 200', 'ISMB 250', 'ISMB 300', 'ISMB 400', 'NPB 150', 'NPB 200'],
    isActive: true,
    image: '/products/prod_beams.jpg',
    measurement: 'ton',
    loadingCost: 380,
    moq: 5,
    hsn: '72163100'
  },
  {
    id: 'prod-6',
    name: 'Industrial Binding Wire & Welding Consumables',
    category: 'industrial',
    subcategory: 'Welding & Wire',
    description: 'Annealed binding wire, wire mesh, and shielded metal arc welding electrodes for industrial fabrication and structural assembly.',
    specs: ['Electrodes: E6013, E7018 standard', 'Wire: 16 SWG, 18 SWG, 20 SWG', 'High tensile strength & smooth arc'],
    sizes: ['16 SWG', '18 SWG', '20 SWG', 'Welding Rod 2.5mm', 'Welding Rod 3.15mm', 'Welding Rod 4.0mm'],
    isActive: true,
    image: '/products/prod_wire.jpg',
    measurement: 'kg',
    loadingCost: 4,
    moq: 50,
    hsn: '72171010'
  },
  {
    id: 'prod-10',
    name: 'Refractory Fire Bricks & Insulation Materials',
    category: 'industrial',
    subcategory: 'Thermal & Refractory',
    description: 'Industrial grade thermal insulation bricks and binding mortar for lining kilns, furnaces, and high-heat fabrication areas.',
    specs: ['Temperature resistance: up to 1400°C', 'Sizes: Standard 9x4.5x3 inches', 'Material: Fireclay high-alumina content'],
    sizes: ['Standard (9x4.5x3 inch)', 'Side Arch', 'End Arch'],
    isActive: true,
    image: '/products/prod_firebricks.jpg',
    measurement: 'nos',
    loadingCost: 5,
    moq: 200,
    hsn: '69022000'
  }
];

function toProductDbPayload(product: Product): { full: Record<string, any>; safe: Record<string, any> } {
  // Ensure HSN and SIZES are encoded in specs array as resilient fallback
  const cleanSpecs = Array.isArray(product.specs)
    ? product.specs.filter(s => typeof s === 'string' && !s.toLowerCase().startsWith('hsn') && !s.startsWith('SIZES_JSON:'))
    : [];

  if (product.hsn) {
    cleanSpecs.push(`HSN: ${product.hsn}`);
  }
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    cleanSpecs.push(`SIZES_JSON:${JSON.stringify(product.sizes)}`);
  }

  const baseFields = {
    id: product.id,
    name: product.name,
    category: product.category,
    subcategory: product.subcategory || '',
    description: product.description || '',
    specs: cleanSpecs,
    image: product.image || '/products/prod_tmt.jpg',
    measurement: product.measurement || 'ton',
    loadingCost: Number(product.loadingCost) || 0,
    moq: Number(product.moq) || 1,
    isActive: product.isActive !== false
  };

  return {
    full: {
      ...baseFields,
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      hsn: product.hsn || '72149990'
    },
    safe: baseFields
  };
}

function mapRowToProduct(row: any): Product {
  let hsn = row.hsn;
  let sizes: string[] = [];
  const rawSpecs: string[] = Array.isArray(row.specs) ? row.specs : [];
  const displaySpecs: string[] = [];

  for (const s of rawSpecs) {
    if (typeof s === 'string') {
      if (s.startsWith('SIZES_JSON:')) {
        try {
          const parsed = JSON.parse(s.replace('SIZES_JSON:', ''));
          if (Array.isArray(parsed) && sizes.length === 0) {
            sizes = parsed.map(x => String(x).trim()).filter(Boolean);
          }
        } catch {}
      } else if (s.toLowerCase().startsWith('hsn')) {
        if (!hsn) {
          hsn = s.replace(/hsn(\s*code)?\s*:\s*/i, '').trim();
        }
      } else {
        displaySpecs.push(s);
      }
    }
  }

  if (sizes.length === 0) {
    if (Array.isArray(row.sizes)) {
      sizes = row.sizes.map((s: any) => String(s).trim()).filter(Boolean);
    } else if (typeof row.sizes === 'string') {
      try {
        const parsed = JSON.parse(row.sizes);
        if (Array.isArray(parsed)) {
          sizes = parsed.map((s: any) => String(s).trim()).filter(Boolean);
        }
      } catch {
        sizes = row.sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
  }

  return {
    id: row.id,
    name: row.name || 'Unnamed Product',
    category: row.category || 'steel',
    subcategory: row.subcategory || 'General Supply',
    description: row.description || '',
    specs: displaySpecs,
    sizes: sizes,
    image: row.image || '/products/prod_tmt.jpg',
    measurement: row.measurement || 'ton',
    loadingCost: Number(row.loadingCost) || 0,
    moq: Number(row.moq) || 1,
    isActive: row.isActive !== false,
    hsn: hsn || '72149990'
  };
}

const LOCAL_PRODUCTS_KEY = 'shivam_steel_products';
const LOCAL_CATEGORIES_KEY = 'shivam_steel_categories';

/**
 * Fetch products from Supabase and synchronize with localStorage cache.
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (!error && Array.isArray(data)) {
      if (data.length > 0) {
        const mappedList: Product[] = data.map(mapRowToProduct);
        // Sort: newest created products first or by id
        const sorted = mappedList.sort((a, b) => {
          const isTimestampA = a.id.startsWith('prod-1');
          const isTimestampB = b.id.startsWith('prod-1');
          if (isTimestampA && !isTimestampB) return -1;
          if (!isTimestampA && isTimestampB) return 1;
          const numA = parseInt(a.id.replace(/\D/g, '')) || 999999;
          const numB = parseInt(b.id.replace(/\D/g, '')) || 999999;
          return numA - numB;
        });
        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(sorted));
        return sorted;
      } else {
        // Check if first-time seed is needed
        const hasInitialized = localStorage.getItem('shivam_catalog_initialized');
        if (!hasInitialized) {
          const seedPayload = INITIAL_PRODUCTS.map(p => toProductDbPayload(p).safe);
          const { error: seedErr } = await supabase
            .from('products')
            .upsert(seedPayload);
          if (!seedErr) {
            localStorage.setItem('shivam_catalog_initialized', 'true');
            localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
            return INITIAL_PRODUCTS;
          }
        }
        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify([]));
        return [];
      }
    }
  } catch (err) {
    console.warn('Failed to fetch products from Supabase, checking local cache:', err);
  }

  // Fallback to local storage if available
  try {
    const cached = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (cached !== null && cached !== undefined) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(mapRowToProduct);
      }
    }
  } catch {}

  const hasInit = localStorage.getItem('shivam_catalog_initialized');
  if (!hasInit) {
    localStorage.setItem('shivam_catalog_initialized', 'true');
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }

  return [];
}

/**
 * Fetch categories from Supabase and synchronize with localStorage cache.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (!error && Array.isArray(data)) {
      if (data.length > 0) {
        localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(data));
        return data as Category[];
      } else {
        const hasInitialized = localStorage.getItem('shivam_catalog_initialized');
        if (!hasInitialized) {
          const { error: seedErr } = await supabase
            .from('categories')
            .upsert(DEFAULT_CATEGORIES);
          if (!seedErr) {
            localStorage.setItem('LOCAL_CATEGORIES_KEY', JSON.stringify(DEFAULT_CATEGORIES));
            return DEFAULT_CATEGORIES;
          }
        }
        localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify([]));
        return [];
      }
    }
  } catch (err) {
    console.warn('Failed to fetch categories from Supabase, checking local cache:', err);
  }

  // Fallback to local storage
  try {
    const cached = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}

  localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
  return DEFAULT_CATEGORIES;
}

/**
 * Save (create or update) a product both in Supabase cloud and localStorage cache.
 */
export async function saveProduct(product: Product, _isNew: boolean): Promise<Product[]> {
  const { full, safe } = toProductDbPayload(product);

  try {
    // Attempt upsert with full payload
    let { error } = await supabase
      .from('products')
      .upsert([full]);

    // If PostgREST fails due to schema cache missing column (PGRST204), fallback to safe payload
    if (error && error.code === 'PGRST204') {
      console.warn('Retrying product save with safe schema-compatible payload:', error.message);
      const safeRes = await supabase
        .from('products')
        .upsert([safe]);
      error = safeRes.error;
    }

    if (error) {
      console.error('Supabase save product error:', error);
    } else {
      console.log('Product saved successfully to Supabase cloud table:', product.name);
    }
  } catch (err) {
    console.error('Supabase save product exception:', err);
  }

  // Fetch updated list from Supabase or update local storage
  return await getProducts();
}

/**
 * Toggle product active status both in Supabase and localStorage.
 */
export async function toggleProductActive(id: string, newActiveState: boolean): Promise<Product[]> {
  try {
    const { error } = await supabase
      .from('products')
      .update({ isActive: newActiveState })
      .eq('id', id);
    if (error) console.error('Supabase toggle error:', error);
  } catch (err) {
    console.error('Failed to toggle product status in Supabase:', err);
  }

  let currentList: Product[] = [];
  try {
    const cached = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (cached) currentList = JSON.parse(cached);
  } catch {}

  const updatedList = currentList.map(p => (p.id === id ? { ...p, isActive: newActiveState } : p));
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(updatedList));
  return updatedList;
}

/**
 * Delete a product both from Supabase and localStorage.
 */
export async function deleteProduct(id: string): Promise<Product[]> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) console.error('Supabase delete error:', error);
  } catch (err) {
    console.error('Failed to delete product in Supabase:', err);
  }

  let currentList: Product[] = [];
  try {
    const cached = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (cached) currentList = JSON.parse(cached);
  } catch {}

  const updatedList = currentList.filter(p => p.id !== id);
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(updatedList));
  return updatedList;
}

/**
 * Save (create or update) a category both in Supabase and localStorage.
 */
export async function saveCategory(category: Category, isNew: boolean): Promise<Category[]> {
  const catPayload = {
    id: category.id,
    name: category.name,
    slug: category.slug
  };

  try {
    if (isNew) {
      const { error } = await supabase.from('categories').insert([catPayload]);
      if (error) console.error('Supabase save category error:', error);
    } else {
      const { error } = await supabase
        .from('categories')
        .update(catPayload)
        .eq('id', category.id);
      if (error) console.error('Supabase update category error:', error);
    }
  } catch (err) {
    console.error('Supabase save category exception:', err);
  }

  let currentList: Category[] = [];
  try {
    const cached = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (cached) currentList = JSON.parse(cached);
  } catch {}

  let updatedList: Category[];
  if (isNew) {
    updatedList = [...currentList, category];
  } else {
    updatedList = currentList.map(c => (c.id === category.id ? category : c));
  }

  localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(updatedList));
  return updatedList;
}

/**
 * Delete a category both from Supabase and localStorage.
 */
export async function deleteCategory(id: string): Promise<Category[]> {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) console.error('Supabase delete category error:', error);
  } catch (err) {
    console.error('Failed to delete category in Supabase:', err);
  }

  let currentList: Category[] = [];
  try {
    const cached = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (cached) currentList = JSON.parse(cached);
  } catch {}

  const updatedList = currentList.filter(c => c.id !== id);
  localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(updatedList));
  return updatedList;
}
