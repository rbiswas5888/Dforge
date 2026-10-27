// Shared types for the ai-ops package. Erasable TypeScript only (runs under Node type stripping).

export const VERBS = [
  'section', 'frame', 'rect', 'ellipse', 'text', 'inst', 'group',
  'set', 'bind', 'style', 'layout', 'constraint', 'move', 'del', 'ix', 'var', 'note',
] as const;
export type Verb = (typeof VERBS)[number];

export interface TokenRef { token: string }
export type PropValue = number | string | boolean | TokenRef;
export type NodeProps = Record<string, PropValue>;
export function isTokenRef(v: unknown): v is TokenRef {
  return typeof v === 'object' && v !== null && 'token' in v;
}

export interface Arg { key?: string; value: string; quoted: boolean }
export interface RawOp {
  verb: Verb; args: Arg[]; positional: Arg[]; named: Record<string, Arg>; line: number; raw: string;
}

export type Severity = 'error' | 'warn' | 'info';
export interface Diagnostic { line: number; severity: Severity; code: string; message: string; raw?: string }

export type CreateType = 'SECTION' | 'FRAME' | 'RECTANGLE' | 'ELLIPSE' | 'TEXT' | 'INSTANCE' | 'GROUP';

export interface ActionSpec {
  type: 'navigate' | 'back' | 'openOverlay' | 'swapOverlay' | 'closeOverlay' | 'openLink' | 'setVar' | 'changeTo';
  target?: string; transition?: string; durationMs?: number; easing?: string; direction?: string;
  url?: string; variable?: string; expr?: string; variant?: Record<string, string>; position?: string;
}

/** Validated, normalised operation. Property keys follow the Figma plugin API naming used in the engine spec. */
export type Op =
  | { kind: 'create'; line: number; type: CreateType; id: string; name: string; parent: string; props: NodeProps; comp?: string; characters?: string; overrides?: Record<string, string>; of?: string[] }
  | { kind: 'set'; line: number; ref: string; props: NodeProps }
  | { kind: 'bind'; line: number; ref: string; prop: string; variable: string }
  | { kind: 'style'; line: number; ref: string; token: string }
  | { kind: 'move'; line: number; ref: string; x?: number; y?: number; parent?: string; index?: number }
  | { kind: 'delete'; line: number; ref: string }
  | { kind: 'constraint'; line: number; ref: string; h?: string; v?: string }
  | { kind: 'interaction'; line: number; ref: string; trigger: string; delayMs?: number; key?: string; when?: string; actions: ActionSpec[] }
  | { kind: 'variable'; line: number; name: string; type: 'string' | 'number' | 'boolean' | 'color'; value: string }
  | { kind: 'note'; line: number; ref?: string; text: string };

// ---- Engine boundary: the host editor implements these (see apply/memory-engine.ts for a reference) ----
export type EngineValue = number | string | boolean;
export interface CreateSpec {
  type: CreateType; name: string; parent: string; props: Record<string, EngineValue>;
  componentId?: string; characters?: string; children?: string[];
}
export interface ResolvedAction extends Omit<ActionSpec, 'target'> { targetId?: string }
export interface InteractionSpec { trigger: string; delayMs?: number; key?: string; when?: string; actions: ResolvedAction[] }

/** One transient (ghost) transaction. Nothing is final until commit(); discard() removes everything created. */
export interface GhostHandle {
  create(spec: CreateSpec): string;
  set(id: string, key: string, value: EngineValue): void;
  bind(id: string, key: string, variableId: string): void;
  applyStyle(id: string, kind: 'fill' | 'text' | 'effect', styleId: string): void;
  setComponentProps(id: string, props: Record<string, string>): void;
  move(id: string, to: { x?: number; y?: number; parent?: string; index?: number }): void;
  remove(id: string): void;
  setConstraints(id: string, h?: string, v?: string): void;
  addInteraction(id: string, spec: InteractionSpec): void;
  declareVariable(spec: { name: string; type: string; value: string }): void;
  annotate(id: string | null, text: string): void;
  commit(): void;
  discard(): void;
}
export interface EngineAdapter {
  beginGhost(label: string): GhostHandle;
  selectionIds(): string[];
  pageId(): string;
  describe?(id: string): { type: string; name: string; width?: number; height?: number } | undefined;
}

// ---- AI provider boundary ----
export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }
export interface GenStats { promptTokens: number; promptMs: number; genTokens: number; genMs: number; loadMs: number }
export interface ChatChunk { text: string; done: boolean; stats?: GenStats }
export interface ChatRequest { messages: ChatMessage[]; numPredict?: number; temperature?: number; think?: boolean }
export interface AIProvider { id: string; chat(req: ChatRequest, signal?: AbortSignal): AsyncIterable<ChatChunk> }
export interface Calibration { promptTps: number; genTps: number; measuredAt: number }
