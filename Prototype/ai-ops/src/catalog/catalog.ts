// Design-file catalogue: tokens (variables/styles) and components, with fuzzy matching and relevance retrieval.

export type TokenKind = 'color' | 'text' | 'space' | 'radius' | 'effect' | 'number' | 'string' | 'boolean';
export interface TokenDef {
  name: string; kind: TokenKind; value?: string | number | boolean; variableId?: string; styleId?: string;
}
export interface ComponentDef {
  id: string; name: string; code: string; props?: Record<string, string[]>; keywords?: string[]; size?: { w: number; h: number };
}
export interface CatalogMatch { def: ComponentDef; score: number }

const SYN: Record<string, string> = {
  btn: 'button', cta: 'button', textfield: 'input', field: 'input', img: 'image', pic: 'image', picture: 'image',
  nav: 'navigation', navbar: 'navigation', topbar: 'header', appbar: 'header', pwd: 'password',
};

export function words(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((w) => SYN[w] ?? w);
}

function lev(a: string, b: string): number {
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0] ?? 0;
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j] ?? 0;
      dp[j] = Math.min((dp[j] ?? 0) + 1, (dp[j - 1] ?? 0) + 1, prev + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length] ?? 0;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');

export class Catalog {
  tokens: TokenDef[];
  components: ComponentDef[];
  private tokenMap = new Map<string, TokenDef>();
  private compMap = new Map<string, ComponentDef>();

  constructor(tokens: TokenDef[], components: ComponentDef[]) {
    this.tokens = tokens;
    this.components = components;
    for (const t of tokens) this.tokenMap.set(t.name.toLowerCase(), t);
    for (const c of components) this.compMap.set(c.code.replace(/^#/, '').toLowerCase(), c);
  }

  token(name: string): TokenDef | undefined {
    return this.tokenMap.get(name.replace(/^\$/, '').toLowerCase());
  }
  component(ref: string): ComponentDef | undefined {
    return this.compMap.get(ref.replace(/^#/, '').toLowerCase());
  }
  firstToken(names: string[], kind?: TokenKind): TokenDef | undefined {
    for (const n of names) {
      const t = this.token(n);
      if (t && (!kind || t.kind === kind)) return t;
    }
    return undefined;
  }
  tokensOfKind(kind: TokenKind): TokenDef[] {
    return this.tokens.filter((t) => t.kind === kind);
  }

  /** Fuzzy-match a brief's component name (+ props such as variant=primary) to a catalogue component. */
  matchComponent(query: string, props?: Record<string, string>): CatalogMatch | null {
    const qw = words(query);
    const head = qw[qw.length - 1];
    const pw = props ? words(Object.values(props).join(' ')) : [];
    const qAll = new Set([...qw, ...pw]);
    let best: CatalogMatch | null = null;
    for (const c of this.components) {
      const exact = words(c.name).join(' ') === qw.join(' ') || c.code.replace(/^#/, '').toLowerCase() === slug(query);
      const cw = new Set(words(`${c.name} ${c.code} ${(c.keywords ?? []).join(' ')}`));
      let inter = 0;
      for (const w of qAll) if (cw.has(w)) inter++;
      const coverage = qAll.size ? inter / qAll.size : 0;
      let score = exact ? 2 : head && cw.has(head) && inter > 0 ? coverage : 0;
      if (c.props && props) {
        for (const [k, v] of Object.entries(props)) {
          if (c.props[k]?.some((x) => x.toLowerCase() === v.toLowerCase())) score += 0.25;
        }
      }
      score -= 0.01 * Math.max(0, cw.size - inter);
      if (score >= 0.45 && (!best || score > best.score)) best = { def: c, score };
    }
    return best;
  }

  /** Relevance retrieval for prompt building (word overlap; no embeddings needed). */
  retrieve(query: string, maxComponents = 8, maxTokens = 16): { tokens: TokenDef[]; components: ComponentDef[] } {
    const qw = new Set(words(query));
    const overlap = (text: string) => words(text).filter((w) => qw.has(w)).length;
    const comps = [...this.components]
      .map((c) => ({ c, s: overlap(`${c.name} ${c.code} ${(c.keywords ?? []).join(' ')}`) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, maxComponents)
      .map((x) => x.c);
    const scored = [...this.tokens].map((t) => ({ t, s: overlap(t.name) + (t.kind === 'color' || t.kind === 'text' || t.kind === 'space' ? 0.5 : 0) }));
    scored.sort((a, b) => b.s - a.s);
    return { tokens: scored.slice(0, maxTokens).map((x) => x.t), components: comps };
  }

  digest(sel: { tokens: TokenDef[]; components: ComponentDef[] }): string {
    const t = sel.tokens.map((x) => `$${x.name}:${x.kind}${typeof x.value === 'string' || typeof x.value === 'number' ? '=' + String(x.value) : ''}`);
    const c = sel.components.map((x) => {
      const p = x.props ? ' [' + Object.entries(x.props).map(([k, v]) => `${k}(${v.join('|')})`).join(', ') + ']' : '';
      return `${x.code} '${x.name}'${p}`;
    });
    return ['Tokens:', ...t, 'Components:', ...c].join('\n');
  }

  suggest(kind: 'token' | 'component', name: string): string | undefined {
    const pool = kind === 'token' ? this.tokens.map((t) => '$' + t.name) : this.components.map((c) => c.code);
    const q = name.toLowerCase();
    let best: string | undefined;
    let bd = 4;
    for (const p of pool) {
      const d = lev(q, p.toLowerCase());
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
}
