import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Catalog, composeSection, mergeBriefs, parseBrief, parseFlowLine, parseItem, planWork, resolveDevice } from '../src/index.ts';

const raw = JSON.parse(readFileSync(new URL('../examples/catalog.json', import.meta.url), 'utf8'));
const catalog = new Catalog(raw.tokens, raw.components);
const md = readFileSync(new URL('../examples/example-brief.md', import.meta.url), 'utf8');

test('parseItem classifies bullets', () => {
  assert.deepEqual(parseItem('Button (primary): Sign in'), { text: 'Sign in', kind: 'component', component: 'Button', props: { variant: 'primary' }, checked: undefined });
  assert.deepEqual(parseItem('Input[type=email, label=Email]').props, { type: 'email', label: 'Email' });
  assert.equal(parseItem('Heading: Welcome').kind, 'copy');
  assert.equal(parseItem('[x] Heading: Done').checked, true);
  assert.equal(parseItem('Header with logo and a long description').kind, 'other');
  assert.equal(parseItem('On click: go home').kind, 'behavior');
  assert.equal(parseItem('Layout: stacked with gap').kind, 'layout');
});

test('flow lines carry the control used for each transition', () => {
  assert.deepEqual(parseFlowLine('Login -(Sign in)-> Home -> Settings'), [
    { screen: 'Login', via: undefined }, { screen: 'Home', via: 'Sign in' }, { screen: 'Settings', via: undefined },
  ]);
  assert.deepEqual(parseFlowLine('A -> B (via Next)')?.[1], { screen: 'B', via: 'Next' });
  assert.equal(parseFlowLine('no arrows here'), null);
});

test('example brief parses into screens, sections, rules, flows and meta', () => {
  const b = parseBrief(md);
  assert.equal(b.title, 'Acme Banking App');
  assert.equal(b.meta.device, 'iPhone 15');
  assert.deepEqual(b.screens.map((s) => s.name), ['Login', 'Home']);
  assert.equal(b.screens[0]?.role, 'Let returning users sign in');
  assert.deepEqual(b.screens[0]?.sections.map((s) => s.heading), ['Header', 'Form', 'Social']);
  assert.equal(b.rules.length, 2);
  assert.equal(b.tokens['color.primary'], 'brand blue');
  assert.equal(b.flows.length, 1);
  assert.equal(b.flows[0]?.[1]?.via, 'Sign in');
});

test('markdown tables, nested bullets, tokens fences and ops fences', () => {
  const doc = [
    '## Screen: Settings', '### Rows', '| Component | Text | Variant |', '| --- | --- | --- |', '| Checkbox | Notifications | |', '| Button | Save | primary |',
    '- Card', '  - Heading: Nested', '```ops', "rect R1 parent=F1 w=10 h=10", '```', '## Tokens', '```tokens', 'color.accent: #FF0000', '```',
  ].join('\n');
  const b = parseBrief(doc);
  const items = b.screens[0]?.sections[0]?.items ?? [];
  assert.equal(items[0]?.component, 'Checkbox');
  assert.equal(items[1]?.props?.variant, 'primary');
  assert.equal(items[2]?.children?.[0]?.text, 'Nested');
  assert.equal(b.screens[0]?.rawOps.length, 1);
  assert.equal(b.tokens['color.accent'], '#FF0000');
  assert.equal(mergeBriefs([b, b]).screens.length, 1);
});

test('devices resolve from presets or explicit sizes', () => {
  assert.deepEqual(resolveDevice('iPhone 15'), { w: 393, h: 852 });
  assert.deepEqual(resolveDevice('1280 x 720'), { w: 1280, h: 720 });
  assert.deepEqual(resolveDevice(undefined), { w: 390, h: 844 });
});

test('catalogue matching accepts head-noun matches and rejects unrelated ones', () => {
  assert.equal(catalog.matchComponent('Primary button')?.def.code, '#btn.primary');
  assert.equal(catalog.matchComponent('Button', { variant: 'secondary' })?.def.code, '#btn.secondary');
  assert.equal(catalog.matchComponent('Email input')?.def.code, '#input.text');
  assert.equal(catalog.matchComponent('Primary card'), null);
  assert.equal(catalog.matchComponent('Social login buttons'), null);
});

test('deterministic composer maps clean items and defers anything it cannot map', () => {
  const b = parseBrief(md);
  const form = b.screens[0]?.sections[1];
  const lines = composeSection('s', form?.items ?? [], catalog) ?? [];
  assert.equal(lines.length, 4);
  assert.match(lines[0] ?? '', /comp=#input\.text .*type='email'.*label='Email address'/);
  assert.match(lines[1] ?? '', /type='password'/);
  assert.match(lines[2] ?? '', /comp=#btn\.primary .*label='Sign in'/);
  assert.match(lines[3] ?? '', /^text t4 'Forgot password\?' parent=s w=fill style=\$text\.link/);
  assert.equal(composeSection('s', b.screens[0]?.sections[2]?.items ?? [], catalog), null);
});

test('plan: prompt selects screens, builds prelude, flags model units', () => {
  const b = parseBrief(md);
  const all = planWork(b, 'Generate the Login and Home screens', catalog);
  assert.equal(all.frames.size, 2);
  assert.equal(all.units.filter((u) => u.kind === 'flows').length, 1);
  const only = planWork(b, 'Generate the Login screen only', catalog);
  assert.equal(only.frames.size, 1);
  assert.equal(only.units.filter((u) => u.kind === 'flows').length, 0);
  const modelUnits = all.units.filter((u) => u.kind === 'section' && !u.lines);
  assert.equal(modelUnits.length, 1);
  assert.ok(all.notes.some((n) => n.includes('color.primary')) === false, 'color.primary exists in the catalogue');
  const prompted = planWork(parseBrief('just notes'), 'A pricing page with three tiers', catalog);
  assert.ok(prompted.notes[0]?.includes('prompt only'));
});
