import { VERBS } from '../types.ts';
import type { Arg, Diagnostic, RawOp, Verb } from '../types.ts';

/** Split a line into args. Strings may use 'single' or "double" quotes; key=value and key='quoted value' are supported. */
export function tokenize(line: string): { args: Arg[]; error?: string } {
  const args: Arg[] = [];
  let i = 0;
  const n = line.length;
  while (i < n) {
    const c = line.charAt(i);
    if (c === ' ' || c === '\t') { i++; continue; }
    let key: string | undefined;
    const m = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(line.slice(i));
    if (m && m[1]) { key = m[1]; i += m[0].length; }
    const q = line.charAt(i);
    if (q === "'" || q === '"') {
      i++;
      let out = '';
      let closed = false;
      while (i < n) {
        const ch = line.charAt(i);
        if (ch === '\\' && i + 1 < n) { out += line.charAt(i + 1); i += 2; continue; }
        if (ch === q) { closed = true; i++; break; }
        out += ch; i++;
      }
      if (!closed) return { args, error: 'unterminated quoted string' };
      args.push({ key, value: out, quoted: true });
    } else {
      let j = i;
      while (j < n && line.charAt(j) !== ' ' && line.charAt(j) !== '\t') j++;
      args.push({ key, value: line.slice(i, j), quoted: false });
      i = j;
    }
  }
  return { args };
}

export type ParsedLine =
  | { kind: 'op'; op: RawOp }
  | { kind: 'skip'; reason: 'blank' | 'fence-or-comment' | 'prose' }
  | { kind: 'error'; diag: Diagnostic };

const LIST_PREFIX = /^(?:[-*+]\s+|\d+[.)]\s+)/;
const VERB_SET = new Set<string>(VERBS);

export function parseLine(raw: string, lineNo: number): ParsedLine {
  let s = raw.trim();
  if (!s) return { kind: 'skip', reason: 'blank' };
  if (s.startsWith('```') || s.startsWith('#') || s.startsWith('//')) return { kind: 'skip', reason: 'fence-or-comment' };
  s = s.replace(LIST_PREFIX, '');
  const { args, error } = tokenize(s);
  const first = args[0];
  if (!first || first.key || first.quoted || !VERB_SET.has(first.value.toLowerCase())) return { kind: 'skip', reason: 'prose' };
  if (error) return { kind: 'error', diag: { line: lineNo, severity: 'error', code: 'syntax', message: error, raw } };
  const rest = args.slice(1);
  const named: Record<string, Arg> = {};
  const positional: Arg[] = [];
  for (const a of rest) {
    if (a.key) named[a.key] = a; else positional.push(a);
  }
  return { kind: 'op', op: { verb: first.value.toLowerCase() as Verb, args: rest, positional, named, line: lineNo, raw } };
}

/** Incremental line splitter for streamed model output (chunks may split lines anywhere). */
export class LineStream {
  private buf = '';
  push(chunk: string): string[] {
    this.buf += chunk;
    const parts = this.buf.split(/\r?\n/);
    this.buf = parts.pop() ?? '';
    return parts;
  }
  flush(): string[] {
    const rest = this.buf;
    this.buf = '';
    return rest.trim() ? [rest] : [];
  }
}
