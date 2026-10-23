/**
 * DesignForge AI - React Project Packager
 * Generates package.json, vite.config, tsconfig, index.html, App entrypoint, and export manifest
 */

export class ProjectPackager {
  constructor(document, options = {}) {
    this.doc = document;
    this.target = options.target || 'react-vite-ts';
    this.typescript = options.typescript !== false;
  }

  generatePackageJson() {
    const pkgName = this.toSlug(this.doc.name || 'designforge-project');
    return JSON.stringify({
      name: pkgName,
      private: true,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: this.typescript ? 'tsc && vite build' : 'vite build',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        'lucide-react': '^0.450.0'
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.3.1',
        vite: '^5.4.2',
        ...(this.typescript ? {
          '@types/react': '^18.3.5',
          '@types/react-dom': '^18.3.0',
          typescript: '^5.5.3'
        } : {})
      }
    }, null, 2);
  }

  generateViteConfig() {
    const ext = this.typescript ? 'ts' : 'js';
    return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
});
`;
  }

  generateTsConfig() {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true
      },
      include: ['src']
    }, null, 2);
  }

  generateIndexHtml() {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.escapeHtml(this.doc.name)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${this.typescript ? 'tsx' : 'jsx'}"></script>
  </body>
</html>
`;
  }

  generateMainEntry() {
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './tokens/tokens.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
  }

  generateApp(components) {
    const imports = components.map(c => `import { ${c.name} } from './components/${c.name}';`).join('\n');
    const sections = components.map(c => `        <section key="${c.name}" style={{ display: 'flex', justifyContent: 'center' }}>\n          <${c.name} />\n        </section>`).join('\n');

    return `import React from 'react';
${imports}

export function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '32px 20px', boxSizing: 'border-box' }}>
      <header style={{ maxWidth: '1200px', margin: '0 auto 32px auto', borderBottom: '1px solid #1e293b', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#38bdf8' }}>
          ${this.escapeJsx(this.doc.name)}
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
          Compiled with DesignForge AI Deterministic React Compiler
        </p>
      </header>
      <main style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
${sections}
      </main>
    </div>
  );
}

export default App;
`;
  }

  generateManifest(summary) {
    return JSON.stringify({
      generator: 'DesignForge AI React Compiler',
      schemaVersion: this.doc.schemaVersion,
      documentId: this.doc.id,
      documentName: this.doc.name,
      exportedAt: new Date().toISOString(),
      target: this.target,
      typescript: this.typescript,
      summary
    }, null, 2);
  }

  generateReadme() {
    return `# ${this.doc.name}

> Production React application compiled deterministically from **DesignForge AI** on ${new Date().toLocaleDateString()}.

This application has **zero runtime dependencies** on DesignForge AI. It is an independent, idiomatic React 18 project with TypeScript and Vite.

## Quick Start

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start the local Vite development server:
\`\`\`bash
npm run dev
\`\`\`

3. Build for production:
\`\`\`bash
npm run build
\`\`\`

4. Preview production build:
\`\`\`bash
npm run preview
\`\`\`

## Project Architecture

\`\`\`text
src/
├── components/          # Reusable React components compiled from design frames
├── tokens/
│   ├── tokens.css      # CSS Custom Properties (:root design variables)
│   └── tokens.ts       # Type-safe token constants
├── assets/             # SVG, icons, and asset manifest
├── App.tsx             # Root layout and route composition
└── main.tsx            # Application entrypoint
\`\`\`

## Design Tokens

All colors, spacing, and corner radii are bound to CSS variables defined in \`src/tokens/tokens.css\`. You can edit token values there to propagate global theme changes instantly.
`;
  }

  toSlug(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'designforge-project';
  }

  escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  escapeJsx(str) {
    return String(str).replace(/([{}])/g, '{\'$1\'}');
  }
}
