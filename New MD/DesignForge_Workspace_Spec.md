# DesignForge AI — Workspace, Projects, and Design File Navigation

**Document type:** Product and engineering implementation specification  
**Status:** Audited implementation specification; confirm against existing codebase before rollout  
**Primary constraint:** Improve workspace and file navigation without removing, rewriting, or impairing existing design-editor functionality.

## 1. Objective

Restructure the current workspace so it follows a clear, Figma-inspired information hierarchy:

**Workspace → Projects → Design files → Existing design editor**

A workspace contains projects. Each project contains one or more design files. A design file is the editable document that opens in the existing DesignForge AI editor.

The current screen titled **Your projects** displays cards named **Untitled Document** alongside a card named **test**. These appear to be design files, not projects. Separate the concepts so that the Projects screen lists projects, and opening a project displays the design files inside it.

The goal is a navigation and organization change—not a redesign or replacement of the editor.

## 2. Non-negotiable compatibility requirements

1. **Do not alter the existing design editor's behavior.** The canvas, vector tools, text tools, layers, properties panels, components, assets, design tokens, prototyping, AI features, keyboard shortcuts, selection behavior, and export functionality must continue to work as they do today.
2. Reuse the existing editor and its save/open mechanisms. A design file card must open the same editor route or handler used today.
3. Preserve existing document IDs, content, versions, assets, permissions, and timestamps. Do not recreate documents just to place them in a project.
4. Keep existing URLs and deep links working where possible. If routes must change, add redirects or route compatibility so old bookmarks still open the correct file.
5. Keep autosave and manual-save behavior unchanged. Navigation must not discard unsaved work. If saving is pending or has failed, use the application's existing save/retry/error pattern before switching away.
6. Do not rename existing design files automatically, overwrite their contents, or silently change their access permissions.
7. Implement the new navigation as a shell around existing capabilities. Avoid broad editor refactors as part of this task.

## 3. Core information architecture

### Level 1 — Workspace

The workspace is the top-level environment for a user or organization. It contains projects and workspace-level destinations.

- **Projects:** browse and manage projects in the selected workspace.
- **Recently opened:** open design files recently used by the user, regardless of which project contains them, subject to access permissions.
- **Settings:** retain the existing workspace/user settings destination as a persistent, top-level workspace navigation item.
- **Organization:** retain the existing organization destination and organization-level membership/permissions as a persistent, top-level workspace navigation item.
- **Profile / account menu:** retain the current account controls.

**Navigation rule:** Settings and Organization must remain top-level workspace destinations in the global left sidebar and remain available while the user is inside a project or design file. Do not move them under an individual project, replace them with Project settings, or hide them only inside an overflow menu. Project settings are an additional, project-scoped area. Organization membership and project membership are separate concepts.

The sidebar can retain the visual language shown in the supplied screenshot. Only adjust its labels, navigation behavior, and counts where needed.

### Level 2 — Projects

The Projects screen lists actual projects, not individual design files.

Each project should have:

- Project name
- Optional description
- Project thumbnail or generated preview, when available
- Number of design files
- Last activity / last edited date
- Owner or team information, where available in the current permission model
- A **Project settings** destination, available from the project header and/or project overflow menu
- Overflow actions such as Rename, Move (only if supported), Duplicate (only if safe and supported), and Delete (with confirmation and existing permission checks)

Primary actions:

- **New project** — creates a project container. It does not silently create or replace a design file.
- **Open project** — opens the project detail screen and displays its design files.
- **Search projects** — searches project names and any project metadata supported by the application.
- **Sort** — for example, Last edited, Name, and Recently created, if the underlying fields are available.

An empty project is valid and should show a useful empty state with a **Create design file** action.

### Level 3 — Project detail / Design files

Opening a project shows the design files that belong to that project. Project-level navigation should also expose **Project settings** without changing the workspace-wide sidebar destinations.

The screen should include:

- Breadcrumb: `Workspace / Projects / [Project name]`
- Project title and optional description
- **New design file** action
- Search within this project
- Sorting and display options consistent with the rest of the app
- A grid or list of design-file cards
- An empty state when the project has no files

Each design-file card should represent one editable document and include:

- File preview / thumbnail, falling back to a neutral placeholder if no preview exists
- Design-file name
- Last edited information
- Optional file type or status only when the product already supports that concept
- Overflow actions such as Rename, Duplicate, Move to project, and Delete, only where they can be implemented safely and consistently with current capabilities

Selecting a card opens that design file in the **existing editor**. The project detail screen must not render an alternative editor or create a second document state.

### Level 4 — Project settings and members

Every project must have its own settings section. This is distinct from global **Settings** and **Organization**. A project lead should be able to manage the people who have access to that project without changing the workspace's global navigation or the organization's membership records.

The Project settings screen should include:

- **General:** project name and optional description; use existing validation and rename/update flows.
- **Members & access:** current project members, their project role, who added them where supported, and available actions.
- **Add people:** search/select existing organization or workspace members and add them to this project. If the application already supports invitations, allow a project lead to initiate an invitation through that existing flow; do not create a separate invitation system.
- **Remove from project:** remove a member's access to this project only, after confirmation. This must not delete their account or remove them from the organization/workspace.
- **Role management:** support Project Lead, Designer, and Viewer only if these roles fit the existing permission system. Map to existing roles where possible rather than introducing incompatible duplicate roles.
- **Access feedback:** show clear success/error and permission-denied states; update the member list after a successful change.

**Project membership rules:**

1. Only a project owner/lead or an administrator explicitly authorized by the existing permission model can add or remove project members or change their project role.
2. Designers added to a project gain access only to that project and the files within it, subject to the app's existing file-level access rules. Do not grant organization-wide access by default.
3. Adding an existing organization member to a project must not alter their organization role. If the person is not yet an organization/workspace member, use the current organization invitation/approval process where available; do not silently bypass it.
4. Removing a person from a project revokes that person's project-scoped access but preserves authored content, comments, assets, version history, and audit records according to existing retention behavior. Do not delete their work.
5. Prevent a project from being left without an authorized owner/lead. Require another eligible lead to be assigned before removing or demoting the last lead.
6. Enforce access checks on the server/API or authoritative data layer, not only by hiding UI controls. Recheck access when opening files and when performing mutations.
7. Record membership changes in the existing audit log/activity system if one exists; otherwise, keep the implementation minimal and document the gap rather than building a broad audit subsystem in this task.
8. Project settings and membership state must be scoped to the correct workspace. A project must not add members from a different workspace unless the existing product explicitly supports cross-workspace collaboration.

### Level 5 — Existing design editor

The existing editor remains authoritative for editing and document state. Add only the minimum navigation affordances necessary to make moving between files straightforward:

- A breadcrumb or file-location control that returns to the containing project.
- A file name control that allows renaming only through the existing rename/save pathway.
- A **Switch file** or **Open recent** affordance that lets the user open another accessible design file without returning to the Projects landing page first.
- Where practical, show the current project and provide a way back to that project's file list.

Do not add a new editor tab system if it would require duplicating editor state or destabilize the current editor. A simple file switcher is sufficient for the first release. If multi-tab editing is introduced later, it must have an explicit design for independent document state, unsaved changes, keyboard focus, and recovery.

## 4. Recommended screen flow

1. User enters DesignForge AI and sees the workspace's Projects screen.
2. User selects a project card.
3. Project detail opens and shows the design files within that project.
4. User selects a design-file card.
5. The selected document opens in the existing editor.
6. User can return to the project using the breadcrumb, or switch directly to another accessible design file using the file switcher / recent-files menu.
7. A project lead opens **Project settings → Members & access** to add eligible designers or remove people from that project.
8. Returning to the project preserves the user's previous search, sort, and scroll position for the current session where feasible.

### Creation flow

**Create a project**

1. Select **New project**.
2. Enter a project name; description is optional.
3. Create the project.
4. Navigate to the new project's detail screen.
5. Show the empty state and **Create design file** action.

**Create a design file**

1. From a project, select **New design file**.
2. Use the application's existing new-document creation logic.
3. Associate the newly created file with the current project.
4. Open the file in the existing editor.
5. Confirm that the new file appears in the project's file list after it is saved.

If the application supports templates or different file types today, preserve those existing options in the new-file flow. Do not invent or remove file types as part of this navigation change.

## 5. Suggested navigation layout

Use the current screenshot as the visual baseline: dark theme, fixed left sidebar, compact navigation, strong page heading, restrained controls, and a card grid. Keep the current design system, spacing, typography, icon style, and color tokens unless a small adjustment is required for hierarchy or accessibility.

### Workspace sidebar

- DesignForge AI brand / workspace selector, if available
- Search (scope should be clearly indicated)
- Projects (with a project count, not a document count)
- Recently opened
- Persistent top-level workspace destinations near the top-level navigation: **Settings** and **Organization**. Preserve their existing global routes and availability; they must not be nested inside a project or replaced by Project settings.
- User / profile area at the bottom

The exact visual grouping may follow the current sidebar, but Settings and Organization must stay globally accessible. Project settings appear contextually on each project's detail page/header or project menu.

### Projects landing screen

- Breadcrumb: `Workspace / Projects`
- Page title: **Projects** or **Your projects**
- Supporting text explaining that projects organize design files
- Top-right: existing Settings shortcut if appropriate, profile/avatar, **New project**
- Project search and sort controls
- Project cards, each showing a project thumbnail, project name, file count, and last activity

Avoid showing document-level controls such as a document's Open label as if they were project metadata.

### Project detail screen

- Breadcrumb: `Workspace / Projects / Project name`
- Project name and optional description
- Primary action: **New design file**
- **Project settings** action visible to authorized project members/leads
- Project-specific search and sorting
- Design-file grid/list
- Clear empty state if there are no files

### Project settings screen

- Breadcrumb: `Workspace / Projects / Project name / Settings`
- Settings sections such as **General** and **Members & access**
- Member list with role and per-member management actions
- **Add people** flow for authorized project leads/admins
- **Remove from project** flow with confirmation
- Read-only state or permission-denied messaging for users who cannot manage membership

### Recently opened

Show design files rather than projects, because users are returning to individual documents. Each item should make its containing project discoverable when that relationship is available.

## 6. Data model and relationships

Use the app's existing data model and persistence layer as the source of truth. The following is a logical model, not a requirement to replace current database tables or naming conventions.

### Workspace

- `id`
- `name`
- existing owner/member/permission fields
- existing creation and update timestamps

### Project

- `id`
- `workspaceId`
- `name`
- `description` (optional)
- `thumbnail` or preview reference (optional; use the current asset/preview mechanism if available)
- `createdBy`
- `createdAt`
- `updatedAt` or `lastActivityAt`, according to current conventions
- existing membership/permission fields as needed

### Project membership (logical model)

Use the existing membership/ACL model if it already supports project-scoped permissions. If it does not, introduce the smallest compatible relationship, conceptually containing:

- `projectId`
- `userId`
- `role` or permission reference mapped to the app's current permission model
- `addedBy` and timestamps, where consistent with existing audit conventions

Enforce uniqueness for a user's membership in a given project and validate that the project and user belong to an allowed workspace boundary. Avoid storing a second, conflicting source of truth for organization membership.

### Design file

- Preserve all current file/document fields and identifiers.
- Add or use a nullable `projectId` relationship to `Project` if the application does not already have one.
- Maintain the current file content, editor schema, canvas state, assets, component references, design tokens, prototype links, versions, and save metadata.
- Enforce that the project belongs to the same workspace as the design file.

### Relationship

- One workspace contains many projects.
- One project contains many design files.
- A design file belongs to one project in the first release.
- Do not add nested folders inside projects unless they are already supported or separately approved.

If the current application is single-workspace, introduce only the smallest compatible representation needed. Do not add organization-level complexity to the runtime just to imitate a different product's architecture.

## 7. Existing-data migration and backward compatibility

The current UI appears to show design documents directly on the Projects screen. Existing documents must remain accessible after the new hierarchy is introduced.

Recommended migration:

1. Inspect the actual persisted data model and determine whether projects already exist or whether the current screen is simply presenting documents as projects.
2. Preserve every existing design-file ID and its content.
3. For files without a project association, place them into a clearly named default project such as **My designs** (or the application's current equivalent) using a reversible metadata-only migration. Do not create one project per document.
4. If a suitable default project already exists, reuse it rather than making duplicates.
5. Make the migration idempotent: rerunning it must not create duplicate projects or duplicate file relationships.
6. Preserve original timestamps and ownership metadata wherever possible. The migration itself must not make every file look newly edited.
7. Keep the old file-opening route or add a redirect/resolver so direct links to existing documents still open the same document.
8. Validate access permissions before showing files in search, recent lists, project grids, or switchers.
9. Provide a safe fallback for files whose project relationship is missing, inaccessible, or invalid. Such files must not disappear; route them to the user's recoverable files area or a migration-repair state defined by the existing app.

Do not run a destructive schema migration before testing on a copy of the existing data.

## 8. Navigation and routing contract

Use the application's existing routing conventions. The following paths are illustrative; adapt them to the current codebase rather than introducing duplicate route systems:

- `/workspace/:workspaceId/projects` — project listing
- `/workspace/:workspaceId/projects/:projectId` — project's design-file list
- `/workspace/:workspaceId/projects/:projectId/settings` — project settings, including Members & access
- Existing design-file route, for example `/design/:fileId` — opens the existing editor
- `/workspace/:workspaceId/recent` — recently opened design files
- Existing global Settings and Organization routes remain valid and unchanged

Requirements:

- Route changes must preserve workspace/project context where possible.
- Refreshing a project or design-file URL must render the correct screen.
- Browser Back and Forward must behave predictably.
- Opening a design file from search, recents, or the file switcher must resolve to the same canonical document route.
- Invalid or inaccessible project/file IDs should show a useful not-found or access-denied state, not a blank screen.
- Do not store the only copy of essential navigation context in transient component state; URL state should identify the current project or file.

## 9. File switching behavior

The user should be able to move among design files without returning to the workspace home every time.

Implement a lightweight switcher using existing file data:

- List recently opened files and, where useful, files from the current project.
- Display each file's name and project name when available.
- Search the available files if the current data volume warrants it.
- Respect user permissions and workspace boundaries.
- Selecting a file follows the normal open-document path.
- Preserve the existing save lifecycle. If there are unsaved changes, use the current autosave/save/error handling rather than silently discarding edits.
- Do not transfer selections, layers, zoom, or canvas state from one design file to another unless the existing editor explicitly scopes that state to the new document.
- After opening a file, update recent-file metadata through the current persistence mechanism.

The switcher must not change how tools work inside a document. It is a navigation feature only.

## 10. Search and sorting

Clarify search scope in the UI.

- **Projects screen:** search projects.
- **Project detail:** search design files inside the current project.
- **Recently opened:** search recent design files.
- **File switcher:** search only files the user is allowed to open.

Keep search and sort state local to the relevant screen. Do not mix project names and file names into one ambiguous result list without labels identifying each result type.

Use stable ordering and existing timestamp semantics. If `lastEdited` is not available, use an existing reliable activity timestamp rather than generating or guessing one.

## 11. Permissions, project membership, and destructive actions

- Apply existing workspace, project, and file access rules consistently.
- Keep **Organization membership** separate from **Project membership**. Adding or removing a person from a project must not silently add them to or remove them from the organization/workspace.
- Only authorized project leads/owners and administrators may manage project members. Check permission at the authoritative data/API layer for every add, remove, or role change.
- Confirm before removing a person from a project; state clearly that access to this project will be removed but their account and authored content will remain.
- Do not allow removal or demotion of the last project lead until another eligible lead is assigned.
- When a member loses project access, ensure their access to project files is revoked consistently while preserving project content and existing retention/audit behavior.
- Only expose create, rename, move, duplicate, and delete actions when the existing permission model allows them.
- Confirm destructive actions and explain their scope.
- Deleting a project must not silently delete its design files unless the product's current rules explicitly define that behavior and the user confirms it. Prefer blocking deletion until the project is empty, or offer an explicit, well-defined move/retention path.
- Moving a design file must change only its project association, not its ID or content.
- A project must not be able to contain a file from another workspace.

## 12. UI states to design and implement

- Loading project list
- Loading a project's files
- No projects yet
- Project exists but has no design files
- Search returns no projects
- Search returns no files
- Failed to load with retry action
- File has no preview / thumbnail
- File is being saved before navigation
- Save failure while switching files
- Missing or inaccessible project/file
- File has no valid project association during migration
- Permission-restricted actions
- Project settings for users with view-only access
- Add project members: success, existing member, invalid/ineligible user, and permission-denied states
- Remove project member: confirmation, success, failure, and last-lead protection states
- Project lead changes and role-management edge cases

Do not rely on blank space alone to communicate an empty or failed state.

## 13. Implementation boundaries

### In scope

- Correct separation of projects and design files
- Project creation and listing
- Project detail page with file listing
- New design-file creation within the current project, using existing creation logic
- Breadcrumbs and navigation back to project/workspace
- Recently opened design files
- A lightweight design-file switcher
- Per-project settings, including general settings and project member management
- Safe mapping of existing documents into projects
- UI states, routing, permissions, and regression tests for the above

### Out of scope unless separately approved

- Rebuilding the canvas or editor
- Rewriting vector, pen, Boolean operation, shape, text, component, prototype, or design-token behavior
- Changing the document file format or editor state schema
- Introducing a new permissions system
- Adding nested folders or advanced project hierarchies
- Introducing collaborative editing or multi-tab editing if not already present
- Replacing the existing autosave, undo/redo, version history, or asset pipeline
- Changing the current visual design system for unrelated reasons

## 14. Suggested implementation sequence

1. **Audit:** locate current project/document entities, current workspace landing route, document creation handler, editor route, save lifecycle, access checks, and recent-file support.
2. **Model:** add the smallest project-to-file relationship compatible with the current schema.
3. **Migration:** map existing unassigned documents to a default project in an idempotent, reversible migration.
4. **Projects screen:** change its data source to projects and update labels, counts, search, sorting, and empty state.
5. **Project detail:** list the design files associated with a project.
6. **Creation:** connect New project and New design file to existing persistence and editor-opening logic.
7. **Navigation:** add breadcrumbs, Recently opened, the lightweight file switcher, and persistent global Settings/Organization destinations.
8. **Project settings:** connect each project to its settings screen; implement authorized member listing, adding, removing, and role changes using the existing permission/invitation mechanisms.
9. **Regression:** test file opening, editing, save/reload, workspace and project permissions, membership changes, deep links, browser navigation, and all current editor tools.
10. **Rollout:** enable the new shell only after migration and regression checks pass; keep a rollback strategy for the navigation/data association change.

## 15. Acceptance criteria

The feature is complete when all of the following are true:

- [ ] The workspace Projects screen displays projects, not individual design files presented as projects.
- [ ] Global Settings and Organization remain persistent top-level workspace destinations and are never moved under an individual project.
- [ ] Every project has a Project settings destination that is distinct from global Settings and Organization.
- [ ] Authorized project leads can view project membership and add existing eligible workspace/organization members to the project.
- [ ] Authorized project leads can remove people from a project without deleting their accounts, authored work, or organization membership.
- [ ] Unauthorized users cannot add/remove members or change project roles, including by calling an API directly.
- [ ] A project cannot be left without an authorized lead.
- [ ] Project membership changes immediately affect access to that project's files while preserving document content and existing audit/retention behavior.
- [ ] Opening a project displays only the design files associated with that project.
- [ ] A project can contain multiple design files.
- [ ] The user can create a project and then create a design file inside it.
- [ ] Opening a design-file card opens the existing DesignForge AI editor.
- [ ] Users can return to the containing project from the editor.
- [ ] Users can switch to another accessible design file without visiting the Projects landing screen.
- [ ] Recently opened contains design files and respects access permissions.
- [ ] Existing design files remain available after migration, with IDs and content preserved.
- [ ] Existing direct links to design files continue to work or redirect correctly.
- [ ] Saving, undo/redo, selection, canvas state, vector editing, text editing, components, design tokens, prototyping, and export remain unchanged.
- [ ] There is no data loss when navigating between projects or files.
- [ ] Empty, loading, error, and permission states are implemented.
- [ ] Browser refresh, Back, and Forward work on project and design-file URLs.
- [ ] Automated or manual regression tests verify the existing editor still behaves as before.

## 16. Instruction for the implementation agent

Before making code changes, inspect the current codebase and identify the existing document model, routes, save flow, and editor entry point. Reuse them. Do not assume that a feature or route exists based on this specification alone.

Implement the smallest set of changes that establishes the hierarchy **Workspace → Projects → Project settings / Design files → Existing editor**. Keep global **Settings** and **Organization** as persistent top-level workspace destinations, and add a project-scoped **Members & access** section so authorized project leads can add or remove designers. Preserve the current application styling and every existing editor capability. If any required data relationship or behavior is unclear, document the assumption and choose the least destructive implementation. Do not remove or rename existing functionality, replace components wholesale, or perform unrelated refactors.

## 17. Gap audit — additional decisions to make implementation unambiguous

The main hierarchy, migration constraints, persistent global navigation, and project membership workflow are covered above. The following details should be explicitly resolved during implementation so different parts of the team do not infer conflicting behavior.

### 17.1 Role capability matrix

Map this matrix onto the permissions already in the codebase; do not create duplicate role systems if equivalent roles already exist.

| Capability | Workspace / organization admin | Project lead | Designer | Viewer |
|---|---|---|---|---|
| Open the workspace Projects and Recently opened destinations | Yes, subject to workspace access | Yes | Yes | Yes |
| Open a project | If authorized by current workspace policy | Yes | Yes, when a project member | Yes, when a project member |
| Create or rename a project | According to current workspace policy | Only if separately granted by workspace policy | No by default | No |
| Edit project details | Only if authorized by current policy | Yes | No by default | No |
| Add or remove project members | Only if explicitly authorized by current policy | Yes | No | No |
| Change project roles / assign another lead | Only if explicitly authorized by current policy | Yes, while preserving at least one lead | No | No |
| Create or edit design files | Depends on explicit project/file permissions; admin status alone must not silently bypass them unless current policy says so | Yes | Yes | No |
| View design files | According to current workspace/project/file ACL | Yes | Yes | Yes |
| Manage organization membership | Only organization roles authorized to do so | No, unless also an authorized organization admin | No | No |

If the existing product's permission semantics differ, follow its authoritative model, document the mapping, and test it. The key invariant is that **organization role and project role are separate scopes**.

### 17.2 Defaults and ownership lifecycle

- The person creating a project becomes its initial Project Lead unless the existing product has a different explicit ownership policy.
- A project may have multiple leads, but it must never have zero authorized leads.
- Promoting a member to lead must update the project-scoped membership record and activity log atomically. It must not alter the member's organization role.
- Project roles must be stored per project, not as a single role on the user record.
- A member who is added to a project must be a valid member of the same workspace/organization under the current membership rules. External invitations must go through the existing organization invitation flow first when required.
- If invitations can be pending, represent pending invitations distinctly from active project members and do not treat an unaccepted invite as successful access provisioning.

### 17.3 File-access inheritance and revocation

- By default, an active project member can access files in that project according to the product's established file-level permission model. Do not broaden access beyond that model.
- On removal or role downgrade, revoke project-scoped access in the authoritative API/data layer and re-evaluate authorization for already-open editor routes, file downloads, previews, asset endpoints, and subsequent mutations.
- Do not rely on hiding a card or menu item as a security boundary.
- Recent files and switcher results must be filtered at query time using current permissions, not only using stale client-side cached state.
- If the app supports offline editing or local cached documents, define how revoked access is handled on reconnect without silently deleting locally authored work.

### 17.4 Project deletion, archive, and leaving

For the first release, avoid adding a project Delete action unless the existing application already has a defined deletion and recovery model. Prefer a safe, explicit policy:

1. A project with files cannot be permanently deleted by an ordinary project lead unless the existing product supports a safe move/retention flow.
2. If archival already exists, archived projects become read-only and are hidden from the default active-project view while remaining discoverable to authorized users.
3. Leaving a project is not the same as removing a different person. A lead cannot leave if doing so would leave the project without an authorized lead; they must transfer lead access first.
4. If deletion is supported later, require a confirmation that names the project and explains whether files are retained, moved, archived, or deleted. Avoid irreversible cascading deletion by default.

### 17.5 Empty, invitation, and membership edge cases

Design and test these states in addition to the base flows in Section 12:

- No eligible organization members are available to add.
- Selected person is already a member due to a concurrent update.
- Invitation is pending, expired, declined, or fails to send, if the existing invitation system exposes those states.
- Project lead lacks permission because their role changed in another session.
- Project was deleted, archived, or moved while the settings page was open.
- Two leads update membership concurrently; the authoritative data layer must preserve the last-lead invariant.
- A member list is empty because there is a loading/error condition, not because the project genuinely has no members.
- A user searches for a person who is not in the current workspace; explain the existing organization invitation path instead of silently creating a cross-workspace member.

### 17.6 Accessibility and responsive behavior

- All actions must be keyboard reachable with a visible focus indicator; dialogs must trap focus, close predictably, and return focus to the initiating control.
- Use semantic headings, explicit labels for search/select controls, accessible names for icon-only actions, and screen-reader announcements for membership success and failure.
- Do not convey roles, statuses, or errors by color alone.
- Check color contrast in the dark theme, test at 200% zoom, and ensure long project names/emails do not obscure action controls.
- At narrow widths, retain access to the global Projects, Recently opened, Settings, and Organization destinations. Use an accessible collapsed sidebar or navigation drawer rather than removing destinations.
- Project settings tables should adapt to smaller screens with a deliberate stacked/list layout or horizontal scrolling; controls must not become unreachable.

### 17.7 Project list and file-list behavior

- Project count is the number of projects, never the number of design files. File counts belong on project cards.
- Recent items are design files and identify their parent project. Search scope must be labeled as workspace projects, current-project files, or recent files.
- Grid/list display preference may be local to the user, but persist it only through the app's established preferences mechanism.
- Project card actions should not depend on hover alone. Keep a keyboard-accessible overflow action and a direct way to reach Project settings.
- Provide stable ordering when timestamps are unavailable; do not fabricate recent activity timestamps to make a project appear newly edited.
- If a project is empty, show an explicit Create design file action. If the workspace is empty, show New project and explain that files are organized inside projects.

### 17.8 Audit logging, analytics, and operational readiness

Reuse existing activity/audit events where available. At minimum, implementation should be able to distinguish and diagnose: project created/renamed; file associated with a project; project member added/removed; project role changed; lead transferred; access denied; and migration repair required. Avoid logging document content, credentials, or unnecessary personal data.

Before rollout, verify:

- migration is idempotent and can be dry-run against a copy of production-like data;
- record counts and file/project associations reconcile before and after migration;
- there is a rollback or repair path for incorrectly associated files;
- permission checks and membership mutations are covered by automated tests;
- project and file routes work on refresh and browser Back/Forward;
- no existing editor regression is introduced;
- loading, error, empty, and permission-denied states are not blank screens;
- the prototype or frontend does not represent mocked membership changes as persisted production changes.

## 18. Workspace recreation audit outcome

The existing specification already defines the core hierarchy and most critical safety requirements. The material gaps identified and resolved by this audit are: an explicit role-capability matrix; project-scoped role storage and lead-transfer behavior; invitations and concurrent membership edge cases; access revocation for cached/recent/editor/API paths; safe deletion/archive/leave policy; accessibility and responsive requirements; stable count/search/sort semantics; and rollout observability/rollback requirements.

A companion HTML prototype, `designforge-workspace-recreated.html`, illustrates the intended dark workspace shell and interactive navigation using local demo data. It is a design/interaction prototype only: project/member changes are in-memory and must be connected to the existing application's APIs, persistence, route handling, and permission checks before production use.
