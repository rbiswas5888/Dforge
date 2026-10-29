import assert from 'node:assert/strict';
import { WorkspaceStore } from '../src/engine/workspace_store.js';
import { AuthService, DEMO_ACCOUNTS } from '../src/engine/auth_service.js';

console.log('⚡ Starting DesignForge AI Authentication & Session Test Suite...');

const values = new Map();
globalThis.localStorage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); },
  clear() { values.clear(); }
};

const store = new WorkspaceStore();
const auth = new AuthService(store);

// 1. Initial State (Unauthenticated)
console.log('\n1. Testing Initial Unauthenticated State...');
assert.equal(auth.isAuthenticated(), false, 'Initially not authenticated');
assert.equal(auth.getCurrentUser(), null, 'No current user');
console.log('   ✓ Initial unauthenticated state verified.');

// 2. Form Validation: Empty & Invalid Inputs
console.log('\n2. Testing Form Validations (Empty & Invalid)...');
await assert.rejects(
  async () => auth.login('', ''),
  /enter your email or username/,
  'Rejects empty email'
);

await assert.rejects(
  async () => auth.login('not-an-email', 'somepassword'),
  /valid email address/,
  'Rejects invalid email format'
);

await assert.rejects(
  async () => auth.login('designer@designforge.ai', ''),
  /enter your password/,
  'Rejects empty password'
);

await assert.rejects(
  async () => auth.login('designer@designforge.ai', 'WrongPassword123!'),
  /Incorrect email, username, or password/,
  'Rejects incorrect password'
);
console.log('   ✓ Required field validations and invalid credentials rejected.');

// 3. Successful Authentication with Demo Account (Jordan Lee)
console.log('\n3. Testing Valid Credentials Authentication...');
const session = await auth.login('designer@designforge.ai', 'DesignForge2026!', true);
assert.ok(session.token, 'Session contains auth token');
assert.equal(session.user.name, 'Jordan Lee');
assert.equal(session.user.role, 'UX Lead');
assert.equal(session.rememberMe, true);
assert.equal(auth.isAuthenticated(), true, 'Now authenticated');
assert.equal(auth.getCurrentUser().email, 'designer@designforge.ai');
console.log('   ✓ Valid login with Jordan Lee (UX Lead) succeeded and session persisted.');

// 4. Session Persistence and Sign-Out
console.log('\n4. Testing Session Persistence & Logout...');
assert.equal(store.isAuthenticated(), true);
auth.logout();
assert.equal(auth.isAuthenticated(), false);
assert.equal(auth.getCurrentUser(), null);
assert.equal(store.getAuthSession(), null);
console.log('   ✓ Sign-out cleanly clears token, session, and authenticated status.');

// 5. Alternate Account (Alex Morgan) and Username Login
console.log('\n5. Testing Username Sign-In & Alternate Account (Alex Morgan)...');
const sessionAlex = await auth.login('alex_m', 'DesignForge2026!', false);
assert.equal(sessionAlex.user.name, 'Alex Morgan');
assert.equal(sessionAlex.user.role, 'Senior UX Designer');
assert.equal(sessionAlex.rememberMe, false);
assert.equal(auth.isAuthenticated(), true);
auth.logout();
console.log('   ✓ Username login and alternate account verified.');

// 6. Enterprise Single Sign-On (Google, GitHub, SAML)
console.log('\n6. Testing Enterprise SSO Sign-In...');
const ssoGoogle = await auth.loginWithSso('google');
assert.ok(ssoGoogle.token.startsWith('df_sso_google'));
assert.equal(auth.isAuthenticated(), true);
auth.logout();

const ssoGithub = await auth.loginWithSso('github');
assert.ok(ssoGithub.token.startsWith('df_sso_github'));
auth.logout();

const ssoSaml = await auth.loginWithSso('saml');
assert.ok(ssoSaml.token.startsWith('df_sso_saml'));
auth.logout();
console.log('   ✓ Google, GitHub, and Okta SAML enterprise SSO flows verified.');

// 7. Password Reset & Recovery Flow
console.log('\n7. Testing Password Recovery Flow...');
await assert.rejects(
  async () => auth.requestPasswordReset(''),
  /enter your email address/,
  'Rejects empty recovery email'
);

await assert.rejects(
  async () => auth.requestPasswordReset('invalid-format'),
  /valid email address/,
  'Rejects invalid recovery email'
);

const resetRes = await auth.requestPasswordReset('designer@designforge.ai');
assert.equal(resetRes.success, true);
assert.match(resetRes.message, /instructions have been sent to designer@designforge.ai/);
console.log('   ✓ Password recovery validation and instructions receipt verified.');

console.log('\n🎉 ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY (100% SUCCESS)!');

