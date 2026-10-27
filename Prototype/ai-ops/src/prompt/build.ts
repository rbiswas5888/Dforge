import type { Catalog } from '../catalog/catalog.ts';
import type { ChatMessage } from '../types.ts';
import type { ItemBrief } from '../brief/markdown.ts';

/** Static, prefix-stable system prompt (about 600 tokens). Never interpolate per-request data into it: Ollama reuses the KV cache for an unchanged prefix. */
export const SYSTEM_PREFIX = `You are the design generator inside a Figma-style editor. Output ONLY design operations, one per line, in the op language below. No prose, no code fences, no explanations.

Op language (strings use single quotes; key=value pairs; ids are short names starting with a letter):
section ID 'Name' parent=page
frame ID 'Name' WxH parent=ID layout=V|H|GRID|NONE gap=N|$token pad=N|N,N|N,N,N,N|$token fill=$token|#RRGGBB radius=N|$token w=fill|hug|N h=fill|hug|N align=MAIN[,CROSS]
rect ID parent=ID w=N h=N fill=... radius=...
ellipse ID parent=ID w=N h=N fill=...
text ID 'Characters' parent=ID style=$token fill=$token w=fill|hug
inst ID comp=#component parent=ID w=.. h=.. <property>=value   (extra key=value pairs set component properties)
group ID parent=ID of=ID1,ID2
set ID.prop value        (props: x y w h rotation opacity radius fill stroke sw visible clip gap layout align text name)
bind ID.prop var=name
style ID $token
layout ID V|H|GRID|NONE gap=N pad=N align=MAIN[,CROSS]
constraint ID h=LEFT|RIGHT|LEFT_RIGHT|CENTER|SCALE v=TOP|BOTTOM|TOP_BOTTOM|CENTER|SCALE
move ID x=N y=N parent=ID index=N
del ID
ix ID click|hover|press|drag|key K|after MS -> nav TARGET [smart|dissolve|instant|moveIn|moveOut|push|slideIn|slideOut] [MS] [easing] ; back ; overlay TARGET ; close ; swap TARGET ; link 'url' ; setvar name='expr' ; change Prop=Value
var name string|number|boolean|color 'value'
note ID 'text'

Rules:
1. Use ONLY tokens ($...) and components (#...) listed in the Catalogue. Never invent colors, sizes or components. If a needed component is missing, still emit inst with the best-named component (the editor draws a wireframe placeholder).
2. Define every id before using it as a parent. Put children inside the right frame with parent=.
3. Use auto layout (layout=V or H with gap and pad) instead of absolute x/y inside frames.
4. Keep copy exactly as written in the brief. Do not add features, screens or copy that the brief does not mention.
5. Be compact: one op per line, no repeated ids, nothing but ops.`;

export const estimateTokens = (s: string) => Math.ceil(s.length / 3.5);

export function renderItem(it: ItemBrief, depth = 0): string {
  const pad = '  '.repeat(depth);
  const props = it.props ? ' ' + Object.entries(it.props).map(([k, v]) => `${k}=${v}`).join(' ') : '';
  const head = it.kind === 'component' ? `component ${it.component ?? ''}${props}` : it.kind === 'copy' ? `copy(${it.role ?? 'text'})` : it.kind;
  const line = `${pad}- ${head}${it.text ? ': ' + it.text : ''}`;
  return [line, ...(it.children ?? []).map((c) => renderItem(c, depth + 1))].join('\n');
}

export interface SectionPromptInput {
  instruction: string; screen: string; frameId: string; frameSize: string; parentId: string; heading: string;
  items: ItemBrief[]; notes: string[]; rules: string[]; catalog: Catalog; ids: string; maxPromptTokens?: number;
}

export function buildSectionMessages(p: SectionPromptInput): ChatMessage[] {
  const max = p.maxPromptTokens ?? 1800;
  const query = `${p.screen} ${p.heading} ${p.items.map((i) => `${i.component ?? ''} ${i.text}`).join(' ')} ${p.instruction}`;
  let comps = 8, toks = 16, idLines = 30, ruleLines = 6;
  let content = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    const cat = p.catalog.digest(p.catalog.retrieve(query, comps, toks));
    const ids = p.ids.split('\n').slice(-idLines).join('\n');
    content = [
      '## Catalogue', cat,
      '## Existing ids', ids || '(none)',
      '## Global rules', p.rules.slice(0, ruleLines).map((r) => `- ${r}`).join('\n') || '(none)',
      `## Brief: screen '${p.screen}' (frame ${p.frameId}, ${p.frameSize}), section '${p.heading}' -> parent id: ${p.parentId}`,
      'Items:', p.items.map((i) => renderItem(i)).join('\n'),
      ...(p.notes.length ? ['Notes:', ...p.notes.slice(0, 6).map((n) => `- ${n}`)] : []),
      '## Instruction', p.instruction,
      `Emit operations for this section only. Children go inside ${p.parentId} (or frames you create inside it).`,
    ].join('\n');
    if (estimateTokens(SYSTEM_PREFIX + content) <= max) break;
    comps = Math.max(2, Math.floor(comps / 2)); toks = Math.max(4, Math.floor(toks / 2));
    idLines = Math.max(6, Math.floor(idLines / 2)); ruleLines = Math.max(2, ruleLines - 1);
  }
  return [{ role: 'system', content: SYSTEM_PREFIX }, { role: 'user', content }];
}

export function buildFlowMessages(p: { instruction: string; unresolved: string[]; frames: string; candidates: string; rules: string[] }): ChatMessage[] {
  const content = [
    '## Frames', p.frames,
    '## Interactive candidates (use these ids as the ix source)', p.candidates || '(none)',
    '## Transitions still to wire', p.unresolved.map((u) => `- ${u}`).join('\n'),
    '## Global rules', p.rules.map((r) => `- ${r}`).join('\n') || '(none)',
    '## Instruction', p.instruction,
    'Emit only ix operations (one per line) that wire the listed transitions: ix SOURCE click -> nav TARGETFRAME smart 300 easeInOut',
  ].join('\n');
  return [{ role: 'system', content: SYSTEM_PREFIX }, { role: 'user', content }];
}

export function buildRepairMessages(prev: ChatMessage[], output: string, hint: string): ChatMessage[] {
  return [...prev, { role: 'assistant', content: output }, { role: 'user', content: hint }];
}
