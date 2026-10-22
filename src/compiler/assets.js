/**
 * DesignForge AI - Asset Compiler & Manifest Manager
 * Resolves images, SVG icons, stable asset filenames, and emits asset manifests
 */

export class AssetCompiler {
  constructor(document) {
    this.doc = document;
  }

  /**
   * Scans document for referenced raster and vector assets
   */
  compileAssets() {
    const assetFiles = {};
    const assetManifest = {
      generatedAt: new Date().toISOString(),
      totalAssets: 0,
      assets: []
    };

    // Include registered document assets
    for (const a of this.doc.assets || []) {
      const filename = `assets/${a.filename || `${a.id}.${a.format || 'png'}`}`;
      assetManifest.assets.push({
        id: a.id,
        filename,
        format: a.format || 'png',
        sizeBytes: a.sizeBytes || 0
      });
      // Emit SVG placeholder if content provided
      if (a.svgContent) {
        assetFiles[`src/${filename}`] = a.svgContent;
      }
    }

    assetManifest.totalAssets = assetManifest.assets.length;
    assetFiles['src/assets/asset-manifest.json'] = JSON.stringify(assetManifest, null, 2);

    return {
      assetFiles,
      assetManifest
    };
  }
}
