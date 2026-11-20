/**
 * Test Suite: DF-UX Intelligence & Desktop Menu Bar Actions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Top Desktop Menu Bar & Actions Completeness', () => {
  it('verifies all required menu IDs are defined in index.html', () => {
    const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');

    const expectedMenuIds = [
      // File
      'menuNewProject', 'menuOpenProject', 'menuImportDesign', 'menuSaveProject', 'menuExportReact', 'menuExportSvg', 'menuExportPng',
      // Edit
      'menuUndo', 'menuRedo', 'menuCut', 'menuCopy', 'menuPaste', 'menuDuplicate', 'menuDelete', 'menuSelectAll', 'menuBulkRename', 'menuMissingFonts',
      // View
      'menuZoomIn', 'menuZoomOut', 'menuZoomFit', 'menuZoom100', 'menuToggleGrid', 'menuToggleRulers', 'menuOutlineView', 'menuPixelGrid', 'menuOpenDfuxWorkspace',
      // Object
      'menuGroup', 'menuUngroup', 'menuBooleanUnion', 'menuBooleanSubtract', 'menuBooleanIntersect', 'menuBooleanExclude', 'menuBringForward', 'menuSendBackward', 'menuBringToFront', 'menuSendToBack',
      // Arrange
      'menuAlignLeft', 'menuAlignCenter', 'menuAlignRight', 'menuAlignTop', 'menuAlignMiddle', 'menuAlignBottom', 'menuDistributeH', 'menuDistributeV',
      // Components
      'menuCreateComponent', 'menuDetachInstance', 'menuResetOverrides', 'menuAddAutoLayout', 'menuRemoveAutoLayout',
      // MCP
      'menuOpenMcpHub', 'menuMcpTools', 'menuMcpPermissions', 'menuMcpWorkflow',
      // Help
      'menuOpenLearn', 'menuStartTour', 'menuShortcuts', 'menuAudit'
    ];

    for (const menuId of expectedMenuIds) {
      assert.ok(html.includes(`id="${menuId}"`), `Missing menu ID in index.html: ${menuId}`);
    }
  });

  it('verifies all menu actions are wired to handlers in app.js', () => {
    const appJs = fs.readFileSync(path.join(rootDir, 'src', 'app.js'), 'utf-8');

    const expectedWiredIds = [
      'menuNewProject', 'menuOpenProject', 'menuImportDesign', 'menuSaveProject', 'menuExportReact', 'menuExportSvg', 'menuExportPng',
      'menuUndo', 'menuRedo', 'menuCut', 'menuCopy', 'menuPaste', 'menuDuplicate', 'menuDelete', 'menuSelectAll', 'menuBulkRename', 'menuMissingFonts',
      'menuZoomIn', 'menuZoomOut', 'menuZoomFit', 'menuZoom100', 'menuToggleGrid', 'menuToggleRulers', 'menuOutlineView', 'menuPixelGrid', 'menuOpenDfuxWorkspace',
      'menuGroup', 'menuUngroup', 'menuBooleanUnion', 'menuBooleanSubtract', 'menuBooleanIntersect', 'menuBooleanExclude', 'menuBringForward', 'menuSendBackward', 'menuBringToFront', 'menuSendToBack',
      'menuAlignLeft', 'menuAlignCenter', 'menuAlignRight', 'menuAlignTop', 'menuAlignMiddle', 'menuAlignBottom', 'menuDistributeH', 'menuDistributeV',
      'menuCreateComponent', 'menuDetachInstance', 'menuResetOverrides', 'menuAddAutoLayout', 'menuRemoveAutoLayout',
      'menuOpenMcpHub', 'menuMcpTools', 'menuMcpPermissions', 'menuMcpWorkflow',
      'menuOpenLearn', 'menuStartTour', 'menuShortcuts', 'menuAudit'
    ];

    for (const id of expectedWiredIds) {
      assert.ok(appJs.includes(`'${id}'`) || appJs.includes(`"${id}"`), `Menu ID not wired in app.js: ${id}`);
    }
  });
});

describe('DF-UX Intelligence Workspace & Backend Integration', () => {
  it('connects to DF-UX Intelligence health check via proxy (port 3001 -> 8000)', async () => {
    const data = await new Promise((resolve, reject) => {
      const req = http.get('http://127.0.0.1:3001/api/v1/health', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
        });
      });
      req.on('error', reject);
    });

    assert.strictEqual(data.status, 'healthy');
    assert.strictEqual(data.service, 'dfux-intelligence-backend');
  });

  it('queries DF-UX Intelligence models fleet via proxy', async () => {
    const models = await new Promise((resolve, reject) => {
      const req = http.get('http://127.0.0.1:3001/api/v1/models', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
        });
      });
      req.on('error', reject);
    });

    assert.ok(Array.isArray(models));
    assert.ok(models.length >= 5);
    const synth = models.find(m => m.id === 'mock-synth-v1');
    assert.ok(synth);
    assert.strictEqual(synth.status, 'connected');
  });

  it('generates structured DFIR document via /api/v1/generate/dfir', async () => {
    const resData = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({ prompt: 'Fintech Mission Control Dashboard', intent: 'create' });
      const req = http.request('http://127.0.0.1:3001/api/v1/generate/dfir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    assert.strictEqual(resData.success, true);
    assert.ok(resData.dfir);
    assert.ok(resData.dfir.root);
    assert.strictEqual(resData.validation.valid, true);
  });

  it('queries benchmark metrics via /api/v1/benchmarks', async () => {
    const benchmarks = await new Promise((resolve, reject) => {
      const req = http.get('http://127.0.0.1:3001/api/v1/benchmarks', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
        });
      });
      req.on('error', reject);
    });

    assert.ok(benchmarks.summary_metrics);
    assert.strictEqual(benchmarks.summary_metrics.dfir_validity_pct, 100.0);
    assert.ok(benchmarks.summary_metrics.component_resolution_pct >= 98.0);
  });
});
