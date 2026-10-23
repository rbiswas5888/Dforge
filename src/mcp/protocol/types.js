/**
 * DesignForge AI - Model Context Protocol (MCP) Standard Types & Constants
 * Specification Revision: 2024-11-05
 */

export const MCP_PROTOCOL_VERSION = '2024-11-05';
export const MCP_SERVER_NAME = 'designforge-ai-design-server';
export const MCP_SERVER_VERSION = '1.0.0';

export const JSONRPC_VERSION = '2.0';

export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // Application / Protocol Level
  UNAUTHORIZED: -32001,
  PERMISSION_DENIED: -32002,
  APPROVAL_REQUIRED: -32003,
  RATE_LIMITED: -32004,
  TIMEOUT: -32005,
  RESOURCE_NOT_FOUND: -32006,
  TOOL_NOT_FOUND: -32007,
  VALIDATION_FAILED: -32008,
  DISCONNECTED: -32009
};

export const MCP_PERMISSIONS = {
  DESIGN_READ: 'design.read',
  DESIGN_WRITE: 'design.write',
  DESIGN_EXPORT: 'design.export',
  PROJECT_READ: 'project.read',
  PROJECT_WRITE: 'project.write',
  REPOSITORY_READ: 'repository.read',
  REPOSITORY_WRITE: 'repository.write',
  NETWORK_ACCESS: 'network.access',
  ADMIN_MANAGE: 'admin.manageConnections'
};

export const TOOL_CATEGORIES = {
  DESIGN_DOCUMENT: 'Design Document',
  LAYERS_OBJECTS: 'Layers & Objects',
  FRAMES_LAYOUT: 'Frames & Layout',
  DESIGN_SYSTEMS: 'Design Systems',
  PROTOTYPING: 'Prototyping',
  INSPECTION: 'Inspection',
  ASSET_EXPORT: 'Asset Export',
  REACT_COMPILER: 'React Compiler',
  FILE_OPERATIONS: 'File Operations',
  DOCUMENTATION: 'Documentation',
  REPOSITORY: 'Repository Integrations',
  APPROVED_EXTENSIONS: 'Approved Integrations'
};

export function createJsonRpcRequest(id, method, params = {}) {
  return {
    jsonrpc: JSONRPC_VERSION,
    id: id !== undefined ? id : `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    method,
    params
  };
}

export function createJsonRpcNotification(method, params = {}) {
  return {
    jsonrpc: JSONRPC_VERSION,
    method,
    params
  };
}

export function createJsonRpcResponse(id, result) {
  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    result
  };
}

export function createJsonRpcError(id, code, message, data = null) {
  const err = { code, message };
  if (data) err.data = data;
  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    error: err
  };
}
