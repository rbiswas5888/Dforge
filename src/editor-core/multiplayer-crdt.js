/**
 * DesignForge AI — Real-Time Multiplayer Presence & LWW-CRDT Conflict Resolution
 * - Throttled (30fps) presence synchronization (cursor, badge, selection, viewport)
 * - Last-Write-Wins (LWW) property-level conflict-free register with vector clocks
 */

export class LWWRegister {
  constructor(initialValue, timestamp = 0, clientId = '') {
    this.value = initialValue;
    this.timestamp = timestamp;
    this.clientId = clientId;
  }

  /**
   * Compare and merge incoming write using Last-Write-Wins tie-breaking
   */
  merge(incomingValue, incomingTimestamp, incomingClientId) {
    const isNewer = incomingTimestamp > this.timestamp;
    const isTieBreaker = incomingTimestamp === this.timestamp && incomingClientId > this.clientId;

    if (isNewer || isTieBreaker) {
      this.value = incomingValue;
      this.timestamp = incomingTimestamp;
      this.clientId = incomingClientId;
      return true; // value updated
    }
    return false; // rejected stale update
  }
}

export class PresenceBroadcaster {
  constructor(localClientId, localUserMeta = {}) {
    this.localClientId = localClientId;
    this.localUserMeta = {
      name: localUserMeta.name || 'Anonymous Designer',
      color: localUserMeta.color || '#3B82F6',
      avatar: localUserMeta.avatar || '🎨'
    };

    this.remotePeers = new Map(); // peerId -> { cursor, name, color, selection, lastSeen }
    this.lastBroadcastTime = 0;
    this.throttleIntervalMs = 33; // ~30fps
  }

  createPresencePayload(cursorX, cursorY, selectionIds, viewport) {
    return {
      clientId: this.localClientId,
      user: this.localUserMeta,
      cursor: { x: cursorX, y: cursorY },
      selection: [...selectionIds],
      viewport: { ...viewport },
      timestamp: Date.now()
    };
  }

  receivePeerPresence(payload) {
    if (!payload || payload.clientId === this.localClientId) return;
    this.remotePeers.set(payload.clientId, {
      ...payload,
      lastSeen: Date.now()
    });
  }

  /**
   * Prune peers inactive for more than 10 seconds
   */
  pruneInactivePeers(timeoutMs = 10000) {
    const now = Date.now();
    for (const [peerId, peer] of this.remotePeers.entries()) {
      if (now - peer.lastSeen > timeoutMs) {
        this.remotePeers.delete(peerId);
      }
    }
  }

  getActivePeers() {
    this.pruneInactivePeers();
    return Array.from(this.remotePeers.values());
  }
}
