import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Catalog, DesignGenerator, FakeProvider, MemoryEngine, OllamaProvider, SYSTEM_PREFIX } from '../src/index.ts';

const raw = JSON.parse(readFileSync(new URL('../examples/catalog.json', import.meta.url), 'utf8'));
const catalog = new Catalog(raw.tokens, raw.components);
const md = readFileSync(new URL('../examples/example-brief.md', import.meta.url), 'utf8');
const sources = [{ name: 'brief.md', text: md }];

const SOCIAL = [
  'Here are the operations:',
  "inst g1 comp=#btn.secondary parent=s w=fill label='Continue with Google'",
  "text note1 'or' parent=s style=$text.caption",
].join('\n');

test('end to end: MD brief + prompt -> ghost design, model used only where needed', async () => {
  const eng = new MemoryEngine();
  const provider = new FakeProvider((req) => (JSON.stringify(req.messages).includes("section 'Social'") ? SOCIAL : ''));
  const gen = new DesignGenerator({ engine: eng, catalog, provider });
  const progress: string[] = [];
  const { session, report, plan } = await gen.run(
    { prompt: 'Generate the Login and Home screens', sources },
    { onUnit: (p) => progress.push(`${p.mode}:${p.label}`) },
  );
  assert.equal(provider.calls.length, 1, 'only the Social section (layout item) needs the model');
  assert.equal(provider.calls[0]?.messages[0]?.content, SYSTEM_PREFIX, 'system prefix is stable for KV-cache reuse');
  const user = provider.calls[0]?.messages[1]?.content ?? '';
  assert.match(user, /Continue with Google/);
  assert.match(user, /#btn\.secondary/);
  assert.match(user, /parent id: s/);
  assert.equal(provider.calls[0]?.think, false);

  assert.equal(report.modelUnits, 1);
  assert.ok(report.deterministicUnits >= 5);
  assert.equal(report.wireframes, 1, 'Account balance card is not in the catalogue');
  assert.deepEqual(report.missingComponents, ['#account.balance.card']);
  assert.equal(report.invalid, 0);
  assert.ok(progress.some((p) => p.startsWith('model:Login / Social')));
  assert.equal(plan.frames.size, 2);

  const tree = eng.dump();
  assert.match(tree, /SECTION 'Acme Banking App'/);
  assert.match(tree, /FRAME 'Login' 393x852/);
  assert.match(tree, /FRAME 'Home' 393x852/);
  assert.match(tree, /INSTANCE 'Button\/Primary' comp=cmp:btn.primary/);
  assert.match(tree, /component not available: account.balance.card/);
  assert.match(tree, /INSTANCE 'Button\/Secondary'/);

  const signIn = [...eng.nodes.values()].find((n) => n.componentProps?.label === 'Sign in');
  assert.equal(signIn?.interactions.length, 1);
  const home = [...eng.nodes.values()].find((n) => n.name === 'Home');
  assert.equal(signIn?.interactions[0]?.actions[0]?.targetId, home?.id);
  assert.equal(signIn?.interactions[0]?.actions[0]?.transition, 'smart');

  session.accept();
  assert.equal(eng.undo.length, 1);
});

test('prompt narrows the screens generated', async () => {
  const eng = new MemoryEngine();
  const gen = new DesignGenerator({ engine: eng, catalog, provider: new FakeProvider(() => SOCIAL) });
  const { report } = await gen.run({ prompt: 'Generate the Login screen only', sources });
  assert.match(eng.dump(), /FRAME 'Login'/);
  assert.ok(!eng.dump().includes("FRAME 'Home'"));
  assert.equal(report.unresolvedFlows.length, 0);
});

test('without a provider the deterministic parts still build and model-only parts are reported as skipped', async () => {
  const eng = new MemoryEngine();
  const { report } = await new DesignGenerator({ engine: eng, catalog }).run({ prompt: 'Generate the Login and Home screens', sources });
  assert.equal(report.modelUnits, 0);
  assert.ok(report.runNotes.some((n) => n.includes('Login / Social')));
  assert.match(eng.dump(), /Button\/Primary/);
});

test('one repair request re-emits only the rejected lines', async () => {
  const eng = new MemoryEngine();
  const provider = new FakeProvider((_req, call) =>
    call === 1
      ? ["inst x1 comp=#btn.secondary parent=zzz", "inst x2 comp=#btn.secondary parent=yyy", "inst x3 comp=#btn.secondary parent=www", "inst x4 comp=#btn.secondary parent=s label='Ok'"].join('\n')
      : ["inst x1 comp=#btn.secondary parent=s label='A'", "inst x2 comp=#btn.secondary parent=s label='B'", "inst x3 comp=#btn.secondary parent=s label='C'"].join('\n'),
  );
  const { report } = await new DesignGenerator({ engine: eng, catalog, provider }).run({ prompt: 'Generate the Login screen only', sources });
  assert.equal(provider.calls.length, 2);
  assert.equal(report.repairs, 1);
  const repairPrompt = provider.calls[1]?.messages.at(-1)?.content ?? '';
  assert.match(repairPrompt, /Re-emit ONLY corrected versions/);
  assert.match(repairPrompt, /parent=zzz/);
  assert.equal([...eng.nodes.values()].filter((n) => n.name === 'Button/Secondary').length, 4);
});

test('a failing model does not stop deterministic units; abort is honoured', async () => {
  const eng = new MemoryEngine();
  const broken = new FakeProvider(() => { throw new Error('connection refused'); });
  const { report } = await new DesignGenerator({ engine: eng, catalog, provider: broken }).run({ prompt: 'Generate the Login screen only', sources });
  assert.ok(report.runNotes.some((n) => n.includes('connection refused')));
  assert.match(eng.dump(), /Button\/Primary/);

  const ctl = new AbortController();
  ctl.abort();
  const eng2 = new MemoryEngine();
  const r2 = await new DesignGenerator({ engine: eng2, catalog }).run({ prompt: 'x', sources }, { signal: ctl.signal });
  assert.equal(r2.report.aborted, true);
  assert.equal(eng2.nodes.size, 0);
});

test('prompt only (no MD) generates from the prompt through the model', async () => {
  const eng = new MemoryEngine();
  const provider = new FakeProvider(() => "frame b 'Hero' parent=F1 w=fill h=hug layout=V\ntext t1 'Pricing' parent=b style=$text.h1");
  const { report } = await new DesignGenerator({ engine: eng, catalog, provider }).run({ prompt: 'A pricing page with three tiers', sources: [] });
  assert.equal(report.modelUnits, 1);
  assert.ok(report.planNotes.some((n) => n.includes('prompt only')));
  assert.match(eng.dump(), /FRAME 'Hero'/);
});

function ndjsonFetch(captured: { url?: string; body?: Record<string, unknown> }) {
  const lines = [
    JSON.stringify({ message: { content: 'frame F1' }, done: false }),
    JSON.stringify({ message: { content: " 'A'" }, done: false }),
    JSON.stringify({ message: { content: '' }, done: true, prompt_eval_count: 100, prompt_eval_duration: 2e9, eval_count: 10, eval_duration: 5e9, load_duration: 1e8 }),
  ].join('\n') + '\n';
  const bytes = new TextEncoder().encode(lines);
  return (async (url: string, init: { body: string }) => {
    captured.url = url;
    captured.body = JSON.parse(init.body);
    const stream = new ReadableStream({ start(c) { for (let i = 0; i < bytes.length; i += 9) c.enqueue(bytes.slice(i, i + 9)); c.close(); } });
    return new Response(stream, { status: 200 });
  }) as unknown as typeof fetch;
}

test('OllamaProvider streams NDJSON split mid-line, sends think:false and reports stats', async () => {
  const cap: { url?: string; body?: Record<string, unknown> } = {};
  const p = new OllamaProvider({ fetch: ndjsonFetch(cap) });
  let text = '';
  let stats;
  for await (const c of p.chat({ messages: [{ role: 'user', content: 'hi' }], numPredict: 50 })) { text += c.text; if (c.stats) stats = c.stats; }
  assert.equal(text, "frame F1 'A'");
  assert.deepEqual(stats, { promptTokens: 100, promptMs: 2000, genTokens: 10, genMs: 5000, loadMs: 100 });
  assert.equal(cap.url, 'http://127.0.0.1:11434/api/chat');
  assert.equal(cap.body?.model, 'qwen3.8:27b');
  assert.equal(cap.body?.think, false);
  assert.equal(cap.body?.stream, true);
  assert.deepEqual(cap.body?.options, { num_ctx: 8192, temperature: 0.2, num_predict: 50 });
});

test('calibrate derives tokens per second from Ollama timing fields', async () => {
  const p = new OllamaProvider({ fetch: ndjsonFetch({}) });
  const c = await p.calibrate();
  assert.equal(c.promptTps, 50);
  assert.equal(c.genTps, 2);
});
