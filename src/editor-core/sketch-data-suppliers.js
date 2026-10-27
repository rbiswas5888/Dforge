/**
 * DesignForge AI — Sketch Data Suppliers & Presets Integration
 * 
 * Leverages native Sketch assets, BuiltinData suppliers, and gemstone palettes:
 * - 125 Real Portrait Faces / Avatars
 * - 18 High-Resolution Tile Textures / Patterns
 * - 605 Diverse Human Names
 * - 251 Global World Cities
 * - Realistic Structured User Profiles
 * - 16 Sketch Gemstone Color Swatches & 4 Gradient Presets
 */

import { createNode } from '../engine/document.js';

// 1. 125 Portrait Avatars from sketch/Resources/BuiltinData/en/Faces
export const SKETCH_FACES = Array.from({ length: 125 }, (_, i) => {
  const num = String(i + 1).padStart(3, '0');
  return `assets/sketch-data/Faces/${num}.jpg`;
});

// 2. 18 High-Resolution 1024x1024 Texture Tiles
export const SKETCH_TILES = [
  '02', '03', '04', '05_altcolor', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19'
].map(id => `assets/sketch-data/Tiles/1024x1024_tile_${id}.png`);

// 3. Official 16 Sketch Gemstone Swatches & 4 Gradients (from assets.sketchpreset)
export const SKETCH_GEMSTONES = [
  { name: 'Ruby', hex: '#e02020' },
  { name: 'Amber', hex: '#fa6400' },
  { name: 'Citrine', hex: '#f7b500' },
  { name: 'Emerald', hex: '#6dd400' },
  { name: 'Amazonite', hex: '#44d7b6' },
  { name: 'Apatite', hex: '#32c5ff' },
  { name: 'Sapphire', hex: '#0091ff' },
  { name: 'Iolite', hex: '#6236ff' },
  { name: 'Amethyst', hex: '#b620e0' },
  { name: 'Graphite', hex: '#6d7278' },
  { name: 'Calcite', hex: '#ffffff' },
  { name: 'Obsidian', hex: '#111827' },
  { name: 'Quartz', hex: '#1e293b' },
  { name: 'Magnetite', hex: '#0f172a' },
  { name: 'Hematite', hex: '#334155' },
  { name: 'Basalt', hex: '#18181b' }
];

export const SKETCH_GRADIENTS = [
  {
    name: 'Diorite',
    stops: [{ offset: 0, color: 'rgba(0, 0, 0, 0)' }, { offset: 1, color: '#000000' }]
  },
  {
    name: 'Autunite',
    stops: [{ offset: 0, color: '#f7b500' }, { offset: 1, color: '#e02020' }]
  },
  {
    name: 'Bornite',
    stops: [{ offset: 0, color: '#6236ff' }, { offset: 1, color: '#0091ff' }]
  },
  {
    name: 'Bismuth',
    stops: [{ offset: 0, color: '#44d7b6' }, { offset: 1, color: '#32c5ff' }]
  }
];

// In-memory cache for dynamic text data
let cachedNames = [
  'Abbie Wilson', 'Anje Keizer', 'Sang Young-Il', 'Leo Knight', 'Lucas Pacheco',
  'Obasey Chidy', 'Adaora Azubuike', 'Afonso Pinto', 'Ahmad Nazeri', 'Ainara Vergara',
  'Alan Martí', 'Alberto Raya', 'Alex Walker', 'Alexa Richardson', 'Alexander Ljung',
  'Alfie Wood', 'Alice Krejčová', 'Alicia Puma', 'Alma Malmberg', 'Amelia Cabal'
];

let cachedCities = [
  'San Francisco', 'New York', 'London', 'Tokyo', 'Berlin', 'Paris', 'Bangkok',
  'Amsterdam', 'Sydney', 'Toronto', 'Singapore', 'Dubai', 'Seoul', 'Stockholm',
  'Barcelona', 'Zurich', 'Vienna', 'Dublin', 'Oslo', 'Copenhagen', 'Geneva'
];

let cachedProfiles = [
  {
    name: 'Abbie Wilson',
    avatar: 'assets/sketch-data/Faces/006.jpg',
    location: 'Bangkok',
    handle: '@abbiew93',
    bio: 'Dog lover 🐕, mahjong champion 🀄️, and traveller 🗺 currently in Bangkok.'
  },
  {
    name: 'Anje Keizer',
    avatar: 'assets/sketch-data/Faces/014.jpg',
    location: 'Dallas',
    handle: '@akeizer01',
    bio: 'Loving life and living in Dallas, go Mavs! 🏀'
  },
  {
    name: 'Sang Young-Il',
    avatar: 'assets/sketch-data/Faces/031.jpg',
    location: 'Dubai',
    handle: '@yisang_dubai',
    bio: 'Entrepreneur in Dubai, often found dune buggy racing. 🏎'
  },
  {
    name: 'Leo Knight',
    avatar: 'assets/sketch-data/Faces/095.jpg',
    location: 'Geneva',
    handle: '@knighty19',
    bio: 'Sci-fi fan, jazz pianist and snooker enthusiast living in Geneva. 🎹'
  },
  {
    name: 'Lucas Pacheco',
    avatar: 'assets/sketch-data/Faces/026.jpg',
    location: 'Indianapolis',
    handle: '@colts_fan_12',
    bio: 'Colts superfan 🐎 loves all things football 🏈 and fast food 🍔🍟'
  }
];

/**
 * Asynchronously prefetch external datasets if running in browser
 */
export async function initializeSketchData() {
  try {
    if (typeof fetch !== 'undefined') {
      const [resNames, resCities, resProfiles] = await Promise.all([
        fetch('assets/sketch-data/names.json').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('assets/sketch-data/cities.json').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('assets/sketch-data/user-profiles.json').then(r => r.ok ? r.json() : null).catch(() => null)
      ]);
      if (resNames && Array.isArray(resNames)) cachedNames = resNames;
      if (resCities && Array.isArray(resCities)) cachedCities = resCities;
      if (resProfiles && Array.isArray(resProfiles)) cachedProfiles = resProfiles;
    }
  } catch (err) {
    // Graceful fallback to initial values
  }
}

let faceCursor = 0;
let tileCursor = 0;
let nameCursor = 0;
let cityCursor = 0;
let profileCursor = 0;

export function getNextAvatarUrl() {
  const url = SKETCH_FACES[faceCursor % SKETCH_FACES.length];
  faceCursor++;
  return url;
}

export function getNextTileUrl() {
  const url = SKETCH_TILES[tileCursor % SKETCH_TILES.length];
  tileCursor++;
  return url;
}

export function getNextName() {
  const name = cachedNames[nameCursor % cachedNames.length];
  nameCursor++;
  return name;
}

export function getNextCity() {
  const city = cachedCities[cityCursor % cachedCities.length];
  cityCursor++;
  return city;
}

export function getNextProfile() {
  const prof = cachedProfiles[profileCursor % cachedProfiles.length];
  profileCursor++;
  return prof;
}

/**
 * Apply Sketch data supplier to active canvas selection
 */
export function applySketchDataSupplier(engine, type) {
  if (!engine) return { success: false, message: 'No engine available' };
  const selection = engine.getSelection ? engine.getSelection() : [];
  if (selection.length === 0) {
    return { success: false, message: 'Please select one or more layers to populate with data.' };
  }

  let count = 0;

  for (const id of selection) {
    const node = engine.getNode(id);
    if (!node) continue;

    if (type === 'faces' || type === 'avatars') {
      const avatarUrl = getNextAvatarUrl();
      const newFills = [{ type: 'image', url: avatarUrl, scaleMode: 'fill', visible: true }];
      engine.updateNode(id, { style: { fills: newFills } }, 'Insert Avatar Data');
      count++;
    } else if (type === 'tiles' || type === 'patterns') {
      const tileUrl = getNextTileUrl();
      const newFills = [{ type: 'image', url: tileUrl, scaleMode: 'tile', visible: true }];
      engine.updateNode(id, { style: { fills: newFills } }, 'Insert Pattern Tile');
      count++;
    } else if (type === 'names') {
      if (node.type === 'text') {
        engine.updateNode(id, { text: { content: getNextName() } }, 'Insert Name Data');
        count++;
      } else {
        // Find text children if container
        const page = engine.getActivePage();
        if (node.childIds) {
          for (const cid of node.childIds) {
            const child = page.nodes[cid];
            if (child && child.type === 'text') {
              engine.updateNode(cid, { text: { content: getNextName() } }, 'Insert Name Data');
              count++;
            }
          }
        }
      }
    } else if (type === 'cities') {
      if (node.type === 'text') {
        engine.updateNode(id, { text: { content: getNextCity() } }, 'Insert City Data');
        count++;
      } else {
        const page = engine.getActivePage();
        if (node.childIds) {
          for (const cid of node.childIds) {
            const child = page.nodes[cid];
            if (child && child.type === 'text') {
              engine.updateNode(cid, { text: { content: getNextCity() } }, 'Insert City Data');
              count++;
            }
          }
        }
      }
    }
  }

  return { success: true, count, message: `Populated ${count} layer(s) with ${type} data.` };
}

/**
 * Creates a complete responsive User Profile Card using official Sketch BuiltinData
 */
export function insertSketchUserProfileCard(engine, x = 100, y = 100) {
  if (!engine) return null;
  const profile = getNextProfile();

  // Root Card Frame (Auto Layout vertical)
  const cardFrame = createNode('frame', {
    name: `${profile.name} Profile Card`,
    transform: { x, y, width: 320, height: 260 },
    style: {
      fills: [{ type: 'solid', color: '#1e293b' }],
      cornerRadius: 16,
      strokes: [{ color: '#334155', width: 1, style: 'solid' }],
      shadows: [{ color: 'rgba(0, 0, 0, 0.35)', x: 0, y: 8, blur: 24 }]
    },
    layout: {
      mode: 'vertical',
      direction: 'column',
      gap: 12,
      paddingTop: 20,
      paddingRight: 20,
      paddingBottom: 20,
      paddingLeft: 20,
      alignItems: 'center',
      justifyContent: 'start'
    }
  });

  // 1. Avatar Circle (80x80 with photo fill)
  const avatar = createNode('ellipse', {
    name: 'Avatar',
    parentId: cardFrame.id,
    transform: { x: 120, y: 20, width: 80, height: 80 },
    style: {
      fills: [{ type: 'image', url: profile.avatar, scaleMode: 'fill', visible: true }],
      strokes: [{ color: '#0d99ff', width: 2, style: 'solid' }]
    }
  });

  // 2. Name Label
  const nameLabel = createNode('text', {
    name: 'User Name',
    parentId: cardFrame.id,
    transform: { x: 20, y: 110, width: 280, height: 24 },
    text: {
      content: profile.name,
      fontSize: 18,
      fontFamily: 'Inter',
      fontWeight: '700',
      textAlign: 'center',
      color: '#f8fafc'
    }
  });

  // 3. Handle & Location Row
  const subtitleLabel = createNode('text', {
    name: 'Handle & Location',
    parentId: cardFrame.id,
    transform: { x: 20, y: 138, width: 280, height: 18 },
    text: {
      content: `${profile.handle} • 📍 ${profile.location}`,
      fontSize: 13,
      fontFamily: 'Inter',
      fontWeight: '500',
      textAlign: 'center',
      color: '#94a3b8'
    }
  });

  // 4. Bio Text
  const bioLabel = createNode('text', {
    name: 'User Bio',
    parentId: cardFrame.id,
    transform: { x: 20, y: 162, width: 280, height: 42 },
    text: {
      content: profile.bio,
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: '400',
      textAlign: 'center',
      color: '#cbd5e1'
    }
  });

  // Add nodes via CommandEngine for full transaction/undo support
  engine.beginBatch('Insert Sketch User Profile Card');
  engine.addNode(cardFrame, null);
  engine.addNode(avatar, cardFrame.id);
  engine.addNode(nameLabel, cardFrame.id);
  engine.addNode(subtitleLabel, cardFrame.id);
  engine.addNode(bioLabel, cardFrame.id);
  engine.commitBatch();

  engine.setSelection([cardFrame.id]);
  return cardFrame.id;
}
