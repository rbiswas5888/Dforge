import { SCHEMA_VERSION } from './document.js';

const PROJECT_INDEX_KEY = 'designforge_workspace_projects_v1';
const ACTIVE_PROJECT_KEY = 'designforge_workspace_active_project_v1';
const FILES_INDEX_KEY = 'designforge_workspace_files_v1';
const ACTIVE_FILE_KEY = 'designforge_workspace_active_file_v1';
const PROFILE_INDEX_KEY = 'designforge_workspace_profiles_v1';
const ACTIVE_PROFILE_KEY = 'designforge_workspace_active_profile_v1';
const NOTIFICATIONS_KEY = 'designforge_workspace_notifications_v1';
const REACT_LIBRARIES_KEY = 'designforge_workspace_react_libraries_v1';
const LAST_VIEW_KEY = 'designforge_last_active_view';
const AUTH_SESSION_KEY = 'designforge_auth_session_v1';

export const VALID_PROJECT_ROLES = ['Project Lead', 'Designer', 'Viewer'];

export class WorkspaceStore {
  requireStorage() {
    if (typeof localStorage === 'undefined') {
      throw new Error('Workspace persistence is unavailable in this browser context.');
    }
    return localStorage;
  }

  getAuthSession() {
    return this.readJson(AUTH_SESSION_KEY, null);
  }

  saveAuthSession(session) {
    this.writeJson(AUTH_SESSION_KEY, session);
    if (session?.user) {
      try {
        this.saveProfile(session.user);
      } catch {
        // ignore profile sync error
      }
    }
  }

  clearAuthSession() {
    try {
      this.requireStorage().removeItem(AUTH_SESSION_KEY);
    } catch (err) {
      console.warn('Could not clear auth session:', err);
    }
  }

  isAuthenticated() {
    const session = this.getAuthSession();
    if (!session || !session.token) return false;
    if (session.expiresAt && Date.now() > session.expiresAt) {
      this.clearAuthSession();
      return false;
    }
    return true;
  }

  getLastActiveView() {
    try {
      return this.requireStorage().getItem(LAST_VIEW_KEY) || 'workspace';
    } catch {
      return 'workspace';
    }
  }

  setLastActiveView(view) {
    try {
      this.requireStorage().setItem(LAST_VIEW_KEY, view);
    } catch (err) {
      console.warn('Could not persist last active view:', err);
    }
  }

  readJson(key, fallback) {
    const storage = this.requireStorage();
    const stored = storage.getItem(key);
    if (!stored) return fallback;
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.warn(`Could not read saved workspace data for ${key}:`, error);
      return fallback;
    }
  }

  writeJson(key, value) {
    try {
      this.requireStorage().setItem(key, JSON.stringify(value));
    } catch (error) {
      throw new Error(`Could not save workspace data: ${error.message}`);
    }
  }

  /**
   * Projects Management (Figma Hierarchy: Level 2)
   */
  getProjects() {
    const projects = this.readJson(PROJECT_INDEX_KEY, []);
    if (!Array.isArray(projects)) return [];

    let modified = false;
    const allFiles = this.readJson(FILES_INDEX_KEY, []);

    // Ensure metadata, membership, and design file linkages for every project
    const normalized = projects.map(proj => {
      let project = { ...proj };
      if (!project.description) project.description = '';
      if (!Array.isArray(project.members) || project.members.length === 0) {
        const defaultLead = this.getActiveProfile() || { id: 'user_lead', name: 'Jordan Lee', email: 'jordan@example.com' };
        project.members = [
          {
            userId: defaultLead.id || 'user_lead',
            name: defaultLead.name || 'Jordan Lee',
            email: defaultLead.email || 'jordan@example.com',
            role: 'Project Lead',
            addedAt: project.createdAt || new Date().toISOString(),
            addedBy: 'Workspace Admin'
          }
        ];
        modified = true;
      }
      // Reconcile legacy project documents into design files index if not registered
      const hasRegisteredFiles = allFiles.some(f => f.projectId === project.id);
      if (!hasRegisteredFiles) {
        const legacyDoc = this.requireStorage().getItem(`designforge_workspace_document_${project.id}`);
        if (legacyDoc) {
          const fileRecord = {
            id: project.id,
            projectId: project.id,
            name: project.name || 'Untitled Document',
            createdAt: project.createdAt || new Date().toISOString(),
            updatedAt: project.updatedAt || new Date().toISOString()
          };
          allFiles.push(fileRecord);
          this.writeJson(FILES_INDEX_KEY, allFiles);
        }
      }
      project.fileCount = allFiles.filter(f => f.projectId === project.id).length;
      return project;
    });

    if (modified) {
      this.writeJson(PROJECT_INDEX_KEY, normalized);
    }
    return normalized;
  }

  getProject(projectId) {
    const projects = this.getProjects();
    return projects.find(item => item.id === projectId) || null;
  }

  getActiveProjectId() {
    return this.requireStorage().getItem(ACTIVE_PROJECT_KEY);
  }

  setActiveProjectId(projectId) {
    this.requireStorage().setItem(ACTIVE_PROJECT_KEY, projectId);
  }

  createProject(docOrOpts, maybeDescription = '') {
    const id = `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const activeProfile = this.getActiveProfile() || { id: 'user_lead', name: 'Jordan Lee', email: 'jordan@example.com' };

    let projectName = 'Untitled Project';
    let projectDesc = '';
    let initialDoc = null;

    if (typeof docOrOpts === 'string') {
      projectName = docOrOpts.trim() || 'Untitled Project';
      projectDesc = maybeDescription.trim();
    } else if (docOrOpts && typeof docOrOpts === 'object') {
      if (Array.isArray(docOrOpts.pages)) {
        // Passed a full DesignForge document
        projectName = docOrOpts.name || 'Untitled Project';
        projectDesc = docOrOpts.description || '';
        initialDoc = docOrOpts;
      } else {
        projectName = docOrOpts.name?.trim() || 'Untitled Project';
        projectDesc = docOrOpts.description?.trim() || '';
        if (docOrOpts.document) initialDoc = docOrOpts.document;
      }
    }

    const project = {
      id,
      name: projectName,
      description: projectDesc,
      createdAt: now,
      updatedAt: now,
      leadId: activeProfile.id || 'user_lead',
      members: [
        {
          userId: activeProfile.id || 'user_lead',
          name: activeProfile.name || 'Jordan Lee',
          email: activeProfile.email || 'jordan@example.com',
          role: 'Project Lead',
          addedAt: now,
          addedBy: 'Creator'
        }
      ],
      fileCount: initialDoc ? 1 : 0
    };

    const storage = this.requireStorage();
    const projects = this.getProjects();
    projects.unshift(project);
    this.writeJson(PROJECT_INDEX_KEY, projects);
    storage.setItem(ACTIVE_PROJECT_KEY, id);

    // If an initial document was provided, register it as a design file in this project
    if (initialDoc) {
      this.createDesignFile(id, initialDoc, { fileId: id });
      storage.setItem(`designforge_workspace_document_${id}`, JSON.stringify(initialDoc));
    }

    return project;
  }

  updateProject(projectId, updates = {}) {
    const projects = this.getProjects();
    const project = projects.find(item => item.id === projectId);
    if (!project) throw new Error('Project not found.');

    if (typeof updates.name === 'string' && updates.name.trim()) {
      project.name = updates.name.trim();
    }
    if (typeof updates.description === 'string') {
      project.description = updates.description.trim();
    }
    project.updatedAt = new Date().toISOString();

    this.writeJson(PROJECT_INDEX_KEY, projects);
    return project;
  }

  deleteProject(projectId) {
    const files = this.getDesignFiles(projectId);
    if (files.length > 0) {
      throw new Error('Cannot delete a project that contains design files. Move or delete its design files first.');
    }
    const projects = this.getProjects().filter(p => p.id !== projectId);
    this.writeJson(PROJECT_INDEX_KEY, projects);
    if (this.getActiveProjectId() === projectId) {
      this.requireStorage().removeItem(ACTIVE_PROJECT_KEY);
    }
    return true;
  }

  ensureActiveProject(document) {
    const storage = this.requireStorage();
    const projects = this.getProjects();
    const activeId = storage.getItem(ACTIVE_PROJECT_KEY);
    const activeProject = projects.find(project => project.id === activeId);
    if (activeProject) {
      this.saveProject(document, activeId);
      return activeProject;
    }
    if (projects.length) {
      storage.setItem(ACTIVE_PROJECT_KEY, projects[0].id);
      this.saveProject(document, projects[0].id);
      return projects[0];
    }
    return this.createProject(document);
  }

  saveProject(document, projectId = this.getActiveProjectId()) {
    if (!projectId) return this.createProject(document);
    const projects = this.getProjects();
    const project = projects.find(item => item.id === projectId);
    if (!project) throw new Error('The active project could not be found.');
    project.name = document.name || project.name;
    project.updatedAt = new Date().toISOString();
    const storage = this.requireStorage();
    try {
      storage.setItem(`designforge_workspace_document_${projectId}`, JSON.stringify(document));
      // Also update or ensure design file record
      const activeFileId = this.getActiveFileId();
      const targetFileId = (activeFileId && this.getFile(activeFileId)?.projectId === projectId)
        ? activeFileId
        : projectId;
      this.saveDesignFile(targetFileId, document, projectId);
    } catch (error) {
      throw new Error(`Could not save this project locally: ${error.message}`);
    }
    this.writeJson(PROJECT_INDEX_KEY, projects);
    return project;
  }

  loadProject(projectId) {
    // Check if legacy/direct document exists for this project ID
    const serialized = this.requireStorage().getItem(`designforge_workspace_document_${projectId}`);
    let document = null;
    if (serialized) {
      try {
        document = JSON.parse(serialized);
      } catch {
        throw new Error('This project snapshot is invalid JSON and cannot be opened.');
      }
    } else {
      // Look up first design file belonging to this project
      const files = this.getDesignFiles(projectId);
      if (files.length > 0) {
        document = this.loadDesignFile(files[0].id);
      }
    }

    if (!document) {
      throw new Error('This project has no saved local document.');
    }
    if (document?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(document.pages) || !document.pages.length) {
      throw new Error('This project snapshot is not a supported DesignForge document.');
    }
    this.requireStorage().setItem(ACTIVE_PROJECT_KEY, projectId);
    return document;
  }

  /**
   * Design Files Management (Figma Hierarchy: Level 3)
   */
  getDesignFiles(projectId = null) {
    const files = this.readJson(FILES_INDEX_KEY, []);
    if (!Array.isArray(files)) return [];
    if (!projectId) return files;
    return files.filter(file => file.projectId === projectId).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  getFile(fileId) {
    const files = this.getDesignFiles();
    return files.find(f => f.id === fileId) || null;
  }

  getActiveFileId() {
    return this.requireStorage().getItem(ACTIVE_FILE_KEY);
  }

  setActiveFileId(fileId) {
    this.requireStorage().setItem(ACTIVE_FILE_KEY, fileId);
  }

  createDesignFile(projectId, document, options = {}) {
    const fileId = options.fileId || `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const file = {
      id: fileId,
      projectId,
      name: document.name || 'Untitled Document',
      createdAt: options.createdAt || now,
      updatedAt: now
    };

    const storage = this.requireStorage();
    storage.setItem(`designforge_workspace_document_${fileId}`, JSON.stringify(document));

    const files = this.readJson(FILES_INDEX_KEY, []);
    const existingIdx = files.findIndex(f => f.id === fileId);
    if (existingIdx >= 0) {
      files[existingIdx] = file;
    } else {
      files.unshift(file);
    }
    this.writeJson(FILES_INDEX_KEY, files);

    // Update parent project's updatedAt and file count
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      project.updatedAt = now;
      this.writeJson(PROJECT_INDEX_KEY, projects);
    }

    storage.setItem(ACTIVE_FILE_KEY, fileId);
    storage.setItem(ACTIVE_PROJECT_KEY, projectId);
    return file;
  }

  saveDesignFile(fileId, document, projectId = null) {
    const storage = this.requireStorage();
    storage.setItem(`designforge_workspace_document_${fileId}`, JSON.stringify(document));

    const files = this.readJson(FILES_INDEX_KEY, []);
    const now = new Date().toISOString();
    let file = files.find(f => f.id === fileId);

    if (file) {
      file.name = document.name || file.name;
      file.updatedAt = now;
      if (projectId) file.projectId = projectId;
    } else {
      file = {
        id: fileId,
        projectId: projectId || this.getActiveProjectId() || 'project_default',
        name: document.name || 'Untitled Document',
        createdAt: now,
        updatedAt: now
      };
      files.unshift(file);
    }
    this.writeJson(FILES_INDEX_KEY, files);

    // Update parent project updatedAt
    if (file.projectId) {
      const projects = this.getProjects();
      const proj = projects.find(p => p.id === file.projectId);
      if (proj) {
        proj.updatedAt = now;
        this.writeJson(PROJECT_INDEX_KEY, projects);
      }
    }
    return file;
  }

  loadDesignFile(fileId) {
    const storage = this.requireStorage();
    const serialized = storage.getItem(`designforge_workspace_document_${fileId}`);
    if (!serialized) throw new Error('Design file not found in local storage.');

    let document;
    try {
      document = JSON.parse(serialized);
    } catch {
      throw new Error('This design file is invalid JSON.');
    }
    if (document?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(document.pages) || !document.pages.length) {
      throw new Error('This design file is not a supported DesignForge document.');
    }

    const file = this.getFile(fileId);
    storage.setItem(ACTIVE_FILE_KEY, fileId);
    if (file?.projectId) {
      storage.setItem(ACTIVE_PROJECT_KEY, file.projectId);
    }
    return document;
  }

  deleteDesignFile(fileId) {
    const storage = this.requireStorage();
    storage.removeItem(`designforge_workspace_document_${fileId}`);
    const files = this.readJson(FILES_INDEX_KEY, []).filter(f => f.id !== fileId);
    this.writeJson(FILES_INDEX_KEY, files);
    if (this.getActiveFileId() === fileId) {
      storage.removeItem(ACTIVE_FILE_KEY);
    }
    return true;
  }

  getRecentFiles(limit = 10) {
    const files = this.readJson(FILES_INDEX_KEY, []);
    const projects = this.getProjects();
    const projectMap = new Map(projects.map(p => [p.id, p.name]));

    return files
      .slice()
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, limit)
      .map(file => ({
        ...file,
        projectName: projectMap.get(file.projectId) || 'My designs'
      }));
  }

  /**
   * Project Settings & Members Management (Figma Hierarchy: Level 4)
   */
  getProjectMembers(projectId) {
    const project = this.getProject(projectId);
    if (!project) throw new Error('Project not found.');
    return Array.isArray(project.members) ? project.members : [];
  }

  addProjectMember(projectId, member) {
    if (!member || !member.name || !member.name.trim()) {
      throw new Error('Member name is required.');
    }
    const role = member.role || 'Designer';
    if (!VALID_PROJECT_ROLES.includes(role)) {
      throw new Error(`Invalid role "${role}". Supported roles: ${VALID_PROJECT_ROLES.join(', ')}.`);
    }

    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found.');

    if (!Array.isArray(project.members)) project.members = [];

    const isDuplicate = project.members.some(m =>
      (member.userId && m.userId === member.userId) ||
      (member.email && m.email && m.email.toLowerCase() === member.email.toLowerCase())
    );
    if (isDuplicate) {
      throw new Error('This user is already a member of this project.');
    }

    const newMember = {
      userId: member.userId || `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: member.name.trim(),
      email: (member.email || '').trim(),
      role,
      addedAt: new Date().toISOString(),
      addedBy: member.addedBy || 'Project Lead'
    };

    project.members.push(newMember);
    project.updatedAt = new Date().toISOString();
    this.writeJson(PROJECT_INDEX_KEY, projects);
    return newMember;
  }

  updateProjectMemberRole(projectId, userId, newRole) {
    if (!VALID_PROJECT_ROLES.includes(newRole)) {
      throw new Error(`Invalid role "${newRole}". Supported roles: ${VALID_PROJECT_ROLES.join(', ')}.`);
    }

    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found.');

    const member = project.members.find(m => m.userId === userId);
    if (!member) throw new Error('Member not found in this project.');

    // Last-lead protection invariant:
    // Prevent project from being left without an authorized Project Lead
    if (member.role === 'Project Lead' && newRole !== 'Project Lead') {
      const leadCount = project.members.filter(m => m.role === 'Project Lead').length;
      if (leadCount <= 1) {
        throw new Error('Cannot remove or demote the last Project Lead. Assign another lead first.');
      }
    }

    member.role = newRole;
    project.updatedAt = new Date().toISOString();
    this.writeJson(PROJECT_INDEX_KEY, projects);
    return member;
  }

  removeProjectMember(projectId, userId) {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found.');

    const member = project.members.find(m => m.userId === userId);
    if (!member) throw new Error('Member not found in this project.');

    // Last-lead protection invariant:
    if (member.role === 'Project Lead') {
      const leadCount = project.members.filter(m => m.role === 'Project Lead').length;
      if (leadCount <= 1) {
        throw new Error('Cannot remove the last Project Lead. Assign another lead first.');
      }
    }

    project.members = project.members.filter(m => m.userId !== userId);
    project.updatedAt = new Date().toISOString();
    this.writeJson(PROJECT_INDEX_KEY, projects);
    return true;
  }

  /**
   * User Profiles & Settings (Global Workspace Destinations: Level 1)
   */
  getActiveProfile() {
    const profiles = this.getProfiles();
    const activeId = this.requireStorage().getItem(ACTIVE_PROFILE_KEY);
    return profiles.find(profile => profile.id === activeId) || profiles[0] || null;
  }

  getProfiles() {
    const profiles = this.readJson(PROFILE_INDEX_KEY, []);
    return Array.isArray(profiles) ? profiles : [];
  }

  saveProfile(profile) {
    const profiles = this.getProfiles();
    const savedProfile = {
      id: profile.id || `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: String(profile.name || '').trim().slice(0, 100),
      email: String(profile.email || '').trim().slice(0, 200),
      role: String(profile.role || 'Product Designer').trim().slice(0, 100),
      handle: String(profile.handle || '').trim().replace(/^@/, '').slice(0, 60),
      updatedAt: new Date().toISOString()
    };
    if (!savedProfile.name) throw new Error('Enter a profile name.');
    const existingIndex = profiles.findIndex(item => item.id === savedProfile.id);
    if (existingIndex >= 0) profiles[existingIndex] = savedProfile;
    else profiles.unshift(savedProfile);
    this.writeJson(PROFILE_INDEX_KEY, profiles);
    this.requireStorage().setItem(ACTIVE_PROFILE_KEY, savedProfile.id);
    return savedProfile;
  }

  setActiveProfile(profileId) {
    if (!this.getProfiles().some(profile => profile.id === profileId)) {
      throw new Error('The selected profile could not be found.');
    }
    this.requireStorage().setItem(ACTIVE_PROFILE_KEY, profileId);
  }

  getNotifications() {
    return this.readJson(NOTIFICATIONS_KEY, {
      desktop: true,
      comments: true,
      invites: true,
      projectUpdates: false,
      productNews: false
    });
  }

  saveNotifications(notifications) {
    this.writeJson(NOTIFICATIONS_KEY, notifications);
  }

  getReactLibraries() {
    const libraries = this.readJson(REACT_LIBRARIES_KEY, []);
    return Array.isArray(libraries) ? libraries : [];
  }

  addReactLibrary(library) {
    const libraries = this.getReactLibraries();
    const existingIndex = libraries.findIndex(item => item.name === library.name);
    const record = { ...library, updatedAt: new Date().toISOString() };
    if (existingIndex >= 0) libraries[existingIndex] = record;
    else libraries.unshift(record);
    this.writeJson(REACT_LIBRARIES_KEY, libraries);
    return record;
  }

  removeReactLibrary(name) {
    const libraries = this.getReactLibraries().filter(library => library.name !== name);
    this.writeJson(REACT_LIBRARIES_KEY, libraries);
  }
}
