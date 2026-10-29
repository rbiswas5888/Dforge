# DesignForge AI — Comprehensive QA Test Plan

## 1. Overview and Executive Summary
This document establishes the master testing strategy, scope, environment configuration, test matrix, and verification procedures for the **DesignForge AI** enterprise application. The test plan evaluates the full application hierarchy:
- Responsive Authentication (Desktop, Tablet, Mobile)
- Workspace Management (Organization hierarchy, Projects, File listing, Permissions, Last-Lead safety)
- Canvas Editor (Infinite canvas, selection, vector editing, floating tool pods, prototyping, React code export)
- Landing Navigation Invariants (Unauthenticated $\to$ Login; Authenticated $\to$ Workspace, or direct Editor restoration if closed with an open file).

---

## 2. Testing Scope & Methodology

### 2.1 Target Modules
1. **Authentication Experience**:
   - Validation for empty, malformed, and incorrect inputs.
   - Password visibility toggling and remember-me persistence.
   - Enterprise SSO simulation (Google Workspace, GitHub Enterprise, Okta SAML).
   - Self-service password recovery flow with format checking.
   - Session termination and state synchronization.
2. **Responsive Layouts**:
   - Desktop viewports (1440 × 900, 1280 × 800, 1920 × 1080).
   - Tablet viewports (768 × 1024 portrait, 1024 × 768 landscape).
   - Mobile viewports (390 × 844 iPhone, 360 × 800 compact Android, 430 × 932 large mobile).
   - Touch ergonomics: minimum 44–48px hit targets, zero horizontal scrolling, accessible focus indicators.
3. **Workspace & Information Architecture**:
   - Organization-level navigation (Global settings, Design Org chart).
   - Project lifecycle (Create, search, filter, settings modal, membership management).
   - Last-Lead protection invariant (Prevents removing or demoting the last project lead).
   - Multi-file project containment and isolation.
4. **Design Editor & Canvas Engine**:
   - 2D Canvas rendering, panning, zooming, and selection resolution.
   - Shape tools, pen/vector paths, and floating action pods.
   - Mode switching: Design Mode, Prototyping Mode (interactions/smart-animate), Inspect/Dev Mode (React TSX, Tailwind, CSS, design tokens).
   - Quick File Switcher modal (`⌘P`).
5. **State Restoration & Invariants**:
   - Unauthenticated sessions route to Login.
   - Authenticated sessions route to Workspace projects by default.
   - Active design files reload directly into the Canvas editor upon browser re-open.

---

## 3. Test Environments & Tooling

| Component | Specification |
| :--- | :--- |
| **Operating System** | macOS 26.1 (Darwin 24.6.0) |
| **Runtime Environment** | Node.js v22.14.0 |
| **Test Automation Framework** | Playwright Chromium (Automated E2E with video recording) |
| **Application Server** | Node.js HTTP static server (`serve.js` on `http://127.0.0.1:3001/`) |
| **Unit / Integration Engine** | Native ES Module Test Runner (`node tests/*.js`) |
| **Artifact Output Directory** | `artifacts/qa/` (Screenshots, recordings, reports, CSV test results) |

---

## 4. Test User Accounts & Credentials

The authentication engine provides pre-configured test profiles for verification:

| Name | Role | Email / Identifier | Password | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **Jordan Lee** | Principal Design Lead | `designer@designforge.ai` / `jordan` | `DesignForge2026!` | Workspace Admin & Lead |
| **Alex Morgan** | Senior Product Designer | `alex@designforge.ai` / `alex` | `DesignForge2026!` | Project Editor |
| **Sam Rivera** | Frontend Engineer | `sam@designforge.ai` / `sam` | `DesignForge2026!` | Project Viewer / Inspect |

---

## 5. Viewport Matrix

| Category | Width × Height | Device Profile | Key Assertions |
| :--- | :--- | :--- | :--- |
| **Desktop Wide** | 1440 × 900 px | Reference Desktop Display | Split-screen hero showcase, right glassmorphic card, quick-fill test pills. |
| **Desktop Standard** | 1280 × 800 px | Laptop Display | Layout scales proportionately without container clipping. |
| **Tablet Portrait** | 768 × 1024 px | iPad / Tablet Portrait | Hero hides cleanly, card centers, comfortable padding, touch inputs. |
| **Tablet Landscape** | 1024 × 768 px | iPad / Tablet Landscape | Centered card with expanded margins, zero overflow. |
| **Mobile Standard** | 390 × 844 px | iPhone 14/15/16 | Full-width single column, 48px minimum touch height, zero horizontal scroll. |
| **Mobile Compact** | 360 × 800 px | Compact Android | Strict containment within 360px viewport boundary, readable labels. |
| **Mobile Large** | 430 × 932 px | iPhone Pro Max / Plus | Safe-area padding, optimal typographic contrast. |

---

## 6. Execution & Verification Workflow

```mermaid
flowchart TD
    A[Start QA Suite] --> B[Run Unit & Integration Suites (16 suites)]
    B --> C[Launch Dev Server http://127.0.0.1:3001]
    C --> D[Initialize Playwright with Video Recording]
    D --> E[Phase 1: Desktop Login & Auth Edge Cases]
    E --> F[Phase 2: Tablet Viewport Reflows]
    F --> G[Phase 3: Mobile Viewport & Recovery Modal]
    G --> H[Phase 4: Workspace, Projects & Org Hierarchy]
    H --> I[Phase 5: Canvas Editor, Modes & Quick Switcher]
    I --> J[Phase 6: Session Invariant & Restore Tests]
    J --> K[Close Browser & Finalize MP4/WebM Video]
    K --> L[Generate QA Markdown Reports & Test Cases CSV]
```
