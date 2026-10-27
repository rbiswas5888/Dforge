import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Catalog, DEFAULT_LIMITS, LineStream, parseLine, tokenize, validate } from '../src/index.ts';
import type { NodeInfo, RawOp, ValidationCtx } from '../src/index.ts';

const catalog = new Catalog(
  [
    { name: 'color.bg', kind: 'color', value: '#FFFFFF' },
    { name: 'text.h1', kind: 'text' },
    { name: 'space.md', kind: 'space', value: 16 },
  ],
  [{ id: 'c1', name: 'Button/Primary', code: '#btn.primary', props: { label: [] } }],
);

function ctx(ids: Record<string, NodeInfo> = {}, cat: Catalog | undefined = catalog): ValidationCtx {
  return {
    limits: DEFAULT_LIMITS, catalog: cat,
    lookup: (r) => (r === 'page' ? { type: 'PAGE', depth: 0, name: 'page' } : ids[r]),
    isDefined: (id) => id in ids,
    created: () => Object.keys(ids).length,
  };
}
const F1: NodeInfo = { type: 'FRAME', depth: 1, name: 'F1' };
function v(line: string, c: ValidationCtx = ctx({ F1 })) {
  const p = parseLine(line, 1);
  assert.equal(p.kind, 'op');
  return validate((p as { kind: 'op'; op: RawOp }).op, c);
}
const codes = (r: ReturnType<typeof v>) => r.diags.map((d) => d.code);

test('tokenizer handles quotes, escapes and key=value', () => {
  const t = tokenize("text T1 'Don\\'t stop' parent=F1 label=\"Sign in\" note='a b' x=1");
  assert.deepEqual(t.args.map((a) => a.value), ['text', 'T1', "Don't stop", 'F1', 'Sign in', 'a b', '1']);
  assert.equal(t.args[3]?.key, 'parent');
  assert.equal(t.args[4]?.quoted, true);
  assert.equal(tokenize("text T1 'oops").error, 'unterminated quoted string');
});

test('parseLine skips prose, fences and comments; strips list markers', () => {
  assert.equal(parseLine('Here is your design:', 1).kind, 'skip');
  assert.equal(parseLine('```', 2).kind, 'skip');
  assert.equal(parseLine('# comment', 3).kind, 'skip');
  const p = parseLine("- frame F1 'Login' 390x844", 4);
  assert.equal(p.kind, 'op');
  assert.equal(parseLine("frame F1 'oops", 5).kind, 'error');
});

test('LineStream reassembles lines split across chunks', () => {
  const s = new LineStream();
  const out = [...s.push('frame F1 '), ...s.push("'A' 10x10\nrect R"), ...s.push('1 parent=F1\r\nlast'), ...s.flush()];
  assert.deepEqual(out, ["frame F1 'A' 10x10", 'rect R1 parent=F1', 'last']);
});

test('frame with size, layout, token props validates and normalises', () => {
  const r = v("frame F2 'Card' 320x200 parent=F1 layout=V gap=$space.md pad=8,16 fill=$color.bg radius=12", ctx({ F1 }));
  assert.equal(r.diags.filter((d) => d.severity === 'error').length, 0);
  const op = r.op;
  assert.equal(op?.kind, 'create');
  if (op?.kind !== 'create') return;
  assert.equal(op.props.width, 320);
  assert.equal(op.props.layoutMode, 'VERTICAL');
  assert.deepEqual(op.props.itemSpacing, { token: 'space.md' });
  assert.equal(op.props.paddingTop, 8);
  assert.equal(op.props.paddingLeft, 16);
  assert.deepEqual(op.props.fill, { token: 'color.bg' });
});

test('structural errors are rejected with clear codes', () => {
  assert.ok(codes(v("frame F1 'Dup' parent=page", ctx({ F1 }))).includes('duplicate-id'));
  assert.ok(codes(v("rect R1 parent=Nope w=10 h=10")).includes('unknown-parent'));
  assert.ok(codes(v("rect R1 parent=T9 w=10 h=10", ctx({ T9: { type: 'TEXT', depth: 2, name: 't' } }))).includes('leaf-parent'));
  assert.ok(codes(v("section S2 'x' parent=F1")).includes('section-parent'));
  assert.ok(codes(v("frame F2 'Huge' 99999x10 parent=F1")).includes('bad-size'));
  assert.ok(codes(v("frame F2 'Deep' parent=F1", ctx({ F1: { type: 'FRAME', depth: 12, name: 'F1' } }))).includes('depth-limit'));
  assert.ok(codes(v("rect R1 parent=F1 layout=Z")).includes('bad-layout'));
});

test('unknown tokens and components warn but keep the op (fallback happens at apply time)', () => {
  const a = v("rect R1 parent=F1 w=10 h=10 fill=$color.nope");
  assert.ok(a.op);
  assert.ok(codes(a).includes('unknown-token'));
  const b = v("inst C1 comp=#btn.primry parent=F1");
  assert.ok(b.op);
  assert.ok(b.diags.find((d) => d.code === 'unknown-component')?.message.includes('#btn.primary'));
  const c = v("rect R1 parent=F1 w=10 h=10 fill=$text.h1");
  assert.ok(codes(c).includes('token-kind'));
  assert.ok(c.op?.kind === 'create' && c.op.props.fill === undefined, 'mismatched token is dropped');
});

test('inst collects extra key=value pairs as component property overrides', () => {
  const r = v("inst C1 comp=#btn.primary parent=F1 w=fill label='Sign in' size=L");
  const op = r.op;
  assert.equal(op?.kind, 'create');
  if (op?.kind !== 'create') return;
  assert.deepEqual(op.overrides, { label: 'Sign in', size: 'L' });
  assert.equal(op.props.layoutSizingHorizontal, 'FILL');
});

test('set, layout, bind, style, ix', () => {
  const c = ctx({ F1, T1: { type: 'TEXT', depth: 2, name: 'T1' } });
  const s = v('set F1.radius 16', c).op;
  assert.equal(s?.kind === 'set' && s.props.cornerRadius, 16);
  assert.ok(codes(v("set F1.text 'x'", c)).includes('not-text'));
  const l = v('layout F1 H gap=8 align=CENTER,CENTER', c).op;
  assert.equal(l?.kind === 'set' && l.props.layoutMode, 'HORIZONTAL');
  assert.equal(v('bind F1.fill var=color.primary', c).op?.kind, 'bind');
  assert.equal(v('style T1 $text.h1', c).op?.kind, 'style');
  const ix = v("ix F1 click -> nav F9 smart 300 easeOut ; setvar count='count + 1'", c).op;
  assert.equal(ix?.kind, 'interaction');
  if (ix?.kind !== 'interaction') return;
  assert.equal(ix.actions.length, 2);
  assert.deepEqual(ix.actions[0], { type: 'navigate', target: 'F9', transition: 'smart', durationMs: 300, easing: 'easeOut' });
  assert.deepEqual(ix.actions[1], { type: 'setVar', variable: 'count', expr: 'count + 1' });
  assert.ok(codes(v('ix F1 click -> fly F2', c)).includes('action-unknown'));
  assert.ok(codes(v('ix F1 wiggle -> back', c)).includes('bad-trigger'));
});
