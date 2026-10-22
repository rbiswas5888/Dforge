/**
 * DesignForge AI - Master Deterministic React Compiler
 * Orchestrates pre-flight validation, token emission, JSX/TSX generation, packager, and live sandbox
 */

import { CompilerValidator } from './validator.js';
import { TokenCompiler } from './tokens.js';
import { LayoutTransformer } from './layout.js';
import { JsxGenerator } from './jsx.js';
import { InteractionCompiler } from './interactions.js';
import { AssetCompiler } from './assets.js';
import { ProjectPackager } from './packager.js';
import { CompilerDiagnostics } from './diagnostics.js';

export class DesignForgeReactCompiler {
  constructor(document, options = {}) {
    this.doc = document;
    this.options = {
      target: 'react-vite-ts', // 'react-vite-ts' | 'react-vite-js' | 'react-cssmodules' | 'react-tailwind'
      typescript: true,
      ...options
    };
  }

  /**
   * Compiles the entire project into a complete, runnable file tree
   */
  compile() {
    // 1. Pre-flight Document Validation
    const validator = new CompilerValidator(this.doc);
    const validation = validator.validate();
    if (!validation.valid) {
      return {
        success: false,
        fileTree: {},
        errors: validation.errors,
        warnings: validation.warnings,
        diagnostics: null
      };
    }

    const fileTree = {};
    const page = this.doc.pages[0];

    // 2. Compile Design Tokens
    const tokenCompiler = new TokenCompiler(this.doc.tokens);
    const { css: tokensCss, tokenMap } = tokenCompiler.compileCss();
    fileTree['src/tokens/tokens.css'] = tokensCss;
    if (this.options.typescript) {
      fileTree['src/tokens/tokens.ts'] = tokenCompiler.compileTs();
    }

    // 3. Compile Assets & Manifest
    const assetCompiler = new AssetCompiler(this.doc);
    const { assetFiles } = assetCompiler.compileAssets();
    Object.assign(fileTree, assetFiles);

    // 4. Compile Interaction Runtime Helper
    const interactionCompiler = new InteractionCompiler(this.doc);
    fileTree['src/lib/interactions.tsx'] = interactionCompiler.generateInteractionHelper();

    // 5. Compile Root Frames into Modular Components
    const jsxGenerator = new JsxGenerator({
      target: this.options.target,
      typescript: this.options.typescript,
      tokenMap
    });

    const components = [];
    for (const rootId of page.rootIds) {
      const rootNode = page.nodes[rootId];
      if (rootNode) {
        const comp = jsxGenerator.generateComponent(rootNode, page);
        components.push(comp);
        const ext = this.options.typescript ? 'tsx' : 'jsx';
        fileTree[`src/components/${comp.name}.${ext}`] = comp.code;
      }
    }

    // 6. Package Project Infrastructure
    const packager = new ProjectPackager(this.doc, this.options);
    fileTree['package.json'] = packager.generatePackageJson();
    fileTree['index.html'] = packager.generateIndexHtml();
    fileTree[`vite.config.${this.options.typescript ? 'ts' : 'js'}`] = packager.generateViteConfig();
    fileTree['README.md'] = packager.generateReadme();

    if (this.options.typescript) {
      fileTree['tsconfig.json'] = packager.generateTsConfig();
    }

    fileTree[`src/main.${this.options.typescript ? 'tsx' : 'jsx'}`] = packager.generateMainEntry();
    fileTree[`src/App.${this.options.typescript ? 'tsx' : 'jsx'}`] = packager.generateApp(components);

    // 7. Run Diagnostics Audit
    const diagnosticsCompiler = new CompilerDiagnostics(this.doc, { components, fileTree });
    const diagnostics = diagnosticsCompiler.generateReport();
    fileTree['.designforge-manifest.json'] = packager.generateManifest(diagnostics);

    return {
      success: true,
      fileTree,
      errors: [],
      warnings: validation.warnings,
      diagnostics,
      summary: {
        totalFiles: Object.keys(fileTree).length,
        componentsCount: components.length,
        tokensCount: tokenMap.size
      }
    };
  }

  /**
   * Compiles a single selected node into an isolated component
   */
  compileNodeToComponent(node, page) {
    const tokenCompiler = new TokenCompiler(this.doc.tokens);
    const { tokenMap } = tokenCompiler.compileCss();

    const jsxGenerator = new JsxGenerator({
      target: this.options.target,
      typescript: this.options.typescript,
      tokenMap
    });

    const res = jsxGenerator.generateComponent(node, page || this.doc.pages[0]);
    return {
      componentName: res.name,
      tsx: res.code
    };
  }

  /**
   * Generates a self-contained Live Preview HTML string for instant sandboxed iframe testing
   */
  generateLivePreviewHtml() {
    const page = this.doc.pages[0];
    const layoutTransformer = new LayoutTransformer({ target: 'react-css' });

    const renderNodeHtml = (nodeId) => {
      const node = page.nodes[nodeId];
      if (!node || !node.visible) return '';

      const styleObj = layoutTransformer.transformNodeToStyles(node);
      const styleStr = Object.entries(styleObj)
        .map(([k, v]) => `${k}:${v}`)
        .join(';');

      const tag = node.semanticTag || (node.type === 'frame' ? 'div' : node.type === 'text' ? 'p' : 'div');

      if (node.type === 'text') {
        const text = this.escapeHtml(node.text?.content || '');
        return `<${tag} style="${styleStr}">${text}</${tag}>`;
      }

      const children = (node.childIds || []).map(cid => renderNodeHtml(cid)).join('\n');
      return `<${tag} style="${styleStr}">\n${children}\n</${tag}>`;
    };

    const rootParts = (page.rootIds || []).map(rid => renderNodeHtml(rid)).join('\n');
    const { css: tokensCss } = new TokenCompiler(this.doc.tokens).compileCss();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(this.doc.name)} - React Live Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    ${tokensCss}
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 36px 20px;
      background: #090d16;
      font-family: 'Inter', -apple-system, sans-serif;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 36px;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  ${rootParts}
</body>
</html>`;
  }

  escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
