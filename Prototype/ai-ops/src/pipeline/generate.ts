import { GhostSession } from '../apply/ghost.ts';
import type { GhostOptions, GhostReport } from '../apply/ghost.ts';
import { composeSection } from '../brief/deterministic.ts';
import { mergeBriefs, parseBrief } from '../brief/markdown.ts';
import { norm, planWork } from '../brief/plan.ts';
import type { Plan, WorkUnit } from '../brief/plan.ts';
import type { Catalog } from '../catalog/catalog.ts';
import { buildFlowMessages, buildRepairMessages, buildSectionMessages, estimateTokens } from '../prompt/build.ts';
import type { AIProvider, Calibration, ChatMessage, EngineAdapter } from '../types.ts';

export interface SourceDoc { name: string; text: string }
export interface GenerateInput { prompt: string; sources: SourceDoc[] }
export interface UnitProgress { index: number; total: number; label: string; mode: 'deterministic' | 'model' | 'repair' | 'flows'; etaSeconds?: number }
export interface Hooks { onUnit?: (p: UnitProgress) => void; signal?: AbortSignal }
export interface GenerationReport extends GhostReport {
  deterministicUnits: number; modelUnits: number; repairs: number; unresolvedFlows: string[]; planNotes: string[]; runNotes: string[]; aborted: boolean;
}
export interface GeneratorDeps {
  engine: EngineAdapter; catalog: Catalog; provider?: AIProvider; calibration?: Calibration; ghost?: GhostOptions;
  devices?: Record<string, { w: number; h: number }>;
}

/** Accepts browser/Electron File objects or anything with name + text(). */
export async function loadSources(files: { name: string; text(): Promise<string> }[]): Promise<SourceDoc[]> {
  return Promise.all(files.map(async (f) => ({ name: f.name, text: await f.text() })));
}

export function wireFlows(plan: Plan, session: GhostSession): { lines: string[]; unresolved: string[] } {
  const lines: string[] = [];
  const unresolved: string[] = [];
  for (const flow of plan.brief.flows) {
    for (let j = 1; j < flow.length; j++) {
      const from = flow[j - 1];
      const to = flow[j];
      if (!from || !to) continue;
      const label = `${from.screen} -> ${to.screen}${to.via ? ` (${to.via})` : ''}`;
      const fromFrame = plan.frames.get(norm(from.screen));
      const toFrame = plan.frames.get(norm(to.screen));
      if (!fromFrame || !toFrame) { unresolved.push(label); continue; }
      const src = to.via ? session.findByLabel(fromFrame, to.via) : session.firstInstance(fromFrame, /button|btn|cta/i);
      if (!src) { unresolved.push(label); continue; }
      lines.push(`ix ${src} click -> nav ${toFrame} smart 300 easeInOut`);
    }
  }
  return { lines, unresolved };
}

export class DesignGenerator {
  private deps: GeneratorDeps;
  constructor(deps: GeneratorDeps) { this.deps = deps; }

  private eta(promptTok: number, outTok: number): number | undefined {
    const c = this.deps.calibration;
    return c && c.promptTps > 0 && c.genTps > 0 ? Math.round(promptTok / c.promptTps + outTok / c.genTps) : undefined;
  }

  private async stream(messages: ChatMessage[], session: GhostSession, numPredict: number, signal?: AbortSignal): Promise<string> {
    let out = '';
    for await (const c of (this.deps.provider as AIProvider).chat({ messages, numPredict, think: false, temperature: 0.2 }, signal)) {
      out += c.text;
      session.push(c.text);
      if (signal?.aborted) break;
    }
    session.endUnit();
    return out;
  }

  async run(input: GenerateInput, hooks: Hooks = {}): Promise<{ session: GhostSession; report: GenerationReport; plan: Plan }> {
    const docs = input.sources.filter((s) => /\.(md|markdown|txt)$/i.test(s.name));
    const brief = mergeBriefs((docs.length ? docs : input.sources).map((s) => parseBrief(s.text)));
    const plan = planWork(brief, input.prompt, this.deps.catalog, { devices: this.deps.devices });
    const session = new GhostSession(this.deps.engine, this.deps.catalog, this.deps.ghost);
    const { provider } = this.deps;
    const runNotes: string[] = [];
    let det = 0, mod = 0, repairs = 0, aborted = false;
    let unresolved: string[] = [];
    const total = plan.units.length;
    const progress = (index: number, label: string, mode: UnitProgress['mode'], etaSeconds?: number) =>
      hooks.onUnit?.({ index, total, label, mode, etaSeconds });

    for (let i = 0; i < total && !aborted; i++) {
      const u: WorkUnit = plan.units[i] as WorkUnit;
      if (hooks.signal?.aborted) { aborted = true; break; }
      try {
        if (u.kind === 'ops') {
          progress(i, u.label, 'deterministic');
          session.beginUnit(u.ns); session.pushLines(u.lines); session.endUnit(); det++;
        } else if (u.kind === 'section') {
          session.beginUnit(u.id);
          if (u.header.length) session.pushLines(u.header);
          const lines = u.lines ?? composeSection(u.parentId, u.items, this.deps.catalog) ?? undefined;
          if (lines) {
            progress(i, u.label, 'deterministic');
            session.pushLines(lines); session.endUnit(); det++;
          } else if (!provider) {
            runNotes.push(`Skipped '${u.label}': it needs a model and no provider is configured.`);
            session.endUnit();
          } else {
            const messages = buildSectionMessages({
              instruction: input.prompt, screen: u.screen, frameId: u.frameId, frameSize: u.frameSize, parentId: u.parentId,
              heading: u.heading, items: u.items, notes: u.notes, rules: plan.rules, catalog: this.deps.catalog, ids: session.describeIds(),
            });
            const numPredict = Math.min(400, Math.max(60, u.items.length * 20 + 40));
            progress(i, u.label, 'model', this.eta(estimateTokens(messages.map((m) => m.content).join('')), numPredict));
            const out = await this.stream(messages, session, numPredict, hooks.signal);
            mod++;
            const hint = session.repairHint();
            if (hint && !hooks.signal?.aborted) {
              repairs++;
              progress(i, u.label, 'repair');
              session.beginUnit(u.id);
              await this.stream(buildRepairMessages(messages, out, hint), session, 200, hooks.signal);
            }
          }
          session.endUnit();
        } else {
          progress(i, u.label, 'flows');
          const wired = wireFlows(plan, session);
          session.beginUnit(u.id); session.pushLines(wired.lines); session.endUnit();
          unresolved = wired.unresolved;
          if (unresolved.length && provider) {
            const candidates = [...plan.frames.values()].map((f) => `# ${f}\n${session.interactiveCandidates(f)}`).join('\n');
            const messages = buildFlowMessages({ instruction: input.prompt, unresolved, frames: session.describeIds(), candidates, rules: plan.rules });
            session.beginUnit(u.id);
            await this.stream(messages, session, 200, hooks.signal);
            mod++;
          } else if (unresolved.length) runNotes.push(`Could not wire: ${unresolved.join('; ')}`);
          det++;
        }
      } catch (e) {
        if (hooks.signal?.aborted || (e instanceof Error && e.name === 'AbortError')) { aborted = true; break; }
        session.endUnit();
        runNotes.push(`Model error in '${u.label}': ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    const base = session.end();
    const report: GenerationReport = {
      ...base, deterministicUnits: det, modelUnits: mod, repairs, unresolvedFlows: unresolved,
      planNotes: plan.notes, runNotes, aborted,
    };
    return { session, report, plan };
  }
}
