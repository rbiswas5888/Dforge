/**
 * DesignForge AI - Prototype & Interactive Experience Engine
 * Framer-inspired responsive preview runtime, device bezel simulation, and interaction graph player
 */

import { ReactCompiler } from './compiler.js';

export class PrototypeEngine {
  constructor(document) {
    this.doc = document;
    this.currentDevice = 'desktop'; // 'desktop' (1440px) | 'tablet' (768px) | 'mobile' (375px) | 'responsive'
    this.activeModalNodeId = null;
    this.navigationHistory = [];
  }

  setDevice(device) {
    this.currentDevice = device;
  }

  getDeviceDimensions() {
    switch (this.currentDevice) {
      case 'mobile':
        return { width: 375, height: 812, label: 'iPhone 15 Pro (375 × 812)' };
      case 'tablet':
        return { width: 768, height: 1024, label: 'iPad Mini (768 × 1024)' };
      case 'desktop':
        return { width: 1440, height: 900, label: 'Desktop MacBook (1440 × 900)' };
      case 'responsive':
      default:
        return { width: '100%', height: '100%', label: 'Fluid Responsive' };
    }
  }

  startFlow(frameId) {
    this.currentFrameId = frameId;
    this.navigationHistory = [frameId];
    return frameId;
  }

  handleEvent(sourceNodeId, eventType = 'click') {
    for (const page of this.doc.pages) {
      const node = page.nodes?.[sourceNodeId];
      if (node && node.interactions && node.interactions.length > 0) {
        const match = node.interactions.find(i => i.trigger === eventType || (eventType === 'click' && i.trigger === 'tap'));
        if (match) {
          if (match.action === 'navigate' && match.targetId) {
            this.currentFrameId = match.targetId;
            this.navigationHistory.push(match.targetId);
            return {
              success: true,
              action: 'navigate',
              targetId: match.targetId,
              animation: match.animation || 'smart-animate'
            };
          } else if (match.action === 'back') {
            if (this.navigationHistory.length > 1) {
              this.navigationHistory.pop();
              this.currentFrameId = this.navigationHistory[this.navigationHistory.length - 1];
              return { success: true, action: 'back', targetId: this.currentFrameId };
            }
          }
          return { success: true, action: match.action };
        }
      }
    }
    return { success: false, reason: 'No interaction found' };
  }

  /**
   * Generates a fully interactive simulator HTML bundle for prototype playback
   */
  generatePrototypeHtml() {
    const compiler = new ReactCompiler(this.doc);
    const liveHtml = compiler.generateLivePreviewHtml();

    // Inject interaction script and device styles
    const interactionScript = `
    <script>
      // Interactive Prototype Runtime
      document.addEventListener('click', (e) => {
        const target = e.target.closest('[style*="cursor: pointer"], button, a, [data-interactive]');
        if (target) {
          target.style.transform = 'scale(0.97)';
          setTimeout(() => { target.style.transform = ''; }, 120);
        }
      });
    </script>
    `;

    return liveHtml.replace('</body>', `${interactionScript}</body>`);
  }
}

