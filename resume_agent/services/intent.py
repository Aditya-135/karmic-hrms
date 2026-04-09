from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from resume_agent.models.schema import IntentProfile


# Define intent categories and keywords BEFORE lazy loader
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


# Don't import transformer models at module level - lazy load on first use
_transformer_model_cache: Any | None = None
_transformer_anchor_matrix_cache: Any | None = None


def _load_transformer_model() -> tuple[Any | None, Any | None]:
    """Lazy load SentenceTransformer model on first use."""
    global _transformer_model_cache, _transformer_anchor_matrix_cache
    
    if _transformer_model_cache is not None:
        return _transformer_model_cache, _transformer_anchor_matrix_cache
    
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-MiniLM-L6-v2")
        anchors = [INTENT_ANCHORS[label] for label in INTENT_CATEGORIES]
        anchor_matrix = model.encode(anchors, normalize_embeddings=True)
        _transformer_model_cache = model
        _transformer_anchor_matrix_cache = anchor_matrix
        return model, anchor_matrix
    except ImportError:
        # sentence_transformers not installed
        return None, None
    except Exception:
        # Model download failed or other error
        return None, None


@dataclass(slots=True)
class IntentDetectionService:
    model: Any | None
    anchor_matrix: Any | None

    @classmethod
    def create(cls) -> "IntentDetectionService":
        """Create service with lazy-loaded transformer model."""
        model, anchor_matrix = _load_transformer_model()
        return cls(model=model, anchor_matrix=anchor_matrix)

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
