from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from resume_agent.models.schema import IntentProfile


INTENT_CATEGORIES: list[str] = [
    "Research-focused",
    "Corporate Growth",
    "Startup-oriented",
    "Stability-driven",
]

INTENT_ANCHORS: dict[str, str] = {
    "Research-focused": "interested in publications innovation experimentation deep technical exploration research labs",
    "Corporate Growth": "focused on scaling enterprise impact process optimization promotions large organizations",
    "Startup-oriented": "prefers startup environments ambiguity rapid iteration building from zero high ownership",
    "Stability-driven": "values long term stability predictable growth dependable teams sustainable work environments",
}

INTENT_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Research-focused": ("research", "publication", "lab", "paper", "innovation", "experiment"),
    "Corporate Growth": ("enterprise", "scale", "optimization", "process", "promotion", "stakeholder"),
    "Startup-oriented": ("startup", "0-1", "zero to one", "ambiguity", "rapid", "ownership"),
    "Stability-driven": ("stable", "long-term", "consistency", "reliable", "sustainable", "dependable"),
}


try:
    from sentence_transformers import SentenceTransformer
except ImportError:  # pragma: no cover - optional runtime fallback
    SentenceTransformer = None


@dataclass(slots=True)
class IntentDetectionService:
    model: Any | None
    anchor_matrix: Any | None

    @classmethod
    def create(cls) -> "IntentDetectionService":
        if SentenceTransformer is None:
            return cls(model=None, anchor_matrix=None)

        try:
            model = SentenceTransformer("all-MiniLM-L6-v2")
            anchors = [INTENT_ANCHORS[label] for label in INTENT_CATEGORIES]
            anchor_matrix = model.encode(anchors, normalize_embeddings=True)
            return cls(model=model, anchor_matrix=anchor_matrix)
        except Exception:
            return cls(model=None, anchor_matrix=None)

    def analyze(self, text: str) -> IntentProfile:
        similarities = self._semantic_similarities(text)
        if not similarities:
            similarities = self._keyword_similarities(text)

        ranking = sorted(range(len(similarities)), key=lambda i: similarities[i], reverse=True)
        primary_idx = ranking[0]
        secondary_idx = ranking[1] if len(ranking) > 1 else ranking[0]

        primary = INTENT_CATEGORIES[primary_idx]
        secondary = INTENT_CATEGORIES[secondary_idx]

        confidence = max(0.0, min(1.0, similarities[primary_idx]))

        return IntentProfile(
            primary_intent=primary,
            secondary_intent=secondary,
            confidence=round(confidence, 3),
        )

    def _semantic_similarities(self, text: str) -> list[float]:
        if self.model is None or self.anchor_matrix is None:
            return []

        query_embedding = self.model.encode([text], normalize_embeddings=True)[0]

        scores: list[float] = []
        for anchor_embedding in self.anchor_matrix:
            score = sum(float(a) * float(b) for a, b in zip(anchor_embedding, query_embedding))
            scores.append((score + 1.0) / 2.0)

        return scores

    def _keyword_similarities(self, text: str) -> list[float]:
        lower_text = text.lower()
        tokens = re.findall(r"[a-z0-9+-]+", lower_text)
        token_set = set(tokens)
        scores: list[float] = []

        for label in INTENT_CATEGORIES:
            kws = INTENT_KEYWORDS[label]
            hits = 0
            for kw in kws:
                kw_lower = kw.lower()
                if " " in kw_lower:
                    if kw_lower in lower_text:
                        hits += 1
                elif kw_lower in token_set:
                    hits += 1
            score = hits / max(1, len(kws))
            scores.append(score)

        return scores
