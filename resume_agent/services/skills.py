from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

import numpy as np

from resume_agent.models.schema import SkillsResult
from resume_agent.services.embeddings import (
    SentenceTransformersBackend,
    TokenOverlapBackend,
    cosine_sim_matrix,
)


try:
    import spacy
except ImportError:  # pragma: no cover
    spacy = None


TECHNICAL_SKILLS: set[str] = {
    "python",
    "java",
    "javascript",
    "typescript",
    "c++",
    "c#",
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "redis",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "fastapi",
    "django",
    "flask",
    "react",
    "node.js",
    "pandas",
    "numpy",
    "scikit-learn",
    "tensorflow",
    "pytorch",
    "git",
    "ci/cd",
    "linux",
    "rest api",
    "microservices",
    "nlp",
    "machine learning",
    "data analysis",
}

SOFT_SKILLS: set[str] = {
    "leadership",
    "communication",
    "teamwork",
    "problem solving",
    "critical thinking",
    "adaptability",
    "collaboration",
    "time management",
    "mentoring",
    "ownership",
    "stakeholder management",
    "conflict resolution",
    "decision making",
    "creativity",
    "empathy",
}

# Maps text variants to canonical skill names.
# Each canonical value must exist in TECHNICAL_SKILLS or SOFT_SKILLS.
# Longer aliases are applied before shorter ones to avoid partial replacements.
SKILL_ALIASES: dict[str, str] = {
    # Machine learning variants
    "ml": "machine learning",
    "deep learning": "machine learning",
    "neural network": "machine learning",
    "neural networks": "machine learning",
    # NLP variants
    "natural language processing": "nlp",
    "llm": "nlp",
    "large language model": "nlp",
    "large language models": "nlp",
    # Kubernetes
    "k8s": "kubernetes",
    # JavaScript / TypeScript
    # NOTE: "js" and "ts" intentionally omitted — they cascade inside "node.js" after
    # the "nodejs" alias fires, corrupting the replacement. Semantic matching handles them.
    "reactjs": "react",
    "react.js": "react",
    # Node
    "nodejs": "node.js",
    # Databases
    "postgres": "postgresql",   # "postgresql" won't re-match (?<!\w)postgres(?!\w)
    "mongo": "mongodb",         # "mongodb" won't re-match (?<!\w)mongo(?!\w)
    # scikit-learn
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    # REST API — ordered long→short; bare "rest" intentionally omitted to avoid
    # re-matching the "rest api" text already produced by the longer aliases.
    "restful apis": "rest api",
    "restful api": "rest api",
    "rest apis": "rest api",
    "restful": "rest api",
    # CI/CD
    "ci cd": "ci/cd",
    "cicd": "ci/cd",
    # Microservices
    "micro services": "microservices",
    "microservice": "microservices",
    # Data
    "data analytics": "data analysis",
    "data science": "data analysis",
    # Soft skill hyphenated variants
    "problem-solving": "problem solving",
    "critical-thinking": "critical thinking",
    "time-management": "time management",
    "decision-making": "decision making",
    "conflict-resolution": "conflict resolution",
    "stakeholder-management": "stakeholder management",
    "team work": "teamwork",
}

# Cosine similarity threshold for semantic matching (pre-normalized embeddings → range [0, 1]).
# Raise to reduce false positives; lower to catch more paraphrases.
SEMANTIC_THRESHOLD: float = 0.60

# Cap on candidate terms extracted per document to keep inference fast.
_MAX_CANDIDATES: int = 200

# Aliases sorted descending by length so longer phrases replace before shorter ones.
_SORTED_ALIASES: list[tuple[str, str]] = sorted(
    SKILL_ALIASES.items(), key=lambda kv: len(kv[0]), reverse=True
)


@dataclass(slots=True)
class SkillExtractionService:
    nlp: Any | None
    embedding_backend: Any | None
    # All canonical skills in a stable order for index alignment with skill_embeddings.
    canonical_skills: list[str]
    # Pre-computed SBERT embeddings shape (n_skills, d); None when using TokenOverlap.
    skill_embeddings: np.ndarray | None

    @classmethod
    def create(cls) -> "SkillExtractionService":
        nlp = _load_spacy()
        canonical = sorted(TECHNICAL_SKILLS | SOFT_SKILLS)

        # Prefer SBERT — pre-compute skill embeddings once so inference is fast.
        try:
            backend: Any = SentenceTransformersBackend("all-MiniLM-L6-v2")
            skill_emb: np.ndarray | None = backend.encode(canonical)
            return cls(
                nlp=nlp,
                embedding_backend=backend,
                canonical_skills=canonical,
                skill_embeddings=skill_emb,
            )
        except Exception:
            pass

        # Fallback: TokenOverlap builds vocab per encode call, so no pre-computation.
        try:
            return cls(
                nlp=nlp,
                embedding_backend=TokenOverlapBackend(),
                canonical_skills=canonical,
                skill_embeddings=None,
            )
        except Exception:
            pass

        return cls(
            nlp=nlp,
            embedding_backend=None,
            canonical_skills=canonical,
            skill_embeddings=None,
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def analyze(self, text: str) -> SkillsResult:
        if not text or not text.strip():
            return SkillsResult(technical=[], soft=[], confidence=0.0)

        normalized = _normalize(text)

        # Step 1 — alias expansion + exact regex matching.
        expanded = _apply_aliases(normalized)
        tech_exact = _match_skills(expanded, TECHNICAL_SKILLS)
        soft_exact = _match_skills(expanded, SOFT_SKILLS)

        # Step 2 — semantic matching for skills not yet found.
        already_found = tech_exact | soft_exact
        tech_sem, soft_sem = self._semantic_match(normalized, already_found)

        technical_found = tech_exact | tech_sem
        soft_found = soft_exact | soft_sem

        # Confidence: exact matches are fully trusted; semantic matches weighted 0.8
        # (they carry a small false-positive risk).
        exact_count = len(tech_exact) + len(soft_exact)
        sem_count = len(tech_sem) + len(soft_sem)
        effective = exact_count + 0.8 * sem_count
        confidence = effective / (effective + 5) if effective > 0 else 0.0

        return SkillsResult(
            technical=sorted(technical_found),
            soft=sorted(soft_found),
            confidence=round(confidence, 3),
        )

    # ------------------------------------------------------------------
    # Semantic matching
    # ------------------------------------------------------------------

    def _semantic_match(
        self,
        normalized_text: str,
        already_found: set[str],
    ) -> tuple[set[str], set[str]]:
        """Find skills not caught by exact matching using embedding similarity."""
        if self.embedding_backend is None:
            return set(), set()

        remaining = [s for s in self.canonical_skills if s not in already_found]
        if not remaining:
            return set(), set()

        candidates = self._extract_candidates(normalized_text)
        if not candidates:
            return set(), set()

        try:
            if self.skill_embeddings is not None:
                # SBERT path: candidates encoded independently; skill embeddings are pre-computed.
                cand_emb = self.embedding_backend.encode(candidates)
                idx = [self.canonical_skills.index(s) for s in remaining]
                skill_emb = self.skill_embeddings[idx]
            else:
                # TokenOverlap path: must encode everything together to share vocabulary.
                all_texts = candidates + remaining
                all_emb = self.embedding_backend.encode(all_texts)
                cand_emb = all_emb[: len(candidates)]
                skill_emb = all_emb[len(candidates) :]

            sims = cosine_sim_matrix(cand_emb, skill_emb)  # (n_candidates, n_remaining)
        except Exception:
            return set(), set()

        tech_sem: set[str] = set()
        soft_sem: set[str] = set()
        for col, skill in enumerate(remaining):
            if float(sims[:, col].max()) >= SEMANTIC_THRESHOLD:
                if skill in TECHNICAL_SKILLS:
                    tech_sem.add(skill)
                else:
                    soft_sem.add(skill)

        return tech_sem, soft_sem

    def _extract_candidates(self, text: str) -> list[str]:
        """Extract candidate skill phrases from normalized text for semantic comparison."""
        candidates: set[str] = set()

        if self.nlp is not None:
            doc = self.nlp(text)

            # Noun chunks cover multi-word technical terms ("machine learning", "data analysis").
            try:
                for chunk in doc.noun_chunks:
                    phrase = chunk.text.strip()
                    if 2 <= len(phrase) <= 50:
                        candidates.add(phrase)
                        for word in phrase.split():
                            if len(word) >= 2:
                                candidates.add(word)
            except Exception:
                pass  # Blank spacy model has no parser; graceful skip.

            # Named entities catch tool/framework names ("TensorFlow", "AWS").
            for ent in doc.ents:
                s = ent.text.lower().strip()
                if len(s) >= 2:
                    candidates.add(s)

            # PROPN and NOUN tokens catch individual skill names.
            for token in doc:
                if (
                    not token.is_stop
                    and not token.is_punct
                    and len(token.text) >= 2
                    and token.pos_ in ("PROPN", "NOUN")
                ):
                    candidates.add(token.lemma_.lower())
        else:
            # Fallback: grab word-like tokens (alphanumeric + common tech chars).
            tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9.+#/-]*", text)
            candidates.update(t.lower() for t in tokens if len(t) >= 2)

        # Bi-grams capture compound skills ("machine learning", "data analysis", "rest api").
        words = re.findall(r"[a-z][a-z0-9.+#/-]*", text)
        for i in range(len(words) - 1):
            bigram = f"{words[i]} {words[i + 1]}"
            if len(bigram) <= 50:
                candidates.add(bigram)

        result = [c for c in candidates if c.strip()]
        # Cap to avoid slow encoding on very long resumes.
        return result[:_MAX_CANDIDATES]


# ------------------------------------------------------------------
# Module-level helpers
# ------------------------------------------------------------------

def _load_spacy() -> Any | None:
    if spacy is None:
        return None
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        nlp = spacy.blank("en")
        if "sentencizer" not in nlp.pipe_names:
            nlp.add_pipe("sentencizer")
        return nlp


def _normalize(text: str) -> str:
    """Lowercase and pad with spaces so word-boundary patterns work at string edges."""
    return f" {text.lower()} "


def _apply_aliases(text: str) -> str:
    """Replace alias patterns with their canonical skill name (longer aliases first)."""
    for alias, canonical in _SORTED_ALIASES:
        pattern = rf"(?<!\w){re.escape(alias)}(?!\w)"
        text = re.sub(pattern, canonical, text)
    return text


def _match_skills(text: str, dictionary: set[str]) -> set[str]:
    """Exact whole-word search for each skill in the dictionary."""
    found: set[str] = set()
    for skill in dictionary:
        pattern = rf"(?<!\w){re.escape(skill.lower())}(?!\w)"
        if re.search(pattern, text):
            found.add(skill)
    return found
