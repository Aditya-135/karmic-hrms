from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from resume_agent.models.schema import LeadershipAnalysis


try:
    import spacy
except ImportError:  # pragma: no cover - optional runtime fallback
    spacy = None


LEADERSHIP_VERBS: set[str] = {"led", "managed", "mentored", "owned", "coordinated"}


@dataclass(slots=True)
class LeadershipSignalService:
    nlp: Any | None

    @classmethod
    def create(cls) -> "LeadershipSignalService":
        if spacy is None:
            return cls(nlp=None)

        try:
            nlp = spacy.load("en_core_web_sm")
        except OSError:
            nlp = spacy.blank("en")
            if "sentencizer" not in nlp.pipe_names:
                nlp.add_pipe("sentencizer")
        return cls(nlp=nlp)

    def analyze(self, text: str) -> LeadershipAnalysis:
        sentences = self._split_sentences(text)

        evidence: list[str] = []
        for sentence in sentences:
            lower_sentence = sentence.lower()
            if any(re.search(rf"(?<!\w){verb}(?!\w)", lower_sentence) for verb in LEADERSHIP_VERBS):
                evidence.append(sentence)

        total = max(1, len(sentences))
        raw_score = len(evidence) / total
        score = min(1.0, raw_score * 2.5)

        confidence = 0.25 + min(0.75, len(evidence) / max(1, len(evidence) + 2))

        return LeadershipAnalysis(
            score=round(score, 3),
            evidence=evidence[:8],
            confidence=round(min(1.0, confidence), 3),
        )

    def _split_sentences(self, text: str) -> list[str]:
        if self.nlp is not None:
            doc = self.nlp(text)
            sents = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
            if sents:
                return sents

        return [s.strip() for s in re.split(r"[.!?]\s+", text) if s.strip()]
