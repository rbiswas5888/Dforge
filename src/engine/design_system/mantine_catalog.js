/**
 * DesignForge AI — Mantine UI (@mantine/*) Component & Token Catalog
 * Authoritative integration for Mantine v7/v9 components, system tokens,
 * PostCSS integration variables, and authentic canvas nodes.
 */

import { createNode } from '../document.js';
import { TOKEN_CATEGORIES, VARIABLE_TYPES } from './types.js';

/**
 * Official Mantine Design Tokens (Mantine Core & Theme Variables)
 */
export const MANTINE_DESIGN_TOKENS = Object.freeze({
  colors: {
    primary: '#228be6',
    blue: ['#e7f5ff', '#d0ebff', '#a5d8ff', '#74c0fc', '#4dabf7', '#339af0', '#228be6', '#1c7ed6', '#1971c2', '#1864ab'],
    cyan: ['#e3fafc', '#c5f6fa', '#99e9f2', '#66d9e8', '#3bc9db', '#22b8cf', '#15aabf', '#1098ad', '#0c8599', '#0b7285'],
    teal: ['#e6fcf5', '#c3fae8', '#96f2d7', '#63e6be', '#38d9a9', '#20c997', '#12b886', '#0ca678', '#099268', '#087f5b'],
    green: ['#ebfbee', '#d3f9d8', '#b2f2bb', '#8ce99a', '#69db7c', '#51cf66', '#40c057', '#37b24d', '#2f9e44', '#2b8a3e'],
    yellow: ['#fff9db', '#fff3bf', '#ffec99', '#ffe066', '#ffd43b', '#fcc419', '#fab005', '#f59f00', '#f08c00', '#e67700'],
    orange: ['#fff4e6', '#ffe8cc', '#ffd8a8', '#ffc078', '#ffa94d', '#ff922b', '#fd7e14', '#f76707', '#e8590c', '#d9480f'],
    red: ['#fff5f5', '#ffe3e3', '#ffc9c9', '#ffa8a8', '#ff8787', '#ff6b6b', '#fa5252', '#f03e3e', '#e03131', '#c92a2a'],
    pink: ['#fff0f6', '#ffdeeb', '#fcc2d7', '#faa2c1', '#f783ac', '#f06595', '#e64980', '#d6336c', '#c2255c', '#a61e4d'],
    grape: ['#f8f0fc', '#f3d9fa', '#eebefa', '#e599f7', '#da77f2', '#cc5de8', '#be4bdb', '#ae3ec9', '#9c36b5', '#862e9c'],
    violet: ['#f3f0ff', '#e5dbff', '#d0bfff', '#b197fc', '#9775fa', '#845ef7', '#7950f2', '#7048e8', '#6741d9', '#5f3dc4'],
    indigo: ['#edf2ff', '#dbe4ff', '#bac8ff', '#91a7ff', '#748ffc', '#5c7cfa', '#4c6ef5', '#4263eb', '#3b5bdb', '#364fc7'],
    gray: ['#f8f9fa', '#f1f3f5', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#868e96', '#495057', '#343a40', '#212529'],
    dark: ['#c9c9c9', '#b8b8b8', '#828282', '#696969', '#424242', '#3b3b3b', '#2e2e2e', '#242424', '#1f1f1f', '#141414']
  },
  radius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 16,
    xl: 32
  },
  spacing: {
    xs: 10,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 32
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20
    },
    headings: {
      h1: { fontSize: 34, fontWeight: '700', lineHeight: 1.3 },
      h2: { fontSize: 26, fontWeight: '700', lineHeight: 1.35 },
      h3: { fontSize: 22, fontWeight: '600', lineHeight: 1.4 },
      h4: { fontSize: 18, fontWeight: '600', lineHeight: 1.45 },
      h5: { fontSize: 16, fontWeight: '600', lineHeight: 1.5 },
      h6: { fontSize: 14, fontWeight: '600', lineHeight: 1.5 }
    }
  },
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 10px 15px -5px, rgba(0, 0, 0, 0.04) 0px 7px 7px -5px',
    md: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px',
    lg: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 28px 23px -7px, rgba(0, 0, 0, 0.04) 0px 12px 12px -7px',
    xl: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 36px 28px -7px, rgba(0, 0, 0, 0.04) 0px 17px 17px -7px'
  },
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em'
  }
});

/**
 * Official Mantine Component Definitions across Core, Dates, Charts, TipTap, Dropzone, Carousel, etc.
 */
const MANTINE_COMPONENTS = [
  // --- Core & Buttons ---
  {
    id: 'button',
    name: 'Button',
    category: 'Buttons',
    package: '@mantine/core',
    description: 'Mantine standard button with filled, light, outline, subtle, and white variants.',
    defaultSize: { width: 140, height: 38 },
    properties: [
      { name: 'variant', type: 'variant', defaultValue: 'filled', options: ['filled', 'light', 'outline', 'subtle', 'default', 'white'] },
      { name: 'color', type: 'variant', defaultValue: 'blue', options: ['blue', 'teal', 'green', 'red', 'orange', 'violet', 'gray', 'dark'] },
      { name: 'size', type: 'variant', defaultValue: 'sm', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
      { name: 'radius', type: 'variant', defaultValue: 'sm', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
      { name: 'label', type: 'text', defaultValue: 'Mantine Button' },
      { name: 'disabled', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'action-icon',
    name: 'ActionIcon',
    category: 'Buttons',
    package: '@mantine/core',
    description: 'Circular or square icon button for compact interface actions and toolbars.',
    defaultSize: { width: 36, height: 36 },
    properties: [
      { name: 'variant', type: 'variant', defaultValue: 'light', options: ['filled', 'light', 'outline', 'subtle', 'default'] },
      { name: 'color', type: 'variant', defaultValue: 'blue', options: ['blue', 'gray', 'red', 'teal'] },
      { name: 'size', type: 'variant', defaultValue: 'md', options: ['xs', 'sm', 'md', 'lg', 'xl'] }
    ]
  },
  {
    id: 'segmented-control',
    name: 'SegmentedControl',
    category: 'Buttons',
    package: '@mantine/core',
    description: 'Horizontal pill switcher with animated active slider indicator.',
    defaultSize: { width: 260, height: 36 },
    properties: [
      { name: 'size', type: 'variant', defaultValue: 'sm', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
      { name: 'color', type: 'variant', defaultValue: 'blue', options: ['blue', 'teal', 'dark'] },
      { name: 'selected', type: 'text', defaultValue: 'Preview' }
    ]
  },

  // --- Inputs & Forms ---
  {
    id: 'text-input',
    name: 'TextInput',
    category: 'Inputs',
    package: '@mantine/core',
    description: 'Form text input with label, description, placeholder, and validation error.',
    defaultSize: { width: 260, height: 68 },
    properties: [
      { name: 'label', type: 'text', defaultValue: 'Email address' },
      { name: 'placeholder', type: 'text', defaultValue: 'your@email.com' },
      { name: 'description', type: 'text', defaultValue: 'We will send updates here' },
      { name: 'required', type: 'boolean', defaultValue: true },
      { name: 'error', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'password-input',
    name: 'PasswordInput',
    category: 'Inputs',
    package: '@mantine/core',
    description: 'Secure password input with built-in toggle visibility eye icon.',
    defaultSize: { width: 260, height: 68 },
    properties: [
      { name: 'label', type: 'text', defaultValue: 'Password' },
      { name: 'placeholder', type: 'text', defaultValue: '••••••••' }
    ]
  },
  {
    id: 'select',
    name: 'Select',
    category: 'Inputs',
    package: '@mantine/core',
    description: 'Custom dropdown select with searchable options and clearable button.',
    defaultSize: { width: 240, height: 68 },
    properties: [
      { name: 'label', type: 'text', defaultValue: 'Select framework' },
      { name: 'placeholder', type: 'text', defaultValue: 'Pick one' },
      { name: 'searchable', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'multi-select',
    name: 'MultiSelect',
    category: 'Inputs',
    package: '@mantine/core',
    description: 'Multi-value select with removable pill chips and search filter.',
    defaultSize: { width: 300, height: 74 },
    properties: [
      { name: 'label', type: 'text', defaultValue: 'Tags' },
      { name: 'placeholder', type: 'text', defaultValue: 'Select tags' }
    ]
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'Inputs',
    package: '@mantine/core',
    description: 'Checkbox input with checkmark, label, and description.',
    defaultSize: { width: 180, height: 32 },
    properties: [
      { name: 'label', type: 'text', defaultValue: 'Subscribe to newsletter' },
      { name: 'checked', type: 'boolean', defaultValue: true },
      { name: 'color', type: 'variant', defaultValue: 'blue', options: ['blue', 'teal', 'green'] }
    ]
  },
  {
    id: 'switch',
    name: 'Switch',
    category: 'Inputs',
    package: '@mantine/core',
    description: 'Interactive sliding toggle switch for feature flags and settings.',
    defaultSize: { width: 180, height: 32 },
    properties: [
      { name: 'label', type: 'text', defaultValue: 'Enable notifications' },
      { name: 'checked', type: 'boolean', defaultValue: true },
      { name: 'color', type: 'variant', defaultValue: 'blue', options: ['blue', 'teal', 'green'] }
    ]
  },
  {
    id: 'slider',
    name: 'Slider',
    category: 'Inputs',
    package: '@mantine/core',
    description: 'Continuous range slider with filled track and draggable thumb.',
    defaultSize: { width: 240, height: 36 },
    properties: [
      { name: 'value', type: 'number', defaultValue: 65 },
      { name: 'min', type: 'number', defaultValue: 0 },
      { name: 'max', type: 'number', defaultValue: 100 },
      { name: 'color', type: 'variant', defaultValue: 'blue', options: ['blue', 'teal', 'orange'] }
    ]
  },

  // --- Data Display ---
  {
    id: 'card',
    name: 'Card',
    category: 'Data Display',
    package: '@mantine/core',
    description: 'Mantine card container with Card.Section, header, badges, and action buttons.',
    defaultSize: { width: 320, height: 260 },
    properties: [
      { name: 'shadow', type: 'variant', defaultValue: 'sm', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
      { name: 'padding', type: 'variant', defaultValue: 'lg', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
      { name: 'radius', type: 'variant', defaultValue: 'md', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
      { name: 'withBorder', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'Data Display',
    package: '@mantine/core',
    description: 'Compact status pill badge with filled, light, outline, and dot variants.',
    defaultSize: { width: 85, height: 24 },
    properties: [
      { name: 'variant', type: 'variant', defaultValue: 'light', options: ['filled', 'light', 'outline', 'dot'] },
      { name: 'color', type: 'variant', defaultValue: 'blue', options: ['blue', 'green', 'red', 'yellow', 'grape'] },
      { name: 'size', type: 'variant', defaultValue: 'md', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
      { name: 'label', type: 'text', defaultValue: 'Active' }
    ]
  },
  {
    id: 'avatar',
    name: 'Avatar',
    category: 'Data Display',
    package: '@mantine/core',
    description: 'User avatar with circular initials, image support, and status dot indicator.',
    defaultSize: { width: 44, height: 44 },
    properties: [
      { name: 'radius', type: 'variant', defaultValue: 'xl', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
      { name: 'color', type: 'variant', defaultValue: 'blue', options: ['blue', 'teal', 'grape', 'orange'] },
      { name: 'initials', type: 'text', defaultValue: 'DF' }
    ]
  },
  {
    id: 'table',
    name: 'Table',
    category: 'Data Display',
    package: '@mantine/core',
    description: 'Clean data table with striped rows, hover highlight, and bordered cells.',
    defaultSize: { width: 480, height: 200 },
    properties: [
      { name: 'striped', type: 'boolean', defaultValue: true },
      { name: 'highlightOnHover', type: 'boolean', defaultValue: true },
      { name: 'withTableBorder', type: 'boolean', defaultValue: true }
    ]
  },

  // --- Feedback & Overlays ---
  {
    id: 'alert',
    name: 'Alert',
    category: 'Feedback',
    package: '@mantine/core',
    description: 'Status alert banner with icon, title, description, and dismiss action.',
    defaultSize: { width: 340, height: 76 },
    properties: [
      { name: 'variant', type: 'variant', defaultValue: 'light', options: ['filled', 'light', 'outline'] },
      { name: 'color', type: 'variant', defaultValue: 'blue', options: ['blue', 'red', 'green', 'yellow'] },
      { name: 'title', type: 'text', defaultValue: 'Update Available' }
    ]
  },
  {
    id: 'modal',
    name: 'Modal',
    category: 'Overlays',
    package: '@mantine/core',
    description: 'Centered dialog modal overlay with title, close icon, body, and action buttons.',
    defaultSize: { width: 420, height: 240 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Confirm Action' },
      { name: 'centered', type: 'boolean', defaultValue: true },
      { name: 'radius', type: 'variant', defaultValue: 'md', options: ['sm', 'md', 'lg'] }
    ]
  },

  // --- Navigation & Layout ---
  {
    id: 'tabs',
    name: 'Tabs',
    category: 'Navigation',
    package: '@mantine/core',
    description: 'Tabbed navigation container with active indicator and panels.',
    defaultSize: { width: 380, height: 160 },
    properties: [
      { name: 'defaultValue', type: 'text', defaultValue: 'overview' },
      { name: 'color', type: 'variant', defaultValue: 'blue', options: ['blue', 'teal', 'grape'] }
    ]
  },
  {
    id: 'app-shell',
    name: 'AppShell',
    category: 'Layout',
    package: '@mantine/core',
    description: 'Root responsive application layout shell with Header, Navbar, and Main content.',
    defaultSize: { width: 680, height: 380 },
    properties: [
      { name: 'headerHeight', type: 'number', defaultValue: 56 },
      { name: 'navbarWidth', type: 'number', defaultValue: 200 }
    ]
  },

  // --- Dates (@mantine/dates) ---
  {
    id: 'date-picker',
    name: 'DatePicker',
    category: 'Dates',
    package: '@mantine/dates',
    description: 'Interactive calendar month grid with year/month navigator and date selection.',
    defaultSize: { width: 280, height: 280 },
    properties: [
      { name: 'type', type: 'variant', defaultValue: 'default', options: ['default', 'multiple', 'range'] },
      { name: 'allowDeselect', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'date-input',
    name: 'DateInput',
    category: 'Dates',
    package: '@mantine/dates',
    description: 'Form date input with calendar trigger icon and popover calendar.',
    defaultSize: { width: 260, height: 68 },
    properties: [
      { name: 'label', type: 'text', defaultValue: 'Select date' },
      { name: 'placeholder', type: 'text', defaultValue: 'YYYY-MM-DD' }
    ]
  },

  // --- Notifications (@mantine/notifications) ---
  {
    id: 'notification',
    name: 'Notification',
    category: 'Feedback',
    package: '@mantine/notifications',
    description: 'Toast notification card with status icon, title, description, and close button.',
    defaultSize: { width: 320, height: 72 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Notification title' },
      { name: 'color', type: 'variant', defaultValue: 'teal', options: ['blue', 'teal', 'red', 'yellow'] },
      { name: 'loading', type: 'boolean', defaultValue: false }
    ]
  },

  // --- Charts (@mantine/charts) ---
  {
    id: 'area-chart',
    name: 'AreaChart',
    category: 'Charts',
    package: '@mantine/charts',
    description: 'Smooth curved area chart with gradient fill and Recharts SVG path integration.',
    defaultSize: { width: 480, height: 240 },
    properties: [
      { name: 'curveType', type: 'variant', defaultValue: 'natural', options: ['linear', 'natural', 'monotone', 'step'] },
      { name: 'series', type: 'text', defaultValue: 'Apples, Oranges' }
    ]
  },
  {
    id: 'bar-chart',
    name: 'BarChart',
    category: 'Charts',
    package: '@mantine/charts',
    description: 'Vertical or horizontal grouped bar chart with legend and grid lines.',
    defaultSize: { width: 480, height: 240 },
    properties: [
      { name: 'orientation', type: 'variant', defaultValue: 'vertical', options: ['vertical', 'horizontal'] }
    ]
  },
  {
    id: 'donut-chart',
    name: 'DonutChart',
    category: 'Charts',
    package: '@mantine/charts',
    description: 'Ring donut chart with central value readout and multi-color segments.',
    defaultSize: { width: 240, height: 240 },
    properties: [
      { name: 'size', type: 'number', defaultValue: 160 },
      { name: 'thickness', type: 'number', defaultValue: 24 }
    ]
  },

  // --- TipTap Rich Text (@mantine/tiptap) ---
  {
    id: 'rich-text-editor',
    name: 'RichTextEditor',
    category: 'Editors',
    package: '@mantine/tiptap',
    description: 'TipTap rich text editor with toolbar for bold, italic, headings, lists, links, and code blocks.',
    defaultSize: { width: 520, height: 280 },
    properties: [
      { name: 'placeholder', type: 'text', defaultValue: 'Start typing your document...' }
    ]
  },

  // --- Code Highlight (@mantine/code-highlight) ---
  {
    id: 'code-highlight',
    name: 'CodeHighlight',
    category: 'Code',
    package: '@mantine/code-highlight',
    description: 'Syntax-highlighted code container with language tag and quick copy button.',
    defaultSize: { width: 460, height: 180 },
    properties: [
      { name: 'language', type: 'text', defaultValue: 'tsx' },
      { name: 'withCopyButton', type: 'boolean', defaultValue: true }
    ]
  },

  // --- Dropzone (@mantine/dropzone) ---
  {
    id: 'dropzone',
    name: 'Dropzone',
    category: 'Upload',
    package: '@mantine/dropzone',
    description: 'Drag & drop file upload target with upload icon, file format tags, and reject state.',
    defaultSize: { width: 440, height: 180 },
    properties: [
      { name: 'maxSize', type: 'text', defaultValue: '5MB' },
      { name: 'accept', type: 'text', defaultValue: 'Images, PDFs' }
    ]
  },

  // --- Carousel (@mantine/carousel) ---
  {
    id: 'carousel',
    name: 'Carousel',
    category: 'Media',
    package: '@mantine/carousel',
    description: 'Embla-powered interactive carousel with slide tracks, navigation arrows, and indicator dots.',
    defaultSize: { width: 480, height: 240 },
    properties: [
      { name: 'withIndicators', type: 'boolean', defaultValue: true },
      { name: 'withControls', type: 'boolean', defaultValue: true }
    ]
  },

  // --- Spotlight (@mantine/spotlight) ---
  {
    id: 'spotlight',
    name: 'Spotlight',
    category: 'Overlays',
    package: '@mantine/spotlight',
    description: 'Command palette modal overlay with instant action search and shortcut chips.',
    defaultSize: { width: 480, height: 280 },
    properties: [
      { name: 'shortcut', type: 'text', defaultValue: 'mod + K' }
    ]
  },

  // --- Progress (@mantine/nprogress) ---
  {
    id: 'progress',
    name: 'Progress',
    category: 'Feedback',
    package: '@mantine/core',
    description: 'Linear progress bar with animated striped fill and percentage readout.',
    defaultSize: { width: 280, height: 20 },
    properties: [
      { name: 'value', type: 'number', defaultValue: 65 },
      { name: 'color', type: 'variant', defaultValue: 'blue', options: ['blue', 'teal', 'green', 'orange', 'red'] }
    ]
  }
];

export const MANTINE_COMPONENT_CATALOG = Object.freeze(
  MANTINE_COMPONENTS.map(c => Object.freeze({
    ...c,
    defaultSize: Object.freeze({ ...c.defaultSize }),
    properties: Object.freeze(c.properties.map(p => Object.freeze({ ...p })))
  }))
);

/**
 * Registers a Mantine component into the Design System Registry
 */
export function addMantineComponentToRegistry(registry, componentId) {
  const definition = MANTINE_COMPONENT_CATALOG.find(c => c.id === componentId);
  if (!definition) {
    throw new Error(`Unknown Mantine catalog component: ${componentId}`);
  }

  const existing = registry.getAllComponents().find(c =>
    c.sourceMetadata?.catalogId === definition.id && c.sourceMetadata?.package?.startsWith('@mantine')
  );
  if (existing) return { component: existing, added: false };

  const component = registry.registerComponent(`Mantine / ${definition.name}`, {
    category: `Mantine / ${definition.category}`,
    description: definition.description,
    properties: definition.properties.map((p, i) => ({
      id: `${definition.id}_prop_${i + 1}`,
      ...p
    })),
    sourceMetadata: {
      origin: 'package-catalog',
      package: definition.package,
      packageVersion: '^9.8.0',
      catalogId: definition.id,
      platform: 'react-web',
      rendering: 'native-canvas'
    }
  });

  return { component, added: true };
}

/**
 * Registers all Mantine theme tokens and variables into the registry
 */
export function addMantineTokensToRegistry(registry) {
  const addedTokens = [];
  const c = MANTINE_DESIGN_TOKENS.colors;

  const tokenList = [
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Mantine / Primary Blue', value: c.primary },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Mantine / Blue Light', value: c.blue[1] },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Mantine / Blue Dark', value: c.blue[8] },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Mantine / Teal 6', value: c.teal[6] },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Mantine / Green 6', value: c.green[6] },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Mantine / Red 6', value: c.red[6] },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Mantine / Gray 1', value: c.gray[1] },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Mantine / Gray 3', value: c.gray[3] },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Mantine / Gray 7', value: c.gray[7] },
    { cat: TOKEN_CATEGORIES.COLOR, name: 'Mantine / Dark 7', value: c.dark[7] },
    { cat: TOKEN_CATEGORIES.RADIUS, name: 'Mantine / Radius SM', value: `${MANTINE_DESIGN_TOKENS.radius.sm}px` },
    { cat: TOKEN_CATEGORIES.RADIUS, name: 'Mantine / Radius MD', value: `${MANTINE_DESIGN_TOKENS.radius.md}px` },
    { cat: TOKEN_CATEGORIES.SPACING, name: 'Mantine / Spacing MD', value: `${MANTINE_DESIGN_TOKENS.spacing.md}px` },
    { cat: TOKEN_CATEGORIES.TYPOGRAPHY, name: 'Mantine / Font Family', value: MANTINE_DESIGN_TOKENS.typography.fontFamily }
  ];

  for (const t of tokenList) {
    const existing = registry.getAllTokens().find(item => item.name === t.name);
    if (!existing) {
      addedTokens.push(registry.addToken(t.cat, t.name, t.value));
    }
  }

  return addedTokens;
}

// Helpers for canvas node generation
function makeText(name, content, x, y, width, height, opts = {}) {
  return createNode('text', {
    name,
    transform: { x, y, width, height },
    text: {
      content,
      fontSize: opts.fontSize ?? 13,
      fontWeight: opts.fontWeight ?? '400',
      fontFamily: opts.fontFamily ?? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: opts.color ?? '#212529',
      textAlign: opts.textAlign ?? 'left',
      verticalAlign: 'middle'
    }
  });
}

function makeBox(name, x, y, width, height, opts = {}) {
  return createNode('frame', {
    name,
    transform: { x, y, width, height },
    cornerRadius: opts.cornerRadius ?? 4,
    fills: opts.fill ? [{ type: 'solid', color: opts.fill, opacity: opts.opacity ?? 1, visible: true }] : [],
    strokes: opts.stroke ? [{ color: opts.stroke, weight: opts.strokeWeight ?? 1, align: 'inside', visible: true }] : []
  });
}

/**
 * Creates authentic canvas node hierarchy representing a Mantine UI component
 */
export function createMantineNode(componentId, options = {}) {
  const definition = MANTINE_COMPONENT_CATALOG.find(c => c.id === componentId) || MANTINE_COMPONENT_CATALOG[0];
  const x = Math.round(options.x ?? 100);
  const y = Math.round(options.y ?? 100);
  const width = Math.round(options.width ?? definition.defaultSize.width);
  const height = Math.round(options.height ?? definition.defaultSize.height);

  let rootNode;
  const childNodes = [];

  switch (definition.id) {
    case 'button': {
      rootNode = makeBox(`Mantine / Button`, x, y, width, height, {
        fill: '#228be6',
        cornerRadius: 4
      });
      const label = makeText('Button Label', 'Mantine Button', 0, 0, width, height, {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center'
      });
      label.parentId = rootNode.id;
      childNodes.push(label);
      rootNode.childIds = [label.id];
      break;
    }

    case 'action-icon': {
      rootNode = makeBox('Mantine / ActionIcon', x, y, width, height, {
        fill: '#e7f5ff',
        stroke: '#d0ebff',
        cornerRadius: 4
      });
      const icon = makeText('Icon', '★', 0, 0, width, height, {
        fontSize: 15,
        color: '#228be6',
        textAlign: 'center'
      });
      icon.parentId = rootNode.id;
      childNodes.push(icon);
      rootNode.childIds = [icon.id];
      break;
    }

    case 'segmented-control': {
      rootNode = makeBox('Mantine / SegmentedControl', x, y, width, height, {
        fill: '#f1f3f5',
        cornerRadius: 6
      });
      const segWidth = Math.floor((width - 8) / 3);
      // Active pill
      const activePill = makeBox('Active Pill', 4, 3, segWidth, height - 6, {
        fill: '#ffffff',
        cornerRadius: 4,
        stroke: '#dee2e6'
      });
      activePill.parentId = rootNode.id;
      childNodes.push(activePill);

      const items = ['Preview', 'Code', 'Settings'];
      items.forEach((item, idx) => {
        const itemText = makeText(`Segment ${item}`, item, 4 + idx * segWidth, 0, segWidth, height, {
          fontSize: 12,
          fontWeight: idx === 0 ? '600' : '500',
          color: idx === 0 ? '#212529' : '#868e96',
          textAlign: 'center'
        });
        itemText.parentId = rootNode.id;
        childNodes.push(itemText);
      });

      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'text-input':
    case 'password-input': {
      const isPassword = definition.id === 'password-input';
      rootNode = makeBox(`Mantine / ${definition.name}`, x, y, width, height, {
        cornerRadius: 4
      });

      const label = makeText('Input Label', isPassword ? 'Password *' : 'Email address *', 0, 0, width, 18, {
        fontSize: 12,
        fontWeight: '500',
        color: '#212529'
      });
      label.parentId = rootNode.id;

      const inputField = makeBox('Input Field', 0, 22, width, 36, {
        fill: '#ffffff',
        stroke: '#ced4da',
        cornerRadius: 4
      });
      inputField.parentId = rootNode.id;

      const placeholder = makeText('Placeholder', isPassword ? '••••••••' : 'your@email.com', 10, 30, width - (isPassword ? 40 : 20), 20, {
        fontSize: 13,
        color: isPassword ? '#212529' : '#adb5bd'
      });
      placeholder.parentId = rootNode.id;

      childNodes.push(label, inputField, placeholder);

      if (isPassword) {
        const eyeIcon = makeText('Toggle Eye', '👁', width - 26, 30, 20, 20, {
          fontSize: 12,
          color: '#868e96',
          textAlign: 'center'
        });
        eyeIcon.parentId = rootNode.id;
        childNodes.push(eyeIcon);
      }

      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'badge': {
      rootNode = makeBox('Mantine / Badge', x, y, width, height, {
        fill: '#e7f5ff',
        cornerRadius: 12
      });
      const badgeText = makeText('Badge Text', 'ACTIVE', 0, 0, width, height, {
        fontSize: 10,
        fontWeight: '700',
        color: '#1c7ed6',
        textAlign: 'center'
      });
      badgeText.parentId = rootNode.id;
      childNodes.push(badgeText);
      rootNode.childIds = [badgeText.id];
      break;
    }

    case 'card': {
      rootNode = makeBox('Mantine / Card', x, y, width, height, {
        fill: '#ffffff',
        stroke: '#dee2e6',
        cornerRadius: 8
      });

      // Card Section Image placeholder
      const imageSection = makeBox('Card.Section Image', 0, 0, width, 120, {
        fill: '#e9ecef',
        cornerRadius: 0
      });
      imageSection.parentId = rootNode.id;

      const imgPlaceholder = makeText('Img Label', '🌄 Card Media Section', 0, 48, width, 24, {
        fontSize: 13,
        color: '#868e96',
        textAlign: 'center'
      });
      imgPlaceholder.parentId = rootNode.id;

      const title = makeText('Card Title', 'Mantine UI Design System', 16, 134, width - 32, 20, {
        fontSize: 15,
        fontWeight: '700',
        color: '#212529'
      });
      title.parentId = rootNode.id;

      const desc = makeText('Card Desc', 'High-performance React components with comprehensive token styling.', 16, 158, width - 32, 36, {
        fontSize: 12,
        color: '#495057'
      });
      desc.parentId = rootNode.id;

      const actionBtn = makeBox('Action Btn', 16, height - 46, width - 32, 34, {
        fill: '#228be6',
        cornerRadius: 4
      });
      actionBtn.parentId = rootNode.id;

      const btnLabel = makeText('Action Label', 'Explore Documentation', 16, height - 46, width - 32, 34, {
        fontSize: 12,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center'
      });
      btnLabel.parentId = rootNode.id;

      childNodes.push(imageSection, imgPlaceholder, title, desc, actionBtn, btnLabel);
      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'date-picker': {
      rootNode = makeBox('Mantine / DatePicker', x, y, width, height, {
        fill: '#ffffff',
        stroke: '#dee2e6',
        cornerRadius: 8
      });

      const monthHeader = makeText('Month Header', '‹   November 2026   ›', 0, 14, width, 20, {
        fontSize: 13,
        fontWeight: '700',
        color: '#212529',
        textAlign: 'center'
      });
      monthHeader.parentId = rootNode.id;
      childNodes.push(monthHeader);

      const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
      const cellW = Math.floor(width / 7);

      daysOfWeek.forEach((d, idx) => {
        const dText = makeText(`DOW_${d}`, d, idx * cellW, 44, cellW, 16, {
          fontSize: 11,
          color: '#868e96',
          textAlign: 'center'
        });
        dText.parentId = rootNode.id;
        childNodes.push(dText);
      });

      // Calendar sample numbers
      let dayNum = 1;
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 7; col++) {
          if (dayNum <= 30) {
            const isSelected = dayNum === 10;
            const dayBox = isSelected ? makeBox(`SelectedDay_${dayNum}`, col * cellW + 4, 70 + row * 34, cellW - 8, 28, {
              fill: '#228be6',
              cornerRadius: 14
            }) : null;

            if (dayBox) {
              dayBox.parentId = rootNode.id;
              childNodes.push(dayBox);
            }

            const dayText = makeText(`Day_${dayNum}`, String(dayNum), col * cellW, 70 + row * 34, cellW, 28, {
              fontSize: 12,
              fontWeight: isSelected ? '700' : '400',
              color: isSelected ? '#ffffff' : '#212529',
              textAlign: 'center'
            });
            dayText.parentId = rootNode.id;
            childNodes.push(dayText);
            dayNum++;
          }
        }
      }

      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'rich-text-editor': {
      rootNode = makeBox('Mantine / RichTextEditor', x, y, width, height, {
        fill: '#ffffff',
        stroke: '#ced4da',
        cornerRadius: 6
      });

      // Toolbar Bar
      const toolbar = makeBox('Toolbar', 0, 0, width, 38, {
        fill: '#f8f9fa',
        stroke: '#dee2e6'
      });
      toolbar.parentId = rootNode.id;

      const toolsText = makeText('Tool Buttons', '𝗕  𝑰  ̶𝗦̶  |  H1  H2  H3  |  🔗  • List  1. List  |  <Code>', 12, 10, width - 24, 18, {
        fontSize: 12,
        color: '#495057'
      });
      toolsText.parentId = rootNode.id;

      // Editor Canvas
      const contentHead = makeText('Content H1', 'Welcome to TipTap Editor', 16, 50, width - 32, 24, {
        fontSize: 16,
        fontWeight: '700',
        color: '#212529'
      });
      contentHead.parentId = rootNode.id;

      const contentBody = makeText('Content Body', 'This rich text editor is powered by @mantine/tiptap and ProseMirror extensions.\nSupports seamless markdown typing, syntax highlight code blocks, and hyperlinks.', 16, 80, width - 32, 50, {
        fontSize: 13,
        color: '#495057'
      });
      contentBody.parentId = rootNode.id;

      childNodes.push(toolbar, toolsText, contentHead, contentBody);
      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'dropzone': {
      rootNode = makeBox('Mantine / Dropzone', x, y, width, height, {
        fill: '#f8f9fa',
        stroke: '#adb5bd',
        strokeWeight: 2,
        cornerRadius: 8
      });

      const icon = makeText('Cloud Icon', '☁️ ⬆️', 0, 36, width, 36, {
        fontSize: 28,
        textAlign: 'center'
      });
      icon.parentId = rootNode.id;

      const title = makeText('Dropzone Title', 'Drag images here or click to browse', 0, 80, width, 20, {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        textAlign: 'center'
      });
      title.parentId = rootNode.id;

      const sub = makeText('Dropzone Sub', 'Attach up to 5 files, each file should not exceed 5MB', 0, 106, width, 16, {
        fontSize: 11,
        color: '#868e96',
        textAlign: 'center'
      });
      sub.parentId = rootNode.id;

      childNodes.push(icon, title, sub);
      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'code-highlight': {
      rootNode = makeBox('Mantine / CodeHighlight', x, y, width, height, {
        fill: '#1a1b1e',
        cornerRadius: 6
      });

      const header = makeBox('Header Bar', 0, 0, width, 28, { fill: '#25262b' });
      header.parentId = rootNode.id;

      const lang = makeText('Lang', 'tsx', 12, 6, 60, 16, { fontSize: 11, color: '#909296' });
      lang.parentId = rootNode.id;

      const copyBtn = makeText('Copy', 'Copy', width - 50, 6, 40, 16, { fontSize: 11, color: '#909296', textAlign: 'right' });
      copyBtn.parentId = rootNode.id;

      const codeLines = makeText('Code Text', 'import { Button } from "@mantine/core";\n\nexport function Demo() {\n  return <Button variant="light">Click</Button>;\n}', 14, 38, width - 28, height - 48, {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#c1c2c5'
      });
      codeLines.parentId = rootNode.id;

      childNodes.push(header, lang, copyBtn, codeLines);
      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'area-chart':
    case 'bar-chart':
    case 'donut-chart': {
      const isDonut = definition.id === 'donut-chart';
      rootNode = makeBox(`Mantine / ${definition.name}`, x, y, width, height, {
        fill: '#ffffff',
        stroke: '#dee2e6',
        cornerRadius: 8
      });

      const title = makeText('Chart Title', `Mantine ${definition.name}`, 14, 12, width - 28, 18, {
        fontSize: 13,
        fontWeight: '700',
        color: '#212529'
      });
      title.parentId = rootNode.id;
      childNodes.push(title);

      if (isDonut) {
        const donut = makeBox('Donut Ring', (width - 120) / 2, 45, 120, 120, {
          fill: '#228be6',
          cornerRadius: 60
        });
        donut.parentId = rootNode.id;
        const hole = makeBox('Donut Hole', (width - 70) / 2, 70, 70, 70, {
          fill: '#ffffff',
          cornerRadius: 35
        });
        hole.parentId = rootNode.id;
        const val = makeText('Donut Val', '68%', (width - 60) / 2, 92, 60, 24, {
          fontSize: 16,
          fontWeight: '700',
          color: '#228be6',
          textAlign: 'center'
        });
        val.parentId = rootNode.id;
        childNodes.push(donut, hole, val);
      } else {
        const chartBg = makeBox('Chart Grid Area', 14, 38, width - 28, height - 56, {
          fill: '#f8f9fa',
          stroke: '#e9ecef',
          cornerRadius: 4
        });
        chartBg.parentId = rootNode.id;

        const chartLine = makeBox('Chart Path Accent', 14, height / 2, width - 28, 3, {
          fill: '#228be6'
        });
        chartLine.parentId = rootNode.id;
        childNodes.push(chartBg, chartLine);
      }

      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    case 'carousel': {
      rootNode = makeBox('Mantine / Carousel', x, y, width, height, {
        fill: '#f8f9fa',
        stroke: '#dee2e6',
        cornerRadius: 8
      });

      const slideCard = makeBox('Slide 1 Card', 40, 20, width - 80, height - 60, {
        fill: '#ffffff',
        stroke: '#ced4da',
        cornerRadius: 6
      });
      slideCard.parentId = rootNode.id;

      const slideTitle = makeText('Slide Title', 'Embla Slide 1 of 4', 40, (height - 60) / 2 + 5, width - 80, 24, {
        fontSize: 15,
        fontWeight: '600',
        color: '#212529',
        textAlign: 'center'
      });
      slideTitle.parentId = rootNode.id;

      const prevArrow = makeBox('Prev Arrow', 8, (height - 32) / 2, 26, 26, { fill: '#ffffff', stroke: '#ced4da', cornerRadius: 13 });
      prevArrow.parentId = rootNode.id;
      const prevText = makeText('Prev Text', '‹', 8, (height - 32) / 2, 26, 26, { fontSize: 16, color: '#495057', textAlign: 'center' });
      prevText.parentId = rootNode.id;

      const nextArrow = makeBox('Next Arrow', width - 34, (height - 32) / 2, 26, 26, { fill: '#ffffff', stroke: '#ced4da', cornerRadius: 13 });
      nextArrow.parentId = rootNode.id;
      const nextText = makeText('Next Text', '›', width - 34, (height - 32) / 2, 26, 26, { fontSize: 16, color: '#495057', textAlign: 'center' });
      nextText.parentId = rootNode.id;

      const dots = makeText('Indicators', '●  ○  ○  ○', 0, height - 26, width, 18, {
        fontSize: 12,
        color: '#228be6',
        textAlign: 'center'
      });
      dots.parentId = rootNode.id;

      childNodes.push(slideCard, slideTitle, prevArrow, prevText, nextArrow, nextText, dots);
      rootNode.childIds = childNodes.map(c => c.id);
      break;
    }

    default: {
      rootNode = makeBox(`Mantine / ${definition.name}`, x, y, width, height, {
        fill: '#ffffff',
        stroke: '#228be6',
        cornerRadius: 6
      });
      const title = makeText('Title', `Mantine ${definition.name}`, 12, 12, width - 24, 20, {
        fontSize: 13,
        fontWeight: '700',
        color: '#228be6'
      });
      title.parentId = rootNode.id;
      const desc = makeText('Desc', definition.description, 12, 36, width - 24, height - 48, {
        fontSize: 11,
        color: '#495057'
      });
      desc.parentId = rootNode.id;
      childNodes.push(title, desc);
      rootNode.childIds = [title.id, desc.id];
      break;
    }
  }

  return { rootNode, childNodes };
}

/**
 * Inserts a Mantine UI component directly onto the active canvas page
 */
export function insertMantineComponentToCanvas(app, componentId, coords = null) {
  if (!app || !app.engine) {
    throw new Error('Application engine not initialized');
  }

  const activePage = app.engine.getActivePage();
  if (!activePage) {
    throw new Error('No active document page');
  }

  const center = coords || (app.getCanvasCenter ? app.getCanvasCenter() : { x: 200, y: 200 });
  const { rootNode, childNodes } = createMantineNode(componentId, center);

  // Register in current design system registry
  if (app.dsRegistry) {
    addMantineComponentToRegistry(app.dsRegistry, componentId);
  }

  // Add child nodes
  for (const child of childNodes) {
    activePage.nodes[child.id] = child;
  }

  // Add root node
  app.engine.addNode(rootNode, null, `Insert ${rootNode.name}`);

  if (app.selectionManager) {
    app.selectionManager.setSelection([rootNode.id]);
  }

  if (app.storage && typeof app.storage.scheduleAutosave === 'function') {
    app.storage.scheduleAutosave(app.doc);
  }

  if (typeof app.render === 'function') {
    app.render();
  }

  if (typeof app.renderLayersTree === 'function') {
    app.renderLayersTree();
  }

  if (typeof app.showToast === 'function') {
    app.showToast(`Inserted ${rootNode.name} onto canvas`, 'success');
  }

  return rootNode;
}
