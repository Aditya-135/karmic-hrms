from __future__ import annotations

import re
from dataclasses import dataclass

from resume_agent.models.schema import CompensationEmphasisIndex


# ---------------------------------------------------------------------------
# Detection patterns
# ---------------------------------------------------------------------------

# Patterns that indicate the candidate is discussing personal compensation.
COMPENSATION_PATTERNS: tuple[str, ...] = (
    r"\bsalary\b",
    r"\bcompensation\b",
    r"\bctc\b",
    r"\bexpected\s+salary\b",
    r"\bnegotiable\b",
    r"\bbonus\b",
    r"\besop\b",
    r"\bequity\b",
    # Kept but guarded by false-positive filters below:
    r"\bbenefits\b",
    r"\bstock\b",
    r"\bpackage\b",
    r"\bpay\b",
)

# Patterns that signal a compensation keyword is used in a *technical* or
# unrelated context — these lines are excluded from the evidence count.
# Applied after a line passes a COMPENSATION_PATTERNS check.
_FALSE_POSITIVE_CONTEXTS: tuple[str, ...] = (
    # "package" in software/library context
    r"(?:npm|pip|apt|brew|pip3|poetry|conda|nuget|maven|gradle)\s+(?:install\s+)?package",
    r"package\s+(?:manager|management|json|lock|dependency|install|version|upgrade|release)",
    r"(?:software|library|sdk|api|plugin|module|deployment|docker)\s+package",
    r"package\.json",
    # "stock" in non-equity contexts
    r"stock\s+(?:photo|image|footage|video|icon|illustration|market\s+data|trading\s+platform)",
    r"out[\s-]of[\s-]stock",
    r"live\s+stock",
    r"stock\s+management\s+system",
    # "pay" in technical / transactional contexts (not personal salary)
    r"pay(?:ment)?\s+(?:gateway|processor|api|integration|method|system|processing|flow)",
    r"(?:co-?pay|pay-per-click|pay-per-use)",
    r"(?:pre-?paid|post-?paid)",
    # "benefits" in a product or feature context
    r"(?:product|feature|technical|performance|security|health)\s+benefits",
    r"benefits\s+(?:of\s+using|include|such\s+as)",
)
_FALSE_POSITIVE_RE: list[re.Pattern[str]] = [
    re.compile(p, re.IGNORECASE) for p in _FALSE_POSITIVE_CONTEXTS
]


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

@dataclass(slots=True)
class CompensationEmphasisService:

    def analyze(self, text: str) -> CompensationEmphasisIndex:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        evidence: list[str] = []

        for line in lines:
            lower = line.lower()
            if _is_compensation_line(lower):
                evidence.append(line)

        denominator = max(1, len(lines))
        ratio = len(evidence) / denominator
        # Amplification: a resume is rarely about salary, so even 1-2 lines is notable.
        score = min(1.0, ratio * 8)

        confidence = 0.2 + min(0.8, len(evidence) / max(1, len(evidence) + 3))

        return CompensationEmphasisIndex(
            score=round(score, 3),
            evidence=evidence[:8],
            confidence=round(min(1.0, confidence), 3),
        )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_compensation_line(lower_line: str) -> bool:
    """
    Return True when a line contains a compensation signal that is NOT
    better explained by a technical/unrelated false-positive context.
    """
    # Must match at least one compensation pattern.
    if not any(re.search(p, lower_line) for p in COMPENSATION_PATTERNS):
        return False

    # Reject lines where the match is clearly in a non-personal context.
    if any(fp.search(lower_line) for fp in _FALSE_POSITIVE_RE):
        return False

    return True
