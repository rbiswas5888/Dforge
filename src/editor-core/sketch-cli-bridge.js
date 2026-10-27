/**
 * DesignForge AI — Embedded Sketch CLI & Frameworks Bridge
 * Provides zero-dependency access to embedded Sketch binary tools,
 * Frameworks, and KeyBindings inside assets/sketch.
 * Safe for both browser environments and Node.js runtimes.
 */

const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node);

let _nodeModules = null;
async function getNodeDeps() {
  if (!isNode) return null;
  if (!_nodeModules) {
    const [fs, path, url, cp] = await Promise.all([
      import('node:fs'),
      import('node:path'),
      import('node:url'),
      import('node:child_process')
    ]);
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, '../..');
    const SKETCH_BASE_DIR = path.join(projectRoot, 'assets/sketch');
    const SKETCH_BIN_DIR = path.join(SKETCH_BASE_DIR, 'bin');
    const SKETCH_FRAMEWORKS_DIR = path.join(SKETCH_BASE_DIR, 'Frameworks');
    const SKETCH_RESOURCES_DIR = path.join(SKETCH_BASE_DIR, 'Resources');

    _nodeModules = {
      fs: fs.default || fs,
      path: path.default || path,
      execFileSync: cp.execFileSync,
      projectRoot,
      SKETCH_BASE_DIR,
      SKETCH_BIN_DIR,
      SKETCH_FRAMEWORKS_DIR,
      SKETCH_RESOURCES_DIR,
      SKETCHTOOL_BIN: path.join(SKETCH_BIN_DIR, 'sketchtool'),
      FIG2SKETCH_BIN: path.join(SKETCH_BIN_DIR, 'fig2sketch'),
      DEFAULT_KEYBINDINGS_PLIST: path.join(SKETCH_RESOURCES_DIR, 'DefaultKeyBindings.plist')
    };
  }
  return _nodeModules;
}

/**
 * Checks if the embedded Sketch binaries and frameworks are available
 */
export async function isSketchBridgeAvailable() {
  const deps = await getNodeDeps();
  if (!deps) return false;
  return (
    deps.fs.existsSync(deps.SKETCHTOOL_BIN) &&
    deps.fs.existsSync(deps.FIG2SKETCH_BIN) &&
    deps.fs.existsSync(deps.SKETCH_FRAMEWORKS_DIR)
  );
}

/**
 * Returns summary of embedded Sketch frameworks
 */
export async function getEmbeddedFrameworks() {
  const deps = await getNodeDeps();
  if (!deps || !deps.fs.existsSync(deps.SKETCH_FRAMEWORKS_DIR)) return [];
  return deps.fs.readdirSync(deps.SKETCH_FRAMEWORKS_DIR)
    .filter(f => f.endsWith('.framework') || f.endsWith('.dylib'));
}

/**
 * Executes embedded sketchtool with args
 */
export async function runSketchTool(args = []) {
  const deps = await getNodeDeps();
  if (!deps) throw new Error('Sketch CLI tool requires Node.js runtime');
  if (!deps.fs.existsSync(deps.SKETCHTOOL_BIN)) {
    throw new Error(`Embedded sketchtool not found at ${deps.SKETCHTOOL_BIN}`);
  }
  try {
    const stdout = deps.execFileSync(deps.SKETCHTOOL_BIN, args, {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024
    });
    return { success: true, stdout };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      stderr: err.stderr ? err.stderr.toString() : ''
    };
  }
}

/**
 * Returns version of embedded sketchtool
 */
export async function getSketchToolVersion() {
  const result = await runSketchTool(['--version']);
  if (result.success) {
    return result.stdout.trim();
  }
  return null;
}

/**
 * Converts a Figma (.fig) file to Sketch (.sketch) using embedded fig2sketch
 */
export async function convertFigToSketch(figPath, sketchOutputPath, options = {}) {
  const deps = await getNodeDeps();
  if (!deps) throw new Error('fig2sketch requires Node.js runtime');
  if (!deps.fs.existsSync(deps.FIG2SKETCH_BIN)) {
    throw new Error(`Embedded fig2sketch not found at ${deps.FIG2SKETCH_BIN}`);
  }
  if (!deps.fs.existsSync(figPath)) {
    throw new Error(`Source .fig file not found at ${figPath}`);
  }

  const args = [];
  if (options.instanceOverride) {
    args.push('--instance-override', options.instanceOverride);
  }
  if (options.forceConvertImages) {
    args.push('--force-convert-images');
  }
  if (options.compress) {
    args.push('--compress');
  }
  args.push(figPath, sketchOutputPath);

  try {
    const stdout = deps.execFileSync(deps.FIG2SKETCH_BIN, args, {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024
    });
    return {
      success: true,
      outputPath: sketchOutputPath,
      stdout
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      stderr: err.stderr ? err.stderr.toString() : ''
    };
  }
}

/**
 * Parses Sketch DefaultKeyBindings.plist into a normalized keybinding mapping
 */
export async function parseSketchDefaultKeyBindings() {
  const deps = await getNodeDeps();
  let content = '';
  if (deps && deps.fs.existsSync(deps.DEFAULT_KEYBINDINGS_PLIST)) {
    content = deps.fs.readFileSync(deps.DEFAULT_KEYBINDINGS_PLIST, 'utf8');
  } else if (typeof fetch !== 'undefined') {
    try {
      const res = await fetch('assets/sketch/Resources/DefaultKeyBindings.plist');
      if (res.ok) content = await res.text();
    } catch {
      // fallback
    }
  }

  if (!content) return {};

  const bindings = {};
  const keyRegex = /<key>([^<]+)<\/key>\s*<string>([^<]+)<\/string>/g;
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const action = match[1];
    const rawKeys = match[2];
    const primaryKey = rawKeys.charAt(0);
    bindings[action] = {
      primary: primaryKey,
      allKeys: Array.from(rawKeys),
      description: action.replace(/^Sketch\./, '').replace(/Action$/, '')
    };
  }

  return bindings;
}
