// Usage: node scripts/demo.ts <brief.md> "<prompt>" [--ollama]
// Runs the full pipeline against the in-memory reference engine and prints the resulting ghost tree and report.
import { readFileSync } from 'node:fs';
import { Catalog, DesignGenerator, FakeProvider, MemoryEngine, OllamaProvider } from '../src/index.ts';
import type { AIProvider, Calibration } from '../src/index.ts';

const args = process.argv.slice(2);
const useOllama = args.includes('--ollama');
const [briefPath, prompt = 'Generate the screens'] = args.filter((a) => !a.startsWith('--'));
if (!briefPath) { console.error('usage: node scripts/demo.ts <brief.md> "<prompt>" [--ollama]'); process.exit(1); }

const raw = JSON.parse(readFileSync(new URL('../examples/catalog.json', import.meta.url), 'utf8'));
const catalog = new Catalog(raw.tokens, raw.components);
const sources = [{ name: briefPath, text: readFileSync(briefPath, 'utf8') }];

let provider: AIProvider;
let calibration: Calibration | undefined;
if (useOllama) {
  const ollama = new OllamaProvider();
  const h = await ollama.health();
  if (!h.ok || !h.installed) { console.error('Ollama is not running or qwen3.8:27b is not pulled: ollama pull qwen3.8:27b'); process.exit(1); }
  console.log('Calibrating (one short request)...');
  calibration = await ollama.calibrate();
  console.log(`Measured: prompt ${calibration.promptTps.toFixed(1)} tok/s, generation ${calibration.genTps.toFixed(2)} tok/s`);
  provider = ollama;
} else {
  provider = new FakeProvider(() => "inst g1 comp=#btn.secondary parent=s w=fill label='Continue with Google'");
}

const engine = new MemoryEngine();
const gen = new DesignGenerator({ engine, catalog, provider, calibration });
const { session, report } = await gen.run({ prompt, sources }, {
  onUnit: (p) => console.log(`[${p.index + 1}/${p.total}] ${p.mode.padEnd(13)} ${p.label}${p.etaSeconds ? `  (~${p.etaSeconds}s)` : ''}`),
});
console.log('\n' + engine.dump());
console.log('\nReport:', JSON.stringify({
  ops: report.ops, created: report.created, deterministicUnits: report.deterministicUnits, modelUnits: report.modelUnits,
  repairs: report.repairs, wireframes: report.wireframes, missingComponents: report.missingComponents,
  missingTokens: report.missingTokens, invalid: report.invalid, planNotes: report.planNotes, runNotes: report.runNotes,
}, null, 2));
session.accept();
console.log(`\nAccepted as ${engine.undo.length} undo step.`);
