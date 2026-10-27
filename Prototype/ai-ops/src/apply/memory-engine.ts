import type { CreateSpec, EngineAdapter, EngineValue, GhostHandle, InteractionSpec } from '../types.ts';

export interface MemNode {
  id: string; type: string; name: string; parent: string; children: string[];
  props: Record<string, EngineValue>; bindings: Record<string, string>; styles: Record<string, string>;
  componentId?: string; componentProps?: Record<string, string>; characters?: string;
  ghost: boolean; interactions: InteractionSpec[]; notes: string[]; constraints?: { h?: string; v?: string };
}

/** Reference in-memory engine: shows how a host maps ghost operations onto its own scene graph and undo stack. */
export class MemoryEngine implements EngineAdapter {
  nodes = new Map<string, MemNode>();
  rootChildren: string[] = [];
  undo: string[][] = [];
  variables: { name: string; type: string; value: string }[] = [];
  pageNotes: string[] = [];
  selection: string[] = [];
  private counter = 0;

  pageId(): string { return 'PAGE'; }
  selectionIds(): string[] { return this.selection; }
  describe(id: string) {
    const n = this.nodes.get(id);
    return n ? { type: n.type, name: n.name, width: n.props.width as number | undefined, height: n.props.height as number | undefined } : undefined;
  }
  beginGhost(label: string): GhostHandle { return new MemoryGhost(this, label); }
  nextId(): string { return `n:${++this.counter}`; }
  childrenOf(parent: string): string[] {
    return parent === 'PAGE' ? this.rootChildren : (this.nodes.get(parent)?.children ?? []);
  }

  dump(): string {
    const lines: string[] = [];
    const walk = (id: string, depth: number) => {
      const n = this.nodes.get(id);
      if (!n) return;
      const w = n.props.width, h = n.props.height;
      const bits = [
        w && h ? `${w}x${h}` : '',
        n.componentId ? `comp=${n.componentId}` : '',
        n.characters ? `'${n.characters}'` : '',
        n.props.layoutMode ? `layout=${n.props.layoutMode}` : '',
        ...Object.entries(n.bindings).map(([k, v]) => `${k}<-var:${v}`),
        ...Object.entries(n.styles).map(([k, v]) => `${k}<-style:${v}`),
        n.interactions.length ? `ix=${n.interactions.length}` : '',
        n.ghost ? '(ghost)' : '',
      ].filter(Boolean);
      lines.push(`${'  '.repeat(depth)}${n.type} '${n.name}' ${bits.join(' ')}`.trimEnd());
      for (const c of n.children) walk(c, depth + 1);
    };
    for (const id of this.rootChildren) walk(id, 0);
    return lines.join('\n');
  }
}

class MemoryGhost implements GhostHandle {
  private eng: MemoryEngine;
  private created: string[] = [];
  private vars: { name: string; type: string; value: string }[] = [];
  private done = false;
  constructor(eng: MemoryEngine, _label: string) { this.eng = eng; }

  create(spec: CreateSpec): string {
    const id = this.eng.nextId();
    const node: MemNode = {
      id, type: spec.type, name: spec.name, parent: spec.parent, children: [], props: { ...spec.props },
      bindings: {}, styles: {}, componentId: spec.componentId, characters: spec.characters, ghost: true, interactions: [], notes: [],
    };
    this.eng.nodes.set(id, node);
    this.eng.childrenOf(spec.parent).push(id);
    for (const c of spec.children ?? []) this.move(c, { parent: id });
    this.created.push(id);
    return id;
  }
  set(id: string, key: string, value: EngineValue): void {
    const n = this.eng.nodes.get(id);
    if (!n) return;
    if (key === 'characters') n.characters = String(value);
    else if (key === 'name') n.name = String(value);
    else n.props[key] = value;
  }
  bind(id: string, key: string, variableId: string): void { const n = this.eng.nodes.get(id); if (n) n.bindings[key] = variableId; }
  applyStyle(id: string, kind: string, styleId: string): void { const n = this.eng.nodes.get(id); if (n) n.styles[kind] = styleId; }
  setComponentProps(id: string, props: Record<string, string>): void {
    const n = this.eng.nodes.get(id);
    if (n) n.componentProps = { ...(n.componentProps ?? {}), ...props };
  }
  move(id: string, to: { x?: number; y?: number; parent?: string; index?: number }): void {
    const n = this.eng.nodes.get(id);
    if (!n) return;
    if (to.x !== undefined) n.props.x = to.x;
    if (to.y !== undefined) n.props.y = to.y;
    if (to.parent && to.parent !== n.parent) {
      const old = this.eng.childrenOf(n.parent);
      const i = old.indexOf(id);
      if (i >= 0) old.splice(i, 1);
      n.parent = to.parent;
      const list = this.eng.childrenOf(to.parent);
      list.splice(to.index ?? list.length, 0, id);
    }
  }
  remove(id: string): void {
    const n = this.eng.nodes.get(id);
    if (!n) return;
    for (const c of [...n.children]) this.remove(c);
    const list = this.eng.childrenOf(n.parent);
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
    this.eng.nodes.delete(id);
  }
  setConstraints(id: string, h?: string, v?: string): void { const n = this.eng.nodes.get(id); if (n) n.constraints = { h, v }; }
  addInteraction(id: string, spec: InteractionSpec): void { this.eng.nodes.get(id)?.interactions.push(spec); }
  declareVariable(spec: { name: string; type: string; value: string }): void { this.vars.push(spec); }
  annotate(id: string | null, text: string): void {
    if (id) this.eng.nodes.get(id)?.notes.push(text); else this.eng.pageNotes.push(text);
  }
  commit(): void {
    if (this.done) return;
    for (const id of this.created) { const n = this.eng.nodes.get(id); if (n) n.ghost = false; }
    this.eng.undo.push([...this.created]);
    this.eng.variables.push(...this.vars);
    this.done = true;
  }
  discard(): void {
    if (this.done) return;
    for (const id of [...this.created]) if (this.eng.nodes.has(id)) this.remove(id);
    this.done = true;
  }
}
