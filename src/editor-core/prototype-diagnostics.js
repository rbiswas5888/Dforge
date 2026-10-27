/**
 * DesignForge AI — Prototype Diagnostics & Flow Graph Validator
 * Implements Section 37 of Design Engine Logical Parameters Specification:
 * - Detects broken interaction targets (destinations pointing to deleted/missing frames)
 * - Calculates flow coverage percentage (reachable frames / total frames)
 * - Detects unreachable dead-end frames
 * - Detects circular delay loops
 * - Auto-repair broken connections and auto-wire obvious navigation
 */

export class PrototypeDiagnosticsEngine {
  constructor(document) {
    this.doc = document;
  }

  /**
   * Run full diagnostics audit on a page
   */
  auditPage(pageId) {
    const page = (this.doc.pages || []).find(p => p.id === pageId) || this.doc.pages?.[0];
    if (!page) {
      return { totalFrames: 0, reachableFrames: 0, coveragePct: 0, brokenLinks: [], deadEnds: [], circularDelays: [] };
    }

    const allFrameIds = [];
    const outgoingMap = new Map(); // frameId -> Set<targetFrameId>
    const incomingMap = new Map(); // frameId -> Set<sourceFrameId>
    const brokenLinks = [];
    const delayChains = new Map(); // frameId -> targetId for after-delay

    for (const rootId of page.rootIds || []) {
      const node = page.nodes[rootId];
      if (node && node.type === 'frame') {
        allFrameIds.push(rootId);
        outgoingMap.set(rootId, new Set());
        incomingMap.set(rootId, new Set());
      }
    }

    // Identify Flow Start Frame
    let startFrameId = allFrameIds.find(id => page.nodes[id]?.isFlowStart) || allFrameIds[0] || null;

    // Scan all interactions across all descendant nodes
    for (const nodeId in page.nodes) {
      const node = page.nodes[nodeId];
      if (!node || !node.interactions || node.interactions.length === 0) continue;

      // Find top-level owner frame
      let ownerFrameId = null;
      let curr = node;
      while (curr) {
        if (allFrameIds.includes(curr.id)) {
          ownerFrameId = curr.id;
          break;
        }
        curr = curr.parentId ? page.nodes[curr.parentId] : null;
      }

      for (const inter of node.interactions) {
        if (inter.targetId) {
          const targetNode = page.nodes[inter.targetId];
          if (!targetNode) {
            brokenLinks.push({
              sourceNodeId: node.id,
              sourceNodeName: node.name,
              ownerFrameId,
              targetId: inter.targetId,
              reason: 'Target frame or layer no longer exists'
            });
          } else {
            // Valid connection
            if (ownerFrameId && allFrameIds.includes(inter.targetId)) {
              outgoingMap.get(ownerFrameId)?.add(inter.targetId);
              incomingMap.get(inter.targetId)?.add(ownerFrameId);

              if (inter.trigger === 'delay' || inter.trigger === 'after-delay') {
                delayChains.set(ownerFrameId, inter.targetId);
              }
            }
          }
        }
      }
    }

    // Compute Reachability from Start Frame using Breadth-First Search
    const reachable = new Set();
    if (startFrameId) {
      const queue = [startFrameId];
      reachable.add(startFrameId);

      while (queue.length > 0) {
        const curr = queue.shift();
        const neighbors = outgoingMap.get(curr) || new Set();
        for (const next of neighbors) {
          if (!reachable.has(next)) {
            reachable.add(next);
            queue.push(next);
          }
        }
      }
    }

    // Dead ends: frames reachable from start that have 0 outgoing connections
    const deadEnds = [];
    for (const fId of reachable) {
      if ((outgoingMap.get(fId)?.size || 0) === 0) {
        deadEnds.push({ frameId: fId, frameName: page.nodes[fId]?.name || fId });
      }
    }

    // Circular delay detection: after-delay loops without user input
    const circularDelays = [];
    for (const [startF, nextF] of delayChains.entries()) {
      let tortoise = nextF;
      let hare = delayChains.get(nextF);
      while (tortoise && hare && delayChains.get(hare)) {
        if (tortoise === hare) {
          circularDelays.push({ frameId: startF, loopFrame: tortoise });
          break;
        }
        tortoise = delayChains.get(tortoise);
        hare = delayChains.get(delayChains.get(hare));
      }
    }

    const totalFrames = allFrameIds.length;
    const reachableCount = reachable.size;
    const coveragePct = totalFrames > 0 ? Math.round((reachableCount / totalFrames) * 100) : 100;

    return {
      totalFrames,
      reachableFrames: reachableCount,
      coveragePct,
      startFrameId,
      brokenLinks,
      deadEnds,
      circularDelays,
      unreachableFrameIds: allFrameIds.filter(id => !reachable.has(id))
    };
  }

  /**
   * Auto-repair broken interactions by stripping targets to deleted nodes
   */
  repairBrokenLinks(pageId, commandEngine) {
    const page = (this.doc.pages || []).find(p => p.id === pageId) || this.doc.pages?.[0];
    if (!page) return 0;

    let repairedCount = 0;
    for (const nodeId in page.nodes) {
      const node = page.nodes[nodeId];
      if (!node || !node.interactions || node.interactions.length === 0) continue;

      const validInteractions = node.interactions.filter(inter => {
        if (!inter.targetId) return true;
        return Boolean(page.nodes[inter.targetId]);
      });

      if (validInteractions.length !== node.interactions.length) {
        repairedCount += (node.interactions.length - validInteractions.length);
        commandEngine.updateNode(node.id, { interactions: validInteractions }, 'Repair broken prototype links');
      }
    }
    return repairedCount;
  }
}
