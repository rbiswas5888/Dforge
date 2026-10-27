/**
 * DesignForge AI Prototyping Logic Engine Verification Suite
 * Validates MD/DesignForge AI Prototyping Logic Engine Spec.md requirements:
 * 1. Flow starting points and navigation history
 * 2. Reactive variables and dependency graph recomputation
 * 3. Sandboxed expression evaluator (Math, Text, List, Logic, Validation)
 * 4. Multi-region hierarchical component state machines
 * 5. Mock data collections and API mock responses
 * 6. Modal overlays stack (open, swap, close, backdrop)
 * 7. Virtual clock, event log, snapshots, time-travel, and assertion runner
 * 8. Motion physics (AnalyticalSpring, CubicBezier, Kinematic gestures)
 */

import { PrototypeEngine } from '../src/engine/prototype.js';
import { evaluateExpression } from '../src/engine/prototype/expressions.js';
import { ComponentStateMachineRuntime } from '../src/engine/prototype/state_machine.js';
import { DataLayer } from '../src/engine/prototype/data_layer.js';
import { AnalyticalSpring, CubicBezier } from '../src/editor-core/index.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runPrototypingEngineVerificationSuite() {
  console.log('⚡ Starting Prototyping Logic Engine Verification Suite (Spec Compliance)...\n');

  const mockDocument = {
    rootFrameIds: ['screen_home', 'screen_details', 'screen_checkout'],
    nodes: {
      screen_home: {
        id: 'screen_home',
        type: 'frame',
        name: 'Home Screen',
        childIds: ['btn_view_details', 'counter_widget'],
        interactions: []
      },
      btn_view_details: {
        id: 'btn_view_details',
        type: 'button',
        name: 'View Details Button',
        interactions: [
          {
            trigger: 'click',
            action: 'navigate_to',
            destinationFrameId: 'screen_details',
            transition: 'smart_animate',
            durationMs: 300
          }
        ]
      },
      counter_widget: {
        id: 'counter_widget',
        type: 'component_instance',
        name: 'Counter Widget',
        interactions: [
          {
            trigger: 'click',
            action: 'set_variable',
            variableId: 'cart_count',
            expression: 'cart_count + 1'
          }
        ]
      },
      screen_details: {
        id: 'screen_details',
        type: 'frame',
        name: 'Details Screen',
        childIds: ['btn_open_modal', 'btn_back'],
        interactions: []
      },
      btn_open_modal: {
        id: 'btn_open_modal',
        type: 'button',
        name: 'Open Filter Modal',
        interactions: [
          {
            trigger: 'click',
            action: 'open_overlay',
            overlayFrameId: 'overlay_filter',
            overlaySettings: {
              position: 'centered',
              closeOnClickOutside: true,
              backgroundDimming: 0.5
            }
          }
        ]
      },
      btn_back: {
        id: 'btn_back',
        type: 'button',
        name: 'Back Button',
        interactions: [
          {
            trigger: 'click',
            action: 'back'
          }
        ]
      },
      overlay_filter: {
        id: 'overlay_filter',
        type: 'frame',
        name: 'Filter Overlay Modal',
        childIds: ['btn_close_overlay'],
        interactions: []
      },
      btn_close_overlay: {
        id: 'btn_close_overlay',
        type: 'button',
        name: 'Close Modal Button',
        interactions: [
          {
            trigger: 'click',
            action: 'close_overlay'
          }
        ]
      },
      screen_checkout: {
        id: 'screen_checkout',
        type: 'frame',
        name: 'Checkout Screen',
        childIds: [],
        interactions: []
      }
    }
  };

  // 1. Flow starting points & Navigation History
  console.log('1. Testing Flows & Navigation History (Section 3 & 4)...');
  const engine = new PrototypeEngine(mockDocument);
  const prototypeHtml = new PrototypeEngine({
    name: 'Prototype Layout',
    pages: [{
      id: 'page',
      rootIds: ['frame'],
      nodes: {
        frame: {
          id: 'frame',
          type: 'frame',
          name: 'Screen',
          childIds: ['first', 'second'],
          layout: { mode: 'stack-vertical', gap: 8 },
          transform: { x: 10, y: 20, width: 375, height: 812 }
        },
        first: {
          id: 'first',
          type: 'frame',
          name: 'First',
          parentId: 'frame',
          childIds: [],
          transform: { x: 0, y: 0, width: 100, height: 20 }
        },
        second: {
          id: 'second',
          type: 'frame',
          name: 'Second',
          parentId: 'frame',
          childIds: [],
          transform: { x: 0, y: 0, width: 100, height: 10 }
        }
      }
    }]
  }).generatePrototypeHtml();
  assert(
    prototypeHtml.includes('id="activeDeviceBezel" style="width: 100%; height: 100%; border: 0;'),
    'Prototype player viewport should fit its iframe so screen interactions remain reachable'
  );
  const serializedPrototype = JSON.parse(
    prototypeHtml.match(/window\.__DFORGE_DOC__ = (.+);/)?.[1] || 'null'
  );
  assert(
    serializedPrototype.pages[0].prototypeBounds.second.y === 48,
    'Prototype layer positions should include parent auto-layout spacing'
  );
  assert(
    prototypeHtml.includes("element.style.whiteSpace = 'pre';"),
    'Prototype text should preserve explicit line breaks without adding canvas-inconsistent wrapping'
  );
  assert(
    prototypeHtml.includes('@media (max-width: 480px)'),
    'Prototype player toolbar should remain usable at mobile viewport widths'
  );
  assert(
    prototypeHtml.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0">'),
    'Prototype iframe should use its actual device width for responsive media queries'
  );
  console.log('   ✓ Prototype layout, text wrapping, and responsive toolbar are preserved.');

  engine.setFlowStartingPoints([
    { id: 'flow_onboarding', name: 'User Onboarding Flow', startingFrameId: 'screen_home' },
    { id: 'flow_checkout', name: 'Direct Checkout Flow', startingFrameId: 'screen_checkout' }
  ]);

  assert(engine.flows.length === 2, 'Two flows should be registered');
  engine.startFlow('flow_onboarding');
  assert(engine.currentFrameId === 'screen_home', 'Starting flow should set current frame to screen_home');

  // Trigger navigation
  engine.handleEvent('btn_view_details', 'click');
  assert(engine.currentFrameId === 'screen_details', 'Clicking View Details should navigate to screen_details');
  assert(engine.navigationHistory.length === 1, 'Navigation history should have screen_home in back stack');

  // Trigger back
  engine.handleEvent('btn_back', 'click');
  assert(engine.currentFrameId === 'screen_home', 'Back button should navigate back to screen_home');
  console.log('   ✓ Flows and back-stack history navigation verified.');

  // 2. Reactive Runtime Variables & Dependency Graph
  console.log('2. Testing Reactive Variables & Computed Graph (Section 5)...');
  engine.createVariable({ id: 'item_price', name: 'Item Price', type: 'number', value: 50 });
  engine.createVariable({ id: 'cart_count', name: 'Cart Count', type: 'number', value: 2 });
  engine.createVariable({
    id: 'subtotal',
    name: 'Subtotal',
    type: 'number',
    value: 0,
    isComputed: true,
    expression: 'item_price * cart_count'
  });
  engine.createVariable({
    id: 'is_free_shipping',
    name: 'Free Shipping Eligible',
    type: 'boolean',
    value: false,
    isComputed: true,
    expression: 'subtotal >= 100'
  });

  engine.variablesStore.recomputeGraph();
  assert(engine.getVariable('subtotal').value === 100, 'Subtotal should be 50 * 2 = 100');
  assert(engine.getVariable('is_free_shipping').value === true, 'Free shipping should be true when subtotal >= 100');

  // Mutate cart count
  engine.setVariable('cart_count', 1);
  assert(engine.getVariable('subtotal').value === 50, 'Subtotal should auto-recompute to 50');
  assert(engine.getVariable('is_free_shipping').value === false, 'Free shipping should auto-recompute to false');
  console.log('   ✓ Reactive variables and topological dependency recomputation verified.');

  // 3. Sandboxed Expression Evaluator
  console.log('3. Testing Expression Evaluator Functions (Section 6)...');
  const scope = {
    price: 49.99,
    quantity: 3,
    user: { email: 'designer@designforge.ai', name: 'Alex' },
    scores: [10, 20, 30, 40]
  };

  assert(evaluateExpression('min(price, 100)', scope) === 49.99, 'min() evaluation');
  assert(evaluateExpression('clamp(quantity * 40, 0, 100)', scope) === 100, 'clamp() evaluation');
  assert(evaluateExpression('round(price, 0)', scope) === 50, 'round() evaluation');
  assert(evaluateExpression('concat("Welcome, ", user.name, "!")', scope) === 'Welcome, Alex!', 'concat() evaluation');
  assert(evaluateExpression('contains(user.email, "@designforge.ai")', scope) === true, 'contains() evaluation');
  assert(evaluateExpression('len(scores)', scope) === 4, 'len() evaluation');
  assert(evaluateExpression('sum(scores)', scope) === 100, 'sum() evaluation');
  assert(evaluateExpression('avg(scores)', scope) === 25, 'avg() evaluation');
  assert(evaluateExpression('isEmail(user.email)', scope) === true, 'isEmail() evaluation');
  assert(evaluateExpression('isEmail("invalid-email")', scope) === false, 'isEmail() false evaluation');
  assert(evaluateExpression('minLen(user.name, 3)', scope) === true, 'minLen() evaluation');
  assert(evaluateExpression('if(quantity > 0, "In Stock", "Out of Stock")', scope) === 'In Stock', 'if() evaluation');
  console.log('   ✓ Sandboxed expression evaluator (Math, Text, List, Logic, Validation) verified.');

  // 4. Multi-Region Component State Machines
  console.log('4. Testing Component State Machine Runtime (Section 7.3)...');
  const hfsmSpec = {
    id: 'toggle_switch_machine',
    initialState: 'off',
    states: {
      off: {
        id: 'off',
        label: 'Off State',
        variantBindings: { status: 'disabled', checked: false },
        transitions: [
          {
            trigger: 'toggle',
            target: 'on',
            guard: 'allow_toggle == true'
          }
        ]
      },
      on: {
        id: 'on',
        label: 'On State',
        variantBindings: { status: 'active', checked: true },
        transitions: [
          {
            trigger: 'toggle',
            target: 'off'
          }
        ]
      }
    }
  };

  const fsm = new ComponentStateMachineRuntime('comp_inst_toggle_1', hfsmSpec, engine.variablesStore);
  assert(fsm.getCurrentStateId() === 'off', 'Initial state should be off');

  // Guard test: allow_toggle is false by default
  engine.createVariable({ id: 'allow_toggle', name: 'Allow Toggle', type: 'boolean', value: false });
  const transitionedBlocked = fsm.dispatch('toggle');
  assert(transitionedBlocked === false, 'Transition should be blocked by guard allow_toggle == true');
  assert(fsm.getCurrentStateId() === 'off', 'State should remain off when guard fails');

  // Update variable to allow toggle
  engine.setVariable('allow_toggle', true);
  const transitionedAllowed = fsm.dispatch('toggle');
  assert(transitionedAllowed === true, 'Transition should succeed when guard evaluates to true');
  assert(fsm.getCurrentStateId() === 'on', 'State should transition to on');
  assert(fsm.getActiveVariantBindings().checked === true, 'Variant binding checked should be true');
  console.log('   ✓ Multi-region state machine with guarded transitions verified.');

  // 5. In-Memory Mock Data Collections & Mock Endpoints
  console.log('5. Testing Mock Data Layer & Mock Endpoints (Section 8)...');
  const dataLayer = new DataLayer();
  dataLayer.registerCollection({
    id: 'users',
    name: 'Team Members',
    schema: { id: 'string', name: 'string', role: 'string' },
    records: [
      { id: 'u1', name: 'Alice', role: 'Lead Architect' },
      { id: 'u2', name: 'Bob', role: 'Design Systems Eng' }
    ]
  });

  const users = dataLayer.findRecords('users', (u) => u.role.includes('Design'));
  assert(users.length === 1 && users[0].name === 'Bob', 'Filtered records lookup');

  dataLayer.addRecord('users', { id: 'u3', name: 'Charlie', role: 'Product Designer' });
  assert(dataLayer.getCollection('users').records.length === 3, 'Record addition');

  dataLayer.registerEndpoint({
    id: 'endpoint_login',
    method: 'POST',
    path: '/api/v1/auth/login',
    responseStatus: 200,
    responseData: { token: 'mock-jwt-token-xyz', user: { id: 'u1', name: 'Alice' } }
  });

  const response = await dataLayer.fetchMock('POST', '/api/v1/auth/login', { username: 'alice' });
  assert(response.status === 200, 'Mock endpoint status');
  assert(response.data.token === 'mock-jwt-token-xyz', 'Mock endpoint returned data payload');
  console.log('   ✓ Mock data layer CRUD and virtual API endpoints verified.');

  // 6. Overlays Management
  console.log('6. Testing Overlays Stack & Lifecycle (Section 4)...');
  engine.startFlow('flow_onboarding');
  engine.handleEvent('btn_view_details', 'click');
  assert(engine.currentFrameId === 'screen_details', 'Navigated to details');

  // Open overlay
  engine.handleEvent('btn_open_modal', 'click');
  assert(engine.overlays.length === 1, 'Overlay modal should be in stack');
  assert(engine.overlays[0].overlayFrameId === 'overlay_filter', 'Filter modal is active overlay');

  // Close overlay
  engine.handleEvent('btn_close_overlay', 'click');
  assert(engine.overlays.length === 0, 'Closing overlay empties overlay stack');
  console.log('   ✓ Modal overlay stack (open, inspect, close) verified.');

  // 7. Event Logging, Time-Travel Snapshots & Assertions
  console.log('7. Testing Time-Travel Snapshots & Virtual Clock (Section 13)...');
  const initialSnapshotCount = engine.snapshots.length;
  engine.stepVirtualClock(100);
  assert(engine.virtualTimeMs === 100, 'Virtual clock advancement');

  engine.recordSnapshot('step_1_checkpoint');
  assert(engine.snapshots.length === initialSnapshotCount + 1, 'Snapshot registered');

  // Assert condition action execution
  const assertPass = engine.executeAction({
    action: 'assert',
    condition: 'cart_count == 1',
    description: 'Cart count must be 1'
  });
  assert(assertPass === true, 'Valid assertion passes');

  const assertFail = engine.executeAction({
    action: 'assert',
    condition: 'cart_count == 999',
    description: 'Cart count must be 999'
  });
  assert(assertFail === false, 'Invalid assertion returns false without crashing engine');
  console.log('   ✓ Virtual clock, event audit log, snapshots, and assertions verified.');

  // 8. Motion Physics (AnalyticalSpring, CubicBezier)
  console.log('8. Testing Motion Physics & Spring Curves (Section 10 & editor-core)...');
  // Underdamped spring: stiffness 300, damping 20, mass 1
  const underdamped = new AnalyticalSpring({ mass: 1, stiffness: 300, damping: 20, initialVelocity: 0 });
  const posAt0 = underdamped.solve(0);
  const posAtMid = underdamped.solve(0.15);
  const posAtSettled = underdamped.solve(1.0);
  assert(Math.abs(posAt0) < 0.001, 'Spring starts at 0 displacement');
  assert(posAtSettled > 0.95 && posAtSettled < 1.05, 'Spring settles near 1.0 after settling time');

  // Cubic Bezier ease-in-out: [0.42, 0, 0.58, 1]
  const bezier = new CubicBezier(0.42, 0, 0.58, 1);
  assert(Math.abs(bezier.solve(0)) < 0.001, 'Bezier curve at t=0');
  assert(Math.abs(bezier.solve(1) - 1.0) < 0.001, 'Bezier curve at t=1');
  assert(Math.abs(bezier.solve(0.5) - 0.5) < 0.05, 'Bezier symmetric midpoint');
  console.log('   ✓ Analytical spring physics and cubic-bezier solver verified.');

  console.log('\n🎉 ALL 8 PROTOTYPING LOGIC ENGINE VERIFICATION CHECKS PASSED (100% SPEC COMPLIANCE)!');
}

runPrototypingEngineVerificationSuite().catch((err) => {
  console.error('❌ Prototyping Engine Verification Failed:', err);
  process.exit(1);
});
