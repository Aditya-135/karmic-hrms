from __future__ import annotations

import re
from dataclasses import dataclass

from resume_agent.models.schema import CompensationEmphasisIndex


COMPENSATION_PATTERNS: tuple[str, ...] = (
    r"\bsalary\b",
    r"\bcompensation\b",
    r"\bpay\b",
    r"\bctc\b",
    r"\bexpected\s+salary\b",
    r"\bnegotiable\b",
    r"\bbenefits\b",
    r"\bbonus\b",
    r"\bstock\b",
    r"\besop\b",
    r"\bequity\b",
    r"\bpackage\b",
)


@dataclass(slots=True)
class CompensationEmphasisService:
    def analyze(self, text: str) -> CompensationEmphasisIndex:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        evidence: list[str] = []

        for line in lines:
            lower_line = line.lower()
            if any(re.search(pattern, lower_line) for pattern in COMPENSATION_PATTERNS):
                evidence.append(line)

        denominator = max(1, len(lines))
        ratio = len(evidence) / denominator
        score = min(1.0, ratio * 8)

        confidence = 0.2 + min(0.8, len(evidence) / max(1, len(evidence) + 3))

        return CompensationEmphasisIndex(
            score=round(score, 3),
            evidence=evidence[:8],
            confidence=round(min(1.0, confidence), 3),
        )

