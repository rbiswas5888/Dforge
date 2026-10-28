import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInitialDocument } from '../src/engine/document.js';
import { CommandEngine } from '../src/engine/commands.js';
import { DesignForgeAIService } from '../src/ai/service.js';
import { StorageEngine } from '../src/engine/storage.js';
import { WorkspaceStore } from '../src/engine/workspace_store.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const values = new Map();
globalThis.localStorage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); }
};

const store = new WorkspaceStore();
const firstDocument = createInitialDocument('Portfolio');
const firstProject = store.createProject(firstDocument);
assert.equal(store.getProjects().length, 1);
assert.equal(store.getActiveProjectId(), firstProject.id);

const secondDocument = createInitialDocument('Mobile Banking');
const secondProject = store.createProject(secondDocument);
assert.equal(store.getProjects().length, 2);
assert.equal(store.loadProject(firstProject.id).name, 'Portfolio');
assert.equal(store.getActiveProjectId(), firstProject.id);
store.saveProject({ ...firstDocument, name: 'Portfolio v2' }, firstProject.id);
assert.equal(store.loadProject(firstProject.id).name, 'Portfolio v2');
assert.equal(store.getProjects().find(project => project.id === firstProject.id).name, 'Portfolio v2');
assert.equal(store.loadProject(secondProject.id).name, 'Mobile Banking');

const profile = store.saveProfile({ name: 'Jordan Lee', email: 'jordan@example.com', role: 'UX Lead', handle: '@jordan' });
assert.equal(store.getActiveProfile().id, profile.id);
const otherProfile = store.saveProfile({ name: 'Sam Kim', role: 'UX Designer' });
store.setActiveProfile(profile.id);
assert.equal(store.getActiveProfile().name, 'Jordan Lee');
assert.equal(store.getProfiles().length, 2);
assert.equal(otherProfile.handle, '');

store.saveNotifications({ ...store.getNotifications(), comments: false });
assert.equal(store.getNotifications().comments, false);
store.addReactLibrary({ name: '@sample/design', version: '1.2.0', sourceFileCount: 2, tokenCount: 4, componentCount: 1 });
assert.equal(store.getReactLibraries()[0].name, '@sample/design');
store.removeReactLibrary('@sample/design');
assert.equal(store.getReactLibraries().length, 0);

assert.throws(() => store.loadProject('missing-project'), /no saved local document/);
assert.throws(() => store.saveProfile({ name: ' ' }), /profile name/);

const storage = new StorageEngine();
storage.setWorkspaceStore(store);
const autosavedDocument = createInitialDocument('Autosaved workspace project');
storage.scheduleAutosave(autosavedDocument, 1);
await new Promise(resolve => setTimeout(resolve, 25));
assert.equal(store.loadProject(store.getActiveProjectId()).name, 'Autosaved workspace project');
assert.equal(storage.flushAutosave(autosavedDocument), true);

const aiDocument = createInitialDocument('AI settings test');
const aiService = new DesignForgeAIService(aiDocument, new CommandEngine(aiDocument));
aiService.configureProvider('openai', { apiKey: 'test-key', model: 'gpt-4.1' });
assert.equal(values.get('designforge_api_key_openai'), 'test-key');
assert.equal(values.get('designforge_model_openai'), 'gpt-4.1');
const reloadedAiService = new DesignForgeAIService(aiDocument, new CommandEngine(aiDocument));
assert.equal(reloadedAiService.getProvider('openai').apiKey, 'test-key');
assert.equal(reloadedAiService.getProvider('openai').model, 'gpt-4.1');
aiService.clearProviderApiKey('openai');
assert.equal(values.has('designforge_api_key_openai'), false);
assert.equal(aiService.getProvider('openai').apiKey, '');
aiService.configureProvider('gemini', { apiKey: 'temporary-key' }, { persist: false });
assert.equal(values.has('designforge_api_key_gemini'), false);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
assert.match(html, /id="brandLogoBtn"/);
assert.match(html, /id="workspaceDashboard"/);
assert.match(html, /id="workspaceSettings"/);
assert.match(html, /data-settings-tab="organization">[\s\S]*?Organization/);
assert.match(app, /openWorkspaceProject\(projectButton\.dataset\.openProject\)/);
assert.match(app, /async importWorkspaceReactLibrary\(files\)/);
assert.match(app, /never executed/);

console.log('✓ Workspace project persistence, profiles, preferences, library metadata, and UI wiring verified.');
