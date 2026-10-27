import type { AIProvider, Calibration, ChatChunk, ChatRequest } from '../types.ts';

export interface OllamaOptions {
  baseUrl?: string; model?: string; numCtx?: number; temperature?: number; keepAlive?: string; think?: boolean;
  fetch?: typeof fetch;
}

/** Streams from a local Ollama server. Interactive calls default to think:false (thinking is on by default for this model). */
export class OllamaProvider implements AIProvider {
  id = 'ollama';
  private baseUrl: string;
  private model: string;
  private numCtx: number;
  private temperature: number;
  private keepAlive: string;
  private think: boolean;
  private fetchFn: typeof fetch;

  constructor(opts: OllamaOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? 'http://127.0.0.1:11434').replace(/\/$/, '');
    this.model = opts.model ?? 'qwen3.8:27b';
    this.numCtx = opts.numCtx ?? 8192;
    this.temperature = opts.temperature ?? 0.2;
    this.keepAlive = opts.keepAlive ?? '30m';
    this.think = opts.think ?? false;
    this.fetchFn = opts.fetch ?? fetch;
  }

  async health(): Promise<{ ok: boolean; installed: boolean; loaded: boolean }> {
    try {
      const tags = (await (await this.fetchFn(`${this.baseUrl}/api/tags`)).json()) as { models?: { name: string }[] };
      const installed = !!tags.models?.some((m) => m.name === this.model || m.name.startsWith(this.model + ':'));
      let loaded = false;
      try {
        const ps = (await (await this.fetchFn(`${this.baseUrl}/api/ps`)).json()) as { models?: { name: string }[] };
        loaded = !!ps.models?.some((m) => m.name === this.model);
      } catch { /* ps is optional */ }
      return { ok: true, installed, loaded };
    } catch {
      return { ok: false, installed: false, loaded: false };
    }
  }

  async *chat(req: ChatRequest, signal?: AbortSignal): AsyncGenerator<ChatChunk> {
    const body = {
      model: this.model, messages: req.messages, stream: true, think: req.think ?? this.think, keep_alive: this.keepAlive,
      options: { num_ctx: this.numCtx, temperature: req.temperature ?? this.temperature, ...(req.numPredict ? { num_predict: req.numPredict } : {}) },
    };
    const res = await this.fetchFn(`${this.baseUrl}/api/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal,
    });
    if (!res.ok || !res.body) throw new Error(`Ollama ${res.status}: ${await res.text().catch(() => '')}`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (line) for (const c of this.parse(line)) yield c;
      }
    }
    if (buf.trim()) for (const c of this.parse(buf.trim())) yield c;
  }

  private parse(line: string): ChatChunk[] {
    const o = JSON.parse(line) as {
      error?: string; done?: boolean; message?: { content?: string };
      prompt_eval_count?: number; prompt_eval_duration?: number; eval_count?: number; eval_duration?: number; load_duration?: number;
    };
    if (o.error) throw new Error(`Ollama: ${o.error}`);
    const chunk: ChatChunk = { text: o.message?.content ?? '', done: !!o.done };
    if (o.done) {
      chunk.stats = {
        promptTokens: o.prompt_eval_count ?? 0, promptMs: (o.prompt_eval_duration ?? 0) / 1e6,
        genTokens: o.eval_count ?? 0, genMs: (o.eval_duration ?? 0) / 1e6, loadMs: (o.load_duration ?? 0) / 1e6,
      };
    }
    return [chunk];
  }

  /** Measures real prompt-processing and generation speed. Budgets and ETAs should come from this, not from estimates. */
  async calibrate(signal?: AbortSignal): Promise<Calibration> {
    const filler = Array.from({ length: 30 }, () => 'The quick brown fox jumps over the lazy dog near the quiet river bank.').join(' ');
    let stats;
    for await (const c of this.chat({
      messages: [{ role: 'system', content: 'Answer in one short sentence.' }, { role: 'user', content: `${filler}\nHow many foxes are mentioned?` }],
      numPredict: 24, think: false, temperature: 0,
    }, signal)) if (c.stats) stats = c.stats;
    if (!stats) throw new Error('Ollama returned no timing stats');
    return {
      promptTps: stats.promptMs > 0 ? stats.promptTokens / (stats.promptMs / 1000) : 0,
      genTps: stats.genMs > 0 ? stats.genTokens / (stats.genMs / 1000) : 0,
      measuredAt: Date.now(),
    };
  }
}
