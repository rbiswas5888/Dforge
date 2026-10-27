import type { ActionSpec, Arg, CreateType, Diagnostic, NodeProps, Op, PropValue, RawOp } from '../types.ts';
import type { Catalog } from '../catalog/catalog.ts';

export interface NodeInfo {
  type: CreateType | 'PAGE' | 'EXISTING'; depth: number; name: string; width?: number; height?: number; layout?: string; label?: string;
}
export interface Limits { maxNodes: number; maxDepth: number; maxSize: number }
export const DEFAULT_LIMITS: Limits = { maxNodes: 300, maxDepth: 12, maxSize: 20000 };

export interface ValidationCtx {
  limits: Limits;
  catalog?: Catalog;
  lookup(ref: string): NodeInfo | undefined;
  isDefined(id: string): boolean;
  created(): number;
}
export interface ValidationResult { op?: Op; diags: Diagnostic[] }

const ID_RE = /^[A-Za-z][A-Za-z0-9_]{0,31}$/;
const REF_RE = /^(?:[A-Za-z][A-Za-z0-9_]{0,31}\/)?[A-Za-z][A-Za-z0-9_]{0,31}$|^n:[A-Za-z0-9_-]+$/;
const VAR_RE = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/;
const SIZE_RE = /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/;
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RESERVED = new Set(['page', 'sel']);
const LAYOUTS: Record<string, string> = { H: 'HORIZONTAL', V: 'VERTICAL', GRID: 'GRID', NONE: 'NONE' };
const ALIGN = new Set(['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN']);
const H_CONS = new Set(['LEFT', 'RIGHT', 'LEFT_RIGHT', 'CENTER', 'SCALE']);
const V_CONS = new Set(['TOP', 'BOTTOM', 'TOP_BOTTOM', 'CENTER', 'SCALE']);
const TRIGGERS = new Set(['click', 'drag', 'hover', 'press', 'key', 'after', 'mouseEnter', 'mouseLeave']);
const TRANSITIONS = new Set(['instant', 'dissolve', 'smart', 'moveIn', 'moveOut', 'push', 'slideIn', 'slideOut']);
const EASINGS = new Set(['linear', 'easeIn', 'easeOut', 'easeInOut', 'easeInBack', 'easeOutBack', 'easeInOutBack', 'gentle', 'quick', 'bouncy', 'slow']);
const DIRS = new Set(['left', 'right', 'up', 'down']);
const BIND_KEYS: Record<string, string> = {
  fill: 'fill', stroke: 'stroke', radius: 'cornerRadius', gap: 'itemSpacing', w: 'width', h: 'height',
  opacity: 'opacity', sw: 'strokeWeight', text: 'characters', visible: 'visible', pad: 'padding',
};

function mk(op: RawOp) {
  const list: Diagnostic[] = [];
  const add = (severity: Diagnostic['severity'], code: string, message: string) =>
    list.push({ line: op.line, severity, code, message, raw: op.raw });
  return {
    list,
    err: (c: string, m: string) => add('error', c, m),
    warn: (c: string, m: string) => add('warn', c, m),
    hasError: () => list.some((d) => d.severity === 'error'),
  };
}
type D = ReturnType<typeof mk>;

function num(s: string | undefined): number | undefined {
  if (s === undefined || s.trim() === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function token(v: string, kinds: string[], key: string, ctx: ValidationCtx, d: D): PropValue | undefined {
  const name = v.slice(1);
  if (!ctx.catalog) return { token: name };
  const t = ctx.catalog.token(name);
  if (!t) {
    d.warn('unknown-token', `token $${name} is not in the catalogue; a wireframe fallback will be used`);
    return { token: name };
  }
  if (!kinds.includes(t.kind)) {
    d.warn('token-kind', `token $${name} is a ${t.kind} token and cannot be used for '${key}'; ignored`);
    return undefined;
  }
  return { token: name };
}

function paint(v: string, key: string, ctx: ValidationCtx, d: D): PropValue | undefined {
  if (v.startsWith('$')) return token(v, ['color'], key, ctx, d);
  if (HEX_RE.test(v)) return v.toUpperCase();
  d.err('bad-color', `${key} must be a $token or a hex color like #1A2B3C`);
  return undefined;
}

/** Convert op-language keys to canonical node props (Figma plugin API naming). */
export function readProps(named: Record<string, Arg>, ctx: ValidationCtx, d: D, skip: Set<string>): NodeProps {
  const out: NodeProps = {};
  const lim = ctx.limits;
  for (const [k, a] of Object.entries(named)) {
    if (skip.has(k)) continue;
    const v = a.value;
    switch (k) {
      case 'w':
      case 'h': {
        const horiz = k === 'w';
        const lower = v.toLowerCase();
        if (lower === 'fill' || lower === 'hug') {
          out[horiz ? 'layoutSizingHorizontal' : 'layoutSizingVertical'] = lower === 'fill' ? 'FILL' : 'HUG';
        } else {
          const n = num(v);
          if (n === undefined || n <= 0 || n > lim.maxSize) d.err('bad-size', `${k} must be fill, hug or a number between 0 and ${lim.maxSize}`);
          else {
            out[horiz ? 'width' : 'height'] = n;
            out[horiz ? 'layoutSizingHorizontal' : 'layoutSizingVertical'] = 'FIXED';
          }
        }
        break;
      }
      case 'x':
      case 'y': {
        const n = num(v);
        if (n === undefined || Math.abs(n) > 100000) d.err('bad-position', `${k} must be a number within +/-100000`);
        else out[k] = n;
        break;
      }
      case 'rotation': {
        const n = num(v);
        if (n === undefined) d.err('bad-number', 'rotation must be a number (degrees)'); else out.rotation = n;
        break;
      }
      case 'opacity': {
        const n = num(v);
        if (n === undefined || n < 0 || n > 1) d.err('bad-opacity', 'opacity must be between 0 and 1'); else out.opacity = n;
        break;
      }
      case 'sw': {
        const n = num(v);
        if (n === undefined || n < 0) d.err('bad-number', 'sw (stroke weight) must be >= 0'); else out.strokeWeight = n;
        break;
      }
      case 'radius': {
        if (v.startsWith('$')) { const t = token(v, ['radius'], k, ctx, d); if (t) out.cornerRadius = t; break; }
        const n = num(v);
        if (n === undefined || n < 0) d.err('bad-number', 'radius must be >= 0 or a $radius token'); else out.cornerRadius = n;
        break;
      }
      case 'gap': {
        if (v.startsWith('$')) { const t = token(v, ['space'], k, ctx, d); if (t) out.itemSpacing = t; break; }
        const n = num(v);
        if (n === undefined || n < 0) d.err('bad-number', 'gap must be >= 0 or a $space token'); else out.itemSpacing = n;
        break;
      }
      case 'pad': {
        if (v.startsWith('$')) { const t = token(v, ['space'], k, ctx, d); if (t) out.padding = t; break; }
        const parts = v.split(',').map((p) => num(p));
        if (![1, 2, 4].includes(parts.length) || parts.some((p) => p === undefined || p < 0)) { d.err('bad-pad', 'pad takes 1, 2 or 4 numbers (or a $space token)'); break; }
        const p = parts as number[];
        const [t, r, b, l] = p.length === 1 ? [p[0], p[0], p[0], p[0]] : p.length === 2 ? [p[0], p[1], p[0], p[1]] : p;
        out.paddingTop = t as number; out.paddingRight = r as number; out.paddingBottom = b as number; out.paddingLeft = l as number;
        break;
      }
      case 'fill': { const p = paint(v, k, ctx, d); if (p !== undefined) out.fill = p; break; }
      case 'stroke': { const p = paint(v, k, ctx, d); if (p !== undefined) out.stroke = p; break; }
      case 'layout': {
        const m = LAYOUTS[v.toUpperCase()];
        if (!m) d.err('bad-layout', 'layout must be H, V, GRID or NONE'); else out.layoutMode = m;
        break;
      }
      case 'align': {
        const parts = v.toUpperCase().split(',');
        if (parts.length > 2 || parts.some((p) => !ALIGN.has(p))) { d.err('bad-align', 'align must be MIN|CENTER|MAX|SPACE_BETWEEN[,MIN|CENTER|MAX]'); break; }
        out.primaryAxisAlignItems = parts[0] as string;
        if (parts[1]) out.counterAxisAlignItems = parts[1];
        break;
      }
      case 'clip':
      case 'visible': {
        if (v !== 'true' && v !== 'false') d.err('bad-bool', `${k} must be true or false`);
        else out[k === 'clip' ? 'clipsContent' : 'visible'] = v === 'true';
        break;
      }
      case 'style': {
        if (!v.startsWith('$')) { d.err('bad-style', 'style must be a $text token'); break; }
        const t = token(v, ['text'], k, ctx, d);
        if (t) out.textStyle = t;
        break;
      }
      case 'text': out.characters = v; break;
      case 'name': out.name = v; break;
      default: d.warn('unknown-key', `unknown property '${k}' ignored`);
    }
  }
  return out;
}

function needRef(a: Arg | undefined, ctx: ValidationCtx, d: D, what = 'node'): string | undefined {
  if (!a || !REF_RE.test(a.value)) { d.err('bad-ref', `expected a ${what} id`); return undefined; }
  if (!ctx.lookup(a.value)) { d.err('unknown-ref', `${a.value} is not defined`); return undefined; }
  return a.value;
}

function validateCreate(op: RawOp, type: CreateType, ctx: ValidationCtx, d: D): Op | undefined {
  const idArg = op.positional[0];
  if (!idArg || idArg.quoted || !ID_RE.test(idArg.value)) { d.err('bad-id', `${op.verb} needs a local id such as F1 as its first argument`); return undefined; }
  const id = idArg.value;
  if (RESERVED.has(id.toLowerCase())) { d.err('reserved-id', `${id} is a reserved name`); return undefined; }
  if (ctx.isDefined(id)) { d.err('duplicate-id', `id ${id} is already defined`); return undefined; }
  if (ctx.created() >= ctx.limits.maxNodes) { d.err('node-limit', `node limit of ${ctx.limits.maxNodes} reached`); return undefined; }

  const rest = op.positional.slice(1);
  const quoted = rest.filter((a) => a.quoted).map((a) => a.value);
  let size: [number, number] | undefined;
  for (const b of rest.filter((a) => !a.quoted)) {
    const m = SIZE_RE.exec(b.value);
    if (m) size = [Number(m[1]), Number(m[2])]; else d.warn('stray-arg', `unexpected argument '${b.value}' ignored`);
  }
  let name: string | undefined;
  let characters: string | undefined;
  if (type === 'TEXT') {
    characters = quoted[0];
    name = quoted[1];
    if (characters === undefined) { d.err('text-missing', "text needs quoted characters, e.g. text T1 'Hello'"); return undefined; }
  } else name = quoted[0];
  if (op.named.name) name = op.named.name.value;

  const parentRef = op.named.parent?.value ?? 'page';
  const parent = REF_RE.test(parentRef) ? ctx.lookup(parentRef) : undefined;
  if (!parent) { d.err('unknown-parent', `parent ${parentRef} is not defined yet (define parents before children)`); return undefined; }
  if (parent.type === 'INSTANCE') { d.err('instance-parent', 'cannot add children inside a component instance'); return undefined; }
  if (parent.type === 'TEXT' || parent.type === 'RECTANGLE' || parent.type === 'ELLIPSE') { d.err('leaf-parent', `${parentRef} cannot contain children`); return undefined; }
  if (type === 'SECTION' && parent.type !== 'PAGE') { d.err('section-parent', 'a section can only be placed on the page'); return undefined; }
  if (parent.depth + 1 > ctx.limits.maxDepth) { d.err('depth-limit', `nesting deeper than ${ctx.limits.maxDepth} levels`); return undefined; }

  const skip = new Set(['parent', 'name', 'comp', 'of']);
  let overrides: Record<string, string> | undefined;
  let comp: string | undefined;
  if (type === 'INSTANCE') {
    comp = op.named.comp?.value;
    if (!comp || !comp.startsWith('#')) { d.err('comp-missing', 'inst needs comp=#component.code'); return undefined; }
    if (ctx.catalog && !ctx.catalog.component(comp)) {
      const s = ctx.catalog.suggest('component', comp);
      d.warn('unknown-component', `component ${comp} is not in the catalogue${s ? ` (closest: ${s})` : ''}; a wireframe placeholder will be drawn`);
    }
    const styleKeys = new Set(['w', 'h', 'x', 'y', 'opacity', 'rotation', 'visible', 'parent', 'name', 'comp']);
    overrides = {};
    for (const [k, a] of Object.entries(op.named)) if (!styleKeys.has(k)) { overrides[k] = a.value; skip.add(k); }
  }
  let of: string[] | undefined;
  if (type === 'GROUP') {
    of = (op.named.of?.value ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!of.length) { d.err('group-empty', 'group needs of=ID1,ID2'); return undefined; }
    for (const r of of) if (!ctx.lookup(r)) { d.err('unknown-ref', `${r} is not defined`); return undefined; }
  }

  const props = readProps(op.named, ctx, d, skip);
  if (size) {
    const [w, h] = size;
    if (w <= 0 || h <= 0 || w > ctx.limits.maxSize || h > ctx.limits.maxSize) { d.err('bad-size', `size must be between 1 and ${ctx.limits.maxSize}`); return undefined; }
    props.width = w; props.height = h; props.layoutSizingHorizontal = 'FIXED'; props.layoutSizingVertical = 'FIXED';
  }
  delete props.name;
  const finalName = name ?? (type === 'TEXT' ? (characters ?? '').slice(0, 24) : `${type.toLowerCase()} ${id}`);
  return { kind: 'create', line: op.line, type, id, name: finalName, parent: parentRef, props, comp, characters, overrides, of };
}

function parseActions(args: Arg[], d: D): ActionSpec[] {
  const segs: Arg[][] = [[]];
  for (const a of args) {
    if (!a.key && !a.quoted && a.value === ';') segs.push([]);
    else (segs[segs.length - 1] as Arg[]).push(a);
  }
  const out: ActionSpec[] = [];
  for (const seg of segs) {
    const first = seg[0];
    if (!first) continue;
    const cmd = first.value.toLowerCase();
    const pos = seg.slice(1).filter((a) => !a.key);
    const named = seg.slice(1).filter((a) => a.key);
    switch (cmd) {
      case 'nav': case 'navigate': {
        const target = pos[0]?.value;
        if (!target) { d.err('action-target', 'nav needs a target frame id'); break; }
        const a: ActionSpec = { type: 'navigate', target };
        for (const t of pos.slice(1)) {
          if (TRANSITIONS.has(t.value)) a.transition = t.value;
          else if (/^\d+$/.test(t.value)) a.durationMs = Number(t.value);
          else if (EASINGS.has(t.value)) a.easing = t.value;
          else if (DIRS.has(t.value)) a.direction = t.value;
          else d.warn('action-arg', `unknown nav argument '${t.value}' ignored`);
        }
        out.push(a); break;
      }
      case 'back': out.push({ type: 'back' }); break;
      case 'close': out.push({ type: 'closeOverlay' }); break;
      case 'overlay': case 'swap': {
        const target = pos[0]?.value;
        if (!target) { d.err('action-target', `${cmd} needs a target frame id`); break; }
        out.push({ type: cmd === 'overlay' ? 'openOverlay' : 'swapOverlay', target, position: pos[1]?.value });
        break;
      }
      case 'link': {
        const url = pos[0]?.value;
        if (!url) d.err('action-url', "link needs a quoted url"); else out.push({ type: 'openLink', url });
        break;
      }
      case 'setvar': {
        const n = named[0];
        if (!n || !n.key) { d.err('action-var', "setvar needs name=expression, e.g. setvar count='count + 1'"); break; }
        out.push({ type: 'setVar', variable: n.key, expr: n.value });
        break;
      }
      case 'change': {
        const variant: Record<string, string> = {};
        for (const n of named) if (n.key) variant[n.key] = n.value;
        if (!Object.keys(variant).length) d.err('action-variant', 'change needs Property=Value pairs'); else out.push({ type: 'changeTo', variant });
        break;
      }
      default: d.err('action-unknown', `unknown action '${cmd}'`);
    }
  }
  return out;
}

export function validate(op: RawOp, ctx: ValidationCtx): ValidationResult {
  const d = mk(op);
  let out: Op | undefined;
  switch (op.verb) {
    case 'section': out = validateCreate(op, 'SECTION', ctx, d); break;
    case 'frame': out = validateCreate(op, 'FRAME', ctx, d); break;
    case 'rect': out = validateCreate(op, 'RECTANGLE', ctx, d); break;
    case 'ellipse': out = validateCreate(op, 'ELLIPSE', ctx, d); break;
    case 'text': out = validateCreate(op, 'TEXT', ctx, d); break;
    case 'inst': out = validateCreate(op, 'INSTANCE', ctx, d); break;
    case 'group': out = validateCreate(op, 'GROUP', ctx, d); break;
    case 'set': {
      const target = op.positional[0]?.value ?? '';
      const m = /^(.+)\.([A-Za-z]+)$/.exec(target);
      const val = op.positional[1];
      if (!m || !val) { d.err('bad-set', 'usage: set ID.prop value'); break; }
      const ref = m[1] as string;
      const prop = m[2] as string;
      const info = REF_RE.test(ref) ? ctx.lookup(ref) : undefined;
      if (!info) { d.err('unknown-ref', `${ref} is not defined`); break; }
      if (prop === 'text' && info.type !== 'TEXT') { d.err('not-text', `${ref} is not a text node`); break; }
      const props = readProps({ [prop]: val }, ctx, d, new Set());
      if (!Object.keys(props).length) { if (!d.hasError()) d.err('empty-set', `nothing to set for ${prop}`); break; }
      out = { kind: 'set', line: op.line, ref, props };
      break;
    }
    case 'layout': {
      const ref = needRef(op.positional[0], ctx, d);
      const mode = op.positional[1]?.value;
      if (!ref || !mode) { if (ref) d.err('bad-layout', 'usage: layout ID V|H|GRID|NONE [gap= pad= align=]'); break; }
      const props = readProps({ ...op.named, layout: { value: mode, quoted: false } }, ctx, d, new Set());
      out = { kind: 'set', line: op.line, ref, props };
      break;
    }
    case 'bind': {
      const m = /^(.+)\.([A-Za-z]+)$/.exec(op.positional[0]?.value ?? '');
      const variable = op.named.var?.value;
      if (!m || !variable) { d.err('bad-bind', 'usage: bind ID.prop var=name'); break; }
      const ref = m[1] as string;
      const key = BIND_KEYS[m[2] as string];
      if (!REF_RE.test(ref) || !ctx.lookup(ref)) { d.err('unknown-ref', `${ref} is not defined`); break; }
      if (!key) { d.err('bad-bind-prop', `cannot bind '${m[2]}'`); break; }
      if (!VAR_RE.test(variable)) { d.err('bad-var', 'variable names use letters, digits, dot, dash and underscore'); break; }
      out = { kind: 'bind', line: op.line, ref, prop: key, variable };
      break;
    }
    case 'style': {
      const ref = needRef(op.positional[0], ctx, d);
      const tok = op.positional[1]?.value;
      if (!ref) break;
      if (!tok || !tok.startsWith('$')) { d.err('bad-style', 'usage: style ID $token'); break; }
      if (ctx.catalog && !ctx.catalog.token(tok)) d.warn('unknown-token', `token ${tok} is not in the catalogue; ignored`);
      out = { kind: 'style', line: op.line, ref, token: tok.slice(1) };
      break;
    }
    case 'constraint': {
      const ref = needRef(op.positional[0], ctx, d);
      const h = op.named.h?.value?.toUpperCase();
      const v = op.named.v?.value?.toUpperCase();
      if (!ref) break;
      if ((h && !H_CONS.has(h)) || (v && !V_CONS.has(v))) { d.err('bad-constraint', 'h: LEFT|RIGHT|LEFT_RIGHT|CENTER|SCALE, v: TOP|BOTTOM|TOP_BOTTOM|CENTER|SCALE'); break; }
      out = { kind: 'constraint', line: op.line, ref, h, v };
      break;
    }
    case 'move': {
      const ref = needRef(op.positional[0], ctx, d);
      if (!ref) break;
      const x = num(op.named.x?.value);
      const y = num(op.named.y?.value);
      const index = num(op.named.index?.value);
      const parent = op.named.parent?.value;
      if (parent && !ctx.lookup(parent)) { d.err('unknown-parent', `parent ${parent} is not defined`); break; }
      out = { kind: 'move', line: op.line, ref, x, y, parent, index };
      break;
    }
    case 'del': {
      const ref = needRef(op.positional[0], ctx, d);
      if (ref) out = { kind: 'delete', line: op.line, ref };
      break;
    }
    case 'var': {
      const [n, t, val] = op.positional;
      const types = ['string', 'number', 'boolean', 'color'];
      if (!n || !VAR_RE.test(n.value) || !t || !types.includes(t.value)) { d.err('bad-var', "usage: var name string|number|boolean|color 'value'"); break; }
      out = { kind: 'variable', line: op.line, name: n.value, type: t.value as 'string' | 'number' | 'boolean' | 'color', value: val?.value ?? '' };
      break;
    }
    case 'note': {
      const [a, b] = op.positional;
      if (!a) { d.err('bad-note', "usage: note [ID] 'text'"); break; }
      if (b && !a.quoted && REF_RE.test(a.value) && ctx.lookup(a.value)) out = { kind: 'note', line: op.line, ref: a.value, text: b.value };
      else out = { kind: 'note', line: op.line, text: a.value };
      break;
    }
    case 'ix': {
      const plain = op.args.filter((a) => !a.key || a.key === 'when');
      const arrow = plain.findIndex((a) => !a.quoted && a.value === '->');
      if (arrow < 0) { d.err('bad-ix', 'usage: ix ID click|hover|press|drag|key K|after MS -> action [; action]'); break; }
      const head = plain.slice(0, arrow).filter((a) => !a.key);
      const ref = needRef(head[0], ctx, d);
      const trigger = head[1]?.value;
      if (!ref) break;
      if (!trigger || !TRIGGERS.has(trigger)) { d.err('bad-trigger', `trigger must be one of ${[...TRIGGERS].join(', ')}`); break; }
      let delayMs: number | undefined;
      let key: string | undefined;
      if (trigger === 'after') {
        delayMs = num(head[2]?.value);
        if (delayMs === undefined || delayMs < 0) { d.err('bad-delay', 'after needs a delay in ms'); break; }
      }
      if (trigger === 'key') { key = head[2]?.value; if (!key) { d.err('bad-key', 'key trigger needs a key name'); break; } }
      const actions = parseActions(op.args.slice(op.args.indexOf(plain[arrow] as Arg) + 1), d);
      if (!actions.length) { if (!d.hasError()) d.err('no-actions', 'ix needs at least one action after ->'); break; }
      const when = op.named.when?.value;
      out = { kind: 'interaction', line: op.line, ref, trigger, delayMs, key, when, actions };
      break;
    }
  }
  if (d.hasError()) out = undefined;
  return { op: out, diags: d.list };
}
