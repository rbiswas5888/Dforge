"""
DF-UX Intelligence - 21 Canonical UX Knowledge Domains
Seed knowledge base for RAG retrieval and UX heuristic guidance.
"""

from typing import Dict, Any, List

UX_CATEGORIES = [
    {"id": "ux_fundamentals", "name": "UX Fundamentals", "description": "Core principles of user experience design, user mental models, and double-diamond design process."},
    {"id": "ui_design", "name": "UI Design", "description": "Visual interface layout, spatial balance, micro-layouts, and component composition."},
    {"id": "hci", "name": "Human-Computer Interaction", "description": "Fitts's Law, Hick's Law, Steering Law, and human motor/cognitive limitations in interfaces."},
    {"id": "cognitive_psychology", "name": "Cognitive Psychology", "description": "Working memory limits (Miller's 7±2 rule), cognitive load theory, selective attention, and sensory memory."},
    {"id": "gestalt_principles", "name": "Gestalt Principles", "description": "Proximity, Similarity, Continuity, Closure, Common Region, and Figure/Ground organization."},
    {"id": "typography", "name": "Typography", "description": "Type scales, font pairing, line heights (1.4-1.6x), letter spacing, vertical rhythm, and readability."},
    {"id": "colour_theory", "name": "Colour Theory", "description": "60-30-10 rule, semantic color assignment, color psychology, and tonal contrast."},
    {"id": "visual_hierarchy", "name": "Visual Hierarchy", "description": "F-shaped and Z-shaped reading patterns, focal points, scale contrast, and visual anchors."},
    {"id": "information_architecture", "name": "Information Architecture", "description": "Navigation taxonomy, tree structures, faceted search, breadcrumbs, and progressive disclosure."},
    {"id": "design_systems", "name": "Design Systems", "description": "Component libraries, design governance, atomic design hierarchy (atoms, molecules, organisms), and versioning."},
    {"id": "design_tokens", "name": "Design Tokens", "description": "W3C design token standard, primitive vs semantic tokens, component tokens, and dark mode aliasing."},
    {"id": "accessibility", "name": "Accessibility", "description": "WCAG 2.2 Level AA/AAA standards, focus indicators, non-text contrast, keyboard traps, and aria semantics."},
    {"id": "ux_research", "name": "UX Research", "description": "Qualitative user interviews, usability testing metrics (SUS, SEQ, task completion rate), and card sorting."},
    {"id": "usability_heuristics", "name": "Usability Heuristics", "description": "Jakob Nielsen's 10 usability heuristics, Shneiderman's 8 golden rules, and heuristic evaluation methods."},
    {"id": "responsive_design", "name": "Responsive Design", "description": "Fluid layouts, CSS breakpoints (375, 768, 1024, 1440), container queries, and mobile-first methodologies."},
    {"id": "interaction_design", "name": "Interaction Design", "description": "Micro-interactions, state machines, feedback loops, hover/active/focus/disabled states, and motion curves."},
    {"id": "prototyping", "name": "Prototyping", "description": "Fidelity levels (wireframe to high-fi), screen transitions, smart animate, and user test simulators."},
    {"id": "enterprise_ux", "name": "Enterprise UX", "description": "Dense data displays, bulk operations, advanced filtering, multi-level permissions, and audit logs."},
    {"id": "fintech_ux", "name": "Fintech UX", "description": "Transaction security confirmation, decimal precision, numeric hierarchy, balance visibility, and ledger audits."},
    {"id": "ecommerce_ux", "name": "E-commerce UX", "description": "Product detail pages, sticky buy boxes, trust badges, checkout funnels, and cart persistence."},
    {"id": "react_frontend_architecture", "name": "React and Frontend Architecture", "description": "React 19 Server Components, compound components, hook state management, TypeScript interfaces, and CSS modules."}
]

# Seed corpus documents across categories
SEED_DOCUMENTS = [
    {
        "id": "doc_gestalt_proximity",
        "title": "Law of Proximity in Layout Architecture",
        "category": "gestalt_principles",
        "source": "DF-UX Core Knowledge Base",
        "licence": "DesignForge Internal Open Standard",
        "version": "1.0",
        "publication_date": "2026-01-15",
        "content": "The Gestalt Law of Proximity states that objects positioned near each other are perceived as a unified conceptual group. In auto-layout design systems, related elements (e.g., label and input field) must share a tight gap (4-8px), whereas distinct sections must be separated by at least 24-32px to eliminate ambiguity."
    },
    {
        "id": "doc_wcag_contrast",
        "title": "WCAG 2.2 Color Contrast and Text Readability",
        "category": "accessibility",
        "source": "W3C Web Content Accessibility Guidelines",
        "licence": "W3C Open Standard",
        "version": "2.2",
        "publication_date": "2026-03-01",
        "content": "WCAG 2.2 Success Criterion 1.4.3 requires a minimum visual contrast ratio of 4.5:1 for regular text and 3:1 for large text (18pt / 24px or bold 14pt / 18.5px). UI components and graphical objects must maintain at least 3:1 contrast against adjacent background colors."
    },
    {
        "id": "doc_fintech_numbers",
        "title": "Numeric Hierarchy in Enterprise Financial Interfaces",
        "category": "fintech_ux",
        "source": "DesignForge Fintech Standards",
        "licence": "DesignForge Internal Open Standard",
        "version": "1.0",
        "publication_date": "2026-02-10",
        "content": "In financial dashboards, account balances and asset valuations must always lead the visual hierarchy with prominent font weight (700-800) and tabular monospace numerals to prevent jitter during real-time updates. Gains and losses should employ culturally neutral indicators (+/- symbols and directional arrows) alongside semantic color tokens."
    },
    {
        "id": "doc_enterprise_tables",
        "title": "High-Density Data Grid Patterns for Enterprise SaaS",
        "category": "enterprise_ux",
        "source": "Enterprise UX Guild",
        "licence": "MIT Documentation Licence",
        "version": "1.2",
        "publication_date": "2026-04-12",
        "content": "Enterprise data tables require persistent column headers, sort indicators, row selection check boxes, and pagination controls. Column alignments must adhere strictly to content types: text left-aligned, numbers right-aligned, status badges and icons centered."
    },
    {
        "id": "doc_design_tokens_w3c",
        "title": "W3C Semantic Design Token Architecture",
        "category": "design_tokens",
        "source": "Design Tokens Community Group",
        "licence": "W3C Community Specification",
        "version": "1.0",
        "publication_date": "2026-05-20",
        "content": "A scalable token architecture separates tokens into three distinct tiers: 1. Global / Primitive tokens (e.g., blue-500, space-16), 2. Semantic tokens (e.g., color.brand.primary, surface.card), and 3. Component-specific tokens (e.g., button.primary.background). Switching themes merely remaps semantic aliases without mutating component implementation."
    }
]
