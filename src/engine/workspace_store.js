import { SCHEMA_VERSION } from './document.js';

const PROJECT_INDEX_KEY = 'designforge_workspace_projects_v1';
const ACTIVE_PROJECT_KEY = 'designforge_workspace_active_project_v1';
const PROFILE_INDEX_KEY = 'designforge_workspace_profiles_v1';
const ACTIVE_PROFILE_KEY = 'designforge_workspace_active_profile_v1';
const NOTIFICATIONS_KEY = 'designforge_workspace_notifications_v1';
const REACT_LIBRARIES_KEY = 'designforge_workspace_react_libraries_v1';

export class WorkspaceStore {
  requireStorage() {
    if (typeof localStorage === 'undefined') {
      throw new Error('Workspace persistence is unavailable in this browser context.');
    }
    return localStorage;
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

  getProjects() {
    const projects = this.readJson(PROJECT_INDEX_KEY, []);
    return Array.isArray(projects) ? projects : [];
  }

  getActiveProjectId() {
    return this.requireStorage().getItem(ACTIVE_PROJECT_KEY);
  }

  createProject(document) {
    const id = `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const project = {
      id,
      name: document.name || 'Untitled Project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const storage = this.requireStorage();
    storage.setItem(`designforge_workspace_document_${id}`, JSON.stringify(document));
    const projects = this.getProjects();
    projects.unshift(project);
    this.writeJson(PROJECT_INDEX_KEY, projects);
    storage.setItem(ACTIVE_PROJECT_KEY, id);
    return project;
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
    } catch (error) {
      throw new Error(`Could not save this project locally: ${error.message}`);
    }
    this.writeJson(PROJECT_INDEX_KEY, projects);
    return project;
  }

  loadProject(projectId) {
    const serialized = this.requireStorage().getItem(`designforge_workspace_document_${projectId}`);
    if (!serialized) throw new Error('This project has no saved local document.');
    let document;
    try {
      document = JSON.parse(serialized);
    } catch {
      throw new Error('This project snapshot is invalid JSON and cannot be opened.');
    }
    if (document?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(document.pages) || !document.pages.length) {
      throw new Error('This project snapshot is not a supported DesignForge document.');
    }
    this.requireStorage().setItem(ACTIVE_PROJECT_KEY, projectId);
    return document;
  }

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
