"""Inference adapter for the deep-learning layout pipeline.

The adapter intentionally uses a deterministic heuristic fallback today. This
keeps the website working on any machine with only Python installed, while
preserving the same boundary where trained-model inference will be connected.
"""

from .model import describe_model


def predict_layout_score(brief):
    """Estimate a neural-style quality score from validated user inputs."""
    land_size = max(300, int(brief.get("landSize") or 2400))
    floors = max(1, int(brief.get("floors") or 1))
    bedrooms = max(1, int(brief.get("bedrooms") or 3))
    bathrooms = max(1, int(brief.get("bathrooms") or 2))
    features = set(brief.get("features") or [])

    density = min(1.0, (bedrooms + bathrooms + floors) / max(6, land_size / 420))
    sustainability_bonus = 2 if {"solarPanels", "solarBackup"} & features else 0
    accessibility_bonus = 1 if {"elderFriendly", "lift", "separateStairs", "ownerPrivateGarden"} & features else 0
    balance_penalty = 3 if bathrooms < max(1, bedrooms - 1) else 0

    score = 86 + round((1 - density) * 7) + sustainability_bonus + accessibility_bonus - balance_penalty
    return max(82, min(96, score))


def infer_concept_metadata(brief):
    """Return metadata shaped like a deep-learning inference result."""
    model = describe_model()
    return {
        "model": model["name"],
        "modelVersion": model["version"],
        "modelStage": model["stage"],
        "score": predict_layout_score(brief),
    }
