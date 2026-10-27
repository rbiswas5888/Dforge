const RNEUI_COMPONENTS = [
  {
    id: 'button',
    name: 'Button',
    category: 'Actions',
    description: 'Pressable action with solid, clear, and outline variants.',
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Button' },
      { name: 'type', type: 'variant', defaultValue: 'solid', options: ['solid', 'clear', 'outline'] },
      { name: 'size', type: 'variant', defaultValue: 'md', options: ['sm', 'md', 'lg'] },
      { name: 'disabled', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'text',
    name: 'Text',
    category: 'Typography',
    description: 'Themed text with heading and font-weight options.',
    properties: [
      { name: 'children', type: 'text', defaultValue: 'Text' },
      { name: 'h1', type: 'boolean', defaultValue: false },
      { name: 'bold', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'input',
    name: 'Input',
    category: 'Forms',
    description: 'Themed text input with labels and validation states.',
    properties: [
      { name: 'placeholder', type: 'text', defaultValue: 'Enter text' },
      { name: 'label', type: 'text', defaultValue: '' },
      { name: 'errorMessage', type: 'text', defaultValue: '' },
      { name: 'disabled', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'card',
    name: 'Card',
    category: 'Content',
    description: 'Container for related content, actions, and media.',
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Card title' },
      { name: 'featured', type: 'boolean', defaultValue: false },
      { name: 'children', type: 'text', defaultValue: '' }
    ]
  },
  {
    id: 'avatar',
    name: 'Avatar',
    category: 'Data Display',
    description: 'Profile image, initials, or icon presentation.',
    properties: [
      { name: 'title', type: 'text', defaultValue: 'AB' },
      { name: 'size', type: 'variant', defaultValue: 'md', options: ['sm', 'md', 'lg'] },
      { name: 'rounded', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'Data Display',
    description: 'Compact status or count indicator.',
    properties: [
      { name: 'value', type: 'text', defaultValue: '1' },
      { name: 'status', type: 'variant', defaultValue: 'primary', options: ['primary', 'success', 'warning', 'error'] }
    ]
  },
  {
    id: 'chip',
    name: 'Chip',
    category: 'Actions',
    description: 'Compact label or interactive filter chip.',
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Chip' },
      { name: 'type', type: 'variant', defaultValue: 'solid', options: ['solid', 'outline'] },
      { name: 'disabled', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'checkbox',
    name: 'CheckBox',
    category: 'Forms',
    description: 'Selectable checkbox with a themed label.',
    properties: [
      { name: 'title', type: 'text', defaultValue: 'Option' },
      { name: 'checked', type: 'boolean', defaultValue: false },
      { name: 'disabled', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'divider',
    name: 'Divider',
    category: 'Layout',
    description: 'Visual separator between content groups.',
    properties: [
      { name: 'orientation', type: 'variant', defaultValue: 'horizontal', options: ['horizontal', 'vertical'] },
      { name: 'color', type: 'color', defaultValue: '#d1d5db' }
    ]
  },
  {
    id: 'icon',
    name: 'Icon',
    category: 'Media',
    description: 'Icon wrapper with size and color properties.',
    properties: [
      { name: 'name', type: 'text', defaultValue: 'star' },
      { name: 'size', type: 'number', defaultValue: 24 },
      { name: 'color', type: 'color', defaultValue: '#2563eb' }
    ]
  },
  {
    id: 'list-item',
    name: 'ListItem',
    category: 'Content',
    description: 'List row with title, subtitle, and accessory slots.',
    properties: [
      { name: 'title', type: 'text', defaultValue: 'List item' },
      { name: 'subtitle', type: 'text', defaultValue: '' },
      { name: 'chevron', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'search-bar',
    name: 'SearchBar',
    category: 'Forms',
    description: 'Search input with themed search and clear affordances.',
    properties: [
      { name: 'placeholder', type: 'text', defaultValue: 'Search' },
      { name: 'platform', type: 'variant', defaultValue: 'default', options: ['default', 'ios', 'android'] }
    ]
  },
  {
    id: 'switch',
    name: 'Switch',
    category: 'Forms',
    description: 'Boolean input with themed track and thumb colors.',
    properties: [
      { name: 'value', type: 'boolean', defaultValue: false },
      { name: 'disabled', type: 'boolean', defaultValue: false }
    ]
  }
];

export const RNEUI_COMPONENT_CATALOG = Object.freeze(RNEUI_COMPONENTS.map(component =>
  Object.freeze({
    ...component,
    properties: Object.freeze(component.properties.map(property => Object.freeze({ ...property })))
  })
));

export function addRneuiComponentToRegistry(registry, componentId) {
  const definition = RNEUI_COMPONENT_CATALOG.find(component => component.id === componentId);
  if (!definition) {
    throw new Error(`Unknown RNEUI catalog component: ${componentId}`);
  }

  const existing = registry.getAllComponents().find(component =>
    component.sourceMetadata?.catalogId === definition.id
  );
  if (existing) return { component: existing, added: false };

  const component = registry.registerComponent(`RNEUI ${definition.name}`, {
    category: `RNEUI / ${definition.category}`,
    description: definition.description,
    properties: definition.properties.map((property, index) => ({
      id: `${definition.id}_prop_${index + 1}`,
      ...property
    })),
    sourceMetadata: {
      origin: 'package-catalog',
      package: '@rneui/themed',
      packageVersion: '5.0.0',
      catalogId: definition.id,
      platform: 'react-native',
      rendering: 'reference-only'
    }
  });
  return { component, added: true };
}
