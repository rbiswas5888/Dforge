// No-model composition: turns brief items that map cleanly onto catalogue components/copy into op lines.
import type { Catalog } from '../catalog/catalog.ts';
import type { ItemBrief } from './markdown.ts';

export const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const BODY = ['text.body', 'text.paragraph', 'type.body'];
const H1 = ['text.h1', 'text.heading', 'text.title', 'type.h1'];
const ROLE_TOKENS: Record<string, string[]> = {
  heading: H1, title: H1, headline: H1,
  subtitle: ['text.h2', 'text.subtitle', 'text.subheading'],
  body: BODY, text: BODY, copy: BODY, paragraph: BODY, description: BODY,
  caption: ['text.caption', 'text.small'], label: ['text.label', 'text.caption', ...BODY], link: ['text.link', ...BODY],
};

export function copyStyle(role: string | undefined, catalog: Catalog): string | undefined {
  const names = ROLE_TOKENS[(role ?? 'body').toLowerCase()] ?? BODY;
  const t = catalog.firstToken(names, 'text');
  return t ? '$' + t.name : undefined;
}

/**
 * Returns op lines when every item is plain copy or a component reference; null when the section needs the model
 * (layout/behavior/free-text items or nested children). Unknown components are still emitted: the applier draws a
 * wireframe placeholder for them, so this path needs no model either.
 */
export function composeSection(parent: string, items: ItemBrief[], catalog: Catalog): string[] | null {
  const lines: string[] = [];
  let n = 0;
  for (const it of items) {
    if (it.checked) continue;
    if (it.children && it.children.length) return null;
    if (it.kind === 'copy') {
      const style = copyStyle(it.role, catalog);
      lines.push(`text t${++n} ${q(it.text)} parent=${parent} w=fill${style ? ' style=' + style : ''}`);
    } else if (it.kind === 'component' && it.component) {
      const m = catalog.matchComponent(it.component, it.props);
      const code = m ? m.def.code : '#' + it.component.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
      const kv: string[] = [];
      const defProps = m?.def.props;
      if (defProps) {
        for (const [k, v] of Object.entries(it.props ?? {})) {
          const has = (pk: string) => defProps[pk]?.some((x) => x.toLowerCase() === v.toLowerCase());
          // 'Input (email)' gives variant=email; map it onto whichever component property lists that value
          const key = has(k) ? k : Object.keys(defProps).find(has);
          if (key && !kv.some((e) => e.startsWith(key + '='))) kv.push(`${key}=${q(v)}`);
        }
        if (it.text) {
          const tp = ['label', 'text', 'title', 'placeholder'].find((p) => p in defProps);
          if (tp) kv.push(`${tp}=${q(it.text)}`);
        }
      } else if (it.text) kv.push(`label=${q(it.text)}`);
      lines.push(`inst c${++n} comp=${code} parent=${parent} w=fill ${kv.join(' ')}`.trimEnd());
    } else return null;
  }
  return lines.length ? lines : null;
}
