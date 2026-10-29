import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInitialDocument } from '../src/engine/document.js';
import { WorkspaceStore, VALID_PROJECT_ROLES } from '../src/engine/workspace_store.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log('⚡ Starting Figma-Inspired Workspace & Navigation Spec Test Suite...');

// Mock localStorage
const values = new Map();
globalThis.localStorage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); },
  clear() { values.clear(); }
};

const store = new WorkspaceStore();

// 1. Level 1 & 2: Project Creation and Metadata
console.log('\n1. Testing Project Creation & Ownership (Level 2)...');
const projectA = store.createProject({
  name: 'FinTech Banking',
  description: 'Next-gen enterprise banking experience'
});

assert.ok(projectA.id, 'Project has a valid ID');
assert.equal(projectA.name, 'FinTech Banking');
assert.equal(projectA.description, 'Next-gen enterprise banking experience');
assert.equal(store.getProjects().length, 1);
assert.equal(store.getActiveProjectId(), projectA.id);

// Initial creator is assigned as Project Lead
assert.equal(projectA.members.length, 1);
assert.equal(projectA.members[0].role, 'Project Lead');
console.log('   ✓ Project created and initial creator assigned as Project Lead.');

// 2. Level 3: Multiple Design Files inside a Project
console.log('\n2. Testing Design Files within a Project (Level 3)...');
const doc1 = createInitialDocument('Transactions Flow');
const file1 = store.createDesignFile(projectA.id, doc1);
assert.equal(file1.projectId, projectA.id);
assert.equal(file1.name, 'Transactions Flow');

const doc2 = createInitialDocument('Accounts Overview');
const file2 = store.createDesignFile(projectA.id, doc2);
assert.equal(file2.projectId, projectA.id);

const filesInA = store.getDesignFiles(projectA.id);
assert.equal(filesInA.length, 2, 'Project contains 2 design files');
assert.equal(store.getProject(projectA.id).fileCount, 2);

// Load each design file independently
const loadedDoc1 = store.loadDesignFile(file1.id);
assert.equal(loadedDoc1.name, 'Transactions Flow');
const loadedDoc2 = store.loadDesignFile(file2.id);
assert.equal(loadedDoc2.name, 'Accounts Overview');

// Mutate file1 and verify persistence
doc1.name = 'Transactions Flow v2';
store.saveDesignFile(file1.id, doc1);
assert.equal(store.loadDesignFile(file1.id).name, 'Transactions Flow v2');
console.log('   ✓ Multiple design files created, isolated, and persisted in project.');

// 3. Recently Opened Design Files across Projects
console.log('\n3. Testing Recently Opened Design Files (Level 1)...');
const projectB = store.createProject({ name: 'Design Tokens Library' });
const doc3 = createInitialDocument('Color Styles');
const file3 = store.createDesignFile(projectB.id, doc3);

const recentFiles = store.getRecentFiles();
assert.ok(recentFiles.length >= 3, 'Recent files lists documents across projects');
assert.equal(recentFiles[0].id, file3.id);
assert.equal(recentFiles[0].projectName, 'Design Tokens Library');
console.log('   ✓ Recently opened correctly aggregates design files with containing project info.');

// 4. Level 4: Project Settings & Member Management
console.log('\n4. Testing Project Settings & Member Management (Level 4)...');
// Add member to Project A
const memberAlex = store.addProjectMember(projectA.id, {
  userId: 'user_alex',
  name: 'Alex Morgan',
  email: 'alex@example.com',
  role: 'Designer'
});
assert.equal(memberAlex.role, 'Designer');
assert.equal(store.getProjectMembers(projectA.id).length, 2);

// Duplicate user prevention
assert.throws(() => {
  store.addProjectMember(projectA.id, {
    userId: 'user_alex',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    role: 'Designer'
  });
}, /already a member/);

// Update member role
store.updateProjectMemberRole(projectA.id, 'user_alex', 'Viewer');
assert.equal(store.getProjectMembers(projectA.id).find(m => m.userId === 'user_alex').role, 'Viewer');
console.log('   ✓ Project member addition, duplicate prevention, and role updates verified.');

// 5. Last-Lead Protection Invariant
console.log('\n5. Testing Last-Lead Protection Invariant...');
const lead = store.getProjectMembers(projectA.id).find(m => m.role === 'Project Lead');
assert.ok(lead, 'Lead exists');

// Attempting to demote the sole Project Lead must throw
assert.throws(() => {
  store.updateProjectMemberRole(projectA.id, lead.userId, 'Designer');
}, /Cannot remove or demote the last Project Lead/);

// Attempting to remove the sole Project Lead must throw
assert.throws(() => {
  store.removeProjectMember(projectA.id, lead.userId);
}, /Cannot remove the last Project Lead/);

// Promoting another member to Project Lead allows former lead removal
store.updateProjectMemberRole(projectA.id, 'user_alex', 'Project Lead');
assert.equal(store.getProjectMembers(projectA.id).filter(m => m.role === 'Project Lead').length, 2);

// Now the original lead can be safely demoted or removed
store.removeProjectMember(projectA.id, lead.userId);
assert.equal(store.getProjectMembers(projectA.id).filter(m => m.role === 'Project Lead').length, 1);
assert.equal(store.getProjectMembers(projectA.id)[0].userId, 'user_alex');
console.log('   ✓ Last-Lead protection invariant rigorously enforced.');

// 6. Project Deletion Safety (Prevent Accidental File Loss)
console.log('\n6. Testing Project Deletion Safety...');
// Project A has files; deletion must be blocked
assert.throws(() => {
  store.deleteProject(projectA.id);
}, /Cannot delete a project that contains design files/);

// Delete files first
store.deleteDesignFile(file1.id);
store.deleteDesignFile(file2.id);
assert.equal(store.getDesignFiles(projectA.id).length, 0);

// Now project can be deleted safely
assert.equal(store.deleteProject(projectA.id), true);
assert.equal(store.getProject(projectA.id), null);
console.log('   ✓ Deletion guard protects projects containing files from accidental loss.');

// 7. HTML and UI Wiring Verification
console.log('\n7. Testing Workspace HTML & UI Component Wiring...');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');

// Persistent top-level destinations (Level 1)
assert.match(html, /id="workspaceRailSettings"/, 'Global Settings destination in sidebar');
assert.match(html, /id="workspaceRailOrganization"/, 'Global Organization destination in sidebar');

// Screen hierarchy containers
assert.match(html, /id="workspaceProjectsView"/, 'Level 2 Projects List container');
assert.match(html, /id="workspaceProjectDetailView"/, 'Level 3 Project Detail container');
assert.match(html, /id="workspaceProjectSettingsView"/, 'Level 4 Project Settings container');
assert.match(html, /id="workspaceRecentFilesView"/, 'Level 1 Recently Opened container');

// Navigation affordances in editor
assert.match(html, /id="btnTopbarProjectCrumb"/, 'Topbar project crumb return affordance');
assert.match(html, /id="btnQuickFileSwitcher"/, 'Quick file switcher trigger');
assert.match(html, /id="workspaceFileSwitcherModal"/, 'Quick file switcher modal');
assert.match(html, /id="workspaceNewFileModal"/, 'New design file modal');

// App controller handlers
assert.match(app, /openProjectDetail\(/, 'openProjectDetail handler');
assert.match(app, /openProjectSettings\(/, 'openProjectSettings handler');
assert.match(app, /openWorkspaceFile\(/, 'openWorkspaceFile handler');
assert.match(app, /openQuickFileSwitcher\(/, 'openQuickFileSwitcher handler');
assert.match(app, /handleProjectMemberRoleChange\(/, 'handleProjectMemberRoleChange handler');
assert.match(app, /handleRemoveProjectMember\(/, 'handleRemoveProjectMember handler');

console.log('   ✓ All HTML elements, persistent global destinations, and app handlers verified.');

// 8. Landing Navigation Rule Verification
console.log('\n8. Testing Initial Landing Navigation Rule...');
// Default state (or closed while on workspace): user always lands on workspace
globalThis.localStorage.clear();
assert.equal(store.getLastActiveView(), 'workspace', 'Default landing view is workspace');

// When user closes/leaves while viewing/editing a design file
store.setLastActiveView('editor');
assert.equal(store.getLastActiveView(), 'editor', 'Directly lands on design file if closed while in editor');

// When user returns to workspace and closes
store.setLastActiveView('workspace');
assert.equal(store.getLastActiveView(), 'workspace', 'Lands on workspace if left while on workspace');

// Verify app startup logic respects this invariant
assert.match(app, /lastActiveView === 'editor'/, 'App checks if previous session was in editor');
assert.match(app, /this\.showWorkspaceView\('editor'\)/, 'App switches to editor if last view was editor');
assert.match(app, /this\.showWorkspaceView\('projects'\)/, 'App lands on workspace by default');
console.log('   ✓ Landing rule verified: user always lands on workspace unless application was closed with design file open.');

console.log('\n🎉 ALL FIGMA-INSPIRED WORKSPACE SPEC CHECKS PASSED (100% SPEC COMPLIANCE)!');


