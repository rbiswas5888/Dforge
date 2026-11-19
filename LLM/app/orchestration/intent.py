"""
DF-UX Intelligence - Intent Classifier
Analyzes natural language prompts to determine user design intent, domain, platform, and task scope.
"""

import re
from typing import Dict, Any, List


class IntentClassifier:
    DOMAINS = {
        "fintech": ["banking", "finance", "portfolio", "crypto", "wallet", "transactions", "balance", "trading", "investment", "invoice"],
        "ecommerce": ["shop", "store", "product", "cart", "checkout", "catalog", "pricing", "order", "inventory"],
        "saas": ["dashboard", "analytics", "metrics", "crm", "admin", "b2b", "kpi", "settings", "team", "billing"],
        "healthcare": ["patient", "clinic", "medical", "health", "doctor", "appointment", "ehr"],
        "social": ["feed", "profile", "chat", "messaging", "social", "community", "posts"],
        "productivity": ["kanban", "task", "project", "todo", "calendar", "notes", "workflow"]
    }

    PLATFORMS = {
        "mobile": ["mobile", "phone", "ios", "android", "375", "390", "screen"],
        "tablet": ["tablet", "ipad", "768", "834"],
        "desktop": ["desktop", "web", "dashboard", "1440", "1920", "admin", "portal"]
    }

    INTENTS = {
        "create_screen": ["create", "generate", "build", "new", "design", "make", "add"],
        "modify_layout": ["layout", "stack", "align", "gap", "padding", "arrange", "flex", "grid"],
        "apply_style": ["theme", "color", "dark", "light", "typography", "token", "style", "font"],
        "audit_ux": ["audit", "check", "review", "evaluate", "wcag", "contrast", "accessibility", "heuristic"],
        "prototype_flow": ["prototype", "link", "connect", "interaction", "click", "hover", "flow"],
        "export_code": ["code", "react", "typescript", "tsx", "component", "export", "compile"]
    }

    @classmethod
    def classify(cls, prompt: str) -> Dict[str, Any]:
        prompt_lower = prompt.lower()

        # 1. Detect Domain
        detected_domain = "general"
        for domain, keywords in cls.DOMAINS.items():
            if any(re.search(rf"\b{k}\b", prompt_lower) for k in keywords):
                detected_domain = domain
                break

        # 2. Detect Platform
        detected_platform = "desktop"
        for platform, keywords in cls.PLATFORMS.items():
            if any(re.search(rf"\b{k}\b", prompt_lower) for k in keywords):
                detected_platform = platform
                break

        # 3. Detect Primary Intent
        detected_intent = "create_screen"
        for intent, keywords in cls.INTENTS.items():
            if any(re.search(rf"\b{k}\b", prompt_lower) for k in keywords):
                detected_intent = intent
                break

        # 4. Extract Key Components Mentioned
        components_found = []
        comp_keywords = ["dashboard", "transactions", "portfolio", "metrics", "table", "chart", "card", "sidebar", "navigation", "navbar", "header", "footer", "modal", "form", "kpi", "avatar", "button", "tabs"]
        for c in comp_keywords:
            if re.search(rf"\b{c}\b", prompt_lower):
                components_found.append(c)

        return {
            "intent": detected_intent,
            "domain": detected_domain,
            "platform": detected_platform,
            "components": components_found,
            "confidence": 0.95
        }
