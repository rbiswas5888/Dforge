/**
 * DesignForge AI - Practical Microinstructions & Learning Engine
 * Implements Section 15 (Interactive Onboarding, Practice Exercises, Tooltips)
 * and Section 16 (YouTube Tutorial Integration & Official Documentation Directory)
 */

export const ONBOARDING_TOUR_STEPS = [
  {
    step: 1,
    title: '1. Infinite Canvas & Viewport Navigation',
    targetSelector: '#canvas2d',
    content: 'Welcome to DesignForge AI! Pan smoothly across the infinite canvas by holding Space or activating the Hand tool (H). Zoom with ⌘+ / ⌘- or trackpad pinch. Reset view anytime with Zoom to Fit (⇧1).',
    actionHint: 'Try panning or zooming the canvas'
  },
  {
    step: 2,
    title: '2. Drawing & Vector Tools',
    targetSelector: '.tool-shelf',
    content: 'Access Frames (F), Rectangles (R), Ellipses (O), Lines (L), Text (T), Shapes, and Comments (C) from the bottom tool shelf. Frames act as responsive containers for nested components.',
    actionHint: 'Select the Frame or Rectangle tool'
  },
  {
    step: 3,
    title: '3. Layer Hierarchy & Asset Library',
    targetSelector: '.left-sidebar',
    content: 'The left sidebar manages Pages, your complete Layer hierarchy with drag-and-drop reordering, and the shared Asset Library (Components, Tokens, and Icons).',
    actionHint: 'Explore the Layer hierarchy on the left'
  },
  {
    step: 4,
    title: '4. Figma-Grade Design Inspector',
    targetSelector: '#rightTabDesign',
    content: 'Replicates Figma down to the pixel: Alignment & distribute bar, scrubbable numeric inputs, arithmetic math evaluation (e.g. 100+24), visual 3×3 Auto-Layout pad, 4-corner radii, and Token binding.',
    actionHint: 'Select any element to inspect its properties'
  },
  {
    step: 5,
    title: '5. Prototyping & Dev Mode (Inspect)',
    targetSelector: '#tabBtnInspect',
    content: 'Connect interactive screen transitions in the Prototype tab. Switch to Inspect (Dev Mode) for live production CSS, Tailwind CSS, React TSX, and SwiftUI snippets with Box Model metrics.',
    actionHint: 'Click Inspect to view production code'
  },
  {
    step: 6,
    title: '6. Native AI Assistant & React Compiler',
    targetSelector: '#btnExportReactTop',
    content: 'Prompt the native AI Assistant (⌘⇧K) with natural language or Markdown PRD specs. When ready, click ⚡ Export to compile into a production-grade React + TypeScript project!',
    actionHint: 'Click Export or open the AI Assistant'
  }
];

export const CONTEXTUAL_TOOLTIPS = {
  'auto-layout': {
    name: 'Auto Layout',
    purpose: 'Keep related objects arranged according to defined layout rules.',
    howToUse: 'Select a frame or valid group, press ⇧A or click Add Auto Layout. Configure horizontal/vertical direction, padding, gap, and Hug or Fill sizing.',
    shortcut: '⇧A',
    example: 'Button with auto-padding that expands when text is edited.',
    commonMistake: 'Manually repositioning every child when the desired behavior is a responsive layout.',
    docUrl: 'https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout-in-Figma'
  },
  'components': {
    name: 'Components & Variants',
    purpose: 'Create reusable UI building blocks with coordinated states and local overrides.',
    howToUse: 'Select elements, press ⌥⌘K to create a component. Create instances and configure variants (Primary, Secondary, Hover).',
    shortcut: '⌥⌘K',
    example: 'Master button component updated once; all 20 screens update instantly.',
    commonMistake: 'Copy-pasting raw shapes across screens instead of referencing a central component.',
    docUrl: 'https://help.figma.com/hc/en-us/sections/39635497809687-Components-collection'
  },
  'constraints': {
    name: 'Constraints',
    purpose: 'Anchor objects to parent frame edges during responsive resizing.',
    howToUse: 'Set horizontal (Left, Right, Center, Left & Right, Scale) and vertical constraints in the Design tab.',
    shortcut: 'N/A',
    example: 'Nav bar pinned Left & Right to fill screen width at any breakpoint.',
    commonMistake: 'Assuming pixel positions remain correct when resizing desktop frames to tablet.',
    docUrl: 'https://help.figma.com/hc/en-us/articles/360041064174-Access-design-tools-from-the-toolbar'
  },
  'variables': {
    name: 'Variables & Tokens',
    purpose: 'Manage design tokens for colors, spacing, and numbers that support multiple theme modes.',
    howToUse: 'Bind fills, gaps, and radii to tokens like colors.primary. Toggle theme modes to switch themes globally.',
    shortcut: '⌥L',
    example: 'Switching from Light to Dark mode instantaneously updates all bound color tokens.',
    commonMistake: 'Hardcoding random raw hex values across frames without token bindings.',
    docUrl: 'https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma'
  },
  'dev-mode': {
    name: 'Inspect (Dev Mode)',
    purpose: 'Read-only developer handoff view showing box models, tokens, and multi-target code.',
    howToUse: 'Click Inspect tab (⌥4). Copy production CSS, Tailwind CSS, React TSX, or SwiftUI snippets.',
    shortcut: '⌥4 or ⇧D',
    example: 'Export CSS flexbox and padding metrics directly into engineering pull requests.',
    commonMistake: 'Eyeballing spacing values in screenshots instead of copying exact tokenized code.',
    docUrl: 'https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode-in-Figma'
  }
};

export const PRACTICE_EXERCISES = [
  {
    id: 'ex-beginner-1',
    level: 'Beginner',
    title: '1. Draw a Frame & Geometric Shapes',
    desc: 'Create a desktop frame (1440×900) and place a rectangle, rounded rectangle, ellipse, and line inside.',
    skills: ['Frames', 'Shapes', 'Geometry', 'Colors'],
    templateAction: 'setup-frame-shapes'
  },
  {
    id: 'ex-beginner-2',
    level: 'Beginner',
    title: '2. Typography Hierarchy & Tokens',
    desc: 'Establish a clean typographic hierarchy with Display H1, Section H2, and Body text bound to font tokens.',
    skills: ['Typography', 'Font Weights', 'Hierarchy'],
    templateAction: 'setup-typography'
  },
  {
    id: 'ex-beginner-3',
    level: 'Beginner',
    title: '3. Align & Distribute Elements',
    desc: 'Select 3 misaligned cards and use the alignment toolbar to align tops and distribute horizontal spacing evenly.',
    skills: ['Alignment', 'Distribute', 'Multi-selection'],
    templateAction: 'setup-align-distribute'
  },
  {
    id: 'ex-intermediate-1',
    level: 'Intermediate',
    title: '4. Build an Auto-Layout Button',
    desc: 'Assemble an auto-layout button with an icon and label. Set Hug Contents, 16px horizontal padding, and corner radius 8px.',
    skills: ['Auto Layout', 'Hug Sizing', 'Padding'],
    templateAction: 'setup-autolayout-button'
  },
  {
    id: 'ex-intermediate-2',
    level: 'Intermediate',
    title: '5. Responsive Metric Stat Card',
    desc: 'Build a financial KPI card with vertical auto-layout, trend percentage badge, and Fill Container responsive sizing.',
    skills: ['Auto Layout 2.0', 'Fill Container', 'Cards'],
    templateAction: 'setup-metric-card'
  },
  {
    id: 'ex-intermediate-3',
    level: 'Intermediate',
    title: '6. Modal Overlay Prototype Flow',
    desc: 'Create two frames and connect a CTA button trigger to open a confirmation modal using Dissolve transition.',
    skills: ['Prototyping', 'Transitions', 'Interactions'],
    templateAction: 'setup-prototype-modal'
  },
  {
    id: 'ex-advanced-1',
    level: 'Advanced',
    title: '7. Reusable Component with Variants',
    desc: 'Convert a button into a master component (⌥⌘K) and define Primary, Secondary, and Hover state variants.',
    skills: ['Components', 'Variants', 'Overrides'],
    templateAction: 'setup-component-variants'
  },
  {
    id: 'ex-advanced-2',
    level: 'Advanced',
    title: '8. Theme Variables & Token Auto-Binding',
    desc: 'Run the Continuous Design System Linter (⌥L) and 1-Click Auto-Bind all raw colors to semantic variables.',
    skills: ['Design Tokens', 'Linter', 'Themes'],
    templateAction: 'setup-theme-tokens'
  },
  {
    id: 'ex-advanced-3',
    level: 'Advanced',
    title: '9. Inspect & Export Production React',
    desc: 'Inspect developer metrics in the Dev Mode tab, verify box models, and compile to React + TypeScript + Tailwind.',
    skills: ['Inspect Mode', 'React Compiler', 'Handoff'],
    templateAction: 'setup-react-export'
  }
];

export const YOUTUBE_TUTORIALS = [
  {
    id: 'yt-1',
    title: 'Figma Tutorial for Beginners — Complete Course 2025',
    creator: 'Average Design Dude',
    url: 'https://www.youtube.com/watch?v=HoKD1qIcchQ',
    duration: '1h 45m',
    topics: 'The editor interface, frames, shapes, layout grids, auto layout, constraints, components, variants, prototype interactions and exporting.',
    feature: 'Core Editor & Complete Workflow',
    exerciseId: 'ex-beginner-1'
  },
  {
    id: 'yt-2',
    title: 'Figma Tutorial for Beginners',
    creator: 'Kevin Stratvert',
    url: 'https://www.youtube.com/watch?v=ezldKx-jPag',
    duration: '35m',
    topics: 'Editor interface, frames, layers, typography, images, masks, components, constraints, styles, prototypes and sharing.',
    feature: 'Layers & Typography',
    exerciseId: 'ex-beginner-2'
  },
  {
    id: 'yt-3',
    title: 'A Guide to Auto Layout: Best Practices, Tips & Tricks',
    creator: 'Figma Official',
    url: 'https://www.youtube.com/watch?v=1odqpkfkDL8',
    duration: '22m',
    topics: 'Flow direction, resizing (Fixed/Hug/Fill), padding, item spacing, 3×3 alignment pad, and responsive exceptions.',
    feature: 'Auto Layout 2.0',
    exerciseId: 'ex-intermediate-1'
  },
  {
    id: 'yt-4',
    title: 'Figma Tutorial for Beginners — Auto Layout & Components',
    creator: 'Aliena Cai',
    url: 'https://www.youtube.com/watch?v=HwiHqfax7Uk',
    duration: '18m',
    topics: 'How components and auto layout work together, variant sets, and managing responsive component libraries.',
    feature: 'Components & Variants',
    exerciseId: 'ex-advanced-1'
  }
];

export const OFFICIAL_DOCS = [
  {
    title: 'Access design tools from the toolbar',
    section: 'Toolbar',
    url: 'https://help.figma.com/hc/en-us/articles/360041064174-Access-design-tools-from-the-toolbar'
  },
  {
    title: 'Design, prototype, and explore layer properties in the right sidebar',
    section: 'Right Sidebar',
    url: 'https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar'
  },
  {
    title: 'Guide to auto layout in Figma',
    section: 'Auto Layout',
    url: 'https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout-in-Figma'
  },
  {
    title: 'Guide to variables in Figma',
    section: 'Variables',
    url: 'https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma'
  },
  {
    title: 'Components & Component Sets Collection',
    section: 'Components',
    url: 'https://help.figma.com/hc/en-us/sections/39635497809687-Components-collection'
  },
  {
    title: 'Guide to Dev Mode in Figma',
    section: 'Dev Mode',
    url: 'https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode-in-Figma'
  }
];

/**
 * Learning Engine Progress Manager
 */
export class LearningManager {
  constructor() {
    this.storageKey = 'designforge_learning_progress';
    this.progress = this.loadProgress();
  }

  loadProgress() {
    if (typeof localStorage === 'undefined') {
      return { completedExercises: [], watchedTutorials: [] };
    }
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : { completedExercises: [], watchedTutorials: [] };
    } catch {
      return { completedExercises: [], watchedTutorials: [] };
    }
  }

  saveProgress() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Could not save learning progress:', e);
    }
  }

  isExerciseCompleted(exerciseId) {
    return this.progress.completedExercises.includes(exerciseId);
  }

  toggleExercise(exerciseId) {
    const idx = this.progress.completedExercises.indexOf(exerciseId);
    if (idx >= 0) {
      this.progress.completedExercises.splice(idx, 1);
    } else {
      this.progress.completedExercises.push(exerciseId);
    }
    this.saveProgress();
    return this.isExerciseCompleted(exerciseId);
  }

  isTutorialWatched(tutorialId) {
    return this.progress.watchedTutorials.includes(tutorialId);
  }

  toggleTutorial(tutorialId) {
    const idx = this.progress.watchedTutorials.indexOf(tutorialId);
    if (idx >= 0) {
      this.progress.watchedTutorials.splice(idx, 1);
    } else {
      this.progress.watchedTutorials.push(tutorialId);
    }
    this.saveProgress();
    return this.isTutorialWatched(tutorialId);
  }

  getProgressStats() {
    const totalExercises = PRACTICE_EXERCISES.length;
    const completedEx = this.progress.completedExercises.length;
    const totalTutorials = YOUTUBE_TUTORIALS.length;
    const watchedTut = this.progress.watchedTutorials.length;
    const percentage = Math.round(((completedEx + watchedTut) / (totalExercises + totalTutorials)) * 100);
    return { totalExercises, completedEx, totalTutorials, watchedTut, percentage };
  }
}
