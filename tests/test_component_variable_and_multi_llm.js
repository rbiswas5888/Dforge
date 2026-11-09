/**
 * DesignForge AI — Component & Variable Management + Multi-LLM Engine Test Suite
 * Master Verification conforming to requirements of:
 * DesignForge AI — Component & Variable Management + Multi-LLM Design Intelligence Engine
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createInitialDocument, createNode } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import { DesignSystemRegistry } from '../src/engine/design_system/registry.js';
import {
  ComponentVariableManager,
  VARIABLE_CATEGORIES,
  PROPERTY_TYPE_COMPATIBILITY
} from '../src/engine/design_system/component_variable_manager.js';
import { DesignSystemRepositoryIndexer } from '../src/ai/knowledge/repository_indexer.js';
import { DualReasoningOrchestrator } from '../src/ai/dual_reasoning.js';
import { DesignForgeAIService } from '../src/ai/service.js';
import { PROVIDERS } from '../src/ai/types.js';
import { OpenAIProvider } from '../src/ai/providers/openai-provider.js';
import { GeminiProvider } from '../src/ai/providers/gemini-provider.js';
import { parseMarkdownDesignSpec } from '../src/ai/markdown_parser.js';

describe('DesignForge AI: Component & Variable Management + Multi-LLM Engine', () => {

  function setupTestEnvironment() {
    const doc = createInitialDocument('Test Doc');
    const engine = new CommandEngine(doc);
    const registry = new DesignSystemRegistry(engine);

    // Seed test tokens & variables
    registry.system.tokens['tok_primary_color'] = {
      id: 'tok_primary_color',
      name: 'Primary / Brand 600',
      type: 'color',
      value: '#2563eb',
      category: 'color'
    };
    registry.system.tokens['tok_secondary_color'] = {
      id: 'tok_secondary_color',
      name: 'Secondary / Brand 400',
      type: 'color',
      value: '#60a5fa',
      category: 'color'
    };
    registry.system.tokens['tok_radius_lg'] = {
      id: 'tok_radius_lg',
      name: 'Radius / Large (12px)',
      type: 'dimension',
      value: 12,
      category: 'radius'
    };
    registry.system.tokens['tok_gap_md'] = {
      id: 'tok_gap_md',
      name: 'Spacing / Gap Medium (16px)',
      type: 'dimension',
      value: 16,
      category: 'spacing'
    };
    registry.system.variables['var_header_font'] = {
      id: 'var_header_font',
      name: 'Typography / Display Font',
      type: 'string',
      value: 'Inter, sans-serif',
      category: 'typography'
    };
    registry.system.variables['var_active_status'] = {
      id: 'var_active_status',
      name: 'State / Is Active',
      type: 'boolean',
      value: true,
      category: 'boolean'
    };

    const compVarManager = new ComponentVariableManager(registry, engine);
    return { doc, engine, registry, compVarManager };
  }

  // --- Part A: Component and Variable Intelligence ---
  describe('Part A: Component & Variable Management Subsystem', () => {

    it('1. Performs comprehensive audit on component layer properties and bindings', () => {
      const { engine, compVarManager } = setupTestEnvironment();
      const page = engine.getActivePage();

      // Create a test frame component with fills, strokes, radius, layout, and children
      const frameNode = createNode('frame', {
        name: 'Account Summary Card',
        transform: { x: 100, y: 150, width: 360, height: 240, rotation: 0 },
        style: {
          fills: [{ type: 'solid', color: '#1e293b' }],
          strokes: [{ type: 'solid', color: '#334155', width: 1 }],
          cornerRadius: 8
        },
        layout: {
          mode: 'stack-vertical',
          gap: 12,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 16,
          paddingBottom: 16
        }
      });
      engine.addNode(frameNode, page.id, 'Add Card Frame');

      const audit = compVarManager.auditComponent(frameNode.id);
      assert.equal(audit.nodeId, frameNode.id);
      assert.equal(audit.nodeName, 'Account Summary Card');
      assert.ok(audit.totalPropertiesCount >= 6, 'Should identify all bindable visual properties');
      assert.ok(audit.hasUnboundProperties, 'New node should have unbound properties');

      const paths = audit.bindableProperties.map(p => p.path);
      assert.ok(paths.includes('style.fills.0.color'), 'Audits fills');
      assert.ok(paths.includes('style.strokes.0.color'), 'Audits strokes');
      assert.ok(paths.includes('style.cornerRadius'), 'Audits corner radius');
      assert.ok(paths.includes('transform.width'), 'Audits width');
      assert.ok(paths.includes('layout.gap'), 'Audits layout gap');
    });

    it('2. Enforces strict property-type compatibility validation', () => {
      const { compVarManager } = setupTestEnvironment();

      // Color to color property: compatible
      const colorCheck = compVarManager.validatePropertyCompatibility('style.fills.0.color', {
        id: 'tok_1',
        type: 'color',
        value: '#3b82f6'
      });
      assert.equal(colorCheck.compatible, true);

      // Dimension/Number to corner radius: compatible
      const radiusCheck = compVarManager.validatePropertyCompatibility('style.cornerRadius', {
        id: 'tok_2',
        type: 'dimension',
        value: 12
      });
      assert.equal(radiusCheck.compatible, true);

      // Incompatible binding: Color variable to transform.width
      const mismatchCheck = compVarManager.validatePropertyCompatibility('transform.width', {
        id: 'tok_3',
        type: 'color',
        value: '#ff0000'
      });
      assert.equal(mismatchCheck.compatible, false, 'Color cannot bind to dimension/width');
      assert.ok(mismatchCheck.reason.includes('Cannot bind variable of type "color" to property "transform.width"'));

      // Incompatible binding: String variable to stroke color
      const stringToColorCheck = compVarManager.validatePropertyCompatibility('style.strokes.0.color', {
        id: 'tok_4',
        type: 'string',
        value: 'Hello'
      });
      assert.equal(stringToColorCheck.compatible, false);
    });

    it('3. Add Variable workflow binds variable, updates concrete value on canvas, and supports undo/redo', () => {
      const { engine, compVarManager } = setupTestEnvironment();
      const page = engine.getActivePage();

      const node = createNode('frame', {
        name: 'Button Container',
        transform: { x: 50, y: 50, width: 200, height: 48 },
        style: {
          fills: [{ type: 'solid', color: '#000000' }],
          cornerRadius: 4
        }
      });
      engine.addNode(node, page.id, 'Add Button Node');

      // Bind primary color variable to fills[0].color
      const bindRes = compVarManager.bindVariable(node.id, 'style.fills.0.color', 'tok_primary_color');
      assert.equal(bindRes.success, true);
      assert.equal(bindRes.appliedValue, '#2563eb');

      // Verify node was updated in document
      let updatedNode = engine.getNode(node.id);
      assert.equal(updatedNode.style.fills[0].color, '#2563eb');
      assert.equal(updatedNode.tokenBindings['style.fills.0.color'], 'tok_primary_color');

      // Bind corner radius
      compVarManager.bindVariable(node.id, 'style.cornerRadius', 'tok_radius_lg');
      updatedNode = engine.getNode(node.id);
      assert.equal(updatedNode.style.cornerRadius, 12);
      assert.equal(updatedNode.tokenBindings['style.cornerRadius'], 'tok_radius_lg');

      // Test Undo
      engine.undo();
      updatedNode = engine.getNode(node.id);
      assert.equal(updatedNode.style.cornerRadius, 4, 'Corner radius should revert on undo');

      // Test Redo
      engine.redo();
      updatedNode = engine.getNode(node.id);
      assert.equal(updatedNode.style.cornerRadius, 12, 'Corner radius should re-apply on redo');
    });

    it('4. Replace Component workflow preserves geometry, variable bindings, and prototype interactions', () => {
      const { engine, compVarManager } = setupTestEnvironment();
      const page = engine.getActivePage();

      // Create an existing button with token binding and interaction
      const sourceButton = createNode('frame', {
        name: 'Legacy Submit Button',
        transform: { x: 300, y: 400, width: 180, height: 44, rotation: 0 },
        style: {
          fills: [{ type: 'solid', color: '#2563eb' }],
          cornerRadius: 8
        },
        tokenBindings: {
          'style.fills.0.color': 'tok_primary_color'
        },
        interactions: [
          { trigger: 'onClick', action: 'navigate', target: 'dashboard_page' }
        ]
      });
      engine.addNode(sourceButton, page.id, 'Add Source Button');

      // Replace with Material UI Button ('mui-button')
      const replaceRes = compVarManager.replaceComponent(sourceButton.id, 'mui-button');
      assert.equal(replaceRes.success, true);
      assert.equal(replaceRes.replacementName, 'Button');

      // Old node replaced
      assert.ok(!engine.getNode(sourceButton.id), 'Old node removed');

      // New node exists
      const newNode = engine.getNode(replaceRes.newNodeId);
      assert.ok(newNode, 'Replacement node should exist');
      assert.equal(newNode.transform.x, 300, 'Preserved X coordinate');
      assert.equal(newNode.transform.y, 400, 'Preserved Y coordinate');
      assert.equal(newNode.transform.width, 180, 'Preserved Width');
      assert.equal(newNode.transform.height, 44, 'Preserved Height');
      assert.equal(newNode.tokenBindings['style.fills.0.color'], 'tok_primary_color', 'Preserved variable binding');
      assert.equal(newNode.interactions[0].target, 'dashboard_page', 'Preserved prototype interaction');

      // Undo atomic replacement
      engine.undo();
      assert.ok(engine.getNode(sourceButton.id), 'Source button restored on undo');
      assert.ok(!engine.getNode(replaceRes.newNodeId), 'Replacement removed on undo');
    });

    it('5. Replace Variable workflow updates bindings cleanly across matching layer properties', () => {
      const { engine, compVarManager } = setupTestEnvironment();
      const page = engine.getActivePage();

      const banner = createNode('frame', {
        name: 'Hero Banner',
        transform: { x: 0, y: 0, width: 800, height: 200 },
        style: {
          fills: [{ type: 'solid', color: '#2563eb' }]
        },
        tokenBindings: {
          'style.fills.0.color': 'tok_primary_color'
        }
      });
      engine.addNode(banner, page.id, 'Add Banner');

      // Replace 'tok_primary_color' with 'tok_secondary_color' (#60a5fa)
      const res = compVarManager.replaceVariable(banner.id, 'tok_primary_color', 'tok_secondary_color');
      assert.equal(res.success, true);
      assert.equal(res.replacedCount, 1);

      const updated = engine.getNode(banner.id);
      assert.equal(updated.tokenBindings['style.fills.0.color'], 'tok_secondary_color');
      assert.equal(updated.style.fills[0].color, '#60a5fa');
    });
  });

  // --- Part B & C: Multi-LLM Engine & Design System Repository Intelligence ---
  describe('Part B & C: Multi-LLM & Design System Repository Intelligence', () => {

    it('6. Repository Indexer scans catalog, tokens, and retrieves relevant context with citations', () => {
      const { registry } = setupTestEnvironment();
      const indexer = new DesignSystemRepositoryIndexer(registry);

      const stats = indexer.buildIndex();
      assert.ok(stats.componentCount >= 30, 'Should index 30+ canonical catalog components');
      assert.ok(stats.tokenCount >= 4, 'Should index design tokens');
      assert.ok(stats.variableCount >= 2, 'Should index variables');

      // Retrieve context for button search
      const result = indexer.retrieveRelevantContext('primary action button with rounded border');
      assert.ok(result.components.length > 0, 'Retrieves relevant button components');
      assert.ok(result.components.some(c => c.name.toLowerCase().includes('button')));
      assert.ok(result.contextPrompt.includes('### Canonical Material UI & Design System Components:'));
      assert.ok(result.citations.length > 0, 'Includes provenance citations');
    });

    it('7. Multi-LLM Providers support required models and configurations', () => {
      // OpenAI Provider models check
      const openai = new OpenAIProvider({ apiKey: 'test-key', model: 'gpt-4o' });
      assert.ok(openai.SUPPORTED_MODELS.includes('gpt-4o'));
      assert.ok(openai.SUPPORTED_MODELS.includes('gpt-4o-mini'));
      assert.ok(openai.SUPPORTED_MODELS.includes('o1'));
      assert.ok(openai.SUPPORTED_MODELS.includes('o3-mini'));
      assert.ok(openai.SUPPORTED_MODELS.includes('gpt-4-turbo'));

      // Gemini Provider models check
      const gemini = new GeminiProvider({ apiKey: 'test-gemini', model: 'gemini-2.5-pro' });
      assert.ok(gemini.SUPPORTED_MODELS.includes('gemini-2.5-pro'));
      assert.ok(gemini.SUPPORTED_MODELS.includes('gemini-2.5-flash'));
      assert.ok(gemini.SUPPORTED_MODELS.includes('gemini-1.5-pro'));
      assert.ok(gemini.SUPPORTED_MODELS.includes('gemini-1.5-flash'));
      assert.ok(gemini.SUPPORTED_MODELS.includes('gemini-2.0-flash'));
    });

    it('8. Dual Reasoning Orchestrator synthesizes proposals from OpenAI and Gemini', async () => {
      const orchestrator = new DualReasoningOrchestrator();

      // Mock plans from provider 1 (OpenAI) and provider 2 (Gemini)
      const mockOpenAiPlan = {
        title: 'Executive Treasury Dashboard (OpenAI)',
        summary: 'Clean modern grid layout',
        screens: [
          {
            name: 'Treasury Overview',
            dimensions: { width: 1440, height: 900 },
            components: [
              { name: 'App Shell', type: 'frame' },
              { name: 'Summary Metrics Row', type: 'frame' },
              { name: 'Transactions Table', type: 'frame' }
            ]
          }
        ],
        designTokens: ['Brand / Primary', 'Background / Surface'],
        operations: [
          { type: 'create_frame', params: { name: 'Treasury Overview', width: 1440, height: 900 } }
        ]
      };

      const mockGeminiPlan = {
        title: 'Executive Treasury Dashboard (Gemini)',
        summary: 'Accessible, token-driven executive analytics overview',
        screens: [
          {
            name: 'Treasury Overview',
            dimensions: { width: 1440, height: 900 },
            components: [
              { name: 'App Shell', type: 'frame' },
              { name: 'Summary Metrics Row', type: 'frame' },
              { name: 'Audit Log Feed', type: 'frame' }
            ]
          }
        ],
        designTokens: ['Brand / Primary', 'Status / Success', 'Border / Subtle'],
        operations: [
          { type: 'create_frame', params: { name: 'Treasury Overview', width: 1440, height: 900 } }
        ]
      };

      const consolidated = orchestrator.synthesizeDualPlans(mockOpenAiPlan, mockGeminiPlan);
      assert.equal(consolidated.title, 'Executive Treasury Dashboard (OpenAI)');
      assert.ok(consolidated.dualReasoningSummary.structuralMatch >= 0.8, 'Structural similarity high');
      assert.ok(consolidated.dualReasoningSummary.sharedComponentSelections.includes('App Shell'));
      assert.ok(consolidated.dualReasoningSummary.sharedTokens.includes('Brand / Primary'));
      assert.ok(consolidated.dualReasoningSummary.synthesisRationale.includes('Harmonized visual structure'));
    });

    it('9. AIService supports Automatic and Dual Reasoning provider modes', () => {
      const { registry } = setupTestEnvironment();
      const service = new DesignForgeAIService();
      service.setRegistry(registry);

      assert.ok(service.activeProviderName);

      service.setProvider(PROVIDERS.OPENAI);
      assert.equal(service.activeProviderName, PROVIDERS.OPENAI);

      service.setProvider(PROVIDERS.GEMINI);
      assert.equal(service.activeProviderName, PROVIDERS.GEMINI);

      service.setProvider(PROVIDERS.DUAL);
      assert.equal(service.activeProviderName, PROVIDERS.DUAL);

      service.setProvider(PROVIDERS.AUTO);
      assert.equal(service.activeProviderName, PROVIDERS.AUTO);
    });
  });

  // --- Part D: Markdown Specification Pipeline ---
  describe('Part D: Markdown Specification to Design Pipeline', () => {

    it('10. Parses full markdown design specification into structured sections and plans', () => {
      const sampleMarkdown = `
# Project Specification: Cloud Security Analytics Console

## Objective
Provide cloud security engineers with real-time detection, posture scoring, and threat response capabilities.

## Target Users
- Security Operations Center (SOC) Analysts
- Cloud Infrastructure Leads

## Scope
- Overview Posture Dashboard
- Active Threat Alerts Table
- Remediations Drawer

## Required Screens and Sections
1. Posture Overview Screen (1440x900)
   - Header with Global Search and Tenant Switcher
   - Security Posture Gauge Score
   - High Severity Incident Grid
2. Incident Detail Modal (640x720)

## Constraints & System Rules
- Must use Material UI Dark Palette
- Primary Action button color: #3b82f6
- Border radius: 8px

## Responsive Breakpoints
- Desktop: 1440px
- Tablet: 768px
- Mobile: 375px
      `;

      const parsed = parseMarkdownDesignSpec(sampleMarkdown);
      assert.equal(parsed.title, 'Project Specification: Cloud Security Analytics Console');
      assert.ok(parsed.objective.includes('Provide cloud security engineers'));
      assert.equal(parsed.targetUsers.length, 2);
      assert.equal(parsed.screens.length, 2);
      assert.equal(parsed.screens[0].name, 'Posture Overview Screen');
      assert.equal(parsed.screens[0].width, 1440);
      assert.equal(parsed.screens[0].height, 900);
      assert.ok(parsed.constraints.some(c => c.includes('Material UI')));
      assert.equal(parsed.breakpoints.desktop, 1440);
      assert.equal(parsed.breakpoints.tablet, 768);
      assert.equal(parsed.breakpoints.mobile, 375);
    });
  });
});
