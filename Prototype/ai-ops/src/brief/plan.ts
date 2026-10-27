import type { Catalog } from '../catalog/catalog.ts';
import { composeSection, q } from './deterministic.ts';
import { DEFAULT_DEVICES, resolveDevice } from './markdown.ts';
import type { DesignBrief, FlowStep, ItemBrief, ScreenBrief } from './markdown.ts';

export interface PromptHints { theme?: 'dark' | 'light'; device?: string; screens: string[] }

export function extractPromptHints(prompt: string, knownScreens: string[], devices = DEFAULT_DEVICES): PromptHints {
  const p = prompt.toLowerCase();
  const theme = /\bdark\b/.test(p) ? 'dark' : /\blight\b/.test(p) ? 'light' : undefined;
  const size = /(\d{3,4})\s*[x×]\s*(\d{3,4})/.exec(p);
  const key = Object.keys(devices).sort((a, b) => b.length - a.length).find((k) => p.includes(k));
  const screens = knownScreens.filter((s) => s && p.includes(s.toLowerCase()));
  return { theme, device: size ? size[0] : key, screens };
}

export type WorkUnit =
  | { kind: 'ops'; id: string; ns: string; label: string; lines: string[] }
  | {
      kind: 'section'; id: string; label: string; screen: string; frameId: string; frameSize: string; parentId: string;
      heading: string; items: ItemBrief[]; notes: string[]; header: string[]; lines?: string[];
    }
  | { kind: 'flows'; id: string; label: string; flows: FlowStep[][] };

export interface Plan {
  units: WorkUnit[]; frames: Map<string, string>; notes: string[]; rules: string[]; hints: PromptHints; brief: DesignBrief;
}
export interface PlanOptions { devices?: Record<string, { w: number; h: number }>; frameSpacing?: number }

export const norm = (s: string) => s.trim().toLowerCase();

export function planWork(briefIn: DesignBrief, prompt: string, catalog: Catalog, opts: PlanOptions = {}): Plan {
  const hints = extractPromptHints(prompt, briefIn.screens.map((s) => s.name), opts.devices);
  const notes: string[] = [];
  let screens: ScreenBrief[] = briefIn.screens;
  if (screens.length === 0) {
    screens = [{ name: hints.screens[0] ?? 'Screen', sections: [{ heading: 'Content', items: [{ text: prompt, kind: 'other' }], notes: [] }], notes: [], rawOps: [] }];
    notes.push('No screens found in the brief; generating from the prompt only.');
  } else if (hints.screens.length) {
    screens = screens.filter((s) => hints.screens.includes(s.name));
  }
  const dev = resolveDevice(briefIn.meta.device ?? hints.device, opts.devices);
  const spacing = opts.frameSpacing ?? 80;

  for (const name of Object.keys(briefIn.tokens)) {
    if (!catalog.token(name)) notes.push(`Brief mentions token $${name} but it is not in the design file; fallbacks will be used.`);
  }
  const bg = catalog.firstToken(['color.bg', 'color.background', 'color.surface', 'bg', 'background', 'surface'], 'color');
  const gapTok = catalog.firstToken(['space.md', 'spacing.md', 'space.4', 'space.16', 'spacing.4'], 'space');
  const padTok = catalog.firstToken(['space.lg', 'spacing.lg', 'space.6', 'space.24', 'spacing.6'], 'space');
  const gap = gapTok ? '$' + gapTok.name : '16';
  const pad = padTok ? '$' + padTok.name : '24';
  if (!gapTok || !padTok) notes.push('No spacing tokens found; used default gap 16 and padding 24.');

  const frames = new Map<string, string>();
  const prelude = [`section S1 ${q(briefIn.title ?? 'Generated design')} parent=page`];
  screens.forEach((s, i) => {
    const id = `F${i + 1}`;
    frames.set(norm(s.name), id);
    prelude.push(`frame ${id} ${q(s.name)} ${dev.w}x${dev.h} parent=S1 x=${i * (dev.w + spacing)} y=0 layout=V gap=${gap} pad=${pad}${bg ? ' fill=$' + bg.name : ''}`);
  });
  const units: WorkUnit[] = [{ kind: 'ops', id: 'prelude', ns: '', label: 'Section and screen frames', lines: prelude }];

  let n = 0;
  screens.forEach((s, si) => {
    const frameId = `F${si + 1}`;
    s.rawOps.forEach((block) => units.push({ kind: 'ops', id: `r${++n}`, ns: `r${n}`, label: `Authored ops for ${s.name}`, lines: block.split('\n') }));
    for (const sec of s.sections) {
      const items = sec.items.filter((it) => !it.checked);
      if (!items.length) continue;
      const id = `u${++n}`;
      const named = norm(sec.heading) !== 'content';
      const parentId = named ? 's' : frameId;
      const header = named ? [`frame s ${q(sec.heading)} parent=${frameId} layout=V gap=${gap} w=fill h=hug`] : [];
      units.push({
        kind: 'section', id, label: `${s.name} / ${sec.heading}`, screen: s.name, frameId, frameSize: `${dev.w}x${dev.h}`, parentId,
        heading: sec.heading, items, notes: [...s.notes, ...sec.notes], header, lines: composeSection(parentId, items, catalog) ?? undefined,
      });
    }
  });
  briefIn.rawOps.forEach((block) => units.push({ kind: 'ops', id: `r${++n}`, ns: `r${n}`, label: 'Authored ops', lines: block.split('\n') }));
  if (briefIn.flows.length && screens.length > 1) units.push({ kind: 'flows', id: 'flows', label: 'Prototype flows', flows: briefIn.flows });

  const rules = [...briefIn.rules];
  if (hints.theme) rules.push(`Theme: ${hints.theme}`);
  return { units, frames, notes, rules, hints, brief: briefIn };
}
