/**
 * DesignForge AI — Prototype Data Layer & Mock Endpoints Engine
 * Conforms to Specification Section 6.8
 * In-memory collections, mock REST endpoints, data binding, and repeat grid provider
 */

export class PrototypeDataLayer {
  constructor() {
    this.collections = new Map(); // collectionName -> Array of records
    this.endpoints = new Map();   // `${method}:${path}` -> { latency, failureRate, responseTemplate }
  }

  /**
   * Defines or populates an in-memory collection
   */
  setCollection(name, records = []) {
    this.collections.set(name, Array.isArray(records) ? [...records] : []);
  }

  getCollection(name) {
    return this.collections.get(name) || [];
  }

  insertRecord(collectionName, record) {
    const coll = this.getCollection(collectionName);
    const newRecord = { id: record.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, ...record };
    coll.push(newRecord);
    this.collections.set(collectionName, coll);
    return newRecord;
  }

  updateRecord(collectionName, id, patch) {
    const coll = this.getCollection(collectionName);
    const idx = coll.findIndex(r => r.id === id);
    if (idx !== -1) {
      coll[idx] = { ...coll[idx], ...patch };
      this.collections.set(collectionName, coll);
      return coll[idx];
    }
    return null;
  }

  deleteRecord(collectionName, id) {
    const coll = this.getCollection(collectionName);
    const filtered = coll.filter(r => r.id !== id);
    this.collections.set(collectionName, filtered);
    return filtered.length < coll.length;
  }

  /**
   * Registers a mock API endpoint
   */
  registerEndpoint(method, path, options = {}) {
    const key = `${method.toUpperCase()}:${path}`;
    this.endpoints.set(key, {
      method: method.toUpperCase(),
      path,
      latency: options.latency || 100, // ms
      failureRate: options.failureRate || 0, // 0 - 1
      responseTemplate: options.responseTemplate || { success: true }
    });
  }

  /**
   * Simulates fetching from a mock endpoint
   */
  async fetchMock(method, path, payload = {}, context = {}) {
    const key = `${method.toUpperCase()}:${path}`;
    const endpoint = this.endpoints.get(key) || {
      latency: 50,
      failureRate: 0,
      responseTemplate: { status: 200, data: payload }
    };

    // Simulate network delay
    if (endpoint.latency > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(endpoint.latency, 300)));
    }

    // Check simulated failure rate
    if (endpoint.failureRate > 0 && Math.random() < endpoint.failureRate) {
      return {
        ok: false,
        status: 500,
        error: 'Simulated Network Failure'
      };
    }

    const response = typeof endpoint.responseTemplate === 'function'
      ? endpoint.responseTemplate(payload, context)
      : JSON.parse(JSON.stringify(endpoint.responseTemplate));

    return {
      ok: true,
      status: 200,
      data: response
    };
  }
}
