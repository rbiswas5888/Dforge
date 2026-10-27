import { LineStream, parseLine } from '../ops/parse.ts';
import { DEFAULT_LIMITS, validate } from '../ops/validate.ts';
import type { Limits, NodeInfo, ValidationCtx } from '../ops/validate.ts';
import type { Catalog } from '../catalog/catalog.ts';
import { isTokenRef } from '../types.ts';
import type {
  Diagnostic, EngineAdapter, EngineValue, GhostHandle, NodeProps, Op, PropValue, ResolvedAction, TokenRef,
} from '../types.ts';

export const WIREFRAME_FILL = '#EDEDED';
export const WIREFRAME_STROKE = '#9E9E9E';
export const WIREFRAME_TEXT = '#616161';
const PAD_KEYS = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];

type CreateOp = Extract<Op, { kind: 'create' }>;
type InteractionOp = Extract<Op, { kind: 'interaction' }>;

interface Meta { key: string; realId: string; type: string; info: NodeInfo; screenKey?: string; comp?: string }
interface PendingIx { ns: string; op: InteractionOp }

export type GhostState = 'idle' | 'streaming' | 'ready' | 'accepted' | 'rejected';
export interface GhostReport {
  state: GhostState; stale: boolean; lines: number; ops: number; created: number; skippedProse: number; invalid: number;
  diagnostics: Diagnostic[]; missingComponents: string[]; missingTokens: string[]; wireframes: number; notes: string[];
}
export interface GhostOptions {
  limits?: Limits; label?: string; invalidThreshold?: number; onOp?: (op: Op, realId?: string) => void;
}

/**
 * Streams op-language text into a ghost transaction on the host engine.
 * Lines are applied as soon as they are complete and valid, so the design appears while the model is still writing.
 * Local ids are namespaced per work unit so independent sections can reuse names like T1 without collisions.
 */
export class GhostSession {
  state: GhostState = 'idle';
  stale = false;
  private engine: EngineAdapter;
  private catalog?: Catalog;
  private limits: Limits;
  private handle: GhostHandle;
  private threshold: number;
  private onOp?: (op: Op, realId?: string) => void;
  private ns = '';
  private nodes = new Map<string, Meta>();
  private stream = new LineStream();
  private lineNo = 0;
  private diags: Diagnostic[] = [];
  private pending: PendingIx[] = [];
  private lineCount = 0;
  private opCount = 0;
  private createdCount = 0;
  private invalid = 0;
  private prose = 0;
  private unitOps = 0;
  private unitInvalid = 0;
  private unitErrors: Diagnostic[] = [];
  private missingComps = new Set<string>();
  private missingToks = new Set<string>();
  private wireframes = 0;
  private notes: string[] = [];

  constructor(engine: EngineAdapter, catalog: Catalog | undefined, opts: GhostOptions = {}) {
    this.engine = engine;
    this.catalog = catalog;
    this.limits = opts.limits ?? DEFAULT_LIMITS;
    this.threshold = opts.invalidThreshold ?? 0.15;
    this.onOp = opts.onOp;
    this.handle = engine.beginGhost(opts.label ?? 'AI generation');
  }

  // ---- input ----
  beginUnit(ns: string): void {
    this.endUnit();
    this.ns = ns;
    this.unitOps = 0; this.unitInvalid = 0; this.unitErrors = [];
    if (this.state === 'idle') this.state = 'streaming';
  }
  endUnit(): void {
    for (const l of this.stream.flush()) this.ingest(l);
    this.ns = '';
  }
  push(chunk: string): void {
    if (this.state === 'idle') this.state = 'streaming';
    for (const l of this.stream.push(chunk)) this.ingest(l);
  }
  pushLines(lines: string[]): void {
    if (this.state === 'idle') this.state = 'streaming';
    for (const l of lines) this.ingest(l);
  }

  ingest(raw: string): void {
    this.lineNo++; this.lineCount++;
    const parsed = parseLine(raw, this.lineNo);
    if (parsed.kind === 'skip') {
      if (parsed.reason === 'prose') {
        this.prose++;
        this.diags.push({ line: this.lineNo, severity: 'info', code: 'prose', message: 'ignored non-operation text', raw });
      }
      return;
    }
    if (parsed.kind === 'error') { this.markInvalid(parsed.diag); return; }
    const res = validate(parsed.op, this.ctx());
    this.diags.push(...res.diags);
    if (!res.op) {
      const e = res.diags.find((d) => d.severity === 'error');
      if (e) this.markInvalid(e, false);
      return;
    }
    this.apply(res.op);
  }

  private markInvalid(d: Diagnostic, record = true): void {
    if (record) this.diags.push(d);
    this.invalid++; this.unitInvalid++; this.unitErrors.push(d);
  }

  // ---- lookup ----
  private key(id: string): string { return this.ns ? `${this.ns}/${id}` : id; }
  private nsLookup(ns: string, ref: string): Meta | undefined {
    if (ref.includes('/')) return this.nodes.get(ref);
    return this.nodes.get(ns ? `${ns}/${ref}` : ref) ?? this.nodes.get(ref);
  }
  private existing(id: string): NodeInfo | undefined {
    const d = this.engine.describe?.(id);
    if (!d && !this.engine.selectionIds().includes(id)) return undefined;
    return { type: 'EXISTING', depth: 1, name: d?.name ?? id, width: d?.width, height: d?.height };
  }
  private info(ref: string): NodeInfo | undefined {
    if (ref === 'page') return { type: 'PAGE', depth: 0, name: 'page' };
    if (ref === 'sel') { const id = this.engine.selectionIds()[0]; return id ? this.existing(id) : undefined; }
    if (ref.startsWith('n:')) return this.existing(ref);
    return this.nsLookup(this.ns, ref)?.info;
  }
  private real(ref: string): string | undefined {
    if (ref === 'page') return this.engine.pageId();
    if (ref === 'sel') return this.engine.selectionIds()[0];
    if (ref.startsWith('n:')) return ref;
    return this.nsLookup(this.ns, ref)?.realId;
  }
  private ctx(): ValidationCtx {
    return {
      limits: this.limits, catalog: this.catalog,
      lookup: (r) => this.info(r),
      isDefined: (id) => this.nodes.has(this.key(id)),
      created: () => this.createdCount,
    };
  }

  // ---- apply ----
  private split(props: NodeProps): { lit: Record<string, EngineValue>; tok: [string, TokenRef][] } {
    const lit: Record<string, EngineValue> = {};
    const tok: [string, TokenRef][] = [];
    for (const [k, v] of Object.entries(props)) {
      if (isTokenRef(v)) tok.push([k, v]); else lit[k] = v;
    }
    return { lit, tok };
  }

  private applyProp(id: string, key: string, value: PropValue): void {
    if (!isTokenRef(value)) { this.handle.set(id, key, value); return; }
    const t = this.catalog?.token(value.token);
    if (!t) {
      this.missingToks.add('$' + value.token);
      if (key === 'fill') this.handle.set(id, key, WIREFRAME_FILL);
      else if (key === 'stroke') this.handle.set(id, key, WIREFRAME_STROKE);
      return;
    }
    const keys = key === 'padding' ? PAD_KEYS : [key];
    for (const k of keys) {
      if (t.variableId) this.handle.bind(id, k, t.variableId);
      else if (t.styleId && (k === 'fill' || k === 'textStyle')) this.handle.applyStyle(id, k === 'textStyle' ? 'text' : 'fill', t.styleId);
      else if (t.value !== undefined) this.handle.set(id, k, t.value);
      else this.missingToks.add('$' + value.token);
    }
  }

  private register(op: CreateOp, realId: string, parentMeta: Meta | undefined, comp?: string, label?: string): void {
    const parentInfo = this.info(op.parent);
    const key = this.key(op.id);
    const w = typeof op.props.width === 'number' ? op.props.width : undefined;
    const h = typeof op.props.height === 'number' ? op.props.height : undefined;
    const layout = typeof op.props.layoutMode === 'string' ? op.props.layoutMode : undefined;
    const info: NodeInfo = { type: op.type, depth: (parentInfo?.depth ?? 0) + 1, name: op.name, width: w, height: h, layout, label };
    const topScreen = op.type === 'FRAME' && (parentInfo?.type === 'SECTION' || parentInfo?.type === 'PAGE');
    this.nodes.set(key, { key, realId, type: op.type, info, comp, screenKey: topScreen ? key : parentMeta?.screenKey });
  }

  private placeholder(op: CreateOp, parentReal: string, parentMeta: Meta | undefined): string {
    const name = (op.comp ?? '#component').replace(/^#/, '');
    const msg = `component not available: ${name}`;
    const w = typeof op.props.width === 'number' ? op.props.width : 160;
    const h = typeof op.props.height === 'number' ? op.props.height : 44;
    const sx = op.props.layoutSizingHorizontal === 'FILL' ? 'FILL' : 'FIXED';
    const id = this.handle.create({
      type: 'FRAME', name: msg, parent: parentReal,
      props: {
        width: w, height: h, layoutMode: 'VERTICAL', primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER',
        fill: WIREFRAME_FILL, stroke: WIREFRAME_STROKE, strokeWeight: 1, dashPattern: '4,4', cornerRadius: 4,
        layoutSizingHorizontal: sx, layoutSizingVertical: 'FIXED',
      },
    });
    this.handle.create({ type: 'TEXT', name: msg, parent: id, props: { fontSize: 12, fill: WIREFRAME_TEXT }, characters: msg });
    this.handle.annotate(id, msg);
    this.createdCount += 2; this.wireframes++; this.missingComps.add('#' + name);
    this.register(op, id, parentMeta, undefined, op.overrides?.label ?? op.overrides?.text);
    return id;
  }

  private apply(op: Op): void {
    this.opCount++; this.unitOps++;
    let realId: string | undefined;
    switch (op.kind) {
      case 'create': {
        const parentReal = this.real(op.parent) ?? this.engine.pageId();
        const parentMeta = this.nsLookup(this.ns, op.parent);
        if (op.type === 'INSTANCE') {
          const def = op.comp ? this.catalog?.component(op.comp) : undefined;
          if (!def) { realId = this.placeholder(op, parentReal, parentMeta); break; }
          const { lit, tok } = this.split(op.props);
          realId = this.handle.create({ type: 'INSTANCE', name: op.name.startsWith('instance ') ? def.name : op.name, parent: parentReal, props: lit, componentId: def.id });
          for (const [k, v] of tok) this.applyProp(realId, k, v);
          const allowed: Record<string, string> = {};
          for (const [k, v] of Object.entries(op.overrides ?? {})) {
            if (!def.props || k in def.props) allowed[k] = v;
            else this.diags.push({ line: op.line, severity: 'warn', code: 'unknown-component-prop', message: `${def.code} has no property '${k}'; ignored` });
          }
          if (Object.keys(allowed).length) this.handle.setComponentProps(realId, allowed);
          this.createdCount++;
          this.register(op, realId, parentMeta, def.code, allowed.label ?? allowed.text ?? allowed.title);
          break;
        }
        const { lit, tok } = this.split(op.props);
        const children = op.of?.map((r) => this.real(r)).filter((x): x is string => !!x);
        realId = this.handle.create({ type: op.type, name: op.name, parent: parentReal, props: lit, characters: op.characters, children });
        for (const [k, v] of tok) this.applyProp(realId, k, v);
        this.createdCount++;
        this.register(op, realId, parentMeta, undefined, op.characters);
        break;
      }
      case 'set': {
        realId = this.real(op.ref);
        if (!realId) break;
        for (const [k, v] of Object.entries(op.props)) this.applyProp(realId, k, v);
        const m = this.nsLookup(this.ns, op.ref);
        if (m && typeof op.props.characters === 'string') m.info.label = op.props.characters;
        break;
      }
      case 'bind': {
        realId = this.real(op.ref);
        if (realId) this.handle.bind(realId, op.prop, op.variable);
        break;
      }
      case 'style': {
        realId = this.real(op.ref);
        const t = this.catalog?.token(op.token);
        if (!realId) break;
        if (!t) { this.missingToks.add('$' + op.token); break; }
        if (t.kind === 'text') this.applyProp(realId, 'textStyle', { token: op.token });
        else if (t.kind === 'color') this.applyProp(realId, 'fill', { token: op.token });
        else if (t.kind === 'effect' && t.styleId) this.handle.applyStyle(realId, 'effect', t.styleId);
        break;
      }
      case 'move': {
        realId = this.real(op.ref);
        if (realId) this.handle.move(realId, { x: op.x, y: op.y, parent: op.parent ? this.real(op.parent) : undefined, index: op.index });
        break;
      }
      case 'delete': {
        realId = this.real(op.ref);
        if (realId) this.handle.remove(realId);
        const m = this.nsLookup(this.ns, op.ref);
        if (m) this.nodes.delete(m.key);
        break;
      }
      case 'constraint': {
        realId = this.real(op.ref);
        if (realId) this.handle.setConstraints(realId, op.h, op.v);
        break;
      }
      case 'interaction': this.pending.push({ ns: this.ns, op }); break;
      case 'variable': this.handle.declareVariable({ name: op.name, type: op.type, value: op.value }); break;
      case 'note': this.handle.annotate(op.ref ? (this.real(op.ref) ?? null) : null, op.text); this.notes.push(op.text); break;
    }
    this.onOp?.(op, realId);
  }

  private finalize(): void {
    for (const p of this.pending) {
      const src = this.nsLookup(p.ns, p.op.ref);
      if (!src) continue;
      const actions: ResolvedAction[] = [];
      for (const a of p.op.actions) {
        const { target, ...rest } = a;
        if (!target) { actions.push(rest); continue; }
        const t = this.nsLookup(p.ns, target);
        if (!t) {
          this.diags.push({ line: p.op.line, severity: 'error', code: 'unresolved-target', message: `interaction target ${target} was never defined; action dropped` });
          this.invalid++;
          continue;
        }
        actions.push({ ...rest, targetId: t.realId });
      }
      if (actions.length) this.handle.addInteraction(src.realId, { trigger: p.op.trigger, delayMs: p.op.delayMs, key: p.op.key, when: p.op.when, actions });
    }
    this.pending = [];
  }

  // ---- lifecycle ----
  end(): GhostReport {
    this.endUnit();
    this.finalize();
    if (this.state === 'idle' || this.state === 'streaming') this.state = 'ready';
    return this.report();
  }
  accept(): void {
    if (this.state === 'accepted' || this.state === 'rejected') return;
    if (this.state !== 'ready') this.end();
    this.handle.commit();
    this.state = 'accepted';
  }
  reject(): void {
    if (this.state === 'accepted' || this.state === 'rejected') return;
    this.handle.discard();
    this.state = 'rejected';
  }
  markStale(): void { this.stale = true; }

  // ---- helpers for the pipeline ----
  /** Text asking the model to re-emit only the lines that were rejected in the current unit, or undefined if quality is fine. */
  repairHint(): string | undefined {
    const total = this.unitOps + this.unitInvalid;
    if (this.unitInvalid < 2 || total === 0 || this.unitInvalid / total <= this.threshold) return undefined;
    const lines = this.unitErrors.slice(0, 8).map((e) => `- ${e.raw ?? ''}  => ${e.message}`);
    return `These lines were rejected:\n${lines.join('\n')}\nRe-emit ONLY corrected versions of the rejected lines, one per line, no commentary.`;
  }
  describeIds(limit = 30): string {
    const out: string[] = [];
    for (const m of this.nodes.values()) {
      if (m.type !== 'FRAME' && m.type !== 'SECTION' && m.type !== 'GROUP') continue;
      const size = m.info.width && m.info.height ? ` ${m.info.width}x${m.info.height}` : '';
      out.push(`${m.key} ${m.type.toLowerCase()} '${m.info.name}'${size}${m.info.layout ? ' layout=' + m.info.layout : ''}`);
    }
    return out.slice(-limit).join('\n');
  }
  findByLabel(screenKey: string, label: string): string | undefined {
    const want = label.trim().toLowerCase();
    for (const m of this.nodes.values()) {
      if (m.screenKey === screenKey && (m.type === 'INSTANCE' || m.type === 'TEXT') && (m.info.label ?? '').trim().toLowerCase() === want) return m.key;
    }
    return undefined;
  }
  firstInstance(screenKey: string, pattern: RegExp): string | undefined {
    for (const m of this.nodes.values()) {
      if (m.screenKey === screenKey && m.type === 'INSTANCE' && pattern.test(`${m.info.name} ${m.comp ?? ''}`)) return m.key;
    }
    return undefined;
  }
  interactiveCandidates(screenKey: string): string {
    const out: string[] = [];
    for (const m of this.nodes.values()) {
      if (m.screenKey === screenKey && (m.type === 'INSTANCE' || m.type === 'TEXT') && m.info.label) out.push(`${m.key} ${m.type.toLowerCase()} '${m.info.label}'`);
    }
    return out.slice(0, 20).join('\n');
  }
  report(): GhostReport {
    return {
      state: this.state, stale: this.stale, lines: this.lineCount, ops: this.opCount, created: this.createdCount,
      skippedProse: this.prose, invalid: this.invalid, diagnostics: [...this.diags],
      missingComponents: [...this.missingComps], missingTokens: [...this.missingToks], wireframes: this.wireframes, notes: [...this.notes],
    };
  }
}
