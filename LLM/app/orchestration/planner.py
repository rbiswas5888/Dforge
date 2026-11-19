"""
DF-UX Intelligence - Task Planner
Deconstructs high-level design prompts into structured planning phases.
"""

from typing import Dict, Any, List
from .intent import IntentClassifier


class TaskPlanner:
    @classmethod
    def create_plan(cls, prompt: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        classification = IntentClassifier.classify(prompt)
        domain = classification["domain"]
        platform = classification["platform"]
        intent = classification["intent"]
        components = classification["components"]

        # 1. Determine Target Viewport
        viewports = {
            "desktop": {"width": 1440, "height": 900},
            "tablet": {"width": 768, "height": 1024},
            "mobile": {"width": 375, "height": 812}
        }
        viewport = viewports.get(platform, viewports["desktop"])

        # 2. Information Architecture Strategy
        if domain == "fintech" or domain == "saas":
            ia_strategy = "Two-column master-detail: Left vertical sidebar navigation + fluid right analytics workspace with KPI row and transaction feeds."
        elif domain == "ecommerce":
            ia_strategy = "Top persistent navigation bar + hero banner + responsive multi-column product card grid + cart/filter sidebar."
        elif platform == "mobile":
            ia_strategy = "Single vertical stack with top app header, primary summary card, quick action buttons, and scrollable list items."
        else:
            ia_strategy = "Standard responsive layout with header, main container, and structured cards."

        # 3. Design Token Recommendations
        color_palettes = {
            "fintech": {"brand": "#2563EB", "accent": "#10B981", "bg": "#0F172A", "surface": "#1E293B", "text": "#F8FAFC"},
            "saas": {"brand": "#6366F1", "accent": "#38BDF8", "bg": "#0B0F19", "surface": "#1E293B", "text": "#FFFFFF"},
            "ecommerce": {"brand": "#F43F5E", "accent": "#F59E0B", "bg": "#0F172A", "surface": "#1E293B", "text": "#F8FAFC"},
            "general": {"brand": "#3B82F6", "accent": "#8B5CF6", "bg": "#0F172A", "surface": "#1E293B", "text": "#F8FAFC"}
        }
        tokens = color_palettes.get(domain, color_palettes["general"])

        return {
            "intent": intent,
            "domain": domain,
            "platform": platform,
            "viewport": viewport,
            "ia_strategy": ia_strategy,
            "recommended_tokens": tokens,
            "required_components": components or ["header", "kpi_card", "content_list"],
            "heuristics": [
                "Nielsen Norman H1: Visibility of system status",
                "Nielsen Norman H4: Consistency and standards",
                "Nielsen Norman H8: Aesthetic and minimalist design"
            ]
        }
