/**
 * DesignForge AI — Material UI (@mui/material) Component & Token Catalog
 * Authoritative integration for React Material UI v10 / v6 components, tokens, and canvas insertion.
 */

import { createNode } from '../document.js';

/**
 * Official Material Design 3 / Material UI System Tokens
 */
export const MUI_DESIGN_TOKENS = Object.freeze({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#ffffff'
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#ffffff'
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#ffffff'
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
      contrastText: '#ffffff'
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff'
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121'
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.60)',
      disabled: 'rgba(0, 0, 0, 0.38)'
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff'
    },
    divider: 'rgba(0, 0, 0, 0.12)'
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    scale: {
      h1: { fontSize: 96, fontWeight: '300', letterSpacing: -1.5 },
      h2: { fontSize: 60, fontWeight: '300', letterSpacing: -0.5 },
      h3: { fontSize: 48, fontWeight: '400', letterSpacing: 0 },
      h4: { fontSize: 34, fontWeight: '400', letterSpacing: 0.25 },
      h5: { fontSize: 24, fontWeight: '400', letterSpacing: 0 },
      h6: { fontSize: 20, fontWeight: '500', letterSpacing: 0.15 },
      subtitle1: { fontSize: 16, fontWeight: '400', letterSpacing: 0.15 },
      subtitle2: { fontSize: 14, fontWeight: '500', letterSpacing: 0.1 },
      body1: { fontSize: 16, fontWeight: '400', letterSpacing: 0.15 },
      body2: { fontSize: 14, fontWeight: '400', letterSpacing: 0.15 },
      button: { fontSize: 14, fontWeight: '500', letterSpacing: 0.4, textTransform: 'uppercase' },
      caption: { fontSize: 12, fontWeight: '400', letterSpacing: 0.4 },
      overline: { fontSize: 10, fontWeight: '400', letterSpacing: 1.5, textTransform: 'uppercase' }
    }
  },
  shape: {
    borderRadius: 4
  },
  spacing: [0, 4, 8, 12, 16, 24, 32, 40, 48, 64],
  elevation: {
    0: 'none',
    1: '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
    2: '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
    3: '0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)',
    4: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
    8: '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
    16: '0px 8px 10px -5px rgba(0,0,0,0.2), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 6px 30px 5px rgba(0,0,0,0.12)',
    24: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)'
  }
});

/**
 * Material UI Component Registry Definitions
 */
const MUI_COMPONENTS = [
  // --- Inputs ---
  {
    id: 'button',
    name: 'Button',
    category: 'Inputs',
    description: 'Material interactive button with contained, outlined, and text variants.',
    defaultSize: { width: 140, height: 42 },
    properties: [
      { name: 'variant', type: 'variant', defaultValue: 'contained', options: ['contained', 'outlined', 'text'] },
      { name: 'color', type: 'variant', defaultValue: 'primary', options: ['primary', 'secondary', 'success', 'error', 'info', 'warning'] },
      { name: 'size', type: 'variant', defaultValue: 'medium', options: ['small', 'medium', 'large'] },
      { name: 'text', type: 'text', defaultValue: 'BUTTON' },
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'fullWidth', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'textfield',
    name: 'TextField',
    category: 'Inputs',
    description: 'Standard text input with floating label, outlined border, and helper text.',
    defaultSize: { width: 240, height: 56 },
    properties: [
      { name: 'variant', type: 'variant', defaultValue: 'outlined', options: ['outlined', 'filled', 'standard'] },
      { name: 'label', type: 'text', defaultValue: 'Email Address' },
      { name: 'placeholder', type: 'text', defaultValue: 'user@example.com' },
      { name: 'helperText', type: 'text', defaultValue: 'We never share your email' },
      { name: 'error', type: 'boolean', defaultValue: false },
      { name: 'disabled', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'Inputs',
    description: 'Square selection control with optional label and ripple indicator.',
    defaultSize: { width: 140, height: 32 },
    properties: [
      { name: 'label', type: 'text', defaultValue: 'Remember me' },
      { name: 'checked', type: 'boolean', defaultValue: true },
      { name: 'color', type: 'variant', defaultValue: 'primary', options: ['primary', 'secondary', 'success', 'error'] },
      { name: 'disabled', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'radio-group',
    name: 'RadioGroup',
    category: 'Inputs',
    description: 'Set of mutually exclusive radio buttons with active selection.',
    defaultSize: { width: 180, height: 80 },
    properties: [
      { name: 'label', type: 'text', defaultValue: 'Gender' },
      { name: 'selected', type: 'text', defaultValue: 'Option A' },
      { name: 'row', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'switch',
    name: 'Switch',
    category: 'Inputs',
    description: 'Sliding toggle switch for binary preferences and active states.',
    defaultSize: { width: 140, height: 32 },
    properties: [
      { name: 'label', type: 'text', defaultValue: 'Notifications' },
      { name: 'checked', type: 'boolean', defaultValue: true },
      { name: 'color', type: 'variant', defaultValue: 'primary', options: ['primary', 'secondary'] },
      { name: 'disabled', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'slider',
    name: 'Slider',
    category: 'Inputs',
    description: 'Continuous or discrete range slider with draggable thumb.',
    defaultSize: { width: 220, height: 36 },
    properties: [
      { name: 'value', type: 'number', defaultValue: 60 },
      { name: 'min', type: 'number', defaultValue: 0 },
      { name: 'max', type: 'number', defaultValue: 100 },
      { name: 'color', type: 'variant', defaultValue: 'primary', options: ['primary', 'secondary'] }
    ]
  },
  {
    id: 'rating',
    name: 'Rating',
    category: 'Inputs',
    description: 'Star-based rating feedback input and score display.',
    defaultSize: { width: 150, height: 32 },
    properties: [
      { name: 'value', type: 'number', defaultValue: 4 },
      { name: 'max', type: 'number', defaultValue: 5 },
      { name: 'precision', type: 'number', defaultValue: 1 }
    ]
  },
  {
    id: 'fab',
    name: 'Floating Action Button (Fab)',
    category: 'Inputs',
    description: 'Circular elevated button for the primary screen action.',
    defaultSize: { width: 56, height: 56 },
    properties: [
      { name: 'color', type: 'variant', defaultValue: 'primary', options: ['primary', 'secondary', 'default'] },
      { name: 'size', type: 'variant', defaultValue: 'medium', options: ['small', 'medium', 'large'] },
      { name: 'label', type: 'text', defaultValue: '+' }
    ]
  },

  // --- Surfaces ---
  {
    id: 'card',
    name: 'Card',
    category: 'Surfaces',
    description: 'Elevated surface container with media header, title, body, and actions.',
    defaultSize: { width: 340, height: 340 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Material Card' },
      { name: 'subheader', type: 'text', defaultValue: 'Word of the Day' },
      { name: 'body', type: 'text', defaultValue: 'Cards are surfaces that display content and actions on a single subject.' },
      { name: 'elevation', type: 'number', defaultValue: 1 },
      { name: 'hasMedia', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'paper',
    name: 'Paper',
    category: 'Surfaces',
    description: 'Fundamental physical surface with Material elevation shadows.',
    defaultSize: { width: 280, height: 180 },
    properties: [
      { name: 'elevation', type: 'number', defaultValue: 2 },
      { name: 'square', type: 'boolean', defaultValue: false },
      { name: 'variant', type: 'variant', defaultValue: 'elevation', options: ['elevation', 'outlined'] }
    ]
  },
  {
    id: 'appbar',
    name: 'AppBar',
    category: 'Surfaces',
    description: 'Top navigation header bar with title, drawer hamburger, and action items.',
    defaultSize: { width: 680, height: 64 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Material Dashboard' },
      { name: 'color', type: 'variant', defaultValue: 'primary', options: ['primary', 'secondary', 'default'] },
      { name: 'elevation', type: 'number', defaultValue: 4 }
    ]
  },
  {
    id: 'accordion',
    name: 'Accordion',
    category: 'Surfaces',
    description: 'Expandable summary and detail panel with chevron indicator.',
    defaultSize: { width: 360, height: 110 },
    properties: [
      { name: 'summary', type: 'text', defaultValue: 'Accordion Panel 1' },
      { name: 'details', type: 'text', defaultValue: 'Detailed collapsible content that unfolds on expansion.' },
      { name: 'expanded', type: 'boolean', defaultValue: true }
    ]
  },

  // --- Feedback ---
  {
    id: 'alert',
    name: 'Alert',
    category: 'Feedback',
    description: 'Status banner with contextual icons and alert tones.',
    defaultSize: { width: 360, height: 68 },
    properties: [
      { name: 'severity', type: 'variant', defaultValue: 'success', options: ['success', 'info', 'warning', 'error'] },
      { name: 'variant', type: 'variant', defaultValue: 'standard', options: ['standard', 'filled', 'outlined'] },
      { name: 'title', type: 'text', defaultValue: 'Success' },
      { name: 'message', type: 'text', defaultValue: 'This is a Material UI alert message.' }
    ]
  },
  {
    id: 'dialog',
    name: 'Dialog',
    category: 'Feedback',
    description: 'Modal dialog box presenting critical information or decisions.',
    defaultSize: { width: 380, height: 210 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Reset Settings?' },
      { name: 'content', type: 'text', defaultValue: 'This will reset all system preferences to factory default.' },
      { name: 'confirmText', type: 'text', defaultValue: 'AGREE' },
      { name: 'cancelText', type: 'text', defaultValue: 'DISAGREE' }
    ]
  },
  {
    id: 'snackbar',
    name: 'Snackbar',
    category: 'Feedback',
    description: 'Brief message notification banner with action button.',
    defaultSize: { width: 340, height: 48 },
    properties: [
      { name: 'message', type: 'text', defaultValue: 'Archived note' },
      { name: 'action', type: 'text', defaultValue: 'UNDO' }
    ]
  },
  {
    id: 'linear-progress',
    name: 'LinearProgress',
    category: 'Feedback',
    description: 'Horizontal loading indicator for deterministic or infinite tasks.',
    defaultSize: { width: 280, height: 6 },
    properties: [
      { name: 'color', type: 'variant', defaultValue: 'primary', options: ['primary', 'secondary'] },
      { name: 'value', type: 'number', defaultValue: 65 }
    ]
  },

  // --- Data Display ---
  {
    id: 'avatar',
    name: 'Avatar',
    category: 'Data Display',
    description: 'Circular or rounded user profile icon, initials, or image.',
    defaultSize: { width: 44, height: 44 },
    properties: [
      { name: 'alt', type: 'text', defaultValue: 'MUI User' },
      { name: 'variant', type: 'variant', defaultValue: 'circular', options: ['circular', 'rounded', 'square'] },
      { name: 'initials', type: 'text', defaultValue: 'MU' }
    ]
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'Data Display',
    description: 'Numeric notification badge anchored to an icon or avatar.',
    defaultSize: { width: 44, height: 44 },
    properties: [
      { name: 'content', type: 'text', defaultValue: '4' },
      { name: 'color', type: 'variant', defaultValue: 'error', options: ['primary', 'secondary', 'error', 'success', 'warning'] }
    ]
  },
  {
    id: 'chip',
    name: 'Chip',
    category: 'Data Display',
    description: 'Compact interactive tag, label, or filter pill.',
    defaultSize: { width: 120, height: 32 },
    properties: [
      { name: 'label', type: 'text', defaultValue: 'Material Chip' },
      { name: 'variant', type: 'variant', defaultValue: 'filled', options: ['filled', 'outlined'] },
      { name: 'color', type: 'variant', defaultValue: 'default', options: ['default', 'primary', 'secondary', 'success'] },
      { name: 'deletable', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'divider',
    name: 'Divider',
    category: 'Data Display',
    description: 'Subtle separator line dividing distinct sections or list items.',
    defaultSize: { width: 320, height: 1 },
    properties: [
      { name: 'orientation', type: 'variant', defaultValue: 'horizontal', options: ['horizontal', 'vertical'] }
    ]
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    category: 'Data Display',
    description: 'Informative hover caption bubble with high contrast styling.',
    defaultSize: { width: 130, height: 34 },
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Material Tooltip' }
    ]
  },
  {
    id: 'typography',
    name: 'Typography',
    category: 'Data Display',
    description: 'Standardized text hierarchy block with Roboto styles.',
    defaultSize: { width: 260, height: 36 },
    properties: [
      { name: 'variant', type: 'variant', defaultValue: 'h6', options: ['h4', 'h5', 'h6', 'subtitle1', 'body1', 'body2', 'caption'] },
      { name: 'text', type: 'text', defaultValue: 'Headline 6 / Roboto' }
    ]
  },
  {
    id: 'table',
    name: 'Table',
    category: 'Data Display',
    description: 'Tabular data container with header row and striped records.',
    defaultSize: { width: 440, height: 160 },
    properties: [
      { name: 'columns', type: 'number', defaultValue: 3 },
      { name: 'rows', type: 'number', defaultValue: 3 }
    ]
  },

  // --- Navigation ---
  {
    id: 'tabs',
    name: 'Tabs',
    category: 'Navigation',
    description: 'Navigation tab bar with animated active underline indicator.',
    defaultSize: { width: 360, height: 48 },
    properties: [
      { name: 'activeTab', type: 'text', defaultValue: 'RECENTS' },
      { name: 'tabs', type: 'text', defaultValue: 'RECENTS, FAVORITES, NEARBY' }
    ]
  },
  {
    id: 'breadcrumbs',
    name: 'Breadcrumbs',
    category: 'Navigation',
    description: 'Hierarchical path navigation links separated by slashes.',
    defaultSize: { width: 300, height: 28 },
    properties: [
      { name: 'path', type: 'text', defaultValue: 'MUI / Components / Breadcrumbs' }
    ]
  },
  {
    id: 'pagination',
    name: 'Pagination',
    category: 'Navigation',
    description: 'Multi-page numbered pagination bar with active page pill.',
    defaultSize: { width: 260, height: 36 },
    properties: [
      { name: 'count', type: 'number', defaultValue: 10 },
      { name: 'page', type: 'number', defaultValue: 3 }
    ]
  },
  {
    id: 'bottom-navigation',
    name: 'BottomNavigation',
    category: 'Navigation',
    description: 'Mobile navigation bar anchored to the bottom of the viewport.',
    defaultSize: { width: 375, height: 56 },
    properties: [
      { name: 'activeItem', type: 'text', defaultValue: 'Recents' }
    ]
  },

  // --- Layout ---
  {
    id: 'stack',
    name: 'Stack',
    category: 'Layout',
    description: 'Flex container managing 1-dimensional item layout and spacing.',
    defaultSize: { width: 320, height: 140 },
    properties: [
      { name: 'direction', type: 'variant', defaultValue: 'column', options: ['row', 'column'] },
      { name: 'spacing', type: 'number', defaultValue: 2 }
    ]
  },
  {
    id: 'container',
    name: 'Container',
    category: 'Layout',
    description: 'Horizontally centered content wrapper with responsive max-width.',
    defaultSize: { width: 500, height: 260 },
    properties: [
      { name: 'maxWidth', type: 'variant', defaultValue: 'md', options: ['xs', 'sm', 'md', 'lg', 'xl'] }
    ]
  }
];

export const MUI_COMPONENT_CATALOG = Object.freeze(
  MUI_COMPONENTS.map(c => Object.freeze({
    ...c,
    properties: Object.freeze(c.properties.map(p => Object.freeze({ ...p })))
  }))
);

/**
 * Registers a Material UI component into the Design System Registry
 */
export function addMuiComponentToRegistry(registry, componentId) {
  const definition = MUI_COMPONENT_CATALOG.find(c => c.id === componentId);
  if (!definition) {
    throw new Error(`Unknown MUI catalog component: ${componentId}`);
  }

  const existing = registry.getAllComponents().find(c =>
    c.sourceMetadata?.catalogId === definition.id && c.sourceMetadata?.package === '@mui/material'
  );
  if (existing) return { component: existing, added: false };

  const component = registry.registerComponent(`MUI ${definition.name}`, {
    category: `Material UI / ${definition.category}`,
    description: definition.description,
    properties: definition.properties.map((p, i) => ({
      id: `${definition.id}_prop_${i + 1}`,
      ...p
    })),
    sourceMetadata: {
      origin: 'package-catalog',
      package: '@mui/material',
      packageVersion: '10.0.0-alpha.0',
      catalogId: definition.id,
      platform: 'react-web',
      rendering: 'native-canvas'
    }
  });

  return { component, added: true };
}

/**
 * Creates authentic canvas node hierarchy representing the Material UI component
 */
export function createMuiNode(componentId, options = {}) {
  const definition = MUI_COMPONENT_CATALOG.find(c => c.id === componentId);
  if (!definition) {
    throw new Error(`Unknown MUI component: ${componentId}`);
  }

  const x = Math.round(options.x ?? 100);
  const y = Math.round(options.y ?? 100);
  const width = options.width ?? definition.defaultSize.width;
  const height = options.height ?? definition.defaultSize.height;

  const childNodes = [];

  // Helper for text creation
  const makeText = (name, text, tx, ty, tw, th, textStyles = {}) => {
    return createNode('text', {
      name,
      transform: { x: tx, y: ty, width: tw, height: th },
      text: {
        content: text,
        fontFamily: 'Roboto',
        fontSize: 14,
        fontWeight: '400',
        color: 'rgba(0, 0, 0, 0.87)',
        ...textStyles
      }
    });
  };

  let rootNode;

  switch (componentId) {
    case 'button': {
      rootNode = createNode('frame', {
        name: 'MUI / Button (Contained)',
        transform: { x, y, width, height },
        cornerRadius: 4,
        fills: [{ type: 'solid', color: '#1976d2', opacity: 1, visible: true }],
        effects: [{
          type: 'drop_shadow',
          color: 'rgba(0, 0, 0, 0.2)',
          offset: { x: 0, y: 3 },
          blur: 4,
          spread: 0,
          visible: true
        }],
        layout: {
          layoutMode: 'horizontal',
          primaryAxisAlignItems: 'center',
          counterAxisAlignItems: 'center',
          paddingLeft: 16,
          paddingRight: 16
        }
      });
      const label = makeText('Button Label', 'BUTTON', 0, 11, 140, 20, {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 0.5
      });
      label.parentId = rootNode.id;
      childNodes.push(label);
      rootNode.childIds = [label.id];
      break;
    }

    case 'textfield': {
      rootNode = createNode('frame', {
        name: 'MUI / TextField (Outlined)',
        transform: { x, y, width: 240, height: 60 },
        cornerRadius: 4,
        fills: [{ type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
        strokes: [{ color: '#1976d2', weight: 2, align: 'inside', visible: true }]
      });
      const label = makeText('Label', 'Email Address', 12, -7, 100, 16, {
        fontSize: 11,
        color: '#1976d2',
        fontWeight: '500'
      });
      label.parentId = rootNode.id;
      const placeholder = makeText('Value', 'user@example.com', 14, 20, 210, 22, {
        fontSize: 15,
        color: '#0f172a'
      });
      placeholder.parentId = rootNode.id;
      childNodes.push(label, placeholder);
      rootNode.childIds = [label.id, placeholder.id];
      break;
    }

    case 'card': {
      rootNode = createNode('frame', {
        name: 'MUI / Card',
        transform: { x, y, width: 340, height: 330 },
        cornerRadius: 4,
        fills: [{ type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
        strokes: [{ color: '#e0e0e0', weight: 1, align: 'inside', visible: true }],
        effects: [{
          type: 'drop_shadow',
          color: 'rgba(0, 0, 0, 0.12)',
          offset: { x: 0, y: 2 },
          blur: 6,
          spread: 0,
          visible: true
        }]
      });

      // Card Media placeholder
      const media = createNode('frame', {
        name: 'Card Media',
        parentId: rootNode.id,
        transform: { x: 0, y: 0, width: 340, height: 140 },
        fills: [{ type: 'solid', color: '#bbdefb', opacity: 1, visible: true }]
      });

      const mediaText = makeText('Media Badge', 'MUI IMAGE PREVIEW', 80, 58, 180, 24, {
        color: '#1565c0',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center'
      });
      mediaText.parentId = media.id;
      media.childIds = [mediaText.id];

      // Card Content
      const title = makeText('Card Title', 'Material Card Surface', 16, 156, 308, 26, {
        fontSize: 20,
        fontWeight: '500',
        color: '#0f172a'
      });
      title.parentId = rootNode.id;

      const subheader = makeText('Subheader', 'Design System Component', 16, 184, 308, 20, {
        fontSize: 13,
        color: '#64748b'
      });
      subheader.parentId = rootNode.id;

      const body = makeText('Card Body', 'Cards contain content and actions about a single subject. They are easy to scan and interact with.', 16, 210, 308, 44, {
        fontSize: 13,
        color: '#334155'
      });
      body.parentId = rootNode.id;

      // Card Actions
      const actionShare = makeText('Action 1', 'SHARE', 16, 285, 70, 24, {
        color: '#1976d2',
        fontSize: 13,
        fontWeight: '600'
      });
      actionShare.parentId = rootNode.id;

      const actionLearn = makeText('Action 2', 'LEARN MORE', 96, 285, 100, 24, {
        color: '#1976d2',
        fontSize: 13,
        fontWeight: '600'
      });
      actionLearn.parentId = rootNode.id;

      childNodes.push(media, mediaText, title, subheader, body, actionShare, actionLearn);
      rootNode.childIds = [media.id, title.id, subheader.id, body.id, actionShare.id, actionLearn.id];
      break;
    }

    case 'alert': {
      rootNode = createNode('frame', {
        name: 'MUI / Alert (Success)',
        transform: { x, y, width: 360, height: 68 },
        cornerRadius: 4,
        fills: [{ type: 'solid', color: '#edf7ed', opacity: 1, visible: true }],
        strokes: [{ color: '#c8e6c9', weight: 1, align: 'inside', visible: true }]
      });

      const icon = makeText('Alert Icon', '✓', 14, 14, 24, 24, {
        color: '#2e7d32',
        fontSize: 18,
        fontWeight: '700'
      });
      icon.parentId = rootNode.id;

      const title = makeText('Alert Title', 'Success Status', 44, 12, 300, 20, {
        color: '#1e4620',
        fontSize: 14,
        fontWeight: '600'
      });
      title.parentId = rootNode.id;

      const desc = makeText('Alert Description', 'Operation completed smoothly with Material UI styling.', 44, 34, 300, 20, {
        color: '#2e7d32',
        fontSize: 13
      });
      desc.parentId = rootNode.id;

      childNodes.push(icon, title, desc);
      rootNode.childIds = [icon.id, title.id, desc.id];
      break;
    }

    case 'appbar': {
      rootNode = createNode('frame', {
        name: 'MUI / AppBar',
        transform: { x, y, width: 680, height: 64 },
        fills: [{ type: 'solid', color: '#1976d2', opacity: 1, visible: true }],
        effects: [{
          type: 'drop_shadow',
          color: 'rgba(0, 0, 0, 0.2)',
          offset: { x: 0, y: 4 },
          blur: 8,
          spread: 0,
          visible: true
        }]
      });

      const menuIcon = makeText('Menu Icon', '☰', 20, 20, 24, 24, {
        color: '#ffffff',
        fontSize: 20
      });
      menuIcon.parentId = rootNode.id;

      const title = makeText('AppBar Title', 'DesignForge Portal', 60, 20, 240, 24, {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '500'
      });
      title.parentId = rootNode.id;

      const rightAction = makeText('Login CTA', 'LOGIN', 600, 22, 60, 20, {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500'
      });
      rightAction.parentId = rootNode.id;

      childNodes.push(menuIcon, title, rightAction);
      rootNode.childIds = [menuIcon.id, title.id, rightAction.id];
      break;
    }

    case 'tabs': {
      rootNode = createNode('frame', {
        name: 'MUI / Tabs',
        transform: { x, y, width: 360, height: 48 },
        fills: [{ type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
        strokes: [{ color: '#e0e0e0', weight: 1, align: 'inside', visible: true }]
      });

      const tab1 = makeText('Tab 1', 'RECENTS', 20, 14, 90, 20, {
        color: '#1976d2',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center'
      });
      tab1.parentId = rootNode.id;

      const indicator = createNode('frame', {
        name: 'Active Indicator',
        parentId: rootNode.id,
        transform: { x: 20, y: 46, width: 90, height: 2 },
        fills: [{ type: 'solid', color: '#1976d2', opacity: 1, visible: true }]
      });

      const tab2 = makeText('Tab 2', 'FAVORITES', 130, 14, 100, 20, {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center'
      });
      tab2.parentId = rootNode.id;

      const tab3 = makeText('Tab 3', 'NEARBY', 250, 14, 90, 20, {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center'
      });
      tab3.parentId = rootNode.id;

      childNodes.push(tab1, indicator, tab2, tab3);
      rootNode.childIds = [tab1.id, indicator.id, tab2.id, tab3.id];
      break;
    }

    case 'chip': {
      rootNode = createNode('frame', {
        name: 'MUI / Chip',
        transform: { x, y, width: 130, height: 32 },
        cornerRadius: 16,
        fills: [{ type: 'solid', color: '#e0e0e0', opacity: 1, visible: true }]
      });

      const chipLabel = makeText('Label', 'Material Chip', 16, 7, 86, 18, {
        fontSize: 13,
        color: 'rgba(0, 0, 0, 0.87)',
        fontWeight: '400'
      });
      chipLabel.parentId = rootNode.id;

      const deleteIcon = makeText('Delete Icon', '✕', 106, 7, 16, 16, {
        fontSize: 11,
        color: 'rgba(0, 0, 0, 0.54)'
      });
      deleteIcon.parentId = rootNode.id;

      childNodes.push(chipLabel, deleteIcon);
      rootNode.childIds = [chipLabel.id, deleteIcon.id];
      break;
    }

    case 'switch': {
      rootNode = createNode('frame', {
        name: 'MUI / Switch',
        transform: { x, y, width: 160, height: 32 },
        fills: []
      });

      const track = createNode('frame', {
        name: 'Track',
        parentId: rootNode.id,
        transform: { x: 0, y: 9, width: 34, height: 14 },
        cornerRadius: 7,
        fills: [{ type: 'solid', color: '#90caf9', opacity: 1, visible: true }]
      });

      const thumb = createNode('ellipse', {
        name: 'Thumb',
        parentId: rootNode.id,
        transform: { x: 14, y: 6, width: 20, height: 20 },
        fills: [{ type: 'solid', color: '#1976d2', opacity: 1, visible: true }],
        effects: [{
          type: 'drop_shadow',
          color: 'rgba(0,0,0,0.2)',
          offset: { x: 0, y: 1 },
          blur: 2,
          spread: 0,
          visible: true
        }]
      });

      const switchLabel = makeText('Switch Label', 'Enable Feature', 44, 7, 110, 18, {
        fontSize: 14,
        color: 'rgba(0, 0, 0, 0.87)'
      });
      switchLabel.parentId = rootNode.id;

      childNodes.push(track, thumb, switchLabel);
      rootNode.childIds = [track.id, thumb.id, switchLabel.id];
      break;
    }

    case 'checkbox': {
      rootNode = createNode('frame', {
        name: 'MUI / Checkbox',
        transform: { x, y, width: 150, height: 30 },
        fills: []
      });

      const box = createNode('frame', {
        name: 'Box',
        parentId: rootNode.id,
        transform: { x: 2, y: 6, width: 18, height: 18 },
        cornerRadius: 2,
        fills: [{ type: 'solid', color: '#1976d2', opacity: 1, visible: true }]
      });

      const check = makeText('Checkmark', '✓', 5, 5, 12, 12, {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700'
      });
      check.parentId = box.id;
      box.childIds = [check.id];

      const label = makeText('Checkbox Label', 'Remember me', 28, 6, 116, 18, {
        fontSize: 14,
        color: 'rgba(0, 0, 0, 0.87)'
      });
      label.parentId = rootNode.id;

      childNodes.push(box, check, label);
      rootNode.childIds = [box.id, label.id];
      break;
    }

    case 'dialog': {
      rootNode = createNode('frame', {
        name: 'MUI / Dialog',
        transform: { x, y, width: 380, height: 200 },
        cornerRadius: 8,
        fills: [{ type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
        effects: [{
          type: 'drop_shadow',
          color: 'rgba(0, 0, 0, 0.25)',
          offset: { x: 0, y: 12 },
          blur: 24,
          spread: 0,
          visible: true
        }]
      });

      const title = makeText('Title', "Use Google's location service?", 24, 20, 332, 26, {
        fontSize: 18,
        fontWeight: '600',
        color: '#0f172a'
      });
      title.parentId = rootNode.id;

      const content = makeText('Content', 'Let Google help apps determine location. This means sending anonymous location data to Google.', 24, 56, 332, 54, {
        fontSize: 14,
        color: '#475569'
      });
      content.parentId = rootNode.id;

      const cancel = makeText('Cancel', 'DISAGREE', 180, 150, 80, 24, {
        color: '#1976d2',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center'
      });
      cancel.parentId = rootNode.id;

      const confirm = makeText('Confirm', 'AGREE', 270, 150, 80, 24, {
        color: '#1976d2',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center'
      });
      confirm.parentId = rootNode.id;

      childNodes.push(title, content, cancel, confirm);
      rootNode.childIds = [title.id, content.id, cancel.id, confirm.id];
      break;
    }

    case 'avatar': {
      rootNode = createNode('ellipse', {
        name: 'MUI / Avatar',
        transform: { x, y, width: 44, height: 44 },
        fills: [{ type: 'solid', color: '#bdbdbd', opacity: 1, visible: true }]
      });

      const text = makeText('Initials', 'MU', 0, 12, 44, 20, {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center'
      });
      text.parentId = rootNode.id;

      childNodes.push(text);
      rootNode.childIds = [text.id];
      break;
    }

    case 'badge': {
      rootNode = createNode('frame', {
        name: 'MUI / Badge (Over Icon)',
        transform: { x, y, width: 44, height: 44 },
        fills: []
      });

      const baseIcon = makeText('Icon', '✉', 8, 10, 28, 28, {
        color: '#475569',
        fontSize: 22
      });
      baseIcon.parentId = rootNode.id;

      const badgePill = createNode('ellipse', {
        name: 'Badge Pill',
        parentId: rootNode.id,
        transform: { x: 24, y: 2, width: 18, height: 18 },
        fills: [{ type: 'solid', color: '#d32f2f', opacity: 1, visible: true }]
      });

      const badgeNumber = makeText('Number', '4', 24, 4, 18, 14, {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center'
      });
      badgeNumber.parentId = rootNode.id;

      childNodes.push(baseIcon, badgePill, badgeNumber);
      rootNode.childIds = [baseIcon.id, badgePill.id, badgeNumber.id];
      break;
    }

    case 'fab': {
      rootNode = createNode('ellipse', {
        name: 'MUI / Fab',
        transform: { x, y, width: 56, height: 56 },
        fills: [{ type: 'solid', color: '#1976d2', opacity: 1, visible: true }],
        effects: [{
          type: 'drop_shadow',
          color: 'rgba(0, 0, 0, 0.28)',
          offset: { x: 0, y: 6 },
          blur: 10,
          spread: 0,
          visible: true
        }]
      });

      const plus = makeText('Icon', '+', 0, 10, 56, 36, {
        color: '#ffffff',
        fontSize: 32,
        fontWeight: '400',
        textAlign: 'center'
      });
      plus.parentId = rootNode.id;

      childNodes.push(plus);
      rootNode.childIds = [plus.id];
      break;
    }

    case 'paper': {
      rootNode = createNode('frame', {
        name: 'MUI / Paper (Elevation 3)',
        transform: { x, y, width: 280, height: 160 },
        cornerRadius: 4,
        fills: [{ type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
        effects: [{
          type: 'drop_shadow',
          color: 'rgba(0, 0, 0, 0.14)',
          offset: { x: 0, y: 3 },
          blur: 8,
          spread: 0,
          visible: true
        }]
      });
      const paperLabel = makeText('Paper Label', 'Material Paper Surface', 20, 20, 240, 24, {
        fontSize: 16,
        fontWeight: '500',
        color: '#1e293b'
      });
      paperLabel.parentId = rootNode.id;
      childNodes.push(paperLabel);
      rootNode.childIds = [paperLabel.id];
      break;
    }

    default: {
      // Generic fallback for any other MUI component
      rootNode = createNode('frame', {
        name: `MUI / ${definition.name}`,
        transform: { x, y, width, height },
        cornerRadius: 4,
        fills: [{ type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
        strokes: [{ color: '#1976d2', weight: 1, align: 'inside', visible: true }]
      });
      const title = makeText('Title', `MUI ${definition.name}`, 12, 12, width - 24, 24, {
        fontSize: 14,
        fontWeight: '600',
        color: '#1976d2'
      });
      title.parentId = rootNode.id;
      const subtitle = makeText('Subtitle', definition.description, 12, 38, width - 24, height - 48, {
        fontSize: 11,
        color: '#64748b'
      });
      subtitle.parentId = rootNode.id;
      childNodes.push(title, subtitle);
      rootNode.childIds = [title.id, subtitle.id];
      break;
    }
  }

  return { rootNode, childNodes };
}

/**
 * Inserts an authentic Material UI component onto the active canvas page
 */
export function insertMuiComponentToCanvas(app, componentId, coords = null) {
  if (!app || !app.engine) {
    throw new Error('Application engine not initialized');
  }

  const activePage = app.engine.getActivePage();
  if (!activePage) {
    throw new Error('No active document page');
  }

  const center = coords || (app.getCanvasCenter ? app.getCanvasCenter() : { x: 200, y: 200 });
  const { rootNode, childNodes } = createMuiNode(componentId, center);

  // Register in current design system registry
  if (app.dsRegistry) {
    addMuiComponentToRegistry(app.dsRegistry, componentId);
  }

  // Add all child nodes to page storage
  for (const child of childNodes) {
    activePage.nodes[child.id] = child;
  }

  // Add the root node via engine transaction so it's undoable and updates canvas
  app.engine.addNode(rootNode, null, `Insert ${rootNode.name}`);

  // Select the newly added node
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
