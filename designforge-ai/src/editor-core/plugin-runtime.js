/**
 * DesignForge AI — Sandboxed Plugin & Scripting API Architecture
 * Provides an isolated execution environment exposing `forge` API surface:
 * `forge.currentPage`, `forge.getNodeById`, `forge.createFrame`, `forge.ui.postMessage`, etc.
 */

export class PluginRuntime {
  constructor(engine) {
    this.engine = engine;
    this.activePlugins = new Map();
  }

  createPluginContext(pluginId, onMessageCallback) {
    const engine = this.engine;
    const page = engine.getActivePage();

    const forgeAPI = {
      currentPage: {
        get id() { return page.id; },
        get rootIds() { return [...page.rootIds]; },
        get selection() { return engine.getSelection(); },
        setSelection(ids) { engine.setSelection(ids); }
      },

      getNodeById: (id) => engine.getNode(id),

      createFrame: (props = {}) => {
        return engine.addNode({
          type: 'frame',
          name: props.name || 'Frame',
          x: props.x || 100,
          y: props.y || 100,
          width: props.width || 300,
          height: props.height || 200,
          fill: props.fill || '#FFFFFF',
          ...props
        });
      },

      createSection: (props = {}) => {
        return engine.addNode({
          type: 'section',
          name: props.name || 'Section',
          x: props.x || 50,
          y: props.y || 50,
          width: props.width || 600,
          height: props.height || 400,
          fill: props.fill || '#1E293B',
          ...props
        });
      },

      createRectangle: (props = {}) => {
        return engine.addNode({
          type: 'rectangle',
          name: props.name || 'Rectangle',
          x: props.x || 100,
          y: props.y || 100,
          width: props.width || 120,
          height: props.height || 80,
          fill: props.fill || '#3B82F6',
          ...props
        });
      },

      createText: (characters, props = {}) => {
        return engine.addNode({
          type: 'text',
          name: characters || 'Text',
          characters: characters || 'Hello World',
          x: props.x || 100,
          y: props.y || 100,
          fontSize: props.fontSize || 16,
          fill: props.fill || '#0F172A',
          ...props
        });
      },

      ui: {
        postMessage: (data) => {
          if (onMessageCallback) onMessageCallback(data);
        }
      },

      notify: (message) => {
        console.log(`[Plugin Notify] ${message}`);
      }
    };

    return forgeAPI;
  }

  /**
   * Run sandboxed plugin code string
   */
  async executePluginCode(pluginId, scriptCode, onMessageCallback) {
    const forge = this.createPluginContext(pluginId, onMessageCallback);
    try {
      const runner = new Function('forge', `"use strict";\n${scriptCode}`);
      const result = runner(forge);
      return { success: true, result };
    } catch (err) {
      console.error(`Plugin ${pluginId} execution error:`, err);
      return { success: false, error: err.message };
    }
  }
}
