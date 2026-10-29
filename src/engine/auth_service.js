/**
 * DesignForge AI - Authentication & Session Service
 * Provides robust credentials authentication, SSO simulation, session persistence,
 * validation, rate limiting, and password recovery.
 */

export const DEMO_ACCOUNTS = [
  {
    id: 'user_jordan',
    email: 'designer@designforge.ai',
    username: 'jordan_lee',
    password: 'DesignForge2026!',
    name: 'Jordan Lee',
    role: 'UX Lead',
    handle: '@jordan',
    avatar: 'JL',
    organization: 'DesignForge Core Design Team'
  },
  {
    id: 'user_alex',
    email: 'alex@designforge.ai',
    username: 'alex_m',
    password: 'DesignForge2026!',
    name: 'Alex Morgan',
    role: 'Senior UX Designer',
    handle: '@alexm',
    avatar: 'AM',
    organization: 'DesignForge Core Design Team'
  },
  {
    id: 'user_sam',
    email: 'sam@designforge.ai',
    username: 'sam_kim',
    password: 'DesignForge2026!',
    name: 'Sam Kim',
    role: 'Product UX Designer',
    handle: '@samk',
    avatar: 'SK',
    organization: 'DesignForge Design Systems'
  }
];

export class AuthService {
  constructor(workspaceStore) {
    this.workspaceStore = workspaceStore;
    this.failedAttempts = new Map();
  }

  validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const trimmed = email.trim();
    // Allow demo username or standard email format
    if (trimmed === 'jordan_lee' || trimmed === 'alex_m' || trimmed === 'sam_kim') return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }

  async login(emailOrUsername, password, rememberMe = false) {
    // Artificial latency for authentic UI loading spinner
    await new Promise(r => setTimeout(r, 200));

    const identifier = String(emailOrUsername || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    // 1. Validation checks
    if (!identifier) {
      throw new Error('Please enter your email or username.');
    }
    if (!this.validateEmail(identifier)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!cleanPassword) {
      throw new Error('Please enter your password.');
    }

    // 2. Rate limiting check
    const attempts = this.failedAttempts.get(identifier) || 0;
    if (attempts >= 5) {
      throw new Error('Too many failed sign-in attempts. Please try again in 1 minute.');
    }

    // 3. Credential matching against demo & registered accounts
    const account = DEMO_ACCOUNTS.find(
      acc => acc.email.toLowerCase() === identifier || acc.username.toLowerCase() === identifier
    );

    if (!account || account.password !== cleanPassword) {
      this.failedAttempts.set(identifier, attempts + 1);
      throw new Error('Incorrect email, username, or password.');
    }

    // Clear failed attempts on success
    this.failedAttempts.delete(identifier);

    // 4. Create persistent session
    const sessionDurationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
    const session = {
      token: `df_tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      user: {
        id: account.id,
        email: account.email,
        name: account.name,
        role: account.role,
        handle: account.handle,
        avatar: account.avatar,
        organization: account.organization
      },
      rememberMe: Boolean(rememberMe),
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + sessionDurationMs
    };

    if (this.workspaceStore) {
      this.workspaceStore.saveAuthSession(session);
    }
    return session;
  }

  async loginWithSso(provider = 'google') {
    await new Promise(r => setTimeout(r, 250));
    const validProviders = ['google', 'github', 'saml'];
    if (!validProviders.includes(provider)) {
      throw new Error(`Unsupported SSO provider: ${provider}`);
    }

    const providerNames = {
      google: 'Google Workspace',
      github: 'GitHub Enterprise',
      saml: 'Okta SAML'
    };

    const session = {
      token: `df_sso_${provider}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      user: {
        id: `user_sso_${provider}`,
        email: `designer@${provider === 'github' ? 'github-enterprise.com' : 'designforge.ai'}`,
        name: `Jordan Lee (${providerNames[provider]})`,
        role: 'UX Lead',
        handle: `@jordan_${provider}`,
        avatar: 'JL',
        organization: 'DesignForge Enterprise'
      },
      provider,
      rememberMe: true,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    };

    if (this.workspaceStore) {
      this.workspaceStore.saveAuthSession(session);
    }
    return session;
  }

  async requestPasswordReset(email) {
    await new Promise(r => setTimeout(r, 150));
    const trimmed = String(email || '').trim().toLowerCase();
    if (!trimmed) {
      throw new Error('Please enter your email address to receive reset instructions.');
    }
    if (!this.validateEmail(trimmed)) {
      throw new Error('Please enter a valid email address.');
    }

    return {
      success: true,
      email: trimmed,
      message: `Password reset instructions have been sent to ${trimmed}.`
    };
  }

  logout() {
    if (this.workspaceStore) {
      this.workspaceStore.clearAuthSession();
      // On sign-out, ensure next landing returns to login/workspace cleanly
      this.workspaceStore.setLastActiveView('workspace');
    }
    return true;
  }

  getCurrentUser() {
    const session = this.workspaceStore?.getAuthSession();
    return session?.user || null;
  }

  isAuthenticated() {
    return Boolean(this.workspaceStore?.isAuthenticated());
  }
}

