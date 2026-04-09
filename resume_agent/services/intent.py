from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

import numpy as np

from resume_agent.models.schema import IntentProfile


# Define intent categories and keywords BEFORE lazy loader
INTENT_CATEGORIES: list[str] = [
    "Research-focused",
    "Corporate Growth",
    "Startup-oriented",
    "Stability-driven",
]

# Three diverse anchor phrases per category give the model a broader semantic
# surface to match against — max-pooling over anchors rewards the best-matching
# one without being confused by anchors that don't apply to a particular resume.
INTENT_ANCHORS: dict[str, list[str]] = {
    "Research-focused": [
        "interested in publications innovation experimentation deep technical exploration research labs",
        "PhD research academic papers conferences journals scientific experiments novel algorithms",
        "cutting-edge research intellectual curiosity publishing findings open-source contributions exploration",
    ],
    "Corporate Growth": [
        "focused on scaling enterprise impact process optimization promotions large organizations career ladder",
        "cross-functional leadership stakeholder management OKRs KPIs revenue growth ROI enterprise solutions",
        "career advancement senior director VP C-suite performance reviews business impact large teams",
    ],
    "Startup-oriented": [
        "prefers startup environments ambiguity rapid iteration building from zero high ownership",
        "early-stage founding team product market fit lean agile wearing many hats shipping fast",
        "zero to one high impact scrappy resourceful small teams fast pace pivoting autonomy equity",
    ],
    "Stability-driven": [
        "values long-term stability predictable growth dependable teams sustainable work environments",
        "work-life balance family-friendly consistent processes mature companies job security benefits",
        "steady career progression low risk reliable employer pension healthcare sustainable pace",
    ],
}

# Keyword fallback — used when the embedding model is unavailable.
INTENT_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Research-focused": (
        "research", "publication", "lab", "paper", "innovation",
        "experiment", "academic", "phd", "conference", "journal",
    ),
    "Corporate Growth": (
        "enterprise", "scale", "optimization", "process", "promotion",
        "stakeholder", "kpi", "okr", "revenue", "cross-functional",
    ),
    "Startup-oriented": (
        "startup", "0-1", "zero to one", "ambiguity", "rapid",
        "ownership", "founding", "early-stage", "lean", "autonomy",
    ),
    "Stability-driven": (
        "stable", "long-term", "consistency", "reliable", "sustainable",
        "dependable", "balance", "security", "pension", "benefits",
    ),
}


try:
    from sentence_transformers import SentenceTransformer
except ImportError:  # pragma: no cover
    SentenceTransformer = None  # type: ignore[assignment,misc]


@dataclass(slots=True)
class IntentDetectionService:
    model: Any | None
    # dict[label, np.ndarray] where each value has shape (n_anchors, d).
    # Stored as Any to satisfy the slots dataclass type constraint.
    anchor_embeddings: Any | None

    @classmethod
    def create(cls) -> "IntentDetectionService":
        if SentenceTransformer is None:
            return cls(model=None, anchor_embeddings=None)

        try:
            model = SentenceTransformer("all-MiniLM-L6-v2")
            # Encode all anchors per category; store as dict[str, ndarray(n_anchors, d)].
            anchor_embeddings: dict[str, np.ndarray] = {}
            for label, phrases in INTENT_ANCHORS.items():
                embs = model.encode(phrases, normalize_embeddings=True)
                anchor_embeddings[label] = np.asarray(embs, dtype=np.float32)
            return cls(model=model, anchor_embeddings=anchor_embeddings)
        except Exception:
            return cls(model=None, anchor_embeddings=None)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def analyze(self, text: str) -> IntentProfile:
        similarities = self._semantic_similarities(text)
        if not similarities:
            similarities = self._keyword_similarities(text)

        ranking = sorted(range(len(similarities)), key=lambda i: similarities[i], reverse=True)
        primary_idx   = ranking[0]
        secondary_idx = ranking[1] if len(ranking) > 1 else ranking[0]

        primary   = INTENT_CATEGORIES[primary_idx]
        secondary = INTENT_CATEGORIES[secondary_idx]
        confidence = max(0.0, min(1.0, similarities[primary_idx]))

        return IntentProfile(
            primary_intent=primary,
            secondary_intent=secondary,
            confidence=round(confidence, 3),
        )

    # ------------------------------------------------------------------
    # Similarity backends
    # ------------------------------------------------------------------

    def _semantic_similarities(self, text: str) -> list[float]:
        if self.model is None or self.anchor_embeddings is None:
            return []

        query_emb = self.model.encode([text], normalize_embeddings=True)[0]   # (d,)

        scores: list[float] = []
        for label in INTENT_CATEGORIES:
            anchor_matrix = self.anchor_embeddings[label]   # (n_anchors, d)
            # Max pooling: the best-matching anchor wins for this category.
            label_sims = anchor_matrix @ query_emb           # (n_anchors,)
            best_raw = float(label_sims.max())
            # Map cosine similarity [-1, 1] → [0, 1]
            scores.append((best_raw + 1.0) / 2.0)

        return scores

    def _keyword_similarities(self, text: str) -> list[float]:
        lower_text = text.lower()
        token_set = set(re.findall(r"[a-z0-9+-]+", lower_text))
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
            scores.append(hits / max(1, len(kws)))

        return scores
