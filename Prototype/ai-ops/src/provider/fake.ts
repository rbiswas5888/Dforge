import type { AIProvider, ChatChunk, ChatRequest } from '../types.ts';

/** Scripted provider for tests and offline demos. Chunks split text at arbitrary positions, like a real token stream. */
export class FakeProvider implements AIProvider {
  id = 'fake';
  calls: ChatRequest[] = [];
  private script: (req: ChatRequest, call: number) => string;
  private chunkSize: number;
  constructor(script: (req: ChatRequest, call: number) => string, chunkSize = 7) {
    this.script = script;
    this.chunkSize = chunkSize;
  }
  async *chat(req: ChatRequest): AsyncGenerator<ChatChunk> {
    this.calls.push(req);
    const text = this.script(req, this.calls.length);
    for (let i = 0; i < text.length; i += this.chunkSize) yield { text: text.slice(i, i + this.chunkSize), done: false };
    yield { text: '', done: true, stats: { promptTokens: 0, promptMs: 0, genTokens: 0, genMs: 0, loadMs: 0 } };
  }
}
