import { useState, useMemo } from 'react';
import {
  RotateCcw,
  Copy,
  Check,
  Scale,
  Info,
  Layers,
  Plus,
  Trash2,
  HardHat,
  Search,
  CheckCircle2,
  ArrowRight,
  Hash,
  FileSpreadsheet
} from 'lucide-react';
import './Calculator.css';

// 12 Supported Steel Categories (TMT Rebars is now the primary featured category)
export type CategoryType = 
  | 'tmt'
  | 'angle' 
  | 'channel' 
  | 'bar' 
  | 'flat' 
  | 'sheet' 
  | 'gi_sheet' 
  | 'ibeam' 
  | 'hbeam' 
  | 'tbeam' 
  | 'gi_pipe' 
  | 'ms_pipe';

export interface CategoryTab {
  id: CategoryType;
  title: string;
  gujarati: string;
  subtitle: string;
  iconName: string;
}

export const CATEGORIES: CategoryTab[] = [
  { id: 'tmt', title: 'TMT Rebars (सरिया)', gujarati: 'टीएमटी सरिया', subtitle: 'IS 1786 Fe 500D / 550D / 600 Construction Steel', iconName: '🏗️' },
  { id: 'angle', title: 'MS Angle', gujarati: 'एंगल', subtitle: 'Equal & Unequal Structural Angles', iconName: '📐' },
  { id: 'channel', title: 'MS Channel', gujarati: 'चैनल', subtitle: 'ISMC Standard Channels', iconName: '🧱' },
  { id: 'bar', title: 'MS Round & Square Bar', gujarati: 'गोल / चौकोर बार', subtitle: 'Plain Round & Square Bright Engineering Bars', iconName: '🪙' },
  { id: 'flat', title: 'MS Flat', gujarati: 'एमएस फ्लैट / पट्टी', subtitle: 'Flat Bars, Patti & Base Strips', iconName: '📏' },
  { id: 'sheet', title: 'MS Sheet / Plate', gujarati: 'एमएस शीट', subtitle: 'Hot Rolled & Cold Rolled Plates', iconName: '📄' },
  { id: 'gi_sheet', title: 'GI Sheet', gujarati: 'जीआई शीट', subtitle: 'Galvanized Plain & Corrugated Sheets', iconName: '🏠' },
  { id: 'ibeam', title: 'I Beam', gujarati: 'आई बीम', subtitle: 'ISMB / NPB Structural Beams & Joists', iconName: '🏛️' },
  { id: 'hbeam', title: 'H Beam', gujarati: 'एच बीम', subtitle: 'ISHB Heavy Columns & Universal Columns', iconName: '🏢' },
  { id: 'tbeam', title: 'T Beam', gujarati: 'टी बीम', subtitle: 'ISNT Structural Tee Sections', iconName: '⚓' },
  { id: 'gi_pipe', title: 'GI Pipe', gujarati: 'जीआई पाइप', subtitle: 'Galvanized Round & Box Pipes', iconName: '🔩' },
  { id: 'ms_pipe', title: 'MS Pipe', gujarati: 'एमएस पाइप', subtitle: 'Round ERW & Square/Rectangular Tubes', iconName: '⭕' },
];

// --- 1. TMT REBAR DATA MATRIX (Every Single Standard Measurement & Specification) ---
export interface TMTMeasurement {
  dia: number; // mm
  sut: string; // Hindi/Local Sut measurement
  inch: string; // Inches representation
  areaMm2: number; // Cross sectional area in sq.mm
  weightPerM: number; // Nominal kg/meter (IS 1786)
  weightPerFt: number; // kg/foot
  weightPer12m: number; // kg for 12 meter standard rod
  pcsPerBundle: number; // Standard mill packaging count
  bundleWeightKg: number; // Total weight per bundle (12m rods)
  barsPerTon: number; // 1000 kg / rod weight
  tolerance: string; // IS 1786 permissible weight tolerance
  gradeRecommend: string; // Recommended Steel Grade
  usage: string; // Civil Engineering Usage
  gujUsage: string; // Hindi usage explanation
}

export const TMT_MEASUREMENTS: Record<number, TMTMeasurement> = {
  4: {
    dia: 4,
    sut: '1.25 Sut (सवा सूत)',
    inch: '5/32"',
    areaMm2: 12.57,
    weightPerM: 0.099,
    weightPerFt: 0.030,
    weightPer12m: 1.188,
    pcsPerBundle: 25,
    bundleWeightKg: 29.70,
    barsPerTon: 841.7,
    tolerance: '±7.0%',
    gradeRecommend: 'Fe 415 / Fe 500',
    usage: 'Binding wire, lightweight concrete mesh, decorative plaster reinforcement',
    gujUsage: 'प्लास्टर जाली, वायरिंग और लाइट मेश'
  },
  6: {
    dia: 6,
    sut: '2 Sut (२ सूत)',
    inch: '1/4"',
    areaMm2: 28.27,
    weightPerM: 0.222,
    weightPerFt: 0.068,
    weightPer12m: 2.664,
    pcsPerBundle: 20,
    bundleWeightKg: 53.28,
    barsPerTon: 375.4,
    tolerance: '±7.0%',
    gradeRecommend: 'Fe 500 / Fe 500D',
    usage: 'Stirrups/Rings, chhajja projections, cantilever stairs, thin partition slabs',
    gujUsage: 'छज्जा, सीढ़ियों के पायदान और स्लैब बाइंडिंग'
  },
  8: {
    dia: 8,
    sut: '2.5 Sut (ढाई सूत)',
    inch: '5/16"',
    areaMm2: 50.27,
    weightPerM: 0.395,
    weightPerFt: 0.120,
    weightPer12m: 4.740,
    pcsPerBundle: 10,
    bundleWeightKg: 47.40,
    barsPerTon: 210.9,
    tolerance: '±7.0%',
    gradeRecommend: 'Fe 500D / Fe 550D',
    usage: 'Column & beam rings (stirrups), slab distribution steel, boundary walls',
    gujUsage: 'कॉलम और बीम रिंग (Stirrups), स्लैब डिस्ट्रीब्यूशन'
  },
  10: {
    dia: 10,
    sut: '3 Sut (३ सूत)',
    inch: '3/8"',
    areaMm2: 78.54,
    weightPerM: 0.617,
    weightPerFt: 0.188,
    weightPer12m: 7.404,
    pcsPerBundle: 7,
    bundleWeightKg: 51.83,
    barsPerTon: 135.0,
    tolerance: '±7.0%',
    gradeRecommend: 'Fe 500D / Fe 550D',
    usage: 'Roof slabs main reinforcement, lintel beams, cantilever slabs, staircases',
    gujUsage: 'छत का मुख्य स्लैब (Roof Slab), लिंटेल और सीढ़ी'
  },
  12: {
    dia: 12,
    sut: '4 Sut (४ सूत / १/२ इंच)',
    inch: '1/2"',
    areaMm2: 113.10,
    weightPerM: 0.888,
    weightPerFt: 0.271,
    weightPer12m: 10.656,
    pcsPerBundle: 4,
    bundleWeightKg: 42.62,
    barsPerTon: 93.8,
    tolerance: '±5.0%',
    gradeRecommend: 'Fe 500D / Fe 550D',
    usage: 'Residential building columns, plinth beams, roof beams, foundation footings',
    gujUsage: 'मकान के कॉलम, प्लिंथ बीम, स्लैब बीम और फुटिंग'
  },
  16: {
    dia: 16,
    sut: '5 Sut (५ सूत / ५/८ इंच)',
    inch: '5/8"',
    areaMm2: 201.06,
    weightPerM: 1.580,
    weightPerFt: 0.482,
    weightPer12m: 18.960,
    pcsPerBundle: 3,
    bundleWeightKg: 56.88,
    barsPerTon: 52.7,
    tolerance: '±5.0%',
    gradeRecommend: 'Fe 500D / Fe 550D',
    usage: 'Heavy load-bearing columns, long span beams, multi-storey building frames',
    gujUsage: 'हैवी कॉलम, बड़े स्पैन बीम और मल्टी-स्टोरी फ्रेम'
  },
  20: {
    dia: 20,
    sut: '6 Sut (६ सूत / ३/४ इंच)',
    inch: '3/4"',
    areaMm2: 314.16,
    weightPerM: 2.470,
    weightPerFt: 0.753,
    weightPer12m: 29.640,
    pcsPerBundle: 2,
    bundleWeightKg: 59.28,
    barsPerTon: 33.7,
    tolerance: '±3.0%',
    gradeRecommend: 'Fe 500D / Fe 550D',
    usage: 'Commercial building columns, heavy basement raft foundations, transfer girders',
    gujUsage: 'कमर्शियल बिल्डिंग कॉलम, बेसमेंट राफ्ट फाउंडेशन'
  },
  22: {
    dia: 22,
    sut: '7 Sut (७ सूत / ७/८ इंच)',
    inch: '7/8"',
    areaMm2: 380.13,
    weightPerM: 2.984,
    weightPerFt: 0.909,
    weightPer12m: 35.808,
    pcsPerBundle: 1,
    bundleWeightKg: 35.81,
    barsPerTon: 27.9,
    tolerance: '±3.0%',
    gradeRecommend: 'Fe 500D / Fe 550D',
    usage: 'Industrial shed columns, heavy crane gantry supports, deep retaining structures',
    gujUsage: 'इंडस्ट्रियल शेड कॉलम और क्रेन गैन्ट्री सपोर्ट'
  },
  25: {
    dia: 25,
    sut: '8 Sut (८ सूत / १ इंच)',
    inch: '1"',
    areaMm2: 490.87,
    weightPerM: 3.850,
    weightPerFt: 1.173,
    weightPer12m: 46.200,
    pcsPerBundle: 1,
    bundleWeightKg: 46.20,
    barsPerTon: 21.6,
    tolerance: '±3.0%',
    gradeRecommend: 'Fe 500D / Fe 550D / Fe 600',
    usage: 'High-rise tower foundation piles, heavy column cages, bridge abutments',
    gujUsage: 'हाई-राइज टावर पाइलिंग, ब्रिज अबटमेंट और हैवी फाउंडेशन'
  },
  28: {
    dia: 28,
    sut: '9 Sut (९ सूत / १-१/८ इंच)',
    inch: '1-1/8"',
    areaMm2: 615.75,
    weightPerM: 4.830,
    weightPerFt: 1.472,
    weightPer12m: 57.960,
    pcsPerBundle: 1,
    bundleWeightKg: 57.96,
    barsPerTon: 17.2,
    tolerance: '±3.0%',
    gradeRecommend: 'Fe 500D / Fe 550D / Fe 600',
    usage: 'Flyovers, metro rail viaducts, heavy industrial raft foundations',
    gujUsage: 'मेट्रो वायाडक्ट, फ्लाईओवर और हैवी इंडस्ट्रियल राफ्ट'
  },
  32: {
    dia: 32,
    sut: '10 Sut (१० सूत / १-१/४ इंच)',
    inch: '1-1/4"',
    areaMm2: 804.25,
    weightPerM: 6.310,
    weightPerFt: 1.923,
    weightPer12m: 75.720,
    pcsPerBundle: 1,
    bundleWeightKg: 75.72,
    barsPerTon: 13.2,
    tolerance: '±3.0%',
    gradeRecommend: 'Fe 550D / Fe 600',
    usage: 'Highway flyover piers, metro bridge decks, deep marine pile foundations',
    gujUsage: 'हाईवे फ्लाईओवर पियर, मेट्रो डेक और मरीन पाइलिंग'
  },
  36: {
    dia: 36,
    sut: '11.3 Sut (११.३ सूत)',
    inch: '1-7/16"',
    areaMm2: 1017.88,
    weightPerM: 7.990,
    weightPerFt: 2.435,
    weightPer12m: 95.880,
    pcsPerBundle: 1,
    bundleWeightKg: 95.88,
    barsPerTon: 10.4,
    tolerance: '±3.0%',
    gradeRecommend: 'Fe 550D / Fe 600',
    usage: 'Dam spillways, powerhouse foundation slabs, heavy sea retaining walls',
    gujUsage: 'डैम स्पिलवे, पावरहाउस फाउंडेशन और रिटेनिंग वॉल'
  },
  40: {
    dia: 40,
    sut: '12.6 Sut (१२.६ सूत)',
    inch: '1-9/16"',
    areaMm2: 1256.64,
    weightPerM: 9.870,
    weightPerFt: 3.008,
    weightPer12m: 118.440,
    pcsPerBundle: 1,
    bundleWeightKg: 118.44,
    barsPerTon: 8.4,
    tolerance: '±3.0%',
    gradeRecommend: 'Fe 550D / Fe 600',
    usage: 'Expressway bridges, high-load industrial pile structures, thermal plant foundations',
    gujUsage: 'एक्सप्रेसवे ब्रिज और थर्मल पावर प्लांट हैवी पाइलिंग'
  },
  45: {
    dia: 45,
    sut: '14.2 Sut (१४.२ सूत)',
    inch: '1-3/4"',
    areaMm2: 1590.43,
    weightPerM: 12.485,
    weightPerFt: 3.805,
    weightPer12m: 149.820,
    pcsPerBundle: 1,
    bundleWeightKg: 149.82,
    barsPerTon: 6.7,
    tolerance: '±3.0%',
    gradeRecommend: 'Fe 600',
    usage: 'Special heavy machine anchors, hydraulic structures, blast-resistant facilities',
    gujUsage: 'हैवी मशीनरी एंकरिंग और स्पेशल हाइड्रोलिक स्ट्रक्चर'
  },
  50: {
    dia: 50,
    sut: '15.7 Sut (१५.७ सूत / २ इंच)',
    inch: '2"',
    areaMm2: 1963.50,
    weightPerM: 15.420,
    weightPerFt: 4.700,
    weightPer12m: 185.040,
    pcsPerBundle: 1,
    bundleWeightKg: 185.04,
    barsPerTon: 5.4,
    tolerance: '±3.0%',
    gradeRecommend: 'Fe 600',
    usage: 'Nuclear containment structures, mega sea ports, ultra-tall skyscrapers foundation',
    gujUsage: 'मेगा सी-पोर्ट, न्यूक्लियर प्लांट और अल्ट्रा-टॉल टावर फाउंडेशन'
  },
};

// Bar Bending Schedule Item for Multi-size estimator
export interface TMTScheduleItem {
  id: string;
  dia: number;
  pieces: number;
  lengthM: number;
  unitWeightKgM: number;
  singlePieceKg: number;
  totalKg: number;
  bundles: number;
  loosePieces: number;
}

export default function Calculator() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('tmt');
  const [isCopied, setIsCopied] = useState(false);

  // Common Units state
  const [lengthUnit, setLengthUnit] = useState<'meter' | 'feet' | 'mm'>('meter');

  // ==========================================
  // --- 0. DEDICATED TMT REBAR STATE ---
  // ==========================================
  const [tmtCalcMode, setTmtCalcMode] = useState<'by_pieces' | 'by_bundles' | 'by_weight' | 'multi_list'>('by_pieces');
  const [tmtDia, setTmtDia] = useState<number>(12); // mm
  const [tmtIsCustomDia, setTmtIsCustomDia] = useState<boolean>(false);
  const [tmtCustomDia, setTmtCustomDia] = useState<number>(12);
  const [tmtLength, setTmtLength] = useState<number>(12); // Length per piece (defaults to 12m standard rod)
  const [tmtLengthPreset, setTmtLengthPreset] = useState<'12m' | '6m' | '40ft' | '1m' | 'custom'>('12m');
  const [tmtQtyPieces, setTmtQtyPieces] = useState<number>(10);
  const [tmtQtyBundles, setTmtQtyBundles] = useState<number>(5);
  const [tmtTargetWeight, setTmtTargetWeight] = useState<number>(1); // e.g. 1 ton or 1000 kg
  const [tmtTargetUnit, setTmtTargetUnit] = useState<'ton' | 'kg'>('ton');
  const [tmtGrade, setTmtGrade] = useState<'Fe 500D' | 'Fe 550D' | 'Fe 500' | 'Fe 600'>('Fe 500D');
  const [tmtScheduleList, setTmtScheduleList] = useState<TMTScheduleItem[]>([]);
  const [tmtTableSearch, setTmtTableSearch] = useState<string>('');
  const [tmtTableUnit, setTmtTableUnit] = useState<'metric' | 'imperial'>('metric');

  // --- 1. MS ANGLE STATE ---
  const [angleMode, setAngleMode] = useState<'preset' | 'custom'>('preset');
  const [anglePreset, setAnglePreset] = useState<string>('50_50_6');
  const [angleLegA, setAngleLegA] = useState<number>(50);
  const [angleLegB, setAngleLegB] = useState<number>(50);
  const [angleThickness, setAngleThickness] = useState<number>(6);
  const [angleLength, setAngleLength] = useState<number>(6);
  const [angleQty, setAngleQty] = useState<number>(1);

  // --- 2. MS CHANNEL STATE ---
  const [channelMode, setChannelMode] = useState<'preset' | 'custom'>('preset');
  const [channelPreset, setChannelPreset] = useState<string>('ismc_100');
  const [channelHeight, setChannelHeight] = useState<number>(100);
  const [channelFlange, setChannelFlange] = useState<number>(50);
  const [channelWebThick, setChannelWebThick] = useState<number>(5.0);
  const [channelFlangeThick, setChannelFlangeThick] = useState<number>(7.5);
  const [channelLength, setChannelLength] = useState<number>(6);
  const [channelQty, setChannelQty] = useState<number>(1);

  // --- 3. MS ROUND & SQUARE BAR STATE (Engineering Bright Bars) ---
  const [barShape, setBarShape] = useState<'round' | 'square'>('round');
  const [roundMode, setRoundMode] = useState<'preset' | 'custom'>('preset');
  const [roundPreset, setRoundPreset] = useState<string>('rd_12');
  const [roundDia, setRoundDia] = useState<number>(12); // mm
  const [squareMode, setSquareMode] = useState<'preset' | 'custom'>('preset');
  const [squarePreset, setSquarePreset] = useState<string>('sq_12');
  const [squareSide, setSquareSide] = useState<number>(12); // mm
  const [barLength, setBarLength] = useState<number>(6); // meters/feet
  const [barQty, setBarQty] = useState<number>(1);

  // --- 4. MS FLAT / PATTI STATE ---
  const [flatMode, setFlatMode] = useState<'preset' | 'custom'>('preset');
  const [flatPreset, setFlatPreset] = useState<string>('50_6');
  const [flatWidth, setFlatWidth] = useState<number>(50); // mm
  const [flatThick, setFlatThick] = useState<number>(6); // mm
  const [flatLength, setFlatLength] = useState<number>(6);
  const [flatQty, setFlatQty] = useState<number>(1);

  // --- 5. MS SHEET / PLATE STATE ---
  const [sheetLength, setSheetLength] = useState<number>(2.5); // meters or ft
  const [sheetWidth, setSheetWidth] = useState<number>(1.25); // meters or ft
  const [sheetThick, setSheetThick] = useState<number>(10); // mm
  const [sheetQty, setSheetQty] = useState<number>(1);

  // --- 6. GI SHEET STATE ---
  const [giSheetLength, setGiSheetLength] = useState<number>(8); // ft / meters
  const [giSheetWidth, setGiSheetWidth] = useState<number>(3); // ft / meters
  const [giSheetThick, setGiSheetThick] = useState<number>(0.50); // mm
  const [giSheetProfile, setGiSheetProfile] = useState<'plain' | 'corrugated'>('corrugated');
  const [giSheetQty, setGiSheetQty] = useState<number>(10);

  // --- 7. I BEAM STATE ---
  const [ibeamMode, setIbeamMode] = useState<'preset' | 'custom'>('preset');
  const [ibeamPreset, setIbeamPreset] = useState<string>('ismb_150');
  const [ibeamDepth, setIbeamDepth] = useState<number>(150);
  const [ibeamFlange, setIbeamFlange] = useState<number>(75);
  const [ibeamWebThick, setIbeamWebThick] = useState<number>(5.0);
  const [ibeamFlangeThick, setIbeamFlangeThick] = useState<number>(8.0);
  const [ibeamLength, setIbeamLength] = useState<number>(6);
  const [ibeamQty, setIbeamQty] = useState<number>(1);

  // --- 8. H BEAM STATE ---
  const [hbeamMode, setHbeamMode] = useState<'preset' | 'custom'>('preset');
  const [hbeamPreset, setHbeamPreset] = useState<string>('ishb_150');
  const [hbeamDepth, setHbeamDepth] = useState<number>(150);
  const [hbeamFlange, setHbeamFlange] = useState<number>(150);
  const [hbeamWebThick, setHbeamWebThick] = useState<number>(5.4);
  const [hbeamFlangeThick, setHbeamFlangeThick] = useState<number>(8.4);
  const [hbeamLength, setHbeamLength] = useState<number>(6);
  const [hbeamQty, setHbeamQty] = useState<number>(1);

  // --- 9. T BEAM STATE ---
  const [tbeamMode, setTbeamMode] = useState<'preset' | 'custom'>('preset');
  const [tbeamPreset, setTbeamPreset] = useState<string>('isnt_50');
  const [tbeamFlange, setTbeamFlange] = useState<number>(50);
  const [tbeamHeight, setTbeamHeight] = useState<number>(50);
  const [tbeamFlangeThick, setTbeamFlangeThick] = useState<number>(6);
  const [tbeamWebThick, setTbeamWebThick] = useState<number>(6);
  const [tbeamLength, setTbeamLength] = useState<number>(6);
  const [tbeamQty, setTbeamQty] = useState<number>(1);

  // --- 10. GI PIPE STATE ---
  const [giPipeShape, setGiPipeShape] = useState<'round' | 'square' | 'rect'>('round');
  const [giPipeOD, setGiPipeOD] = useState<number>(48.3); // mm
  const [giPipeWidth, setGiPipeWidth] = useState<number>(50); // mm
  const [giPipeHeight, setGiPipeHeight] = useState<number>(50); // mm
  const [giPipeThick, setGiPipeThick] = useState<number>(2.9); // mm
  const [giPipeLength, setGiPipeLength] = useState<number>(6);
  const [giPipeQty, setGiPipeQty] = useState<number>(1);

  // --- 11. MS PIPE STATE ---
  const [msPipeShape, setMsPipeShape] = useState<'round' | 'square' | 'rect'>('round');
  const [msPipeOD, setMsPipeOD] = useState<number>(50); // mm
  const [msPipeWidth, setMsPipeWidth] = useState<number>(50); // mm
  const [msPipeHeight, setMsPipeHeight] = useState<number>(50); // mm
  const [msPipeThick, setMsPipeThick] = useState<number>(3.0); // mm
  const [msPipeLength, setMsPipeLength] = useState<number>(6);
  const [msPipeQty, setMsPipeQty] = useState<number>(1);

  // Convert given length to meters for calculation
  const toMeters = (val: number, unit: 'meter' | 'feet' | 'mm') => {
    if (unit === 'meter') return val;
    if (unit === 'feet') return val * 0.3048;
    if (unit === 'mm') return val / 1000;
    return val;
  };

  // Convert meters to feet for display
  const toFeet = (meters: number) => {
    return meters * 3.28084;
  };

  // --- PRESET DEFINITIONS FOR OTHER STRUCTURALS ---
  const ANGLE_PRESETS: Record<string, { a: number; b: number; t: number; weightPerM: number; label: string }> = {
    '25_25_3': { a: 25, b: 25, t: 3, weightPerM: 1.11, label: '25 x 25 x 3 mm (1.11 kg/m)' },
    '25_25_5': { a: 25, b: 25, t: 5, weightPerM: 1.77, label: '25 x 25 x 5 mm (1.77 kg/m)' },
    '30_30_3': { a: 30, b: 30, t: 3, weightPerM: 1.36, label: '30 x 30 x 3 mm (1.36 kg/m)' },
    '35_35_3': { a: 35, b: 35, t: 3, weightPerM: 1.60, label: '35 x 35 x 3 mm (1.60 kg/m)' },
    '35_35_5': { a: 35, b: 35, t: 5, weightPerM: 2.55, label: '35 x 35 x 5 mm (2.55 kg/m)' },
    '40_40_5': { a: 40, b: 40, t: 5, weightPerM: 2.97, label: '40 x 40 x 5 mm (2.97 kg/m)' },
    '40_40_6': { a: 40, b: 40, t: 6, weightPerM: 3.50, label: '40 x 40 x 6 mm (3.50 kg/m)' },
    '50_50_5': { a: 50, b: 50, t: 5, weightPerM: 3.77, label: '50 x 50 x 5 mm (3.77 kg/m)' },
    '50_50_6': { a: 50, b: 50, t: 6, weightPerM: 4.47, label: '50 x 50 x 6 mm (4.47 kg/m)' },
    '65_65_6': { a: 65, b: 65, t: 6, weightPerM: 5.84, label: '65 x 65 x 6 mm (5.84 kg/m)' },
    '75_75_6': { a: 75, b: 75, t: 6, weightPerM: 6.80, label: '75 x 75 x 6 mm (6.80 kg/m)' },
    '75_75_8': { a: 75, b: 75, t: 8, weightPerM: 8.90, label: '75 x 75 x 8 mm (8.90 kg/m)' },
    '100_100_10': { a: 100, b: 100, t: 10, weightPerM: 14.90, label: '100 x 100 x 10 mm (14.90 kg/m)' },
    '130_130_12': { a: 130, b: 130, t: 12, weightPerM: 23.40, label: '130 x 130 x 12 mm (23.40 kg/m)' },
    '150_150_12': { a: 150, b: 150, t: 12, weightPerM: 27.20, label: '150 x 150 x 12 mm (27.20 kg/m)' },
  };

  const CHANNEL_PRESETS: Record<string, { h: number; b: number; tw: number; tf: number; weightPerM: number; label: string }> = {
    'ismc_75': { h: 75, b: 40, tw: 4.8, tf: 7.5, weightPerM: 7.14, label: 'ISMC 75 x 40 mm (7.14 kg/m)' },
    'ismc_100': { h: 100, b: 50, tw: 5.0, tf: 7.5, weightPerM: 9.56, label: 'ISMC 100 x 50 mm (9.56 kg/m)' },
    'ismc_125': { h: 125, b: 65, tw: 5.3, tf: 8.2, weightPerM: 13.10, label: 'ISMC 125 x 65 mm (13.10 kg/m)' },
    'ismc_150': { h: 150, b: 75, tw: 5.7, tf: 9.0, weightPerM: 16.80, label: 'ISMC 150 x 75 mm (16.80 kg/m)' },
    'ismc_175': { h: 175, b: 75, tw: 6.0, tf: 10.2, weightPerM: 19.60, label: 'ISMC 175 x 75 mm (19.60 kg/m)' },
    'ismc_200': { h: 200, b: 75, tw: 6.2, tf: 11.4, weightPerM: 22.30, label: 'ISMC 200 x 75 mm (22.30 kg/m)' },
    'ismc_250': { h: 250, b: 82, tw: 7.2, tf: 14.1, weightPerM: 30.60, label: 'ISMC 250 x 82 mm (30.60 kg/m)' },
    'ismc_300': { h: 300, b: 90, tw: 7.8, tf: 13.6, weightPerM: 36.30, label: 'ISMC 300 x 90 mm (36.30 kg/m)' },
    'ismc_400': { h: 400, b: 100, tw: 8.8, tf: 15.3, weightPerM: 50.10, label: 'ISMC 400 x 100 mm (50.10 kg/m)' },
  };

  const ROUND_BAR_PRESETS: Record<string, { dia: number; weightPerM: number; label: string }> = {
    'rd_6': { dia: 6, weightPerM: 0.222, label: '6 mm Bright Round (0.222 kg/m)' },
    'rd_8': { dia: 8, weightPerM: 0.395, label: '8 mm Bright Round (0.395 kg/m)' },
    'rd_10': { dia: 10, weightPerM: 0.617, label: '10 mm Bright Round (0.617 kg/m)' },
    'rd_12': { dia: 12, weightPerM: 0.888, label: '12 mm Bright Round (0.888 kg/m)' },
    'rd_16': { dia: 16, weightPerM: 1.580, label: '16 mm Bright Round (1.580 kg/m)' },
    'rd_20': { dia: 20, weightPerM: 2.470, label: '20 mm Bright Round (2.470 kg/m)' },
    'rd_25': { dia: 25, weightPerM: 3.850, label: '25 mm Bright Round (3.850 kg/m)' },
    'rd_32': { dia: 32, weightPerM: 6.310, label: '32 mm Bright Round (6.310 kg/m)' },
    'rd_40': { dia: 40, weightPerM: 9.870, label: '40 mm Bright Round (9.870 kg/m)' },
    'rd_50': { dia: 50, weightPerM: 15.420, label: '50 mm Bright Round (15.420 kg/m)' },
  };

  const SQUARE_BAR_PRESETS: Record<string, { side: number; weightPerM: number; label: string }> = {
    'sq_8': { side: 8, weightPerM: 0.502, label: '8 x 8 mm (0.502 kg/m)' },
    'sq_10': { side: 10, weightPerM: 0.785, label: '10 x 10 mm (0.785 kg/m)' },
    'sq_12': { side: 12, weightPerM: 1.130, label: '12 x 12 mm (1.130 kg/m)' },
    'sq_16': { side: 16, weightPerM: 2.010, label: '16 x 16 mm (2.010 kg/m)' },
    'sq_20': { side: 20, weightPerM: 3.140, label: '20 x 20 mm (3.140 kg/m)' },
    'sq_25': { side: 25, weightPerM: 4.906, label: '25 x 25 mm (4.906 kg/m)' },
    'sq_32': { side: 32, weightPerM: 8.038, label: '32 x 32 mm (8.038 kg/m)' },
    'sq_40': { side: 40, weightPerM: 12.560, label: '40 x 40 mm (12.560 kg/m)' },
    'sq_50': { side: 50, weightPerM: 19.625, label: '50 x 50 mm (19.625 kg/m)' },
    'sq_65': { side: 65, weightPerM: 33.170, label: '65 x 65 mm (33.170 kg/m)' },
  };

  const FLAT_PRESETS: Record<string, { w: number; t: number; weightPerM: number; label: string }> = {
    '25_3': { w: 25, t: 3, weightPerM: 0.59, label: '25 x 3 mm (0.59 kg/m)' },
    '25_5': { w: 25, t: 5, weightPerM: 0.98, label: '25 x 5 mm (0.98 kg/m)' },
    '25_6': { w: 25, t: 6, weightPerM: 1.18, label: '25 x 6 mm (1.18 kg/m)' },
    '32_5': { w: 32, t: 5, weightPerM: 1.26, label: '32 x 5 mm (1.26 kg/m)' },
    '32_6': { w: 32, t: 6, weightPerM: 1.51, label: '32 x 6 mm (1.51 kg/m)' },
    '40_5': { w: 40, t: 5, weightPerM: 1.57, label: '40 x 5 mm (1.57 kg/m)' },
    '40_6': { w: 40, t: 6, weightPerM: 1.88, label: '40 x 6 mm (1.88 kg/m)' },
    '40_10': { w: 40, t: 10, weightPerM: 3.14, label: '40 x 10 mm (3.14 kg/m)' },
    '50_5': { w: 50, t: 5, weightPerM: 1.96, label: '50 x 5 mm (1.96 kg/m)' },
    '50_6': { w: 50, t: 6, weightPerM: 2.36, label: '50 x 6 mm (2.36 kg/m)' },
    '50_10': { w: 50, t: 10, weightPerM: 3.93, label: '50 x 10 mm (3.93 kg/m)' },
    '50_12': { w: 50, t: 12, weightPerM: 4.71, label: '50 x 12 mm (4.71 kg/m)' },
    '65_6': { w: 65, t: 6, weightPerM: 3.06, label: '65 x 6 mm (3.06 kg/m)' },
    '65_10': { w: 65, t: 10, weightPerM: 5.10, label: '65 x 10 mm (5.10 kg/m)' },
    '65_12': { w: 65, t: 12, weightPerM: 6.12, label: '65 x 12 mm (6.12 kg/m)' },
    '75_6': { w: 75, t: 6, weightPerM: 3.53, label: '75 x 6 mm (3.53 kg/m)' },
    '75_10': { w: 75, t: 10, weightPerM: 5.89, label: '75 x 10 mm (5.89 kg/m)' },
    '75_12': { w: 75, t: 12, weightPerM: 7.07, label: '75 x 12 mm (7.07 kg/m)' },
    '100_6': { w: 100, t: 6, weightPerM: 4.71, label: '100 x 6 mm (4.71 kg/m)' },
    '100_10': { w: 100, t: 10, weightPerM: 7.85, label: '100 x 10 mm (7.85 kg/m)' },
    '100_12': { w: 100, t: 12, weightPerM: 9.42, label: '100 x 12 mm (9.42 kg/m)' },
    '100_16': { w: 100, t: 16, weightPerM: 12.56, label: '100 x 16 mm (12.56 kg/m)' },
    '150_10': { w: 150, t: 10, weightPerM: 11.78, label: '150 x 10 mm (11.78 kg/m)' },
    '150_12': { w: 150, t: 12, weightPerM: 14.13, label: '150 x 12 mm (14.13 kg/m)' },
    '150_20': { w: 150, t: 20, weightPerM: 23.55, label: '150 x 20 mm (23.55 kg/m)' },
  };

  const IBEAM_PRESETS: Record<string, { d: number; b: number; tw: number; tf: number; weightPerM: number; label: string }> = {
    'ismb_100': { d: 100, b: 50, tw: 4.0, tf: 7.0, weightPerM: 11.50, label: 'ISMB 100 x 50 mm (11.50 kg/m)' },
    'ismb_125': { d: 125, b: 70, tw: 4.4, tf: 8.0, weightPerM: 13.30, label: 'ISMB 125 x 70 mm (13.30 kg/m)' },
    'ismb_150': { d: 150, b: 75, tw: 5.0, tf: 8.0, weightPerM: 15.00, label: 'ISMB 150 x 75 mm (15.00 kg/m)' },
    'ismb_175': { d: 175, b: 85, tw: 5.5, tf: 9.0, weightPerM: 19.30, label: 'ISMB 175 x 85 mm (19.30 kg/m)' },
    'ismb_200': { d: 200, b: 100, tw: 5.7, tf: 10.0, weightPerM: 25.40, label: 'ISMB 200 x 100 mm (25.40 kg/m)' },
    'ismb_250': { d: 250, b: 125, tw: 6.9, tf: 12.5, weightPerM: 37.30, label: 'ISMB 250 x 125 mm (37.30 kg/m)' },
    'ismb_300': { d: 300, b: 140, tw: 7.7, tf: 13.1, weightPerM: 44.20, label: 'ISMB 300 x 140 mm (44.20 kg/m)' },
    'ismb_350': { d: 350, b: 140, tw: 8.1, tf: 14.2, weightPerM: 52.40, label: 'ISMB 350 x 140 mm (52.40 kg/m)' },
    'ismb_400': { d: 400, b: 140, tw: 8.9, tf: 16.0, weightPerM: 61.60, label: 'ISMB 400 x 140 mm (61.60 kg/m)' },
    'ismb_500': { d: 500, b: 180, tw: 10.2, tf: 17.2, weightPerM: 86.90, label: 'ISMB 500 x 180 mm (86.90 kg/m)' },
    'npb_150': { d: 150, b: 75, tw: 5.0, tf: 7.0, weightPerM: 14.00, label: 'NPB 150 x 75 mm (14.00 kg/m)' },
    'npb_200': { d: 200, b: 100, tw: 5.5, tf: 9.0, weightPerM: 25.10, label: 'NPB 200 x 100 mm (25.10 kg/m)' },
    'npb_250': { d: 250, b: 125, tw: 6.0, tf: 9.0, weightPerM: 37.20, label: 'NPB 250 x 125 mm (37.20 kg/m)' },
  };

  const HBEAM_PRESETS: Record<string, { d: number; b: number; tw: number; tf: number; weightPerM: number; label: string }> = {
    'ishb_150': { d: 150, b: 150, tw: 5.4, tf: 8.4, weightPerM: 27.10, label: 'ISHB 150 x 150 mm (27.10 kg/m)' },
    'ishb_200': { d: 200, b: 200, tw: 6.1, tf: 9.0, weightPerM: 37.30, label: 'ISHB 200 x 200 mm (37.30 kg/m)' },
    'ishb_225': { d: 225, b: 225, tw: 6.5, tf: 9.1, weightPerM: 43.10, label: 'ISHB 225 x 225 mm (43.10 kg/m)' },
    'ishb_250': { d: 250, b: 250, tw: 6.9, tf: 9.7, weightPerM: 51.00, label: 'ISHB 250 x 250 mm (51.00 kg/m)' },
    'ishb_300': { d: 300, b: 250, tw: 7.6, tf: 10.6, weightPerM: 58.80, label: 'ISHB 300 x 250 mm (58.80 kg/m)' },
    'ishb_350': { d: 350, b: 250, tw: 8.3, tf: 11.6, weightPerM: 67.40, label: 'ISHB 350 x 250 mm (67.40 kg/m)' },
    'ishb_400': { d: 400, b: 250, tw: 9.1, tf: 12.7, weightPerM: 77.40, label: 'ISHB 400 x 250 mm (77.40 kg/m)' },
    'ishb_450': { d: 450, b: 250, tw: 9.8, tf: 13.7, weightPerM: 87.20, label: 'ISHB 450 x 250 mm (87.20 kg/m)' },
    'uc_152': { d: 152.4, b: 152.4, tw: 5.8, tf: 6.8, weightPerM: 23.00, label: 'Universal Column UC 152 x 152 x 23 (23.00 kg/m)' },
    'uc_203': { d: 203.2, b: 203.2, tw: 7.2, tf: 11.0, weightPerM: 46.10, label: 'Universal Column UC 203 x 203 x 46 (46.10 kg/m)' },
  };

  const TBEAM_PRESETS: Record<string, { b: number; h: number; tf: number; tw: number; weightPerM: number; label: string }> = {
    'isnt_20': { b: 20, h: 20, tf: 3.0, tw: 3.0, weightPerM: 0.90, label: 'ISNT 20 x 20 x 3 mm (0.90 kg/m)' },
    'isnt_40': { b: 40, h: 40, tf: 6.0, tw: 6.0, weightPerM: 3.50, label: 'ISNT 40 x 40 x 6 mm (3.50 kg/m)' },
    'isnt_50': { b: 50, h: 50, tf: 6.0, tw: 6.0, weightPerM: 4.50, label: 'ISNT 50 x 50 x 6 mm (4.50 kg/m)' },
    'isnt_60': { b: 60, h: 60, tf: 6.0, tw: 6.0, weightPerM: 5.40, label: 'ISNT 60 x 60 x 6 mm (5.40 kg/m)' },
    'isnt_75': { b: 75, h: 75, tf: 8.0, tw: 8.0, weightPerM: 8.90, label: 'ISNT 75 x 75 x 8 mm (8.90 kg/m)' },
    'isnt_100': { b: 100, h: 100, tf: 10.0, tw: 10.0, weightPerM: 15.00, label: 'ISNT 100 x 100 x 10 mm (15.00 kg/m)' },
    'isnt_150': { b: 150, h: 150, tf: 10.0, tw: 10.0, weightPerM: 22.80, label: 'ISNT 150 x 150 x 10 mm (22.80 kg/m)' },
  };

  // Handler for Quick Length Preset button for TMT
  const handleTmtLengthPreset = (preset: '12m' | '6m' | '40ft' | '1m' | 'custom') => {
    setTmtLengthPreset(preset);
    if (preset === '12m') {
      setLengthUnit('meter');
      setTmtLength(12);
    } else if (preset === '6m') {
      setLengthUnit('meter');
      setTmtLength(6);
    } else if (preset === '40ft') {
      setLengthUnit('feet');
      setTmtLength(40);
    } else if (preset === '1m') {
      setLengthUnit('meter');
      setTmtLength(1);
    }
  };

  // Add Item to Multi-Size TMT Schedule List
  const handleAddScheduleItem = () => {
    const activeD = tmtIsCustomDia ? tmtCustomDia : tmtDia;
    const spec = TMT_MEASUREMENTS[activeD];
    const unitWt = spec ? spec.weightPerM : (activeD * activeD) / 162.28;
    const lenM = toMeters(tmtLength, lengthUnit);
    const singlePiece = unitWt * lenM;
    const totalItemKg = singlePiece * tmtQtyPieces;
    const pcsPerBdl = spec?.pcsPerBundle || 1;
    const bdlCount = Math.floor(tmtQtyPieces / pcsPerBdl);
    const looseCount = tmtQtyPieces % pcsPerBdl;

    const newItem: TMTScheduleItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dia: activeD,
      pieces: tmtQtyPieces,
      lengthM: lenM,
      unitWeightKgM: unitWt,
      singlePieceKg: singlePiece,
      totalKg: totalItemKg,
      bundles: bdlCount,
      loosePieces: looseCount
    };

    setTmtScheduleList(prev => [...prev, newItem]);
  };

  const handleRemoveScheduleItem = (id: string) => {
    setTmtScheduleList(prev => prev.filter(item => item.id !== id));
  };

  const handleClearSchedule = () => {
    setTmtScheduleList([]);
  };

  // Quick select TMT row from the Master Reference Table
  const handleSelectTmtFromTable = (dia: number) => {
    setActiveCategory('tmt');
    setTmtIsCustomDia(false);
    setTmtDia(dia);
    // Scroll smoothly to the calculator form
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // --- CALCULATION LOGIC ---
  const result = useMemo(() => {
    let weightPerMeter = 0;
    let singlePieceWeight = 0;
    let totalWeightKg = 0;
    let formulaText = '';
    let tmtFullBundles = 0;
    let tmtLoosePieces = 0;
    let tmtTotalPiecesCalculated = 0;
    let tmtTotalRunningMeters = 0;
    let tmtSelectedSpec: TMTMeasurement | null = null;

    switch (activeCategory) {
      // 0. DEDICATED TMT REBARS (IS 1786)
      case 'tmt': {
        const activeD = tmtIsCustomDia ? tmtCustomDia : tmtDia;
        const spec = TMT_MEASUREMENTS[activeD];
        tmtSelectedSpec = spec || null;

        // Base unit weight (kg/m)
        if (spec) {
          weightPerMeter = spec.weightPerM;
          formulaText = `IS:1786 Nominal Mass: ${spec.dia}mm (${spec.sut}) = ${spec.weightPerM.toFixed(3)} kg/m [Grade: ${tmtGrade}]`;
        } else {
          weightPerMeter = (activeD * activeD) / 162.28;
          formulaText = `D² / 162.28 = (${activeD}² / 162.28) = ${weightPerMeter.toFixed(3)} kg/m`;
        }

        const lenMeters = toMeters(tmtLength, lengthUnit);
        singlePieceWeight = weightPerMeter * lenMeters;
        const pcsPerBundle = spec?.pcsPerBundle || 1;

        if (tmtCalcMode === 'by_pieces') {
          tmtTotalPiecesCalculated = Math.max(1, tmtQtyPieces || 1);
          totalWeightKg = singlePieceWeight * tmtTotalPiecesCalculated;
          tmtFullBundles = Math.floor(tmtTotalPiecesCalculated / pcsPerBundle);
          tmtLoosePieces = tmtTotalPiecesCalculated % pcsPerBundle;
          tmtTotalRunningMeters = tmtTotalPiecesCalculated * lenMeters;
        } else if (tmtCalcMode === 'by_bundles') {
          const bdlInput = Math.max(1, tmtQtyBundles || 1);
          tmtTotalPiecesCalculated = bdlInput * pcsPerBundle;
          totalWeightKg = singlePieceWeight * tmtTotalPiecesCalculated;
          tmtFullBundles = bdlInput;
          tmtLoosePieces = 0;
          tmtTotalRunningMeters = tmtTotalPiecesCalculated * lenMeters;
        } else if (tmtCalcMode === 'by_weight') {
          const targetKg = tmtTargetUnit === 'ton' ? (tmtTargetWeight || 1) * 1000 : (tmtTargetWeight || 1);
          tmtTotalPiecesCalculated = Math.ceil(targetKg / (singlePieceWeight || 1));
          totalWeightKg = singlePieceWeight * tmtTotalPiecesCalculated;
          tmtFullBundles = Math.floor(tmtTotalPiecesCalculated / pcsPerBundle);
          tmtLoosePieces = tmtTotalPiecesCalculated % pcsPerBundle;
          tmtTotalRunningMeters = tmtTotalPiecesCalculated * lenMeters;
          formulaText += ` | Target: ${targetKg.toFixed(2)} kg → ${tmtTotalPiecesCalculated} Rods (${tmtFullBundles} Bundles + ${tmtLoosePieces} Loose)`;
        } else if (tmtCalcMode === 'multi_list') {
          totalWeightKg = tmtScheduleList.reduce((acc, item) => acc + item.totalKg, 0);
          tmtTotalPiecesCalculated = tmtScheduleList.reduce((acc, item) => acc + item.pieces, 0);
          tmtFullBundles = tmtScheduleList.reduce((acc, item) => acc + item.bundles, 0);
          tmtLoosePieces = tmtScheduleList.reduce((acc, item) => acc + item.loosePieces, 0);
          tmtTotalRunningMeters = tmtScheduleList.reduce((acc, item) => acc + (item.pieces * item.lengthM), 0);
          singlePieceWeight = tmtScheduleList.length > 0 ? (totalWeightKg / tmtTotalPiecesCalculated) : 0;
          formulaText = `Multi-Size Rebar Bill of Quantities (${tmtScheduleList.length} items total)`;
        }
        break;
      }

      // 1. MS ANGLE
      case 'angle': {
        const lengthInMeters = toMeters(angleLength, lengthUnit);
        if (angleMode === 'preset' && ANGLE_PRESETS[anglePreset]) {
          weightPerMeter = ANGLE_PRESETS[anglePreset].weightPerM;
          formulaText = `Standard IS Angle: ${ANGLE_PRESETS[anglePreset].label}`;
        } else {
          weightPerMeter = ((angleLegA + angleLegB - angleThickness) * angleThickness * 7.85) / 1000;
          formulaText = `[(Leg A + Leg B - T) × T × 7.85] / 1000`;
        }
        singlePieceWeight = weightPerMeter * lengthInMeters;
        totalWeightKg = singlePieceWeight * (angleQty || 1);
        break;
      }

      // 2. MS CHANNEL
      case 'channel': {
        const lengthInMeters = toMeters(channelLength, lengthUnit);
        if (channelMode === 'preset' && CHANNEL_PRESETS[channelPreset]) {
          weightPerMeter = CHANNEL_PRESETS[channelPreset].weightPerM;
          formulaText = `Standard ISMC Section: ${CHANNEL_PRESETS[channelPreset].label}`;
        } else {
          weightPerMeter = (2 * channelFlange * channelFlangeThick + (channelHeight - 2 * channelFlangeThick) * channelWebThick) * 0.00785;
          formulaText = `[2 × Flange × tf + (Height - 2×tf) × tw] × 0.00785`;
        }
        singlePieceWeight = weightPerMeter * lengthInMeters;
        totalWeightKg = singlePieceWeight * (channelQty || 1);
        break;
      }

      // 3. MS ROUND & SQUARE BAR (Plain Engineering Bars)
      case 'bar': {
        const lengthInMeters = toMeters(barLength, lengthUnit);
        if (barShape === 'round') {
          if (roundMode === 'preset' && ROUND_BAR_PRESETS[roundPreset]) {
            weightPerMeter = ROUND_BAR_PRESETS[roundPreset].weightPerM;
            formulaText = `Standard Bright Round Bar: ${ROUND_BAR_PRESETS[roundPreset].label}`;
          } else {
            weightPerMeter = (roundDia * roundDia) / 162.28;
            formulaText = `Diameter² / 162.28 (Round Bar Formula)`;
          }
        } else {
          if (squareMode === 'preset' && SQUARE_BAR_PRESETS[squarePreset]) {
            weightPerMeter = SQUARE_BAR_PRESETS[squarePreset].weightPerM;
            formulaText = `Standard Square Bar: ${SQUARE_BAR_PRESETS[squarePreset].label}`;
          } else {
            weightPerMeter = squareSide * squareSide * 0.00785;
            formulaText = `Side² × 0.00785 (Square Bar Formula)`;
          }
        }
        singlePieceWeight = weightPerMeter * lengthInMeters;
        totalWeightKg = singlePieceWeight * (barQty || 1);
        break;
      }

      // 4. MS FLAT / PATTI
      case 'flat': {
        const lengthInMeters = toMeters(flatLength, lengthUnit);
        if (flatMode === 'preset' && FLAT_PRESETS[flatPreset]) {
          weightPerMeter = FLAT_PRESETS[flatPreset].weightPerM;
          formulaText = `Standard MS Flat: ${FLAT_PRESETS[flatPreset].label}`;
        } else {
          weightPerMeter = flatWidth * flatThick * 0.00785;
          formulaText = `Width (mm) × Thickness (mm) × 0.00785`;
        }
        singlePieceWeight = weightPerMeter * lengthInMeters;
        totalWeightKg = singlePieceWeight * (flatQty || 1);
        break;
      }

      // 5. MS SHEET / PLATE
      case 'sheet': {
        const lMeters = toMeters(sheetLength, lengthUnit);
        const wMeters = toMeters(sheetWidth, lengthUnit);
        const areaSqM = lMeters * wMeters;
        singlePieceWeight = areaSqM * sheetThick * 7.85;
        weightPerMeter = singlePieceWeight / (lMeters || 1);
        totalWeightKg = singlePieceWeight * (sheetQty || 1);
        formulaText = `Length (m) × Width (m) × Thickness (mm) × 7.85 (Steel Density)`;
        break;
      }

      // 6. GI SHEET
      case 'gi_sheet': {
        const lMeters = toMeters(giSheetLength, lengthUnit);
        const wMeters = toMeters(giSheetWidth, lengthUnit);
        const areaSqM = lMeters * wMeters;
        const profileFactor = giSheetProfile === 'corrugated' ? 1.15 : 1.0;
        singlePieceWeight = areaSqM * (giSheetThick * 7.85 + 0.02) * profileFactor;
        weightPerMeter = singlePieceWeight / (lMeters || 1);
        totalWeightKg = singlePieceWeight * (giSheetQty || 1);
        formulaText = `Area (sq.m) × [Thickness × 7.85 + Zinc] × ${profileFactor === 1.15 ? '1.15 (Corrugation Factor)' : '1.0 (Plain)'}`;
        break;
      }

      // 7. I BEAM
      case 'ibeam': {
        const lengthInMeters = toMeters(ibeamLength, lengthUnit);
        if (ibeamMode === 'preset' && IBEAM_PRESETS[ibeamPreset]) {
          weightPerMeter = IBEAM_PRESETS[ibeamPreset].weightPerM;
          formulaText = `Standard ISMB / NPB Beam: ${IBEAM_PRESETS[ibeamPreset].label}`;
        } else {
          weightPerMeter = (2 * ibeamFlange * ibeamFlangeThick + (ibeamDepth - 2 * ibeamFlangeThick) * ibeamWebThick) * 0.00785;
          formulaText = `[2 × Flange × tf + (Depth - 2×tf) × tw] × 0.00785`;
        }
        singlePieceWeight = weightPerMeter * lengthInMeters;
        totalWeightKg = singlePieceWeight * (ibeamQty || 1);
        break;
      }

      // 8. H BEAM
      case 'hbeam': {
        const lengthInMeters = toMeters(hbeamLength, lengthUnit);
        if (hbeamMode === 'preset' && HBEAM_PRESETS[hbeamPreset]) {
          weightPerMeter = HBEAM_PRESETS[hbeamPreset].weightPerM;
          formulaText = `Standard ISHB / UC Column: ${HBEAM_PRESETS[hbeamPreset].label}`;
        } else {
          weightPerMeter = (2 * hbeamFlange * hbeamFlangeThick + (hbeamDepth - 2 * hbeamFlangeThick) * hbeamWebThick) * 0.00785;
          formulaText = `[2 × Flange × tf + (Depth - 2×tf) × tw] × 0.00785 (H-Beam Formula)`;
        }
        singlePieceWeight = weightPerMeter * lengthInMeters;
        totalWeightKg = singlePieceWeight * (hbeamQty || 1);
        break;
      }

      // 9. T BEAM
      case 'tbeam': {
        const lengthInMeters = toMeters(tbeamLength, lengthUnit);
        if (tbeamMode === 'preset' && TBEAM_PRESETS[tbeamPreset]) {
          weightPerMeter = TBEAM_PRESETS[tbeamPreset].weightPerM;
          formulaText = `Standard ISNT Tee Section: ${TBEAM_PRESETS[tbeamPreset].label}`;
        } else {
          weightPerMeter = (tbeamFlange * tbeamFlangeThick + (tbeamHeight - tbeamFlangeThick) * tbeamWebThick) * 0.00785;
          formulaText = `[Flange × tf + (Height - tf) × tw] × 0.00785 (T-Section Formula)`;
        }
        singlePieceWeight = weightPerMeter * lengthInMeters;
        totalWeightKg = singlePieceWeight * (tbeamQty || 1);
        break;
      }

      // 10. GI PIPE
      case 'gi_pipe': {
        const lengthInMeters = toMeters(giPipeLength, lengthUnit);
        const zincCoatingMultiplier = 1.035;
        if (giPipeShape === 'round') {
          weightPerMeter = (giPipeOD - giPipeThick) * giPipeThick * 0.02466 * zincCoatingMultiplier;
          formulaText = `(OD - T) × T × 0.02466 × 1.035 (GI Zinc Allowance)`;
        } else {
          const w = giPipeShape === 'square' ? giPipeWidth : giPipeWidth;
          const h = giPipeShape === 'square' ? giPipeWidth : giPipeHeight;
          weightPerMeter = (2 * (w + h) - 4 * giPipeThick) * giPipeThick * 0.00785 * zincCoatingMultiplier;
          formulaText = `[2 × (W + H) - 4×T] × T × 0.00785 × 1.035 (GI Box Tube)`;
        }
        singlePieceWeight = weightPerMeter * lengthInMeters;
        totalWeightKg = singlePieceWeight * (giPipeQty || 1);
        break;
      }

      // 11. MS PIPE
      case 'ms_pipe': {
        const lengthInMeters = toMeters(msPipeLength, lengthUnit);
        if (msPipeShape === 'round') {
          weightPerMeter = (msPipeOD - msPipeThick) * msPipeThick * 0.02466;
          formulaText = `(OD - Thickness) × Thickness × 0.02466`;
        } else {
          const w = msPipeShape === 'square' ? msPipeWidth : msPipeWidth;
          const h = msPipeShape === 'square' ? msPipeWidth : msPipeHeight;
          weightPerMeter = (2 * (w + h) - 4 * msPipeThick) * msPipeThick * 0.00785;
          formulaText = `[2 × (Width + Height) - 4×T] × T × 0.00785 (SHS/RHS Pipe)`;
        }
        singlePieceWeight = weightPerMeter * lengthInMeters;
        totalWeightKg = singlePieceWeight * (msPipeQty || 1);
        break;
      }
    }

    const totalWeightTon = totalWeightKg / 1000;

    return {
      weightPerMeter: Math.max(0, weightPerMeter),
      singlePieceWeight: Math.max(0, singlePieceWeight),
      totalWeightKg: Math.max(0, totalWeightKg),
      totalWeightTon: Math.max(0, totalWeightTon),
      formulaText,
      tmtFullBundles,
      tmtLoosePieces,
      tmtTotalPiecesCalculated,
      tmtTotalRunningMeters,
      tmtSelectedSpec
    };
  }, [
    activeCategory, lengthUnit,
    tmtCalcMode, tmtDia, tmtIsCustomDia, tmtCustomDia, tmtLength, tmtQtyPieces, tmtQtyBundles, tmtTargetWeight, tmtTargetUnit, tmtGrade, tmtScheduleList,
    angleMode, anglePreset, angleLegA, angleLegB, angleThickness, angleLength, angleQty,
    channelMode, channelPreset, channelHeight, channelFlange, channelWebThick, channelFlangeThick, channelLength, channelQty,
    barShape, roundMode, roundPreset, roundDia, squareMode, squarePreset, squareSide, barLength, barQty,
    flatMode, flatPreset, flatWidth, flatThick, flatLength, flatQty,
    sheetLength, sheetWidth, sheetThick, sheetQty,
    giSheetLength, giSheetWidth, giSheetThick, giSheetProfile, giSheetQty,
    ibeamMode, ibeamPreset, ibeamDepth, ibeamFlange, ibeamWebThick, ibeamFlangeThick, ibeamLength, ibeamQty,
    hbeamMode, hbeamPreset, hbeamDepth, hbeamFlange, hbeamWebThick, hbeamFlangeThick, hbeamLength, hbeamQty,
    tbeamMode, tbeamPreset, tbeamFlange, tbeamHeight, tbeamFlangeThick, tbeamWebThick, tbeamLength, tbeamQty,
    giPipeShape, giPipeOD, giPipeWidth, giPipeHeight, giPipeThick, giPipeLength, giPipeQty,
    msPipeShape, msPipeOD, msPipeWidth, msPipeHeight, msPipeThick, msPipeLength, msPipeQty
  ]);

  const handleCopyWeight = () => {
    const currentTab = CATEGORIES.find(c => c.id === activeCategory);
    let text = `Dahej Support Calculator Result:\nProduct: ${currentTab?.title} (${currentTab?.gujarati})\nTotal Weight: ${result.totalWeightKg.toFixed(2)} KG (${result.totalWeightTon.toFixed(3)} Metric Tonnes)\nUnit Weight: ${result.weightPerMeter.toFixed(3)} KG/m`;
    
    if (activeCategory === 'tmt') {
      const activeD = tmtIsCustomDia ? `${tmtCustomDia} mm (Custom)` : `${tmtDia} mm (${TMT_MEASUREMENTS[tmtDia]?.sut || ''})`;
      text += `\nTMT Size: ${activeD}\nGrade: ${tmtGrade}\nTotal Rods: ${result.tmtTotalPiecesCalculated} pcs\nBundles: ${result.tmtFullBundles} Full Bundles + ${result.tmtLoosePieces} Loose Rods\nRunning Length: ${result.tmtTotalRunningMeters.toFixed(2)} m (${toFeet(result.tmtTotalRunningMeters).toFixed(1)} ft)`;
    }

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleResetCurrent = () => {
    switch (activeCategory) {
      case 'tmt':
        setTmtDia(12);
        setTmtIsCustomDia(false);
        setTmtCustomDia(12);
        setTmtLength(12);
        setTmtLengthPreset('12m');
        setTmtQtyPieces(10);
        setTmtQtyBundles(5);
        setTmtTargetWeight(1);
        setTmtTargetUnit('ton');
        setTmtGrade('Fe 500D');
        setTmtScheduleList([]);
        break;
      case 'angle':
        setAngleLegA(50); setAngleLegB(50); setAngleThickness(6); setAngleLength(6); setAngleQty(1);
        break;
      case 'channel':
        setChannelHeight(100); setChannelFlange(50); setChannelWebThick(5.0); setChannelFlangeThick(7.5); setChannelLength(6); setChannelQty(1);
        break;
      case 'bar':
        setRoundDia(12); setSquareSide(12); setBarLength(6); setBarQty(1);
        break;
      case 'flat':
        setFlatWidth(50); setFlatThick(6); setFlatLength(6); setFlatQty(1);
        break;
      case 'sheet':
        setSheetLength(2.5); setSheetWidth(1.25); setSheetThick(10); setSheetQty(1);
        break;
      case 'gi_sheet':
        setGiSheetLength(8); setGiSheetWidth(3); setGiSheetThick(0.50); setGiSheetProfile('corrugated'); setGiSheetQty(10);
        break;
      case 'ibeam':
        setIbeamDepth(150); setIbeamFlange(75); setIbeamWebThick(5.0); setIbeamFlangeThick(8.0); setIbeamLength(6); setIbeamQty(1);
        break;
      case 'hbeam':
        setHbeamDepth(150); setHbeamFlange(150); setHbeamWebThick(5.4); setHbeamFlangeThick(8.4); setHbeamLength(6); setHbeamQty(1);
        break;
      case 'tbeam':
        setTbeamFlange(50); setTbeamHeight(50); setTbeamFlangeThick(6); setTbeamWebThick(6); setTbeamLength(6); setTbeamQty(1);
        break;
      case 'gi_pipe':
        setGiPipeOD(48.3); setGiPipeWidth(50); setGiPipeHeight(50); setGiPipeThick(2.9); setGiPipeLength(6); setGiPipeQty(1);
        break;
      case 'ms_pipe':
        setMsPipeOD(50); setMsPipeWidth(50); setMsPipeHeight(50); setMsPipeThick(3.0); setMsPipeLength(6); setMsPipeQty(1);
        break;
    }
  };

  // Filtered list for the TMT Master Reference Table
  const filteredTmtList = useMemo(() => {
    return Object.values(TMT_MEASUREMENTS).filter(item => {
      if (!tmtTableSearch) return true;
      const q = tmtTableSearch.toLowerCase();
      return (
        item.dia.toString().includes(q) ||
        item.sut.toLowerCase().includes(q) ||
        item.inch.toLowerCase().includes(q) ||
        item.usage.toLowerCase().includes(q) ||
        item.gujUsage.toLowerCase().includes(q)
      );
    });
  }, [tmtTableSearch]);

  const currentTab = CATEGORIES.find(c => c.id === activeCategory);
  const activeTmtSpec = tmtIsCustomDia ? null : TMT_MEASUREMENTS[tmtDia];

  return (
    <div className="calculator-page page-wrapper animate-fade-in">
      {/* Header Banner */}
      <section className="calculator-header-section">
        <div className="container">
          <span className="section-tag">Dahej Support Engineering Tool</span>
          <h1 className="section-title">Steel Weight & TMT Rebar Calculator</h1>
          <p className="section-desc">
            स्टील और टीएमटी सरिया वज़न कैलकुलेटर — Complete precision engineering weight calculator with dedicated TMT rebar specifications (4mm to 50mm, Sut & Inch measurements, standard bundle counts, reverse weight sizing, and Indian Standards IS:1786 / IS:808 / IS:2062).
          </p>
        </div>
      </section>

      {/* Main Calculator Workspace */}
      <section className="section-padding calculator-main-section">
        <div className="container">
          
          {/* 1. Category Selector Grid */}
          <div className="calc-categories-nav">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`calc-cat-card ${activeCategory === cat.id ? 'active' : ''} ${cat.id === 'tmt' ? 'featured-tmt-tab' : ''}`}
              >
                <span className="calc-cat-icon">{cat.iconName}</span>
                <div className="calc-cat-text">
                  <div className="calc-cat-title">
                    {cat.title}
                    {cat.id === 'tmt' && <span className="tmt-badge-pulse">IS 1786</span>}
                  </div>
                  <div className="calc-cat-guj">{cat.gujarati}</div>
                </div>
              </button>
            ))}
          </div>

          {/* 2. Workspace: Inputs Form + Realtime Weight Card */}
          <div className="calc-workspace-grid">
            
            {/* Left: Input Parameters Form */}
            <div className="calc-inputs-card">
              <div className="calc-card-header">
                <div>
                  <h2 className="calc-active-title">
                    {currentTab?.title} <span className="calc-title-guj">({currentTab?.gujarati})</span>
                  </h2>
                  <p className="calc-active-sub">{currentTab?.subtitle}</p>
                </div>

                {/* Length Unit Switcher (Except for multi-schedule mode) */}
                <div className="calc-unit-pill-group">
                  <span className="calc-unit-label">Length Unit:</span>
                  <button
                    type="button"
                    className={`unit-pill ${lengthUnit === 'meter' ? 'active' : ''}`}
                    onClick={() => setLengthUnit('meter')}
                  >
                    Meter
                  </button>
                  <button
                    type="button"
                    className={`unit-pill ${lengthUnit === 'feet' ? 'active' : ''}`}
                    onClick={() => setLengthUnit('feet')}
                  >
                    Feet
                  </button>
                  <button
                    type="button"
                    className={`unit-pill ${lengthUnit === 'mm' ? 'active' : ''}`}
                    onClick={() => setLengthUnit('mm')}
                  >
                    MM
                  </button>
                </div>
              </div>

              <div className="calc-form-body">
                
                {/* ========================================================= */}
                {/* CATEGORY 0: DEDICATED TMT REBARS (टीएमटी सरिया) */}
                {/* ========================================================= */}
                {activeCategory === 'tmt' && (
                  <div className="tmt-calculator-container">
                    
                    {/* Calculation Method Tabs */}
                    <div className="tmt-method-tabs">
                      <button
                        type="button"
                        className={`tmt-method-btn ${tmtCalcMode === 'by_pieces' ? 'active' : ''}`}
                        onClick={() => setTmtCalcMode('by_pieces')}
                      >
                        <Hash size={15} /> By Rods / Pieces (सरिया नग)
                      </button>
                      <button
                        type="button"
                        className={`tmt-method-btn ${tmtCalcMode === 'by_bundles' ? 'active' : ''}`}
                        onClick={() => setTmtCalcMode('by_bundles')}
                      >
                        <Layers size={15} /> By Bundles (बंडल अनुसार)
                      </button>
                      <button
                        type="button"
                        className={`tmt-method-btn ${tmtCalcMode === 'by_weight' ? 'active' : ''}`}
                        onClick={() => setTmtCalcMode('by_weight')}
                      >
                        <Scale size={15} /> Reverse: Weight to Rods (वज़न से सरिया)
                      </button>
                      <button
                        type="button"
                        className={`tmt-method-btn ${tmtCalcMode === 'multi_list' ? 'active' : ''}`}
                        onClick={() => setTmtCalcMode('multi_list')}
                      >
                        <FileSpreadsheet size={15} /> Project Bar Schedule (BBS लिस्ट)
                      </button>
                    </div>

                    {/* TMT Diameter Selector (Standard Matrix vs Custom) */}
                    <div className="tmt-dia-selector-section">
                      <div className="tmt-section-title-row">
                        <label className="form-label mb-0">
                          1. Select TMT Bar Diameter (व्यास और सूत)
                        </label>
                        <div className="tmt-custom-dia-toggle">
                          <button
                            type="button"
                            className={`sub-pill ${!tmtIsCustomDia ? 'active' : ''}`}
                            onClick={() => setTmtIsCustomDia(false)}
                          >
                            Standard Sizes (4mm - 50mm)
                          </button>
                          <button
                            type="button"
                            className={`sub-pill ${tmtIsCustomDia ? 'active' : ''}`}
                            onClick={() => setTmtIsCustomDia(true)}
                          >
                            Custom mm
                          </button>
                        </div>
                      </div>

                      {!tmtIsCustomDia ? (
                        <>
                          {/* 15 Quick Click Diameter Buttons */}
                          <div className="tmt-dia-buttons-grid">
                            {Object.values(TMT_MEASUREMENTS).map((item) => (
                              <button
                                key={item.dia}
                                type="button"
                                className={`tmt-dia-btn ${tmtDia === item.dia ? 'selected' : ''}`}
                                onClick={() => setTmtDia(item.dia)}
                              >
                                <span className="tmt-dia-mm">{item.dia} mm</span>
                                <span className="tmt-dia-sut">{item.sut.split(' ')[0]} Sut</span>
                                <span className="tmt-dia-wt">{item.weightPerM.toFixed(3)} kg/m</span>
                              </button>
                            ))}
                          </div>

                          {/* Dropdown Alternative for quick picking */}
                          <div className="form-group mt-3">
                            <select
                              className="form-control form-select tmt-select-main"
                              value={tmtDia}
                              onChange={(e) => setTmtDia(Number(e.target.value))}
                            >
                              {Object.values(TMT_MEASUREMENTS).map((item) => (
                                <option key={item.dia} value={item.dia}>
                                  {item.dia} mm ({item.sut} / {item.inch}) — {item.weightPerM.toFixed(3)} kg/m | {item.pcsPerBundle} pcs/bundle (~{item.bundleWeightKg.toFixed(1)} kg)
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : (
                        <div className="form-group mt-2">
                          <label className="form-label">Custom Rebar Diameter D (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={1}
                            max={100}
                            className="form-control"
                            placeholder="e.g. 14, 18, 24, 30"
                            value={tmtCustomDia}
                            onChange={(e) => setTmtCustomDia(Number(e.target.value))}
                          />
                          <span className="text-muted small">
                            Calculated using standard formula: D² / 162.28 kg/m
                          </span>
                        </div>
                      )}
                    </div>

                    {/* TMT Bar Length Section (Standard 12m factory rod presets) */}
                    <div className="tmt-length-section">
                      <label className="form-label">
                        2. Rebar Length per Piece (सरिया की लंबाई)
                      </label>
                      <div className="tmt-length-presets-row">
                        <button
                          type="button"
                          className={`length-preset-btn ${tmtLengthPreset === '12m' ? 'active' : ''}`}
                          onClick={() => handleTmtLengthPreset('12m')}
                        >
                          <strong>12 Meters</strong>
                          <span>Standard Mill Rod (~40 Ft)</span>
                        </button>
                        <button
                          type="button"
                          className={`length-preset-btn ${tmtLengthPreset === '40ft' ? 'active' : ''}`}
                          onClick={() => handleTmtLengthPreset('40ft')}
                        >
                          <strong>40 Feet</strong>
                          <span>Imperial Standard</span>
                        </button>
                        <button
                          type="button"
                          className={`length-preset-btn ${tmtLengthPreset === '6m' ? 'active' : ''}`}
                          onClick={() => handleTmtLengthPreset('6m')}
                        >
                          <strong>6 Meters</strong>
                          <span>Half Length Rod (~20 Ft)</span>
                        </button>
                        <button
                          type="button"
                          className={`length-preset-btn ${tmtLengthPreset === '1m' ? 'active' : ''}`}
                          onClick={() => handleTmtLengthPreset('1m')}
                        >
                          <strong>1 Meter</strong>
                          <span>Per Meter Unit</span>
                        </button>
                        <button
                          type="button"
                          className={`length-preset-btn ${tmtLengthPreset === 'custom' ? 'active' : ''}`}
                          onClick={() => setTmtLengthPreset('custom')}
                        >
                          <strong>Custom Length</strong>
                          <span>Manual Input</span>
                        </button>
                      </div>

                      {tmtLengthPreset === 'custom' && (
                        <div className="form-group mt-2">
                          <label className="form-label">Enter Custom Length ({lengthUnit})</label>
                          <input
                            type="number"
                            step="any"
                            min={0.1}
                            className="form-control"
                            value={tmtLength}
                            onChange={(e) => setTmtLength(Number(e.target.value))}
                          />
                        </div>
                      )}
                    </div>

                    {/* Mode Specific Inputs */}
                    <div className="tmt-mode-inputs-section">
                      
                      {/* MODE A: BY PIECES */}
                      {tmtCalcMode === 'by_pieces' && (
                        <div className="calc-grid-2">
                          <div className="form-group">
                            <label className="form-label">Total Quantity (Number of Rods / कुल सरिया)</label>
                            <input
                              type="number"
                              min={1}
                              className="form-control form-control-lg text-brand font-bold"
                              value={tmtQtyPieces}
                              onChange={(e) => setTmtQtyPieces(Number(e.target.value))}
                            />
                            {activeTmtSpec && (
                              <span className="tmt-quick-hint">
                                Standard bundle: <strong>{activeTmtSpec.pcsPerBundle} pcs/bundle</strong>
                              </span>
                            )}
                          </div>

                          <div className="form-group">
                            <label className="form-label">Steel Grade (ग्रेड)</label>
                            <select
                              className="form-control form-select"
                              value={tmtGrade}
                              onChange={(e) => setTmtGrade(e.target.value as any)}
                            >
                              <option value="Fe 500D">Fe 500D (Super Ductile / Earthquake Resistant)</option>
                              <option value="Fe 550D">Fe 550D (High Strength Heavy Construction)</option>
                              <option value="Fe 500">Fe 500 (Standard Commercial)</option>
                              <option value="Fe 600">Fe 600 (Ultra High Strength Infrastructure)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* MODE B: BY BUNDLES */}
                      {tmtCalcMode === 'by_bundles' && (
                        <div className="calc-grid-2">
                          <div className="form-group">
                            <label className="form-label">Total Number of Factory Bundles (कुल बंडल)</label>
                            <input
                              type="number"
                              min={1}
                              className="form-control form-control-lg text-brand font-bold"
                              value={tmtQtyBundles}
                              onChange={(e) => setTmtQtyBundles(Number(e.target.value))}
                            />
                            {activeTmtSpec && (
                              <span className="tmt-quick-hint">
                                1 Bundle = <strong>{activeTmtSpec.pcsPerBundle} rods</strong> (~{activeTmtSpec.bundleWeightKg.toFixed(1)} kg)
                              </span>
                            )}
                          </div>

                          <div className="form-group">
                            <label className="form-label">Steel Grade (ग्रेड)</label>
                            <select
                              className="form-control form-select"
                              value={tmtGrade}
                              onChange={(e) => setTmtGrade(e.target.value as any)}
                            >
                              <option value="Fe 500D">Fe 500D (Super Ductile / Earthquake Resistant)</option>
                              <option value="Fe 550D">Fe 550D (High Strength Heavy Construction)</option>
                              <option value="Fe 500">Fe 500 (Standard Commercial)</option>
                              <option value="Fe 600">Fe 600 (Ultra High Strength Infrastructure)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* MODE C: REVERSE WEIGHT TO PIECES */}
                      {tmtCalcMode === 'by_weight' && (
                        <div className="calc-grid-2">
                          <div className="form-group">
                            <label className="form-label">Target Procurement Weight (आवश्यक वज़न)</label>
                            <div className="tmt-weight-input-group">
                              <input
                                type="number"
                                step="any"
                                min={0.1}
                                className="form-control form-control-lg text-brand font-bold"
                                value={tmtTargetWeight}
                                onChange={(e) => setTmtTargetWeight(Number(e.target.value))}
                              />
                              <div className="tmt-unit-toggle">
                                <button
                                  type="button"
                                  className={`unit-toggle-btn ${tmtTargetUnit === 'ton' ? 'active' : ''}`}
                                  onClick={() => setTmtTargetUnit('ton')}
                                >
                                  Tonnes (MT)
                                </button>
                                <button
                                  type="button"
                                  className={`unit-toggle-btn ${tmtTargetUnit === 'kg' ? 'active' : ''}`}
                                  onClick={() => setTmtTargetUnit('kg')}
                                >
                                  KG
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Steel Grade (ग्रेड)</label>
                            <select
                              className="form-control form-select"
                              value={tmtGrade}
                              onChange={(e) => setTmtGrade(e.target.value as any)}
                            >
                              <option value="Fe 500D">Fe 500D (Super Ductile / Earthquake Resistant)</option>
                              <option value="Fe 550D">Fe 550D (High Strength Heavy Construction)</option>
                              <option value="Fe 500">Fe 500 (Standard Commercial)</option>
                              <option value="Fe 600">Fe 600 (Ultra High Strength Infrastructure)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* MODE D: MULTI-SIZE BAR SCHEDULE */}
                      {tmtCalcMode === 'multi_list' && (
                        <div className="tmt-multilist-section">
                          <div className="tmt-multilist-add-bar">
                            <div className="add-field">
                              <span className="field-label">Current Size:</span>
                              <strong>{tmtIsCustomDia ? `${tmtCustomDia}mm` : `${tmtDia}mm (${activeTmtSpec?.sut})`}</strong>
                            </div>
                            <div className="add-field">
                              <span className="field-label">Length:</span>
                              <strong>{tmtLength} {lengthUnit}</strong>
                            </div>
                            <div className="add-field">
                              <span className="field-label">Quantity:</span>
                              <input
                                type="number"
                                min={1}
                                className="form-control form-control-sm add-qty-input"
                                value={tmtQtyPieces}
                                onChange={(e) => setTmtQtyPieces(Number(e.target.value))}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleAddScheduleItem}
                              className="btn btn-primary btn-sm add-schedule-btn"
                            >
                              <Plus size={15} /> Add to Order List
                            </button>
                          </div>

                          {/* List Table */}
                          {tmtScheduleList.length > 0 ? (
                            <div className="tmt-schedule-table-wrap">
                              <table className="tmt-schedule-table">
                                <thead>
                                  <tr>
                                    <th>Diameter</th>
                                    <th>Length</th>
                                    <th>Pieces</th>
                                    <th>Bundles + Loose</th>
                                    <th>Total Weight (KG)</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tmtScheduleList.map((item) => (
                                    <tr key={item.id}>
                                      <td>
                                        <strong>{item.dia} mm</strong> <span className="text-muted">({TMT_MEASUREMENTS[item.dia]?.sut || 'Custom'})</span>
                                      </td>
                                      <td>{item.lengthM} m ({toFeet(item.lengthM).toFixed(1)} ft)</td>
                                      <td><strong>{item.pieces}</strong> rods</td>
                                      <td>{item.bundles} bdl + {item.loosePieces} pcs</td>
                                      <td className="font-bold text-brand">{item.totalKg.toFixed(2)} KG</td>
                                      <td>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveScheduleItem(item.id)}
                                          className="tmt-del-btn"
                                          title="Remove row"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr>
                                    <td colSpan={2}><strong>Grand Total:</strong></td>
                                    <td><strong>{result.tmtTotalPiecesCalculated} Rods</strong></td>
                                    <td><strong>{result.tmtFullBundles} Bundles + {result.tmtLoosePieces} Loose</strong></td>
                                    <td className="font-bold text-brand text-lg">{result.totalWeightKg.toFixed(2)} KG ({result.totalWeightTon.toFixed(3)} MT)</td>
                                    <td>
                                      <button
                                        type="button"
                                        onClick={handleClearSchedule}
                                        className="btn btn-secondary btn-xs"
                                      >
                                        Clear All
                                      </button>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          ) : (
                            <div className="tmt-empty-schedule">
                              <p>No sizes added yet. Select a diameter above, enter the quantity, and click <strong>"Add to Order List"</strong> to build a multi-rebar project bill!</p>
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                    {/* TMT Technical Quick Details Card */}
                    {activeTmtSpec && (
                      <div className="tmt-spec-summary-strip">
                        <div className="tmt-spec-strip-header">
                          <span className="badge-is">IS 1786:2008 Standard Matrix</span>
                          <span className="tmt-spec-main-tag">{activeTmtSpec.dia} mm ({activeTmtSpec.sut} / {activeTmtSpec.inch})</span>
                        </div>
                        <div className="tmt-spec-strip-grid">
                          <div className="strip-item">
                            <span className="s-label">Nominal Mass:</span>
                            <span className="s-val">{activeTmtSpec.weightPerM.toFixed(3)} kg/m ({activeTmtSpec.weightPerFt.toFixed(3)} kg/ft)</span>
                          </div>
                          <div className="strip-item">
                            <span className="s-label">12m Rod Weight:</span>
                            <span className="s-val">{activeTmtSpec.weightPer12m.toFixed(2)} kg / rod</span>
                          </div>
                          <div className="strip-item">
                            <span className="s-label">Bundle Packaging:</span>
                            <span className="s-val">{activeTmtSpec.pcsPerBundle} pcs (~{activeTmtSpec.bundleWeightKg.toFixed(1)} kg/bdl)</span>
                          </div>
                          <div className="strip-item">
                            <span className="s-label">Bars per Metric Ton:</span>
                            <span className="s-val">{activeTmtSpec.barsPerTon.toFixed(1)} rods / Ton</span>
                          </div>
                          <div className="strip-item">
                            <span className="s-label">Cross Section Area:</span>
                            <span className="s-val">{activeTmtSpec.areaMm2.toFixed(1)} mm²</span>
                          </div>
                          <div className="strip-item">
                            <span className="s-label">IS Tolerance:</span>
                            <span className="s-val">{activeTmtSpec.tolerance}</span>
                          </div>
                          <div className="strip-item span-full">
                            <span className="s-label">Primary Civil Usage:</span>
                            <span className="s-val">{activeTmtSpec.usage} <strong className="text-teal">({activeTmtSpec.gujUsage})</strong></span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* CATEGORY 1: MS ANGLE (एंगल) */}
                {activeCategory === 'angle' && (
                  <>
                    <div className="calc-mode-switch">
                      <button
                        type="button"
                        className={`mode-btn ${angleMode === 'preset' ? 'active' : ''}`}
                        onClick={() => setAngleMode('preset')}
                      >
                        Standard IS Equal Angles
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${angleMode === 'custom' ? 'active' : ''}`}
                        onClick={() => setAngleMode('custom')}
                      >
                        Custom Leg & Thickness
                      </button>
                    </div>

                    {angleMode === 'preset' ? (
                      <div className="form-group">
                        <label className="form-label">Select Standard Angle Size (A x B x T)</label>
                        <select
                          className="form-control form-select"
                          value={anglePreset}
                          onChange={(e) => setAnglePreset(e.target.value)}
                        >
                          {Object.entries(ANGLE_PRESETS).map(([key, item]) => (
                            <option key={key} value={key}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="calc-grid-3">
                        <div className="form-group">
                          <label className="form-label">Leg A Width (mm)</label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={angleLegA}
                            onChange={(e) => setAngleLegA(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Leg B Width (mm)</label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={angleLegB}
                            onChange={(e) => setAngleLegB(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Thickness T (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            value={angleThickness}
                            onChange={(e) => setAngleThickness(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="calc-grid-2">
                      <div className="form-group">
                        <label className="form-label">Length per Piece ({lengthUnit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.1}
                          className="form-control"
                          value={angleLength}
                          onChange={(e) => setAngleLength(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quantity (Total Pieces)</label>
                        <input
                          type="number"
                          min={1}
                          className="form-control"
                          value={angleQty}
                          onChange={(e) => setAngleQty(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* CATEGORY 2: MS CHANNEL (चैनल) */}
                {activeCategory === 'channel' && (
                  <>
                    <div className="calc-mode-switch">
                      <button
                        type="button"
                        className={`mode-btn ${channelMode === 'preset' ? 'active' : ''}`}
                        onClick={() => setChannelMode('preset')}
                      >
                        Standard ISMC Channels
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${channelMode === 'custom' ? 'active' : ''}`}
                        onClick={() => setChannelMode('custom')}
                      >
                        Custom Channel Dimensions
                      </button>
                    </div>

                    {channelMode === 'preset' ? (
                      <div className="form-group">
                        <label className="form-label">Select ISMC Channel Section</label>
                        <select
                          className="form-control form-select"
                          value={channelPreset}
                          onChange={(e) => setChannelPreset(e.target.value)}
                        >
                          {Object.entries(CHANNEL_PRESETS).map(([key, item]) => (
                            <option key={key} value={key}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="calc-grid-4">
                        <div className="form-group">
                          <label className="form-label">Web Height H (mm)</label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={channelHeight}
                            onChange={(e) => setChannelHeight(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Flange B (mm)</label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={channelFlange}
                            onChange={(e) => setChannelFlange(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Web Thick tw (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            value={channelWebThick}
                            onChange={(e) => setChannelWebThick(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Flange Thick tf (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            value={channelFlangeThick}
                            onChange={(e) => setChannelFlangeThick(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="calc-grid-2">
                      <div className="form-group">
                        <label className="form-label">Length per Piece ({lengthUnit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.1}
                          className="form-control"
                          value={channelLength}
                          onChange={(e) => setChannelLength(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quantity (Pieces)</label>
                        <input
                          type="number"
                          min={1}
                          className="form-control"
                          value={channelQty}
                          onChange={(e) => setChannelQty(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* CATEGORY 3: MS ROUND & SQUARE BRIGHT BAR (एमएस राउंड / चौकोर बार) */}
                {activeCategory === 'bar' && (
                  <>
                    <div className="calc-mode-switch">
                      <button
                        type="button"
                        className={`mode-btn ${barShape === 'round' ? 'active' : ''}`}
                        onClick={() => setBarShape('round')}
                      >
                        Bright Plain Round Bar (गोल बार)
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${barShape === 'square' ? 'active' : ''}`}
                        onClick={() => setBarShape('square')}
                      >
                        Square Bar (चौकोर बार / चकोर)
                      </button>
                    </div>

                    {barShape === 'round' ? (
                      <>
                        <div className="calc-mode-switch" style={{ marginTop: '8px', marginBottom: '16px' }}>
                          <button
                            type="button"
                            className={`mode-btn ${roundMode === 'preset' ? 'active' : ''}`}
                            onClick={() => setRoundMode('preset')}
                            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                          >
                            Standard Round Sizes
                          </button>
                          <button
                            type="button"
                            className={`mode-btn ${roundMode === 'custom' ? 'active' : ''}`}
                            onClick={() => setRoundMode('custom')}
                            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                          >
                            Custom Diameter
                          </button>
                        </div>

                        {roundMode === 'preset' ? (
                          <div className="form-group">
                            <label className="form-label">Select Standard Bright Round Diameter</label>
                            <select
                              className="form-control form-select"
                              value={roundPreset}
                              onChange={(e) => setRoundPreset(e.target.value)}
                            >
                              {Object.entries(ROUND_BAR_PRESETS).map(([key, item]) => (
                                <option key={key} value={key}>{item.label}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="form-group">
                            <label className="form-label">Bar Diameter D (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              min={1}
                              className="form-control"
                              placeholder="e.g. 8, 10, 12, 16, 20, 25, 32"
                              value={roundDia}
                              onChange={(e) => setRoundDia(Number(e.target.value))}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="calc-mode-switch" style={{ marginTop: '8px', marginBottom: '16px' }}>
                          <button
                            type="button"
                            className={`mode-btn ${squareMode === 'preset' ? 'active' : ''}`}
                            onClick={() => setSquareMode('preset')}
                            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                          >
                            Standard Square Sizes
                          </button>
                          <button
                            type="button"
                            className={`mode-btn ${squareMode === 'custom' ? 'active' : ''}`}
                            onClick={() => setSquareMode('custom')}
                            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                          >
                            Custom Side Width
                          </button>
                        </div>

                        {squareMode === 'preset' ? (
                          <div className="form-group">
                            <label className="form-label">Select Standard Square Bar Size</label>
                            <select
                              className="form-control form-select"
                              value={squarePreset}
                              onChange={(e) => setSquarePreset(e.target.value)}
                            >
                              {Object.entries(SQUARE_BAR_PRESETS).map(([key, item]) => (
                                <option key={key} value={key}>{item.label}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="form-group">
                            <label className="form-label">Square Side S (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              min={1}
                              className="form-control"
                              placeholder="e.g. 10, 12, 16, 20, 25, 32"
                              value={squareSide}
                              onChange={(e) => setSquareSide(Number(e.target.value))}
                            />
                          </div>
                        )}
                      </>
                    )}

                    <div className="calc-grid-2">
                      <div className="form-group">
                        <label className="form-label">Length per Bar ({lengthUnit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.1}
                          className="form-control"
                          value={barLength}
                          onChange={(e) => setBarLength(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quantity (Number of Bars)</label>
                        <input
                          type="number"
                          min={1}
                          className="form-control"
                          value={barQty}
                          onChange={(e) => setBarQty(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* CATEGORY 4: MS FLAT / PATTI (एमएस फ्लैट / पट्टी) */}
                {activeCategory === 'flat' && (
                  <>
                    <div className="calc-mode-switch">
                      <button
                        type="button"
                        className={`mode-btn ${flatMode === 'preset' ? 'active' : ''}`}
                        onClick={() => setFlatMode('preset')}
                      >
                        Standard MS Flat Sizes
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${flatMode === 'custom' ? 'active' : ''}`}
                        onClick={() => setFlatMode('custom')}
                      >
                        Custom Width & Thickness
                      </button>
                    </div>

                    {flatMode === 'preset' ? (
                      <div className="form-group">
                        <label className="form-label">Select Standard Flat Patti (Width x Thickness)</label>
                        <select
                          className="form-control form-select"
                          value={flatPreset}
                          onChange={(e) => setFlatPreset(e.target.value)}
                        >
                          {Object.entries(FLAT_PRESETS).map(([key, item]) => (
                            <option key={key} value={key}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="calc-grid-2">
                        <div className="form-group">
                          <label className="form-label">Flat Width W (mm)</label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            placeholder="e.g. 25, 32, 40, 50, 75, 100"
                            value={flatWidth}
                            onChange={(e) => setFlatWidth(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Thickness T (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            placeholder="e.g. 3, 5, 6, 8, 10, 12, 16"
                            value={flatThick}
                            onChange={(e) => setFlatThick(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="calc-grid-2">
                      <div className="form-group">
                        <label className="form-label">Length per Piece ({lengthUnit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.1}
                          className="form-control"
                          value={flatLength}
                          onChange={(e) => setFlatLength(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quantity (Pieces)</label>
                        <input
                          type="number"
                          min={1}
                          className="form-control"
                          value={flatQty}
                          onChange={(e) => setFlatQty(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* CATEGORY 5: MS SHEET / PLATE (एमएस शीट) */}
                {activeCategory === 'sheet' && (
                  <>
                    <div className="calc-grid-3">
                      <div className="form-group">
                        <label className="form-label">Sheet Length ({lengthUnit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.01}
                          className="form-control"
                          value={sheetLength}
                          onChange={(e) => setSheetLength(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Sheet Width ({lengthUnit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.01}
                          className="form-control"
                          value={sheetWidth}
                          onChange={(e) => setSheetWidth(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Thickness (mm)</label>
                        <input
                          type="number"
                          step="0.1"
                          min={0.1}
                          className="form-control"
                          placeholder="e.g. 8, 10, 12, 16, 20"
                          value={sheetThick}
                          onChange={(e) => setSheetThick(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ maxWidth: '300px' }}>
                      <label className="form-label">Quantity (Number of Sheets / Plates)</label>
                      <input
                        type="number"
                        min={1}
                        className="form-control"
                        value={sheetQty}
                        onChange={(e) => setSheetQty(Number(e.target.value))}
                      />
                    </div>
                  </>
                )}

                {/* CATEGORY 6: GI SHEET (जीआई शीट) */}
                {activeCategory === 'gi_sheet' && (
                  <>
                    <div className="calc-mode-switch">
                      <button
                        type="button"
                        className={`mode-btn ${giSheetProfile === 'corrugated' ? 'active' : ''}`}
                        onClick={() => setGiSheetProfile('corrugated')}
                      >
                        Corrugated Roofing Sheet (छत के पतरे)
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${giSheetProfile === 'plain' ? 'active' : ''}`}
                        onClick={() => setGiSheetProfile('plain')}
                      >
                        Plain Galvanized Sheet (प्लेन जीआई)
                      </button>
                    </div>

                    <div className="calc-grid-3">
                      <div className="form-group">
                        <label className="form-label">Sheet Length ({lengthUnit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.1}
                          className="form-control"
                          value={giSheetLength}
                          onChange={(e) => setGiSheetLength(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Sheet Width ({lengthUnit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.1}
                          className="form-control"
                          value={giSheetWidth}
                          onChange={(e) => setGiSheetWidth(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Thickness / Gauge (mm)</label>
                        <select
                          className="form-control form-select"
                          value={giSheetThick}
                          onChange={(e) => setGiSheetThick(Number(e.target.value))}
                        >
                          <option value={0.30}>0.30 mm (~30 Gauge)</option>
                          <option value={0.35}>0.35 mm (~28 Gauge)</option>
                          <option value={0.40}>0.40 mm (~26 Gauge Light)</option>
                          <option value={0.50}>0.50 mm (~24 Gauge Standard)</option>
                          <option value={0.63}>0.63 mm (~22 Gauge Heavy)</option>
                          <option value={0.80}>0.80 mm (~20 Gauge)</option>
                          <option value={1.00}>1.00 mm (~18 Gauge)</option>
                          <option value={1.20}>1.20 mm (~16 Gauge)</option>
                          <option value={1.60}>1.60 mm (~14 Gauge)</option>
                          <option value={2.00}>2.00 mm (~12 Gauge)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ maxWidth: '300px' }}>
                      <label className="form-label">Total Sheet Quantity (Nos)</label>
                      <input
                        type="number"
                        min={1}
                        className="form-control"
                        value={giSheetQty}
                        onChange={(e) => setGiSheetQty(Number(e.target.value))}
                      />
                    </div>
                  </>
                )}

                {/* CATEGORY 7: I BEAM (आई बीम) */}
                {activeCategory === 'ibeam' && (
                  <>
                    <div className="calc-mode-switch">
                      <button
                        type="button"
                        className={`mode-btn ${ibeamMode === 'preset' ? 'active' : ''}`}
                        onClick={() => setIbeamMode('preset')}
                      >
                        Standard ISMB / NPB Sections
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${ibeamMode === 'custom' ? 'active' : ''}`}
                        onClick={() => setIbeamMode('custom')}
                      >
                        Custom Beam Dimensions
                      </button>
                    </div>

                    {ibeamMode === 'preset' ? (
                      <div className="form-group">
                        <label className="form-label">Select Standard ISMB / NPB Section</label>
                        <select
                          className="form-control form-select"
                          value={ibeamPreset}
                          onChange={(e) => setIbeamPreset(e.target.value)}
                        >
                          {Object.entries(IBEAM_PRESETS).map(([key, item]) => (
                            <option key={key} value={key}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="calc-grid-4">
                        <div className="form-group">
                          <label className="form-label">Depth D (mm)</label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={ibeamDepth}
                            onChange={(e) => setIbeamDepth(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Flange B (mm)</label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={ibeamFlange}
                            onChange={(e) => setIbeamFlange(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Web Thick tw (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            value={ibeamWebThick}
                            onChange={(e) => setIbeamWebThick(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Flange Thick tf (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            value={ibeamFlangeThick}
                            onChange={(e) => setIbeamFlangeThick(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="calc-grid-2">
                      <div className="form-group">
                        <label className="form-label">Length per Beam ({lengthUnit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.1}
                          className="form-control"
                          value={ibeamLength}
                          onChange={(e) => setIbeamLength(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quantity (Pieces)</label>
                        <input
                          type="number"
                          min={1}
                          className="form-control"
                          value={ibeamQty}
                          onChange={(e) => setIbeamQty(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* CATEGORY 8: H BEAM (एच बीम) */}
                {activeCategory === 'hbeam' && (
                  <>
                    <div className="calc-mode-switch">
                      <button
                        type="button"
                        className={`mode-btn ${hbeamMode === 'preset' ? 'active' : ''}`}
                        onClick={() => setHbeamMode('preset')}
                      >
                        Standard ISHB / Column Sections
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${hbeamMode === 'custom' ? 'active' : ''}`}
                        onClick={() => setHbeamMode('custom')}
                      >
                        Custom H-Column Dimensions
                      </button>
                    </div>

                    {hbeamMode === 'preset' ? (
                      <div className="form-group">
                        <label className="form-label">Select Standard ISHB Column Section</label>
                        <select
                          className="form-control form-select"
                          value={hbeamPreset}
                          onChange={(e) => setHbeamPreset(e.target.value)}
                        >
                          {Object.entries(HBEAM_PRESETS).map(([key, item]) => (
                            <option key={key} value={key}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="calc-grid-4">
                        <div className="form-group">
                          <label className="form-label">Depth D (mm)</label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={hbeamDepth}
                            onChange={(e) => setHbeamDepth(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Flange B (mm)</label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={hbeamFlange}
                            onChange={(e) => setHbeamFlange(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Web Thick tw (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            value={hbeamWebThick}
                            onChange={(e) => setHbeamWebThick(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Flange Thick tf (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            value={hbeamFlangeThick}
                            onChange={(e) => setHbeamFlangeThick(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="calc-grid-2">
                      <div className="form-group">
                        <label className="form-label">Length per Column ({lengthUnit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.1}
                          className="form-control"
                          value={hbeamLength}
                          onChange={(e) => setHbeamLength(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quantity (Pieces)</label>
                        <input
                          type="number"
                          min={1}
                          className="form-control"
                          value={hbeamQty}
                          onChange={(e) => setHbeamQty(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* CATEGORY 9: T BEAM (टी बीम) */}
                {activeCategory === 'tbeam' && (
                  <>
                    <div className="calc-mode-switch">
                      <button
                        type="button"
                        className={`mode-btn ${tbeamMode === 'preset' ? 'active' : ''}`}
                        onClick={() => setTbeamMode('preset')}
                      >
                        Standard ISNT Tee Sections
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${tbeamMode === 'custom' ? 'active' : ''}`}
                        onClick={() => setTbeamMode('custom')}
                      >
                        Custom Tee Dimensions
                      </button>
                    </div>

                    {tbeamMode === 'preset' ? (
                      <div className="form-group">
                        <label className="form-label">Select Standard ISNT Tee Size</label>
                        <select
                          className="form-control form-select"
                          value={tbeamPreset}
                          onChange={(e) => setTbeamPreset(e.target.value)}
                        >
                          {Object.entries(TBEAM_PRESETS).map(([key, item]) => (
                            <option key={key} value={key}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="calc-grid-4">
                        <div className="form-group">
                          <label className="form-label">Flange B (mm)</label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={tbeamFlange}
                            onChange={(e) => setTbeamFlange(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Height H (mm)</label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={tbeamHeight}
                            onChange={(e) => setTbeamHeight(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Flange Thick tf (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            value={tbeamFlangeThick}
                            onChange={(e) => setTbeamFlangeThick(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Web Thick tw (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            value={tbeamWebThick}
                            onChange={(e) => setTbeamWebThick(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="calc-grid-2">
                      <div className="form-group">
                        <label className="form-label">Length per Piece ({lengthUnit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.1}
                          className="form-control"
                          value={tbeamLength}
                          onChange={(e) => setTbeamLength(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quantity (Pieces)</label>
                        <input
                          type="number"
                          min={1}
                          className="form-control"
                          value={tbeamQty}
                          onChange={(e) => setTbeamQty(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* CATEGORY 10: GI PIPE (जीआई पाइप) */}
                {activeCategory === 'gi_pipe' && (
                  <>
                    <div className="calc-mode-switch">
                      <button
                        type="button"
                        className={`mode-btn ${giPipeShape === 'round' ? 'active' : ''}`}
                        onClick={() => setGiPipeShape('round')}
                      >
                        Round GI Pipe (गोल पाइप)
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${giPipeShape === 'square' ? 'active' : ''}`}
                        onClick={() => setGiPipeShape('square')}
                      >
                        Square GI Box (चौकोर पाइप)
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${giPipeShape === 'rect' ? 'active' : ''}`}
                        onClick={() => setGiPipeShape('rect')}
                      >
                        Rectangular GI Box (आयताकार पाइप)
                      </button>
                    </div>

                    {giPipeShape === 'round' ? (
                      <div className="calc-grid-2">
                        <div className="form-group">
                          <label className="form-label">Outer Diameter OD (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={1}
                            className="form-control"
                            placeholder="e.g. 21.3, 33.7, 48.3, 60.3"
                            value={giPipeOD}
                            onChange={(e) => setGiPipeOD(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Wall Thickness T (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            placeholder="e.g. 2.0, 2.6, 2.9, 3.2, 4.0"
                            value={giPipeThick}
                            onChange={(e) => setGiPipeThick(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="calc-grid-3">
                        <div className="form-group">
                          <label className="form-label">Width (mm)</label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={giPipeWidth}
                            onChange={(e) => setGiPipeWidth(Number(e.target.value))}
                          />
                        </div>
                        {giPipeShape === 'rect' && (
                          <div className="form-group">
                            <label className="form-label">Height (mm)</label>
                            <input
                              type="number"
                              min={1}
                              className="form-control"
                              value={giPipeHeight}
                              onChange={(e) => setGiPipeHeight(Number(e.target.value))}
                            />
                          </div>
                        )}
                        <div className="form-group">
                          <label className="form-label">Thickness T (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            value={giPipeThick}
                            onChange={(e) => setGiPipeThick(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="calc-grid-2">
                      <div className="form-group">
                        <label className="form-label">Pipe Length per Piece ({lengthUnit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.1}
                          className="form-control"
                          value={giPipeLength}
                          onChange={(e) => setGiPipeLength(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quantity (Pipes)</label>
                        <input
                          type="number"
                          min={1}
                          className="form-control"
                          value={giPipeQty}
                          onChange={(e) => setGiPipeQty(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* CATEGORY 11: MS PIPE (एमएस पाइप) */}
                {activeCategory === 'ms_pipe' && (
                  <>
                    <div className="calc-mode-switch">
                      <button
                        type="button"
                        className={`mode-btn ${msPipeShape === 'round' ? 'active' : ''}`}
                        onClick={() => setMsPipeShape('round')}
                      >
                        Round MS Pipe (ERW / सीमलेस)
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${msPipeShape === 'square' ? 'active' : ''}`}
                        onClick={() => setMsPipeShape('square')}
                      >
                        Square Box Tube (SHS चौकोर)
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${msPipeShape === 'rect' ? 'active' : ''}`}
                        onClick={() => setMsPipeShape('rect')}
                      >
                        Rectangular Box Tube (RHS आयताकार)
                      </button>
                    </div>

                    {msPipeShape === 'round' ? (
                      <div className="calc-grid-2">
                        <div className="form-group">
                          <label className="form-label">Outer Diameter OD (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={1}
                            className="form-control"
                            placeholder="e.g. 25.4, 38.1, 50.8, 76.2"
                            value={msPipeOD}
                            onChange={(e) => setMsPipeOD(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Wall Thickness T (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            placeholder="e.g. 1.6, 2.0, 2.5, 3.0, 4.5"
                            value={msPipeThick}
                            onChange={(e) => setMsPipeThick(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="calc-grid-3">
                        <div className="form-group">
                          <label className="form-label">Width (mm)</label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={msPipeWidth}
                            onChange={(e) => setMsPipeWidth(Number(e.target.value))}
                          />
                        </div>
                        {msPipeShape === 'rect' && (
                          <div className="form-group">
                            <label className="form-label">Height (mm)</label>
                            <input
                              type="number"
                              min={1}
                              className="form-control"
                              value={msPipeHeight}
                              onChange={(e) => setMsPipeHeight(Number(e.target.value))}
                            />
                          </div>
                        )}
                        <div className="form-group">
                          <label className="form-label">Thickness T (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0.5}
                            className="form-control"
                            value={msPipeThick}
                            onChange={(e) => setMsPipeThick(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="calc-grid-2">
                      <div className="form-group">
                        <label className="form-label">Length per Piece ({lengthUnit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.1}
                          className="form-control"
                          value={msPipeLength}
                          onChange={(e) => setMsPipeLength(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quantity (Pieces)</label>
                        <input
                          type="number"
                          min={1}
                          className="form-control"
                          value={msPipeQty}
                          onChange={(e) => setMsPipeQty(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Form Action Controls */}
                <div className="calc-form-actions">
                  <button
                    type="button"
                    onClick={handleResetCurrent}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RotateCcw size={14} /> Reset Defaults
                  </button>
                </div>

              </div>
            </div>

            {/* Right: Realtime Theoretical Weight Result Display Card */}
            <div className="calc-result-card">
              <div className="calc-result-header">
                <Scale size={24} className="result-icon text-brand" />
                <div>
                  <h3 className="result-title">Theoretical Weight Summary</h3>
                  <span className="result-sub">गणना किया गया वज़न</span>
                </div>
              </div>

              {/* Grand Total Highlight */}
              <div className="result-highlight-box">
                <span className="res-highlight-label">Total Calculated Weight</span>
                <div className="res-main-val">
                  {result.totalWeightKg.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="res-unit">KG</span>
                </div>
                <div className="res-ton-val">
                  ≈ {result.totalWeightTon.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} Metric Tonnes (MT)
                </div>
              </div>

              {/* Metrics Breakdown Grid */}
              <div className="result-breakdown-list">
                
                {/* TMT Rebar Specific Live Breakdown Metrics */}
                {activeCategory === 'tmt' && (
                  <>
                    <div className="res-breakdown-row highlight-tmt-row">
                      <span className="res-b-label">Total Rebar Quantity:</span>
                      <strong className="res-b-val text-brand">
                        {result.tmtTotalPiecesCalculated} Rods (सरिया)
                      </strong>
                    </div>

                    <div className="res-breakdown-row highlight-tmt-row">
                      <span className="res-b-label">Bundle Breakdown:</span>
                      <strong className="res-b-val text-teal">
                        {result.tmtFullBundles} Full Bundles {result.tmtLoosePieces > 0 ? `+ ${result.tmtLoosePieces} Loose Rods` : ''}
                      </strong>
                    </div>

                    <div className="res-breakdown-row">
                      <span className="res-b-label">Total Running Length:</span>
                      <strong className="res-b-val">
                        {result.tmtTotalRunningMeters.toFixed(2)} m ({toFeet(result.tmtTotalRunningMeters).toFixed(1)} ft)
                      </strong>
                    </div>

                    <div className="res-breakdown-row">
                      <span className="res-b-label">Selected Steel Grade:</span>
                      <strong className="res-b-val text-brand">{tmtGrade}</strong>
                    </div>
                  </>
                )}

                <div className="res-breakdown-row">
                  <span className="res-b-label">Weight per Meter:</span>
                  <strong className="res-b-val">
                    {result.weightPerMeter.toFixed(3)} kg/m
                  </strong>
                </div>

                <div className="res-breakdown-row">
                  <span className="res-b-label">Weight per Piece/Rod:</span>
                  <strong className="res-b-val">
                    {result.singlePieceWeight.toFixed(2)} kg/pc
                  </strong>
                </div>

                <div className="res-breakdown-row">
                  <span className="res-b-label">Product Section:</span>
                  <strong className="res-b-val text-brand">{currentTab?.title} ({currentTab?.gujarati})</strong>
                </div>
              </div>

              {/* Formula & Engineering Basis Note */}
              <div className="res-formula-box">
                <div className="res-formula-title">
                  <Info size={14} /> Engineering Basis:
                </div>
                <code className="res-formula-code">{result.formulaText}</code>
                <p className="res-formula-note">
                  * Theoretical mass calculated based on standard density <strong>7.85 g/cm³</strong> in compliance with <strong>IS 1786:2008 / IS 808 / IS 2062</strong>. Mill rolling tolerance applies.
                </p>
              </div>

              {/* Copy Weight Action */}
              <button
                type="button"
                onClick={handleCopyWeight}
                className="btn btn-primary w-full calc-copy-btn"
              >
                {isCopied ? (
                  <>
                    <Check size={16} /> Copied Summary to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy Weight & Rod Specification
                  </>
                )}
              </button>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* 3. MASTER TMT REBAR MEASUREMENT & WEIGHT REFERENCE CHART (IS 1786:2008) */}
          {/* ========================================================================= */}
          <div className="tmt-master-table-section mt-12">
            <div className="tmt-table-header-box">
              <div className="tmt-table-title-wrap">
                <div className="tmt-table-tag">
                  <HardHat size={16} /> Indian Standard Reference Matrix
                </div>
                <h3 className="tmt-table-title">
                  TMT Rebar Standard Measurement & Theoretical Weight Chart (IS 1786:2008)
                </h3>
                <p className="tmt-table-sub">
                  सरिया का संपूर्ण माप और वज़न तालिका — Every single diameter from 4mm to 50mm with exact Sut (सूत), weight per meter, weight per foot, 12-meter rod weights, bundle packaging standards, and structural applications.
                </p>
              </div>

              <div className="tmt-table-controls">
                {/* Search / Filter */}
                <div className="tmt-table-search-box">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search mm, sut, application..."
                    value={tmtTableSearch}
                    onChange={(e) => setTmtTableSearch(e.target.value)}
                    className="tmt-search-input"
                  />
                </div>

                {/* Unit Switcher */}
                <div className="tmt-table-unit-pill">
                  <button
                    type="button"
                    className={`table-unit-btn ${tmtTableUnit === 'metric' ? 'active' : ''}`}
                    onClick={() => setTmtTableUnit('metric')}
                  >
                    Metric (kg/m, 12m)
                  </button>
                  <button
                    type="button"
                    className={`table-unit-btn ${tmtTableUnit === 'imperial' ? 'active' : ''}`}
                    onClick={() => setTmtTableUnit('imperial')}
                  >
                    Imperial (kg/ft, 40ft)
                  </button>
                </div>
              </div>
            </div>

            {/* Master Table */}
            <div className="tmt-responsive-table-container">
              <table className="tmt-master-table">
                <thead>
                  <tr>
                    <th>Diameter (mm)</th>
                    <th>Sut (सूत) & Inch</th>
                    <th>Cross Section</th>
                    <th>{tmtTableUnit === 'metric' ? 'Nominal Wt / Meter' : 'Nominal Wt / Foot'}</th>
                    <th>{tmtTableUnit === 'metric' ? 'Standard 12m Bar Wt' : 'Standard 40ft Bar Wt'}</th>
                    <th>Pieces / Bundle</th>
                    <th>Bundle Weight (12m)</th>
                    <th>Bars per Metric Ton</th>
                    <th>IS:1786 Tolerance</th>
                    <th>Primary Civil Usage</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTmtList.map((item) => {
                    const isSelected = activeCategory === 'tmt' && !tmtIsCustomDia && tmtDia === item.dia;
                    const displayUnitWt = tmtTableUnit === 'metric' 
                      ? `${item.weightPerM.toFixed(3)} kg/m` 
                      : `${item.weightPerFt.toFixed(3)} kg/ft`;
                    const displayBarWt = tmtTableUnit === 'metric'
                      ? `${item.weightPer12m.toFixed(2)} kg`
                      : `${(item.weightPerFt * 40).toFixed(2)} kg`;

                    return (
                      <tr 
                        key={item.dia}
                        className={isSelected ? 'row-active' : ''}
                      >
                        <td>
                          <div className="dia-badge-cell">
                            <span className="dia-number">{item.dia}</span>
                            <span className="dia-unit">mm</span>
                          </div>
                        </td>
                        <td>
                          <div className="sut-cell">
                            <strong>{item.sut}</strong>
                            <span className="text-muted small">({item.inch})</span>
                          </div>
                        </td>
                        <td>{item.areaMm2.toFixed(1)} mm²</td>
                        <td><strong className="text-brand">{displayUnitWt}</strong></td>
                        <td><strong className="text-teal">{displayBarWt}</strong></td>
                        <td>
                          <span className="badge-bundle-pcs">{item.pcsPerBundle} pcs / bdl</span>
                        </td>
                        <td>~{item.bundleWeightKg.toFixed(1)} kg</td>
                        <td><strong>{item.barsPerTon.toFixed(1)}</strong> rods</td>
                        <td><span className="badge-tol">{item.tolerance}</span></td>
                        <td>
                          <div className="usage-cell">
                            <span className="usage-eng">{item.usage}</span>
                            <span className="usage-guj">{item.gujUsage}</span>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleSelectTmtFromTable(item.dia)}
                            className={`btn-select-calc ${isSelected ? 'btn-selected' : ''}`}
                          >
                            {isSelected ? (
                              <>
                                <CheckCircle2 size={13} /> Active
                              </>
                            ) : (
                              <>
                                Calculate <ArrowRight size={13} />
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom IS Standard Informational Notes */}
            <div className="tmt-table-footer-notes">
              <div className="note-card">
                <span className="note-num">1. Formula Standard</span>
                <p>Theoretical weight is governed by standard density <strong>7,850 kg/m³</strong>: W = D² / 162.28 kg/m (or W = D² / 533 kg/ft) as per <strong>IS 1786:2008 Clause 6.2</strong>.</p>
              </div>
              <div className="note-card">
                <span className="note-num">2. Standard Factory Length</span>
                <p>Standard primary mill TMT rebar bundles (Tata Tiscon, Jindal Panther, Kamdhenu, Gallantt, Electrotherm) are produced in <strong>12.0 meters (39.37 feet / ~40 ft)</strong> rod lengths.</p>
              </div>
              <div className="note-card">
                <span className="note-num">3. Rolling Tolerance</span>
                <p>IS 1786 permissible batch weight tolerances: up to 10mm (<strong>±7%</strong>), 10mm to 16mm (<strong>±5%</strong>), above 16mm (<strong>±3%</strong>).</p>
              </div>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}
