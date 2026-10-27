/**
 * DesignForge AI — Automated Developer Handoff & Multi-Platform Code Exporter
 * - Vector to SVG
 * - Auto Layout to Tailwind CSS & React JSX
 * - Multi-Platform Code Generators (CSS, iOS SwiftUI, Android Jetpack Compose)
 */

export class ExportHandoffEngine {
  /**
   * Convert node or vector network into clean SVG markup
   */
  static exportToSVG(node) {
    if (!node) return '';
    const width = node.width || 100;
    const height = node.height || 100;

    let innerContent = '';
    if (node.type === 'rectangle' || node.type === 'frame') {
      const rx = node.cornerRadius || 0;
      innerContent = `<rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" fill="${node.fill || 'none'}" stroke="${node.stroke || 'none'}" stroke-width="${node.strokeWeight || 0}" />`;
    } else if (node.type === 'ellipse') {
      innerContent = `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2}" ry="${height / 2}" fill="${node.fill || 'none'}" stroke="${node.stroke || 'none'}" stroke-width="${node.strokeWeight || 0}" />`;
    } else if (node.type === 'text') {
      innerContent = `<text x="0" y="${node.fontSize || 16}" font-family="${node.fontFamily || 'Inter, sans-serif'}" font-size="${node.fontSize || 16}" fill="${node.fill || '#000000'}">${node.characters || ''}</text>`;
    } else if (node.vectorData && node.vectorData.svgPath) {
      innerContent = `<path d="${node.vectorData.svgPath}" fill="${node.fill || 'none'}" stroke="${node.stroke || 'none'}" stroke-width="${node.strokeWeight || 1}" />`;
    } else {
      innerContent = `<rect x="0" y="0" width="${width}" height="${height}" fill="${node.fill || 'none'}" />`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  ${innerContent}\n</svg>`;
  }

  /**
   * Generate iOS SwiftUI Component
   */
  static generateSwiftUI(node) {
    if (!node) return '';
    const isRow = node.layoutMode === 'HORIZONTAL';
    const container = isRow ? 'HStack' : 'VStack';
    const spacing = node.itemSpacing || 0;
    const padding = node.padding || 0;
    const cornerRadius = node.cornerRadius || 0;

    let swift = `${container}(spacing: ${spacing}) {\n`;
    if (node.childIds && node.childIds.length > 0) {
      swift += `    // Children nodes\n`;
    } else if (node.type === 'text') {
      swift += `    Text("${node.characters || ''}")\n`;
      swift += `        .font(.system(size: ${node.fontSize || 16}))\n`;
    } else {
      swift += `    Rectangle()\n`;
      swift += `        .frame(width: ${node.width || 100}, height: ${node.height || 100})\n`;
    }

    swift += `}\n`;
    if (padding > 0) swift += `.padding(${padding})\n`;
    if (node.fill) swift += `.background(Color(hex: "${node.fill}"))\n`;
    if (cornerRadius > 0) swift += `.cornerRadius(${cornerRadius})\n`;

    return swift.trim();
  }

  /**
   * Generate Android Jetpack Compose Component
   */
  static generateJetpackCompose(node) {
    if (!node) return '';
    const isRow = node.layoutMode === 'HORIZONTAL';
    const container = isRow ? 'Row' : 'Column';
    const spacing = node.itemSpacing || 0;
    const padding = node.padding || 0;
    const cornerRadius = node.cornerRadius || 0;

    let compose = `@Composable\nfun ${node.name.replace(/[^a-zA-Z0-9]/g, '') || 'CustomComponent'}() {\n`;
    compose += `    ${container}(\n`;
    compose += `        modifier = Modifier\n`;
    if (padding > 0) compose += `            .padding(${padding}.dp)\n`;
    if (cornerRadius > 0) compose += `            .clip(RoundedCornerShape(${cornerRadius}.dp))\n`;
    if (node.fill) compose += `            .background(Color(0xFF${node.fill.replace('#', '')}))\n`;
    if (spacing > 0) compose += `            // horizontalArrangement / verticalArrangement spacing = ${spacing}.dp\n`;
    compose += `    ) {\n`;
    if (node.type === 'text') {
      compose += `        Text(text = "${node.characters || ''}", fontSize = ${node.fontSize || 16}.sp)\n`;
    } else {
      compose += `        Box(modifier = Modifier.size(${node.width || 100}.dp, ${node.height || 100}.dp))\n`;
    }
    compose += `    }\n}\n`;

    return compose.trim();
  }
}
