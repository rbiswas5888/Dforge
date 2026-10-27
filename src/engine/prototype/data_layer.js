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
  registerCollection(collectionOrId, records = []) {
    if (typeof collectionOrId === 'object' && collectionOrId !== null) {
      const id = collectionOrId.id || collectionOrId.name;
      const coll = {
        id,
        name: collectionOrId.name || id,
        schema: collectionOrId.schema || {},
        records: Array.isArray(collectionOrId.records) ? [...collectionOrId.records] : []
      };
      this.collections.set(id, coll);
      return coll;
    }
    const coll = {
      id: collectionOrId,
      name: collectionOrId,
      records: Array.isArray(records) ? [...records] : []
    };
    this.collections.set(collectionOrId, coll);
    return coll;
  }

  setCollection(name, records = []) {
    return this.registerCollection(name, records);
  }

  getCollection(name) {
    const coll = this.collections.get(name);
    if (!coll) return { id: name, name, records: [] };
    return coll;
  }

  findRecords(collectionName, predicate) {
    const coll = this.getCollection(collectionName);
    return (coll.records || []).filter(predicate);
  }

  addRecord(collectionName, record) {
    const coll = this.getCollection(collectionName);
    const newRecord = { id: record.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, ...record };
    coll.records.push(newRecord);
    return newRecord;
  }

  insertRecord(collectionName, record) {
    return this.addRecord(collectionName, record);
  }

  updateRecord(collectionName, id, patch) {
    const coll = this.getCollection(collectionName);
    const idx = (coll.records || []).findIndex(r => r.id === id);
    if (idx !== -1) {
      coll.records[idx] = { ...coll.records[idx], ...patch };
      return coll.records[idx];
    }
    return null;
  }

  deleteRecord(collectionName, id) {
    const coll = this.getCollection(collectionName);
    const beforeLen = (coll.records || []).length;
    coll.records = (coll.records || []).filter(r => r.id !== id);
    return coll.records.length < beforeLen;
  }

  /**
   * Registers a mock API endpoint
   */
  registerEndpoint(methodOrConfig, path, options = {}) {
    if (typeof methodOrConfig === 'object' && methodOrConfig !== null) {
      const { method = 'GET', path: epPath, responseStatus = 200, responseData = {} } = methodOrConfig;
      const key = `${method.toUpperCase()}:${epPath}`;
      this.endpoints.set(key, {
        method: method.toUpperCase(),
        path: epPath,
        status: responseStatus,
        data: responseData,
        latency: methodOrConfig.latency || 0,
        failureRate: methodOrConfig.failureRate || 0,
        responseTemplate: responseData
      });
      return;
    }
    const key = `${methodOrConfig.toUpperCase()}:${path}`;
    this.endpoints.set(key, {
      method: methodOrConfig.toUpperCase(),
      path,
      status: options.status || 200,
      data: options.responseTemplate || options.data || { success: true },
      latency: options.latency || 0,
      failureRate: options.failureRate || 0,
      responseTemplate: options.responseTemplate || { success: true }
    });
  }

  /**
   * Simulates fetching from a mock endpoint
   */
  async fetchMock(method, path, payload = {}, context = {}) {
    const key = `${method.toUpperCase()}:${path}`;
    const endpoint = this.endpoints.get(key) || {
      status: 200,
      data: payload,
      latency: 0,
      failureRate: 0,
      responseTemplate: payload
    };

    if (endpoint.latency > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(endpoint.latency, 300)));
    }

    if (endpoint.failureRate > 0 && Math.random() < endpoint.failureRate) {
      return {
        ok: false,
        status: 500,
        error: 'Simulated Network Failure'
      };
    }

    const response = typeof endpoint.responseTemplate === 'function'
      ? endpoint.responseTemplate(payload, context)
      : (endpoint.data !== undefined ? endpoint.data : endpoint.responseTemplate);

    return {
      ok: true,
      status: endpoint.status || 200,
      data: response
    };
  }
}
export { PrototypeDataLayer as DataLayer };
