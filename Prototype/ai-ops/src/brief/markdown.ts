// Markdown design-brief reader: deterministic extraction of screens, sections, items, tokens, flows and authored ops.

export interface ItemBrief {
  text: string;
  kind: 'component' | 'copy' | 'layout' | 'behavior' | 'other';
  component?: string; role?: string; props?: Record<string, string>; checked?: boolean; children?: ItemBrief[];
}
export interface SectionBrief { heading: string; items: ItemBrief[]; notes: string[] }
export interface ScreenBrief { name: string; role?: string; sections: SectionBrief[]; notes: string[]; rawOps: string[] }
export interface FlowStep { screen: string; via?: string }
export interface DesignBrief {
  title?: string; meta: Record<string, string>; tokens: Record<string, string>; screens: ScreenBrief[];
  flows: FlowStep[][]; rules: string[]; questions: string[]; rawOps: string[]; notes: string[];
}

export const DEFAULT_DEVICES: Record<string, { w: number; h: number }> = {
  iphone: { w: 390, h: 844 }, 'iphone 15': { w: 393, h: 852 }, 'iphone 15 pro max': { w: 430, h: 932 },
  android: { w: 360, h: 800 }, pixel: { w: 412, h: 915 }, ipad: { w: 820, h: 1180 }, tablet: { w: 820, h: 1180 },
  desktop: { w: 1440, h: 1024 }, macbook: { w: 1440, h: 900 }, watch: { w: 184, h: 224 },
};

export function resolveDevice(spec: string | undefined, table = DEFAULT_DEVICES): { w: number; h: number } {
  const fallback = table.iphone ?? { w: 390, h: 844 };
  if (!spec) return fallback;
  const m = /(\d{2,5})\s*[x×]\s*(\d{2,5})/.exec(spec);
  if (m) return { w: Number(m[1]), h: Number(m[2]) };
  const s = spec.toLowerCase();
  const key = Object.keys(table).sort((a, b) => b.length - a.length).find((k) => s.includes(k));
  return key ? (table[key] as { w: number; h: number }) : fallback;
}

const COPY_ROLES = new Set(['text', 'heading', 'title', 'headline', 'subtitle', 'label', 'body', 'caption', 'copy', 'paragraph', 'link', 'description']);
const BEHAVIOR_RE = /^(on |when |if |after |tap |click |hover |navigates? |opens? |goes to)/i;
const LAYOUT_RE = /^(layout|stack|spacing|padding|gap|alignment|align|columns?|rows?|grid)\s*[:=-]/i;
const ITEM_RE = /^([^:[(]+?)\s*(?:\[([^\]]*)\]|\(([^)]*)\))?\s*(?::\s*(.*))?$/;

function parseProps(s: string | undefined): Record<string, string> | undefined {
  if (!s || !s.trim()) return undefined;
  const out: Record<string, string> = {};
  for (const part of s.split(',').map((p) => p.trim()).filter(Boolean)) {
    const eq = part.indexOf('=');
    if (eq > 0) out[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
    else out.variant = part;
  }
  return out;
}

export function parseItem(raw: string): ItemBrief {
  let t = raw.trim();
  let checked: boolean | undefined;
  const cb = /^\[( |x|X)\]\s+/.exec(t);
  if (cb) { checked = cb[1] !== ' '; t = t.slice(cb[0].length); }
  t = t.replace(/\*\*|__|`/g, '');
  if (LAYOUT_RE.test(t)) return { text: t, kind: 'layout', checked };
  if (BEHAVIOR_RE.test(t)) return { text: t, kind: 'behavior', checked };
  const m = ITEM_RE.exec(t);
  if (!m) return { text: t, kind: 'other', checked };
  const name = (m[1] ?? '').trim();
  const props = parseProps(m[2] ?? m[3]);
  const text = m[4]?.trim();
  if (COPY_ROLES.has(name.toLowerCase()) && text) return { text, kind: 'copy', role: name.toLowerCase(), checked };
  const short = name.split(/\s+/).length <= 3;
  if (name && (m[4] !== undefined || props || short)) return { text: text ?? '', kind: 'component', component: name, props, checked };
  return { text: t, kind: 'other', checked };
}

export function parseFlowLine(line: string): FlowStep[] | null {
  const t = line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '').replace(/[`*_]/g, '').trim();
  if (!t.includes('->')) return null;
  const steps: FlowStep[] = [];
  let pendingVia: string | undefined;
  for (const part of t.split('->').map((p) => p.trim())) {
    let name = part;
    let nextVia: string | undefined;
    let via: string | undefined;
    const out = /^(.*?)\s*-\(([^)]*)\)\s*$/.exec(name);
    if (out) { name = (out[1] ?? '').trim(); nextVia = (out[2] ?? '').trim(); }
    const v = /^(.*?)\s*\((?:via|tap|click)\s+([^)]*)\)\s*$/i.exec(name);
    if (v) { name = (v[1] ?? '').trim(); via = (v[2] ?? '').trim(); }
    steps.push({ screen: name, via: via ?? pendingVia });
    pendingVia = nextVia;
  }
  return steps.length >= 2 ? steps : null;
}

type Special = 'tokens' | 'rules' | 'flows' | 'questions' | 'notes';
const RESERVED: Record<string, Special> = {
  tokens: 'tokens', 'design tokens': 'tokens', rules: 'rules', constraints: 'rules', guidelines: 'rules',
  flows: 'flows', flow: 'flows', prototype: 'flows', 'user flow': 'flows', 'user flows': 'flows',
  'open questions': 'questions', questions: 'questions',
  overview: 'notes', goals: 'notes', audience: 'notes', brand: 'notes', notes: 'notes', context: 'notes',
};
const TOKEN_LINE = /^([\w.$-]+)\s*[:=]\s*(.+)$/;
const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function parseBrief(md: string): DesignBrief {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const brief: DesignBrief = { meta: {}, tokens: {}, screens: [], flows: [], rules: [], questions: [], rawOps: [], notes: [] };
  let i = 0;
  if ((lines[0] ?? '').trim() === '---') {
    let j = 1;
    while (j < lines.length && (lines[j] ?? '').trim() !== '---') {
      const m = /^([A-Za-z_][\w -]*):\s*(.*)$/.exec(lines[j] ?? '');
      if (m) brief.meta[(m[1] ?? '').trim().toLowerCase()] = (m[2] ?? '').trim();
      j++;
    }
    i = j + 1;
  }
  let screen: ScreenBrief | undefined;
  let section: SectionBrief | undefined;
  let special: Special | undefined;
  const stack: { indent: number; item: ItemBrief }[] = [];

  const ensureSection = (): { s: ScreenBrief; sec: SectionBrief } => {
    if (!screen) { screen = { name: 'Screen', sections: [], notes: [], rawOps: [] }; brief.screens.push(screen); }
    if (!section) { section = { heading: 'Content', items: [], notes: [] }; screen.sections.push(section); }
    return { s: screen, sec: section };
  };
  const addToken = (line: string) => {
    const m = TOKEN_LINE.exec(line.replace(/`/g, '').trim());
    if (m) brief.tokens[(m[1] ?? '').replace(/^\$/, '')] = (m[2] ?? '').trim();
  };

  const handle = (text: string, bullet: boolean, indent: number) => {
    if (special === 'tokens') return addToken(text);
    if (special === 'rules') { brief.rules.push(text); return; }
    if (special === 'questions') { brief.questions.push(text); return; }
    if (special === 'flows') { const f = parseFlowLine(text); if (f) brief.flows.push(f); else brief.notes.push(text); return; }
    if (special === 'notes' || !screen) { brief.notes.push(text); return; }
    if (!bullet) {
      const r = /^(?:role|purpose|goal)\s*:\s*(.+)$/i.exec(text);
      if (r && !section) { screen.role = r[1]; return; }
      (section ?? screen).notes.push(text);
      return;
    }
    const { sec } = ensureSection();
    const item = parseItem(text);
    while (stack.length && (stack[stack.length - 1] as { indent: number }).indent >= indent) stack.pop();
    const parent = stack[stack.length - 1];
    if (parent) (parent.item.children ??= []).push(item); else sec.items.push(item);
    stack.push({ indent, item });
  };

  const handleTable = (rows: string[][]) => {
    const body = rows.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c)));
    const header = (body[0] ?? []).map((c) => c.toLowerCase());
    const data = body.slice(1);
    if (special === 'tokens') {
      const ni = Math.max(0, header.findIndex((h) => h === 'name' || h === 'token'));
      const vi = Math.max(1, header.findIndex((h) => h === 'value'));
      for (const r of data) if (r[ni] && r[vi]) brief.tokens[(r[ni] ?? '').replace(/^\$/, '')] = r[vi] ?? '';
      return;
    }
    if (!screen || special) { for (const r of data) brief.notes.push(r.join(' | ')); return; }
    const ci = header.indexOf('component');
    const ti = header.findIndex((h) => ['text', 'label', 'copy', 'content'].includes(h));
    const pi = header.indexOf('props');
    if (ci < 0) { for (const r of data) screen.notes.push(r.join(' | ')); return; }
    const { sec } = ensureSection();
    for (const r of data) {
      const props: Record<string, string> = { ...(parseProps(pi >= 0 ? r[pi] : undefined) ?? {}) };
      header.forEach((h, idx) => { if (['variant', 'state', 'size', 'type'].includes(h) && r[idx]) props[h] = r[idx] as string; });
      sec.items.push({ text: ti >= 0 ? (r[ti] ?? '') : '', kind: 'component', component: r[ci], props: Object.keys(props).length ? props : undefined });
    }
  };

  while (i < lines.length) {
    const line = lines[i] ?? '';
    const t = line.trim();
    i++;
    if (!t) continue;
    const fence = /^```\s*([\w-]*)/.exec(t);
    if (fence) {
      const lang = (fence[1] ?? '').toLowerCase();
      const body: string[] = [];
      while (i < lines.length && !(lines[i] ?? '').trim().startsWith('```')) { body.push(lines[i] ?? ''); i++; }
      i++;
      if (lang === 'ops') (screen ? screen.rawOps : brief.rawOps).push(body.join('\n'));
      else if (lang === 'tokens') body.forEach(addToken);
      else if (lang === 'flow' || lang === 'flows') for (const b of body) { const f = parseFlowLine(b); if (f) brief.flows.push(f); }
      continue;
    }
    const h = /^(#{1,6})\s+(.*?)\s*#*$/.exec(t);
    if (h) {
      const level = (h[1] ?? '').length;
      const text = (h[2] ?? '').replace(/[*_`]/g, '').trim();
      stack.length = 0;
      if (level === 1) { brief.title ??= text; screen = undefined; section = undefined; special = undefined; continue; }
      if (level === 2) {
        section = undefined;
        const res = RESERVED[text.toLowerCase()];
        if (res) { special = res; screen = undefined; continue; }
        special = undefined;
        screen = { name: text.replace(/^screen\s*:\s*/i, ''), sections: [], notes: [], rawOps: [] };
        brief.screens.push(screen);
        continue;
      }
      if (screen && !special) { section = { heading: text, items: [], notes: [] }; screen.sections.push(section); }
      continue;
    }
    if (t.startsWith('|')) {
      const rows: string[][] = [];
      i--;
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('|')) { rows.push(cells(lines[i] ?? '')); i++; }
      handleTable(rows);
      continue;
    }
    const b = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (b) { handle((b[3] ?? '').trim(), true, (b[1] ?? '').replace(/\t/g, '  ').length); continue; }
    handle(t, false, 0);
  }
  brief.title ??= brief.meta.title;
  return brief;
}

export function mergeBriefs(list: DesignBrief[]): DesignBrief {
  const out: DesignBrief = { meta: {}, tokens: {}, screens: [], flows: [], rules: [], questions: [], rawOps: [], notes: [] };
  for (const b of list) {
    out.title ??= b.title;
    Object.assign(out.meta, b.meta);
    Object.assign(out.tokens, b.tokens);
    for (const s of b.screens) {
      const ex = out.screens.find((x) => x.name.toLowerCase() === s.name.toLowerCase());
      if (ex) { ex.sections.push(...s.sections); ex.notes.push(...s.notes); ex.rawOps.push(...s.rawOps); ex.role ??= s.role; }
      else out.screens.push(structuredClone(s));
    }
    out.flows.push(...b.flows); out.rules.push(...b.rules); out.questions.push(...b.questions);
    out.rawOps.push(...b.rawOps); out.notes.push(...b.notes);
  }
  return out;
}
