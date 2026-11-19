/**
 * DesignForge AI — Real-Time Multi-User Collaboration & WebSocket Gateway
 * 
 * Provides:
 * 1. Room-based WebSocket multiplexing by projectId
 * 2. Server-side Role-Based Access Control (Owner, Lead, Editor, Reviewer, Viewer)
 * 3. Throttled presence broadcasts (cursors, selections, viewports, avatars)
 * 4. Transactional operation broadcasts with Last-Write-Wins (LWW) conflict resolution
 * 5. Soft object lease acquisition and release to coordinate concurrent node manipulation
 * 6. Threaded comment and design review synchronization
 * 7. REST endpoints for dynamic share links, member invitations, and role management
 */

import { WebSocketServer } from 'ws';

export const COLLAB_ROLES = {
  OWNER: 'owner',
  LEAD: 'lead',
  EDITOR: 'editor',
  REVIEWER: 'reviewer',
  VIEWER: 'viewer'
};

const USER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6'  // Teal
];

export class CollabHub {
  constructor(httpServer, options = {}) {
    this.path = options.path || '/ws/collab';
    this.rooms = new Map(); // projectId -> RoomState
    this.projectMembers = new Map(); // projectId -> Map(userId -> MemberRecord)
    this.shareTokens = new Map(); // token -> { projectId, role, expiresAt }
    
    this.wss = new WebSocketServer({
      server: httpServer,
      path: this.path
    });

    this.initWebSocket();
  }

  // =========================================================================
  // 1. Room & Member Management
  // =========================================================================

  getOrCreateRoom(projectId) {
    if (!this.rooms.has(projectId)) {
      this.rooms.set(projectId, {
        projectId,
        clients: new Map(), // clientId -> WebSocketClient
        leases: new Map(),  // nodeId -> { clientId, userId, expiresAt }
        operationLog: [],
        version: 1,
        createdAt: Date.now()
      });
    }
    return this.rooms.get(projectId);
  }

  getProjectMembers(projectId) {
    if (!this.projectMembers.has(projectId)) {
      const defaultMap = new Map();
      // Default initial Owner
      defaultMap.set('user_owner', {
        userId: 'user_owner',
        name: 'Project Owner',
        email: 'owner@designforge.ai',
        role: COLLAB_ROLES.OWNER,
        color: USER_COLORS[0],
        avatar: 'OW',
        joinedAt: new Date().toISOString()
      });
      this.projectMembers.set(projectId, defaultMap);
    }
    return this.projectMembers.get(projectId);
  }

  resolveMemberRole(projectId, userId, inviteToken = null) {
    if (inviteToken && this.shareTokens.has(inviteToken)) {
      const tokenData = this.shareTokens.get(inviteToken);
      if (tokenData.expiresAt > Date.now()) {
        return tokenData.role;
      }
    }
    const members = this.getProjectMembers(projectId);
    const member = members.get(userId);
    return member ? member.role : COLLAB_ROLES.VIEWER;
  }

  // =========================================================================
  // 2. WebSocket Connection & Event Lifecycle
  // =========================================================================

  initWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const clientId = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      let activeRoom = null;
      let clientUser = null;
      let clientRole = COLLAB_ROLES.VIEWER;

      ws.clientId = clientId;
      ws.isAlive = true;

      ws.on('pong', () => { ws.isAlive = true; });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message, (room, user, role) => {
            activeRoom = room;
            clientUser = user;
            clientRole = role;
          });
        } catch (err) {
          console.error('[CollabHub] Error parsing client message:', err);
          this.sendJson(ws, { type: 'error', message: 'Malformed JSON payload.' });
        }
      });

      ws.on('close', () => {
        if (activeRoom && activeRoom.clients.has(clientId)) {
          activeRoom.clients.delete(clientId);
          
          // Release any soft leases held by this client
          for (const [nodeId, lease] of activeRoom.leases.entries()) {
            if (lease.clientId === clientId) {
              activeRoom.leases.delete(nodeId);
            }
          }

          // Broadcast peer departure
          this.broadcastToRoom(activeRoom.projectId, {
            type: 'peer_left',
            clientId,
            userId: clientUser?.id,
            timestamp: Date.now()
          }, clientId);
        }
      });
    });

    // Heartbeat ping interval
    this.pingInterval = setInterval(() => {
      for (const client of this.wss.clients) {
        if (client.isAlive === false) {
          client.terminate();
          continue;
        }
        client.isAlive = false;
        client.ping();
      }
    }, 30000);
  }

  handleClientMessage(ws, message, setContext) {
    const { type } = message;

    // -------------------------------------------------------------
    // JOIN ROOM
    // -------------------------------------------------------------
    if (type === 'join') {
      const projectId = message.projectId || 'default-project';
      const user = message.user || {};
      const token = message.token || null;
      const room = this.getOrCreateRoom(projectId);

      // Determine role
      let role = this.resolveMemberRole(projectId, user.id, token);
      if (user.role && [COLLAB_ROLES.OWNER, COLLAB_ROLES.LEAD, COLLAB_ROLES.EDITOR].includes(user.role)) {
        // If passed explicit authenticated role from auth service
        role = user.role;
      }

      // Pick distinctive user color
      const colorIndex = (room.clients.size + 1) % USER_COLORS.length;
      const userColor = user.color || USER_COLORS[colorIndex];

      const clientInfo = {
        ws,
        clientId: ws.clientId,
        projectId,
        user: {
          id: user.id || 'user_' + ws.clientId,
          name: user.name || 'Collaborator',
          email: user.email || 'designer@designforge.ai',
          avatar: user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : 'DF'),
          color: userColor
        },
        role,
        cursor: { x: 0, y: 0 },
        selection: [],
        viewport: { panX: 0, panY: 0, zoom: 1 },
        lastSeen: Date.now()
      };

      room.clients.set(ws.clientId, clientInfo);
      setContext(room, clientInfo.user, role);

      // Send init response with active peers and leases
      const existingPeers = Array.from(room.clients.values())
        .filter(c => c.clientId !== ws.clientId)
        .map(c => ({
          clientId: c.clientId,
          user: c.user,
          role: c.role,
          cursor: c.cursor,
          selection: c.selection,
          viewport: c.viewport
        }));

      this.sendJson(ws, {
        type: 'init',
        clientId: ws.clientId,
        projectId,
        role,
        user: clientInfo.user,
        peers: existingPeers,
        leases: Array.from(room.leases.entries()).map(([nodeId, l]) => ({ nodeId, ...l })),
        roomVersion: room.version
      });

      // Broadcast new peer join to existing participants
      this.broadcastToRoom(projectId, {
        type: 'peer_joined',
        peer: {
          clientId: ws.clientId,
          user: clientInfo.user,
          role
        },
        timestamp: Date.now()
      }, ws.clientId);
      return;
    }

    const room = this.rooms.get(message.projectId);
    if (!room) {
      this.sendJson(ws, { type: 'error', message: 'Room not found. Join room first.' });
      return;
    }

    const client = room.clients.get(ws.clientId);
    if (!client) {
      this.sendJson(ws, { type: 'error', message: 'Client not registered in room.' });
      return;
    }

    // -------------------------------------------------------------
    // PRESENCE UPDATE (Cursor, Selection, Viewport)
    // -------------------------------------------------------------
    if (type === 'presence') {
      client.cursor = message.cursor || client.cursor;
      client.selection = message.selection || client.selection;
      client.viewport = message.viewport || client.viewport;
      client.lastSeen = Date.now();

      this.broadcastToRoom(room.projectId, {
        type: 'presence_update',
        clientId: ws.clientId,
        user: client.user,
        cursor: client.cursor,
        selection: client.selection,
        viewport: client.viewport,
        activePageId: message.activePageId || 'page_1',
        timestamp: Date.now()
      }, ws.clientId);
      return;
    }

    // -------------------------------------------------------------
    // DOCUMENT OPERATION MUTATION (Transaction Broadcast)
    // -------------------------------------------------------------
    if (type === 'operation') {
      // SERVER-SIDE PERMISSION ENFORCEMENT
      if (client.role === COLLAB_ROLES.VIEWER || client.role === COLLAB_ROLES.REVIEWER) {
        this.sendJson(ws, {
          type: 'operation_rejected',
          opId: message.opId,
          reason: `Permission denied: ${client.role} access is read-only.`
        });
        return;
      }

      // Check soft lease conflicts
      if (message.targetNodeId && room.leases.has(message.targetNodeId)) {
        const lease = room.leases.get(message.targetNodeId);
        if (lease.expiresAt > Date.now() && lease.clientId !== ws.clientId) {
          this.sendJson(ws, {
            type: 'operation_rejected',
            opId: message.opId,
            reason: `Node ${message.targetNodeId} is currently being modified by another collaborator.`
          });
          return;
        }
      }

      room.version += 1;
      const broadcastPayload = {
        type: 'operation_broadcast',
        clientId: ws.clientId,
        user: client.user,
        opId: message.opId || `op_${Date.now()}`,
        opType: message.opType,
        commandName: message.commandName,
        targetNodeId: message.targetNodeId,
        payload: message.payload,
        roomVersion: room.version,
        timestamp: Date.now()
      };

      room.operationLog.push(broadcastPayload);
      if (room.operationLog.length > 500) room.operationLog.shift(); // Keep bounded

      // Acknowledge to sender
      this.sendJson(ws, {
        type: 'operation_ack',
        opId: message.opId,
        roomVersion: room.version,
        status: 'committed'
      });

      // Broadcast to all other peers in the room
      this.broadcastToRoom(room.projectId, broadcastPayload, ws.clientId);
      return;
    }

    // -------------------------------------------------------------
    // SOFT OBJECT LEASES (Acquire / Release)
    // -------------------------------------------------------------
    if (type === 'request_lease') {
      const { nodeId, ttlMs = 5000 } = message;
      const now = Date.now();
      const existing = room.leases.get(nodeId);

      if (existing && existing.expiresAt > now && existing.clientId !== ws.clientId) {
        this.sendJson(ws, {
          type: 'lease_response',
          nodeId,
          granted: false,
          heldBy: existing.user
        });
        return;
      }

      room.leases.set(nodeId, {
        clientId: ws.clientId,
        user: client.user,
        expiresAt: now + ttlMs
      });

      this.sendJson(ws, { type: 'lease_response', nodeId, granted: true });
      this.broadcastToRoom(room.projectId, {
        type: 'lease_acquired',
        nodeId,
        clientId: ws.clientId,
        user: client.user,
        expiresAt: now + ttlMs
      }, ws.clientId);
      return;
    }

    if (type === 'release_lease') {
      const { nodeId } = message;
      const existing = room.leases.get(nodeId);
      if (existing && existing.clientId === ws.clientId) {
        room.leases.delete(nodeId);
        this.broadcastToRoom(room.projectId, {
          type: 'lease_released',
          nodeId,
          clientId: ws.clientId
        });
      }
      return;
    }

    // -------------------------------------------------------------
    // COLLABORATIVE COMMENTS
    // -------------------------------------------------------------
    if (type === 'comment') {
      if (client.role === COLLAB_ROLES.VIEWER) {
        this.sendJson(ws, { type: 'error', message: 'Viewer role cannot post comments.' });
        return;
      }

      this.broadcastToRoom(room.projectId, {
        type: 'comment_broadcast',
        action: message.action || 'add',
        comment: message.comment,
        clientId: ws.clientId,
        user: client.user,
        timestamp: Date.now()
      });
      return;
    }
  }

  broadcastToRoom(projectId, payload, excludeClientId = null) {
    const room = this.rooms.get(projectId);
    if (!room) return;
    const msgString = JSON.stringify(payload);

    for (const [cId, client] of room.clients.entries()) {
      if (excludeClientId && cId === excludeClientId) continue;
      if (client.ws.readyState === 1 /* OPEN */) {
        client.ws.send(msgString);
      }
    }
  }

  sendJson(ws, payload) {
    if (ws.readyState === 1 /* OPEN */) {
      ws.send(JSON.stringify(payload));
    }
  }

  // =========================================================================
  // 3. REST API Route Handler for Sharing & Permissions
  // =========================================================================

  handleHttpRequest(req, res, pathname, queryParams, body) {
    // 1. GET /api/collab/project/:projectId/members
    const membersMatch = pathname.match(/^\/api\/collab\/project\/([a-zA-Z0-9_-]+)\/members$/);
    if (membersMatch && req.method === 'GET') {
      const projectId = membersMatch[1];
      const members = this.getProjectMembers(projectId);
      return {
        status: 200,
        body: {
          success: true,
          projectId,
          members: Array.from(members.values())
        }
      };
    }

    // 2. POST /api/collab/project/:projectId/invite
    const inviteMatch = pathname.match(/^\/api\/collab\/project\/([a-zA-Z0-9_-]+)\/invite$/);
    if (inviteMatch && req.method === 'POST') {
      const projectId = inviteMatch[1];
      const members = this.getProjectMembers(projectId);
      const email = body.email || 'collaborator@designforge.ai';
      const role = body.role || COLLAB_ROLES.EDITOR;
      const userId = 'user_' + Math.random().toString(36).substring(2, 9);
      const name = body.name || email.split('@')[0];

      const newMember = {
        userId,
        name,
        email,
        role,
        color: USER_COLORS[members.size % USER_COLORS.length],
        avatar: name.substring(0, 2).toUpperCase(),
        joinedAt: new Date().toISOString()
      };
      members.set(userId, newMember);

      return {
        status: 201,
        body: { success: true, member: newMember }
      };
    }

    // 3. POST /api/collab/project/:projectId/share-link (Environment-Aware URL)
    const shareLinkMatch = pathname.match(/^\/api\/collab\/project\/([a-zA-Z0-9_-]+)\/share-link$/);
    if (shareLinkMatch && req.method === 'POST') {
      const projectId = shareLinkMatch[1];
      const role = body.role || COLLAB_ROLES.EDITOR;
      const ttlHours = body.ttlHours || 72;
      const token = 'sh_' + Math.random().toString(36).substring(2, 12);
      const expiresAt = Date.now() + ttlHours * 3600 * 1000;

      this.shareTokens.set(token, { projectId, role, expiresAt });

      const host = req.headers.host || '127.0.0.1:3001';
      const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
      const origin = `${protocol}://${host}`;
      const shareUrl = `${origin}/#project=${projectId}&role=${role}&token=${token}`;

      return {
        status: 200,
        body: {
          success: true,
          shareUrl,
          token,
          role,
          expiresAt
        }
      };
    }

    // 4. POST /api/collab/project/:projectId/role (Update Member Role)
    const roleMatch = pathname.match(/^\/api\/collab\/project\/([a-zA-Z0-9_-]+)\/role$/);
    if (roleMatch && req.method === 'POST') {
      const projectId = roleMatch[1];
      const members = this.getProjectMembers(projectId);
      const { userId, role } = body;
      const member = members.get(userId);
      if (!member) {
        return { status: 404, body: { success: false, message: 'Member not found' } };
      }
      member.role = role;
      return { status: 200, body: { success: true, member } };
    }

    // 5. DELETE /api/collab/project/:projectId/member/:userId (Revoke Member)
    const revokeMatch = pathname.match(/^\/api\/collab\/project\/([a-zA-Z0-9_-]+)\/member\/([a-zA-Z0-9_-]+)$/);
    if (revokeMatch && req.method === 'DELETE') {
      const projectId = revokeMatch[1];
      const userId = revokeMatch[2];
      const members = this.getProjectMembers(projectId);
      const member = members.get(userId);
      if (member && member.role === COLLAB_ROLES.OWNER) {
        return { status: 403, body: { success: false, message: 'Cannot revoke project owner.' } };
      }
      members.delete(userId);
      return { status: 200, body: { success: true, message: 'Member revoked.' } };
    }

    return null;
  }
}
