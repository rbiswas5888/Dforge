/**
 * DesignForge AI — Device Presets & Custom Frame Engine
 * Implements Section 4 of Next-Gen Vector Design & Prototyping Specification:
 * - Complete Apple iPhone, Apple iPad, Samsung Galaxy, and Laptop/Desktop Presets (2000–2026)
 * - Searchable & Era-filtered preset registry
 * - Custom Frame Engine with aspect-ratio locking, safe areas, mockups, and orientation toggle
 */

export const DEVICE_PRESET_CATALOG = [
  // --- Apple iPhone (pt) ---
  {
    id: 'iphone_classic',
    category: 'Apple',
    subcategory: 'iPhone',
    name: 'iPhone / 3G / 3GS',
    era: '2007-2009',
    startYear: 2007,
    endYear: 2009,
    width: 320,
    height: 480,
    unit: 'pt',
    dpr: 1,
    safeArea: { top: 20, bottom: 0, left: 0, right: 0 }
  },
  {
    id: 'iphone_4_se1',
    category: 'Apple',
    subcategory: 'iPhone',
    name: 'iPhone 4 / 4S / SE 1st gen',
    era: '2010-2016',
    startYear: 2010,
    endYear: 2016,
    width: 320,
    height: 568,
    unit: 'pt',
    dpr: 2,
    safeArea: { top: 20, bottom: 0, left: 0, right: 0 }
  },
  {
    id: 'iphone_6_7_8_se',
    category: 'Apple',
    subcategory: 'iPhone',
    name: 'iPhone 6/6S/7/8/SE 2nd and 3rd gen',
    era: '2014-2022',
    startYear: 2014,
    endYear: 2022,
    width: 375,
    height: 667,
    unit: 'pt',
    dpr: 2,
    safeArea: { top: 20, bottom: 0, left: 0, right: 0 }
  },
  {
    id: 'iphone_6_7_8_plus',
    category: 'Apple',
    subcategory: 'iPhone',
    name: 'iPhone 6/6S/7/8 Plus',
    era: '2014-2017',
    startYear: 2014,
    endYear: 2017,
    width: 414,
    height: 736,
    unit: 'pt',
    dpr: 3,
    safeArea: { top: 20, bottom: 0, left: 0, right: 0 }
  },
  {
    id: 'iphone_x_xs_11pro_mini',
    category: 'Apple',
    subcategory: 'iPhone',
    name: 'iPhone X/XS/11 Pro/12 mini/13 mini',
    era: '2017-2021',
    startYear: 2017,
    endYear: 2021,
    width: 375,
    height: 812,
    unit: 'pt',
    dpr: 3,
    safeArea: { top: 44, bottom: 34, left: 0, right: 0 }
  },
  {
    id: 'iphone_xr_11_12_13_14',
    category: 'Apple',
    subcategory: 'iPhone',
    name: 'iPhone XR/11/12/12 Pro/13/13 Pro/14',
    era: '2018-2022',
    startYear: 2018,
    endYear: 2022,
    width: 390,
    height: 844,
    unit: 'pt',
    dpr: 3,
    safeArea: { top: 47, bottom: 34, left: 0, right: 0 }
  },
  {
    id: 'iphone_xsmax_11promax',
    category: 'Apple',
    subcategory: 'iPhone',
    name: 'iPhone XS Max / 11 Pro Max',
    era: '2018-2019',
    startYear: 2018,
    endYear: 2019,
    width: 414,
    height: 896,
    unit: 'pt',
    dpr: 3,
    safeArea: { top: 44, bottom: 34, left: 0, right: 0 }
  },
  {
    id: 'iphone_12_13_promax_14plus',
    category: 'Apple',
    subcategory: 'iPhone',
    name: 'iPhone 12 Pro Max/13 Pro Max/14 Plus',
    era: '2020-2022',
    startYear: 2020,
    endYear: 2022,
    width: 428,
    height: 926,
    unit: 'pt',
    dpr: 3,
    safeArea: { top: 47, bottom: 34, left: 0, right: 0 }
  },
  {
    id: 'iphone_14pro_15_16',
    category: 'Apple',
    subcategory: 'iPhone',
    name: 'iPhone 14 Pro/15/15 Pro/16/16 Pro',
    era: '2022-2026',
    startYear: 2022,
    endYear: 2026,
    width: 393,
    height: 852,
    unit: 'pt',
    dpr: 3,
    safeArea: { top: 59, bottom: 34, left: 0, right: 0 }
  },
  {
    id: 'iphone_14promax_15_16_plus_max',
    category: 'Apple',
    subcategory: 'iPhone',
    name: 'iPhone 14 Pro Max/15 Plus/15 Pro Max/16 Plus/16 Pro Max',
    era: '2022-2026',
    startYear: 2022,
    endYear: 2026,
    width: 430,
    height: 932,
    unit: 'pt',
    dpr: 3,
    safeArea: { top: 59, bottom: 34, left: 0, right: 0 }
  },

  // --- Apple iPad (pt) ---
  {
    id: 'ipad_classic_air1_2',
    category: 'Apple',
    subcategory: 'iPad',
    name: 'iPad / iPad 2 / Mini 1-3 / Air 1-2',
    era: '2010-2018',
    startYear: 2010,
    endYear: 2018,
    width: 768,
    height: 1024,
    unit: 'pt',
    dpr: 2,
    safeArea: { top: 20, bottom: 0, left: 0, right: 0 }
  },
  {
    id: 'ipad_pro_10_5_air_10_5',
    category: 'Apple',
    subcategory: 'iPad',
    name: 'iPad Pro 10.5" / Air 10.5"',
    era: '2017-2019',
    startYear: 2017,
    endYear: 2019,
    width: 834,
    height: 1112,
    unit: 'pt',
    dpr: 2,
    safeArea: { top: 20, bottom: 0, left: 0, right: 0 }
  },
  {
    id: 'ipad_mini_6',
    category: 'Apple',
    subcategory: 'iPad',
    name: 'iPad Mini 6th gen',
    era: '2021',
    startYear: 2021,
    endYear: 2021,
    width: 744,
    height: 1133,
    unit: 'pt',
    dpr: 2,
    safeArea: { top: 24, bottom: 20, left: 0, right: 0 }
  },
  {
    id: 'ipad_10_9_10th',
    category: 'Apple',
    subcategory: 'iPad',
    name: 'iPad 10.9" 10th gen',
    era: '2022',
    startYear: 2022,
    endYear: 2022,
    width: 820,
    height: 1180,
    unit: 'pt',
    dpr: 2,
    safeArea: { top: 24, bottom: 20, left: 0, right: 0 }
  },
  {
    id: 'ipad_pro_11_air_11',
    category: 'Apple',
    subcategory: 'iPad',
    name: 'iPad Pro 11" 1st-4th gen / Air 11"',
    era: '2018-2026',
    startYear: 2018,
    endYear: 2026,
    width: 834,
    height: 1194,
    unit: 'pt',
    dpr: 2,
    safeArea: { top: 24, bottom: 20, left: 0, right: 0 }
  },
  {
    id: 'ipad_pro_12_9',
    category: 'Apple',
    subcategory: 'iPad',
    name: 'iPad Pro 12.9" 1st-6th gen',
    era: '2015-2022',
    startYear: 2015,
    endYear: 2022,
    width: 1024,
    height: 1366,
    unit: 'pt',
    dpr: 2,
    safeArea: { top: 24, bottom: 20, left: 0, right: 0 }
  },
  {
    id: 'ipad_pro_13_m4',
    category: 'Apple',
    subcategory: 'iPad',
    name: 'iPad Pro 13" M4',
    era: '2024-2026',
    startYear: 2024,
    endYear: 2026,
    width: 1032,
    height: 1376,
    unit: 'pt',
    dpr: 2,
    safeArea: { top: 24, bottom: 20, left: 0, right: 0 }
  },

  // --- Samsung Galaxy (dp) ---
  {
    id: 'samsung_s_s4',
    category: 'Samsung',
    subcategory: 'Galaxy Phone',
    name: 'Galaxy S/S II/S III/S4 era',
    era: '2010-2014',
    startYear: 2010,
    endYear: 2014,
    width: 360,
    height: 640,
    unit: 'dp',
    dpr: 2,
    safeArea: { top: 24, bottom: 0, left: 0, right: 0 }
  },
  {
    id: 'samsung_s5_s21',
    category: 'Samsung',
    subcategory: 'Galaxy Phone',
    name: 'Galaxy S5 to S10, S20, S21 standard',
    era: '2014-2021',
    startYear: 2014,
    endYear: 2021,
    width: 360,
    height: 800,
    unit: 'dp',
    dpr: 3,
    safeArea: { top: 24, bottom: 16, left: 0, right: 0 }
  },
  {
    id: 'samsung_s22_s26',
    category: 'Samsung',
    subcategory: 'Galaxy Phone',
    name: 'Galaxy S22 to S26 standard',
    era: '2022-2026',
    startYear: 2022,
    endYear: 2026,
    width: 360,
    height: 780,
    unit: 'dp',
    dpr: 3,
    safeArea: { top: 24, bottom: 16, left: 0, right: 0 }
  },
  {
    id: 'samsung_s_plus_ultra',
    category: 'Samsung',
    subcategory: 'Galaxy Phone',
    name: 'Galaxy S Plus and Ultra variants, S20 Ultra to S26 Ultra',
    era: '2020-2026',
    startYear: 2020,
    endYear: 2026,
    width: 412,
    height: 915,
    unit: 'dp',
    dpr: 3.5,
    safeArea: { top: 24, bottom: 16, left: 0, right: 0 }
  },
  {
    id: 'samsung_note8_note20',
    category: 'Samsung',
    subcategory: 'Galaxy Note',
    name: 'Galaxy Note 8 to Note 20 Ultra',
    era: '2017-2020',
    startYear: 2017,
    endYear: 2020,
    width: 360,
    height: 740,
    unit: 'dp',
    dpr: 3,
    safeArea: { top: 24, bottom: 16, left: 0, right: 0 }
  },
  {
    id: 'samsung_zfold_cover',
    category: 'Samsung',
    subcategory: 'Galaxy Foldable',
    name: 'Galaxy Z Fold cover screen',
    era: '2019-2026',
    startYear: 2019,
    endYear: 2026,
    width: 384,
    height: 832,
    unit: 'dp',
    dpr: 3,
    safeArea: { top: 24, bottom: 16, left: 0, right: 0 }
  },
  {
    id: 'samsung_zfold_inner',
    category: 'Samsung',
    subcategory: 'Galaxy Foldable',
    name: 'Galaxy Z Fold inner screen',
    era: '2019-2026',
    startYear: 2019,
    endYear: 2026,
    width: 768,
    height: 2208,
    unit: 'dp',
    dpr: 3,
    safeArea: { top: 24, bottom: 16, left: 0, right: 0 }
  },
  {
    id: 'samsung_zflip',
    category: 'Samsung',
    subcategory: 'Galaxy Foldable',
    name: 'Galaxy Z Flip cover and main',
    era: '2020-2026',
    startYear: 2020,
    endYear: 2026,
    width: 360,
    height: 880,
    unit: 'dp',
    dpr: 3,
    safeArea: { top: 24, bottom: 16, left: 0, right: 0 }
  },
  {
    id: 'samsung_tab_s7_s10',
    category: 'Samsung',
    subcategory: 'Galaxy Tablet',
    name: 'Galaxy Tab S7/S8/S9/S10',
    era: '2020-2026',
    startYear: 2020,
    endYear: 2026,
    width: 800,
    height: 1280,
    unit: 'dp',
    dpr: 2,
    safeArea: { top: 24, bottom: 16, left: 0, right: 0 }
  },

  // --- Laptops, desktops, monitors ---
  {
    id: 'desktop_svga',
    category: 'Laptop/Desktop',
    subcategory: 'Vintage Web',
    name: 'Early 2000s Web (SVGA)',
    era: '2000-2005',
    startYear: 2000,
    endYear: 2005,
    width: 800,
    height: 600,
    unit: 'px',
    dpr: 1
  },
  {
    id: 'desktop_xga',
    category: 'Laptop/Desktop',
    subcategory: 'Vintage Web',
    name: 'Mid-2000s Desktop (XGA)',
    era: '2004-2008',
    startYear: 2004,
    endYear: 2008,
    width: 1024,
    height: 768,
    unit: 'px',
    dpr: 1
  },
  {
    id: 'laptop_widescreen_late2000',
    category: 'Laptop/Desktop',
    subcategory: 'Laptop',
    name: 'Late 2000s Widescreen Laptops',
    era: '2007-2011',
    startYear: 2007,
    endYear: 2011,
    width: 1280,
    height: 800,
    unit: 'px',
    dpr: 1
  },
  {
    id: 'laptop_budget_hd',
    category: 'Laptop/Desktop',
    subcategory: 'Laptop',
    name: 'Budget / Standard HD Laptop',
    era: '2010-2020',
    startYear: 2010,
    endYear: 2020,
    width: 1366,
    height: 768,
    unit: 'px',
    dpr: 1
  },
  {
    id: 'macbook_air_baseline',
    category: 'Laptop/Desktop',
    subcategory: 'MacBook',
    name: 'MacBook Air baseline',
    era: '2010-2020',
    startYear: 2010,
    endYear: 2020,
    width: 1440,
    height: 900,
    unit: 'pt',
    dpr: 2
  },
  {
    id: 'desktop_full_hd',
    category: 'Laptop/Desktop',
    subcategory: 'Monitor',
    name: 'Modern Desktop baseline (Full HD, primary web design baseline)',
    era: '2012-2026',
    startYear: 2012,
    endYear: 2026,
    width: 1920,
    height: 1080,
    unit: 'px',
    dpr: 1
  },
  {
    id: 'macbook_pro_14',
    category: 'Laptop/Desktop',
    subcategory: 'MacBook',
    name: 'HiDPI MacBook Pro 14"',
    era: '2021-2026',
    startYear: 2021,
    endYear: 2026,
    width: 1512,
    height: 982,
    unit: 'pt',
    dpr: 2
  },
  {
    id: 'macbook_pro_16',
    category: 'Laptop/Desktop',
    subcategory: 'MacBook',
    name: 'HiDPI MacBook Pro 16"',
    era: '2021-2026',
    startYear: 2021,
    endYear: 2026,
    width: 1728,
    height: 1117,
    unit: 'pt',
    dpr: 2
  },
  {
    id: 'desktop_qhd_1440p',
    category: 'Laptop/Desktop',
    subcategory: 'Monitor',
    name: 'Professional Desktop (QHD/1440p)',
    era: '2015-2026',
    startYear: 2015,
    endYear: 2026,
    width: 2560,
    height: 1440,
    unit: 'px',
    dpr: 1
  },
  {
    id: 'desktop_ultrawide',
    category: 'Laptop/Desktop',
    subcategory: 'Monitor',
    name: 'Ultra-Wide Workstation',
    era: '2016-2026',
    startYear: 2016,
    endYear: 2026,
    width: 3440,
    height: 1440,
    unit: 'px',
    dpr: 1
  },
  {
    id: 'desktop_4k_uhd',
    category: 'Laptop/Desktop',
    subcategory: 'Monitor',
    name: '4K Ultra HD',
    era: '2015-2026',
    startYear: 2015,
    endYear: 2026,
    width: 3840,
    height: 2160,
    unit: 'px',
    dpr: 1
  }
];

/**
 * Filter Presets by category, query, and era
 */
export function queryDevicePresets({ category = null, query = '', year = null } = {}) {
  let list = DEVICE_PRESET_CATALOG;

  if (category && category !== 'All') {
    const cat = category.toLowerCase();
    list = list.filter(p => {
      const pCat = (p.category || '').toLowerCase();
      const pSub = (p.subcategory || '').toLowerCase();
      if (pCat === cat || pSub.includes(cat)) return true;
      if (cat === 'phone') return pSub.includes('phone') || pSub.includes('foldable') || pSub.includes('note');
      if (cat === 'tablet') return pSub.includes('tablet') || pSub.includes('pad');
      if (cat === 'desktop') return pCat.includes('desktop') || pCat.includes('laptop') || pSub.includes('macbook');
      return false;
    });
  }

  if (year !== null) {
    list = list.filter(p => p.startYear <= year && p.endYear >= year);
  }

  if (query && query.trim()) {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    list = list.filter(p => {
      const searchTarget = `${p.name} ${p.name.replace(/\//g, ' ')} ${p.category} ${p.subcategory} ${p.era} ${p.width}x${p.height}`.toLowerCase();
      return words.every(w => searchTarget.includes(w));
    });
  }

  return list;
}

/**
 * Custom Frame Model & Controller
 */
export class CustomFrameEngine {
  constructor() {
    this.userPresets = [];
  }

  createCustomFrame({
    name = 'Custom Frame',
    width = 1440,
    height = 900,
    unit = 'px',
    aspectRatioLocked = false,
    background = '#FFFFFF',
    deviceMockup = null
  } = {}) {
    return {
      frameId: `custom_frame_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name,
      type: 'custom',
      dimensions: {
        width: Math.max(10, Math.round(width)),
        height: Math.max(10, Math.round(height))
      },
      aspectRatio: width / height,
      unit,
      aspectRatioLocked,
      background,
      deviceMockup
    };
  }

  /**
   * Resizes width and adjusts height if aspect ratio is locked
   */
  setWidth(frame, newWidth) {
    newWidth = Math.max(10, Math.round(newWidth));
    frame.dimensions.width = newWidth;
    if (frame.aspectRatioLocked && frame.aspectRatio > 0) {
      frame.dimensions.height = Math.max(10, Math.round(newWidth / frame.aspectRatio));
    } else {
      frame.aspectRatio = frame.dimensions.width / frame.dimensions.height;
    }
    return frame;
  }

  /**
   * Resizes height and adjusts width if aspect ratio is locked
   */
  setHeight(frame, newHeight) {
    newHeight = Math.max(10, Math.round(newHeight));
    frame.dimensions.height = newHeight;
    if (frame.aspectRatioLocked && frame.aspectRatio > 0) {
      frame.dimensions.width = Math.max(10, Math.round(newHeight * frame.aspectRatio));
    } else {
      frame.aspectRatio = frame.dimensions.width / frame.dimensions.height;
    }
    return frame;
  }

  /**
   * Swaps orientation (portrait <-> landscape)
   */
  toggleOrientation(frame) {
    const oldW = frame.dimensions.width;
    const oldH = frame.dimensions.height;
    frame.dimensions.width = oldH;
    frame.dimensions.height = oldW;
    frame.aspectRatio = oldH / oldW;
    return frame;
  }

  /**
   * Saves custom frame into user preset group
   */
  saveUserPreset(frame, presetName) {
    const preset = {
      id: `user_preset_${Date.now()}`,
      category: 'Custom',
      subcategory: 'User Presets',
      name: presetName || frame.name,
      era: 'Custom',
      startYear: 2000,
      endYear: 2026,
      width: frame.dimensions.width,
      height: frame.dimensions.height,
      unit: frame.unit || 'px',
      dpr: 1
    };
    this.userPresets.push(preset);
    return preset;
  }

  getUserPresets() {
    return this.userPresets;
  }
}
