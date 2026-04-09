from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from resume_agent.models.schema import LeadershipAnalysis


try:
    import spacy
except ImportError:  # pragma: no cover
    spacy = None


# ---------------------------------------------------------------------------
# Signal dictionaries
# ---------------------------------------------------------------------------

# Action verbs that signal direct leadership or management responsibility.
LEADERSHIP_VERBS: set[str] = {
    # Original core set
    "led", "managed", "mentored", "owned", "coordinated",
    # Organisational / directional
    "directed", "supervised", "oversaw", "spearheaded", "championed",
    "founded", "established", "launched", "scaled", "grew",
    # Building / delivery
    "built", "architected", "drove", "delivered", "shipped",
    # People development
    "recruited", "hired", "trained", "coached", "guided", "influenced",
    # Cross-functional
    "partnered", "aligned", "facilitated",
}

# Patterns that detect quantified leadership (team/report sizes).
# Captured group (group 1) is the numeric team size.
_QUANTIFIED_PATTERNS: tuple[str, ...] = (
    r"team\s+of\s+(\d+)",
    r"(\d+)\+?\s+(?:direct\s+)?reports?",
    r"(\d+)\+?\s+(?:engineers?|developers?|scientists?|analysts?|designers?|members?)",
    r"managing\s+(\d+)",
    r"leading\s+(\d+)",
    r"across\s+(\d+)\s+team",
)
_QUANTIFIED_RE: list[re.Pattern[str]] = [re.compile(p, re.IGNORECASE) for p in _QUANTIFIED_PATTERNS]

# Stress / pressure signals — indicate high-stakes or high-intensity work environments.
# These are factual signals that inform team-fit decisions, not negative judgements.
_STRESS_PATTERNS: tuple[str, ...] = (
    r"\bon[\s-]call\b",
    r"\b24\s*/\s*7\b",
    r"\bpager\s+duty\b",
    r"\bnight\s+shift\b",
    r"\bweekends?\b",
    r"\bovertime\b",
    r"\btight\s+deadline",
    r"\bhigh[\s-]pressure\b",
    r"\bhigh[\s-]stakes?\b",
    r"\bincident\s+response\b",
    r"\bcrisis\b",
    r"\bburn[\s-]out\b",
    r"\bwore\s+many\s+hats\b",
    r"\bfast[\s-]paced\b",
    r"\brapid\s+(?:iteration|delivery|turnaround)\b",
    r"\bzero\s+downtime\b",
    r"\bsla\b",
    r"\bproduction\s+incident\b",
)
_STRESS_RE: list[re.Pattern[str]] = [re.compile(p, re.IGNORECASE) for p in _STRESS_PATTERNS]


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

@dataclass(slots=True)
class LeadershipSignalService:
    nlp: Any | None

    @classmethod
    def create(cls) -> "LeadershipSignalService":
        return cls(nlp=_load_spacy())

    def analyze(self, text: str) -> LeadershipAnalysis:
        if not text or not text.strip():
            return LeadershipAnalysis(
                score=0.0, evidence=[], confidence=0.25,
                stress_indicators=[], stress_score=0.0,
            )

        sentences = self._split_sentences(text)
        total = max(1, len(sentences))

        # ── Leadership evidence ──────────────────────────────────────────
        evidence: list[str] = []
        unique_verbs_seen: set[str] = set()

        for sent in sentences:
            lower = sent.lower()
            for verb in LEADERSHIP_VERBS:
                if re.search(rf"(?<!\w){verb}(?!\w)", lower):
                    evidence.append(sent)
                    unique_verbs_seen.add(verb)
                    break  # one hit per sentence is enough

        # Quantified leadership: extract team sizes mentioned
        team_sizes: list[int] = []
        for pattern in _QUANTIFIED_RE:
            for m in pattern.finditer(text):
                try:
                    team_sizes.append(int(m.group(1)))
                except (IndexError, ValueError):
                    pass

        # Score components:
        #   frequency   — how densely are leadership verbs used?
        #   variety     — are many different leadership verbs used?
        #   scale       — are large teams / high-impact sizes mentioned?
        frequency_score = min(1.0, (len(evidence) / total) * 2.5)
        variety_bonus   = min(0.15, 0.03 * len(unique_verbs_seen))
        scale_bonus     = min(0.15, 0.02 * sum(1 for s in team_sizes if s >= 3))

        score = min(1.0, frequency_score + variety_bonus + scale_bonus)

        # Confidence grows with evidence count (same formula as before, unchanged API)
        n = len(evidence)
        confidence = min(1.0, 0.25 + min(0.75, n / max(1, n + 2)))

        # ── Stress signals ───────────────────────────────────────────────
        stress_hits: list[str] = []
        lower_text = text.lower()
        for pattern in _STRESS_RE:
            m = pattern.search(lower_text)
            if m:
                stress_hits.append(m.group(0).strip())

        # Deduplicate while preserving order
        seen: set[str] = set()
        stress_indicators: list[str] = []
        for hit in stress_hits:
            if hit not in seen:
                seen.add(hit)
                stress_indicators.append(hit)

        stress_score = min(1.0, len(stress_indicators) / max(1, len(stress_indicators) + 3))

        return LeadershipAnalysis(
            score=round(score, 3),
            evidence=evidence[:8],
            confidence=round(confidence, 3),
            stress_indicators=stress_indicators[:10],
            stress_score=round(stress_score, 3),
        )

    def _split_sentences(self, text: str) -> list[str]:
        if self.nlp is not None:
            doc = self.nlp(text)
            sents = [s.text.strip() for s in doc.sents if s.text.strip()]
            if sents:
                return sents
        return [s.strip() for s in re.split(r"[.!?]\s+", text) if s.strip()]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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
