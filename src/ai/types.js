/**
 * DesignForge AI - AI Engine Types & Operation Specifications
 * Typed design operations, tool definitions, schemas, and error definitions
 */

export const OPERATIONS = {
  CREATE_NODE: 'CreateNode',
  UPDATE_NODE: 'UpdateNode',
  DELETE_NODE: 'DeleteNode',
  MOVE_NODE: 'MoveNode',
  REORDER_CHILDREN: 'ReorderChildren',
  CREATE_COMPONENT: 'CreateComponent',
  CREATE_COMPONENT_INSTANCE: 'CreateComponentInstance',
  CREATE_VARIANT: 'CreateVariant',
  UPDATE_TOKENS: 'UpdateTokens',
  CREATE_PROTOTYPE_CONNECTION: 'CreatePrototypeConnection',
  APPLY_LAYOUT: 'ApplyLayout',
  BATCH_OPERATIONS: 'BatchOperations'
};

export const PROVIDERS = {
  LOCAL: 'local',
  OPENAI: 'openai',
  GEMINI: 'gemini',
  ANTHROPIC: 'anthropic',
  OLLAMA: 'ollama' // Local OpenAI-compatible endpoint
};

export const PRIVACY_MODES = {
  LOCAL_ONLY: 'local_only',           // Never send document data outside browser
  ALLOW_HOSTED: 'allow_hosted',       // Allow remote API calls with explicit key
  REDACT_TEXT: 'redact_text'          // Mask sensitive text before sending
};

/**
 * Change-Risk Policy Classification (Blueprint Section 14, Agent Master Prompt Section 4)
 */
export const RISK_LEVELS = {
  LOW: 'low',       // Auto-apply when user settings permit
  MEDIUM: 'medium', // Preview or diff recommended
  HIGH: 'high'      // Explicit user approval required
};

/**
 * Validation Check Statuses (Agent Master Prompt Section 5)
 */
export const CHECK_STATUS = {
  PASSED: 'passed',
  FAILED: 'failed',
  NOT_CHECKED: 'not_checked'
};

/**
 * Agent Execution States (Agent Master Prompt Section 5)
 */
export const EXECUTION_STATUS = {
  SUCCEEDED: 'succeeded',
  PARTIAL: 'partial',
  BLOCKED: 'blocked',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PROPOSED: 'proposed',
  APPROVAL_REQUIRED: 'approval_required'
};


export class DesignForgeAIError extends Error {
  constructor(message, code = 'AI_ERROR', details = null) {
    super(message);
    this.name = 'DesignForgeAIError';
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends DesignForgeAIError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ProviderError extends DesignForgeAIError {
  constructor(message, provider, statusCode = null, details = null) {
    super(`Provider [${provider}] error: ${message}`, 'PROVIDER_ERROR', details);
    this.name = 'ProviderError';
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

export class CancellationError extends DesignForgeAIError {
  constructor(message = 'AI generation cancelled by user') {
    super(message, 'CANCELLED');
    this.name = 'CancellationError';
  }
}

/**
 * Tool definitions exposed to LLM providers for structured function calling
 */
export const DESIGN_TOOLS_SCHEMA = [
  {
    name: OPERATIONS.CREATE_NODE,
    description: 'Creates a new design node (frame, text, rectangle, ellipse, button) and adds it to a page or parent container.',
    parameters: {
      type: 'object',
      required: ['type', 'name', 'transform'],
      properties: {
        type: { type: 'string', enum: ['frame', 'rectangle', 'ellipse', 'text', 'section', 'group'] },
        name: { type: 'string', description: 'Semantic, human-readable name of the node' },
        parentId: { type: 'string', description: 'ID of the parent frame or null for root page element' },
        transform: {
          type: 'object',
          required: ['width', 'height'],
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number', minimum: 1 },
            height: { type: 'number', minimum: 1 },
            rotation: { type: 'number' }
          }
        },
        layout: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['none', 'stack-horizontal', 'stack-vertical', 'grid', 'absolute'] },
            gap: { type: 'number' },
            paddingTop: { type: 'number' },
            paddingRight: { type: 'number' },
            paddingBottom: { type: 'number' },
            paddingLeft: { type: 'number' },
            alignItems: { type: 'string', enum: ['start', 'center', 'end', 'stretch'] },
            justifyContent: { type: 'string', enum: ['start', 'center', 'end', 'space-between'] }
          }
        },
        style: {
          type: 'object',
          properties: {
            fills: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['solid'] },
                  color: { type: 'string', pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$' },
                  opacity: { type: 'number', minimum: 0, maximum: 1 }
                }
              }
            },
            cornerRadius: { type: 'number', minimum: 0 },
            strokes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  color: { type: 'string' },
                  width: { type: 'number', minimum: 0 }
                }
              }
            }
          }
        },
        text: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            fontSize: { type: 'number', minimum: 6 },
            fontWeight: { type: 'string', enum: ['400', '500', '600', '700', '800'] },
            color: { type: 'string' },
            textAlign: { type: 'string', enum: ['left', 'center', 'right'] }
          }
        },
        semanticTag: { type: 'string', enum: ['div', 'section', 'nav', 'header', 'footer', 'main', 'button', 'a', 'p', 'h1', 'h2', 'input'] }
      }
    }
  },
  {
    name: OPERATIONS.UPDATE_NODE,
    description: 'Modifies specific properties (transform, style, text, layout, semanticTag) of an existing node.',
    parameters: {
      type: 'object',
      required: ['nodeId', 'patch'],
      properties: {
        nodeId: { type: 'string', description: 'Stable ID of the target node' },
        patch: { type: 'object', description: 'Partial node object to merge' }
      }
    }
  },
  {
    name: OPERATIONS.DELETE_NODE,
    description: 'Safely removes a node and all its nested children from the active document.',
    parameters: {
      type: 'object',
      required: ['nodeId'],
      properties: {
        nodeId: { type: 'string' }
      }
    }
  },
  {
    name: OPERATIONS.APPLY_LAYOUT,
    description: 'Applies or updates auto-layout (Flexbox) properties on a container node.',
    parameters: {
      type: 'object',
      required: ['nodeId', 'mode'],
      properties: {
        nodeId: { type: 'string' },
        mode: { type: 'string', enum: ['none', 'stack-horizontal', 'stack-vertical', 'grid', 'absolute'] },
        gap: { type: 'number' },
        padding: { type: 'number' },
        alignItems: { type: 'string', enum: ['start', 'center', 'end', 'stretch'] },
        justifyContent: { type: 'string', enum: ['start', 'center', 'end', 'space-between'] }
      }
    }
  },
  {
    name: OPERATIONS.CREATE_PROTOTYPE_CONNECTION,
    description: 'Creates an interactive prototype transition link from a source element to a destination page or overlay.',
    parameters: {
      type: 'object',
      required: ['sourceNodeId', 'targetPageId'],
      properties: {
        sourceNodeId: { type: 'string' },
        targetPageId: { type: 'string' },
        trigger: { type: 'string', enum: ['click', 'hover'] },
        action: { type: 'string', enum: ['navigate', 'open-modal'] },
        animation: { type: 'string', enum: ['instant', 'fade', 'slide'] }
      }
    }
  },
  {
    name: OPERATIONS.UPDATE_TOKENS,
    description: 'Updates global design tokens (colors, typography, spacing) across the document.',
    parameters: {
      type: 'object',
      required: ['collectionId', 'tokenUpdates'],
      properties: {
        collectionId: { type: 'string' },
        tokenUpdates: {
          type: 'array',
          items: {
            type: 'object',
            required: ['tokenId', 'value'],
            properties: {
              tokenId: { type: 'string' },
              value: { type: ['string', 'number'] }
            }
          }
        }
      }
    }
  }
];
