from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from resume_agent.models.schema import SkillsResult


# Don't import spacy at module level - lazy load on first use
spacy = None
_spacy_nlp_cache: Any | None = None


def _load_spacy_model() -> Any | None:
    """Lazy load spacy model on first use."""
    global _spacy_nlp_cache
    
    if _spacy_nlp_cache is not None:
        return _spacy_nlp_cache
    
    try:
        import spacy as spacy_module
        _spacy_nlp_cache = spacy_module.load("en_core_web_sm")
    except ImportError:
        # Spacy not installed
        return None
    except OSError:
        # Model not available, use blank
        import spacy as spacy_module
        _spacy_nlp_cache = spacy_module.blank("en")
    
    return _spacy_nlp_cache


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


@dataclass(slots=True)
class SkillExtractionService:
    nlp: Any | None

    @classmethod
    def create(cls) -> "SkillExtractionService":
        """Create service with lazy-loaded spacy model."""
        nlp = _load_spacy_model()
        return cls(nlp=nlp)

    def analyze(self, text: str) -> SkillsResult:
        normalized_text = text.lower()
        if self.nlp is not None:
            normalized_text = self.nlp(normalized_text).text

        normalized_text = f" {normalized_text} "

        technical_found = self._match_skills(normalized_text, TECHNICAL_SKILLS)
        soft_found = self._match_skills(normalized_text, SOFT_SKILLS)

        unique_total = len(technical_found) + len(soft_found)
        denom = max(1, min(20, unique_total + 4))
        confidence = min(1.0, unique_total / denom)

        return SkillsResult(
            technical=sorted(technical_found),
            soft=sorted(soft_found),
            confidence=round(confidence, 3),
        )

    def _match_skills(self, text: str, dictionary: set[str]) -> set[str]:
        found: set[str] = set()
        for skill in dictionary:
            pattern = rf"(?<!\w){re.escape(skill.lower())}(?!\w)"
            if re.search(pattern, text):
                found.add(skill)
        return found
