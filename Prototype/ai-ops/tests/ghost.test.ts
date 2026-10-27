import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Catalog, DEFAULT_LIMITS, GhostSession, MemoryEngine, WIREFRAME_FILL } from '../src/index.ts';

const catalog = new Catalog(
  [
    { name: 'color.bg', kind: 'color', value: '#FFFFFF', variableId: 'var:bg' },
    { name: 'text.h1', kind: 'text', styleId: 'style:h1' },
    { name: 'space.md', kind: 'space', value: 16 },
  ],
  [{ id: 'cmp:btn', name: 'Button/Primary', code: '#btn.primary', props: { label: [] } }],
);

const script = [
  "section S1 'Demo' parent=page",
  "frame F1 'Login' 390x844 parent=S1 layout=V gap=$space.md fill=$color.bg",
  "text T1 'Hi there' parent=F1 style=$text.h1",
  "inst C1 comp=#btn.primary parent=F1 label='Go' color='red'",
  "inst C2 comp=#nope.thing parent=F1 w=200 h=50 label='Mystery'",
  'Sure! Here is more text that is not an op.',
  "rect R1 parent=Missing w=10 h=10",
].join('\n') + '\n';

function run(chunk: number) {
  const eng = new MemoryEngine();
  const s = new GhostSession(eng, catalog);
  for (let i = 0; i < script.length; i += chunk) s.push(script.slice(i, i + chunk));
  return { eng, s, report: s.end() };
}

test('streaming result is identical for any chunk size and shows ghosts immediately', () => {
  const a = run(3).eng.dump();
  assert.equal(a, run(11).eng.dump());
  assert.equal(a, run(500).eng.dump());
  assert.match(a, /SECTION 'Demo'/);
  assert.match(a, /FRAME 'Login' 390x844 layout=VERTICAL fill<-var:var:bg \(ghost\)/);
  assert.match(a, /TEXT 'Hi there' .*text<-style:style:h1/);
});

test('report counts ops, invalid lines, prose, wireframes and unknown component props', () => {
  const { report } = run(8);
  assert.equal(report.ops, 5);
  assert.equal(report.invalid, 1);
  assert.equal(report.skippedProse, 1);
  assert.equal(report.wireframes, 1);
  assert.deepEqual(report.missingComponents, ['#nope.thing']);
  assert.ok(report.diagnostics.some((d) => d.code === 'unknown-component-prop' && d.message.includes('color')));
  assert.ok(report.diagnostics.some((d) => d.code === 'unknown-parent'));
});

test('missing component becomes a labelled wireframe placeholder', () => {
  const { eng } = run(50);
  const ph = [...eng.nodes.values()].find((n) => n.name === 'component not available: nope.thing');
  assert.ok(ph);
  assert.equal(ph?.type, 'FRAME');
  assert.equal(ph?.props.width, 200);
  assert.equal(ph?.props.fill, WIREFRAME_FILL);
  assert.equal(ph?.children.length, 1);
  assert.equal(eng.nodes.get(ph?.children[0] ?? '')?.characters, 'component not available: nope.thing');
  assert.deepEqual(ph?.notes, ['component not available: nope.thing']);
});

test('accept commits one undo step; reject removes every ghost node', () => {
  const a = run(40);
  a.s.accept();
  assert.equal(a.eng.undo.length, 1);
  assert.ok(![...a.eng.nodes.values()].some((n) => n.ghost));
  assert.equal(a.s.state, 'accepted');

  const r = run(40);
  assert.ok(r.eng.nodes.size > 0);
  r.s.reject();
  assert.equal(r.eng.nodes.size, 0);
  assert.equal(r.eng.rootChildren.length, 0);
  assert.equal(r.s.state, 'rejected');
});

test('units are namespaced so sections can reuse ids; ix forward references resolve at the end', () => {
  const eng = new MemoryEngine();
  const s = new GhostSession(eng, catalog);
  s.beginUnit('');
  s.pushLines(["section S1 'D' parent=page", "frame F1 'A' 100x100 parent=S1", "frame F2 'B' 100x100 parent=S1"]);
  for (const ns of ['u1', 'u2']) {
    s.beginUnit(ns);
    s.pushLines(["text T1 'x' parent=F1", "inst B1 comp=#btn.primary parent=F1 label='Next'", 'ix B1 click -> nav F2 smart 200 easeOut ; nav F9']);
    s.endUnit();
  }
  const r = s.end();
  assert.equal(r.invalid, 2, 'the dangling F9 target is reported once per unit');
  assert.ok(r.diagnostics.some((d) => d.code === 'unresolved-target'));
  const ixNodes = [...eng.nodes.values()].filter((n) => n.interactions.length);
  assert.equal(ixNodes.length, 2);
  assert.equal(ixNodes[0]?.interactions[0]?.actions[0]?.targetId, [...eng.nodes.values()].find((n) => n.name === 'B')?.id);
  assert.equal(s.findByLabel('F1', 'next'), 'u1/B1');
});

test('node limit stops runaway output; repairHint asks only for rejected lines', () => {
  const eng = new MemoryEngine();
  const s = new GhostSession(eng, catalog, { limits: { ...DEFAULT_LIMITS, maxNodes: 3 } });
  s.beginUnit('u1');
  s.pushLines(["section S1 'D' parent=page", "frame F1 'A' parent=S1", "rect R1 parent=F1 w=1 h=1", "rect R2 parent=F1 w=1 h=1", "rect R3 parent=F1 w=1 h=1"]);
  assert.equal(s.report().created, 3);
  assert.equal(s.report().invalid, 2);
  const hint = s.repairHint();
  assert.ok(hint?.includes('node limit'));
  assert.ok(hint?.includes('Re-emit ONLY corrected versions'));
});

test('existing selection can be referenced and edited', () => {
  const eng = new MemoryEngine();
  const g = eng.beginGhost('seed');
  const sel = g.create({ type: 'FRAME', name: 'Existing', parent: 'PAGE', props: { width: 100, height: 100 } });
  g.commit();
  eng.selection = [sel];
  const s = new GhostSession(eng, catalog);
  s.pushLines([`text T1 'Added' parent=sel`, `set sel.radius 12`]);
  s.end();
  assert.equal(eng.nodes.get(sel)?.children.length, 1);
  assert.equal(eng.nodes.get(sel)?.props.cornerRadius, 12);
});
