from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class TeamProfile:
    name: str = "Team"
    skills: list[str] | None = None
    values: list[str] | None = None   # e.g. ["collaboration", "ownership"]
    leadership_needed: bool = False


@dataclass(frozen=True, slots=True)
class BehavioralSignals:
    primary_intent: str | None = None         # from IntentProfile.primary_intent
    leadership_score: float | None = None     # 0..1
    compensation_emphasis: float | None = None  # 0..1


@dataclass(frozen=True, slots=True)
class TeamCompatibilityResult:
    overall_score: float               # 0..1
    skill_overlap_score: float         # 0..1  (Jaccard)
    behavioral_alignment_score: float  # 0..1
    notes: list[str]


@dataclass(slots=True)
class TeamCompatibilityAgent:
    """
    Explainable team-compatibility scorer with context-sensitive weights.

    Skill overlap uses Jaccard similarity; behavioral alignment is a
    rule-based heuristic.  The blend weights between the two are computed
    dynamically from the team profile and candidate signals rather than
    using fixed 0.55 / 0.45 values.
    """

    def assess(
        self,
        employee_skills: list[str] | None,
        team: TeamProfile,
        signals: BehavioralSignals | None = None,
    ) -> TeamCompatibilityResult:
        emp = {s.strip().lower() for s in (employee_skills or []) if s and s.strip()}
        team_sk = {s.strip().lower() for s in (team.skills or []) if s and s.strip()}

        # ── Skill overlap (Jaccard) ──────────────────────────────────────
        if emp and team_sk:
            skill_overlap = len(emp & team_sk) / max(1, len(emp | team_sk))
        else:
            skill_overlap = 0.0

        notes: list[str] = []
        if emp and team_sk:
            notes.append(
                f"Skill overlap: {len(emp & team_sk)}/{len(emp | team_sk)} shared skills."
            )

        # ── Behavioral alignment ─────────────────────────────────────────
        behavioral = _behavioral_alignment(team=team, signals=signals, notes=notes)

        # ── Dynamic weights ──────────────────────────────────────────────
        skill_w, beh_w = _compute_dynamic_weights(team, signals)
        notes.append(
            f"Scoring weights — skill: {skill_w:.0%}, behavioural: {beh_w:.0%}."
        )

        overall = skill_w * skill_overlap + beh_w * behavioral
        overall = max(0.0, min(1.0, overall))

        return TeamCompatibilityResult(
            overall_score=round(overall, 3),
            skill_overlap_score=round(max(0.0, min(1.0, skill_overlap)), 3),
            behavioral_alignment_score=round(max(0.0, min(1.0, behavioral)), 3),
            notes=notes,
        )


# ---------------------------------------------------------------------------
# Dynamic weight computation
# ---------------------------------------------------------------------------

def _compute_dynamic_weights(
    team: TeamProfile,
    signals: BehavioralSignals | None,
) -> tuple[float, float]:
    """
    Return (skill_weight, behavioral_weight) that sum to 1.0.

    Base split: 55% skill / 45% behavioural.
    Adjustments shift weight toward behavioural when cultural / leadership fit
    matters more, and toward skill when the technical bar is explicit.

    Clamp: behavioural weight stays within [0.25, 0.75] to prevent either
    dimension from dominating entirely.
    """
    beh_delta = 0.0

    # Leadership roles: cultural and leadership fit outweighs technical match.
    if team.leadership_needed:
        beh_delta += 0.10

    # Explicit team values listed: culture fit is a stated priority.
    if len(team.values or []) >= 3:
        beh_delta += 0.05

    # Large, well-defined team skill list: the technical bar is clear.
    if len(team.skills or []) >= 8:
        beh_delta -= 0.05   # shift back toward skill

    # Senior/lead candidate (strong leadership signal): behavioural fit matters more.
    if signals is not None and (signals.leadership_score or 0.0) >= 0.7:
        beh_delta += 0.05

    beh_w = max(0.25, min(0.75, 0.45 + beh_delta))
    skill_w = round(1.0 - beh_w, 2)
    beh_w = round(beh_w, 2)
    return skill_w, beh_w


# ---------------------------------------------------------------------------
# Behavioral alignment (rule-based heuristic)
# ---------------------------------------------------------------------------

def _behavioral_alignment(
    team: TeamProfile,
    signals: BehavioralSignals | None,
    notes: list[str],
) -> float:
    if signals is None:
        notes.append("Behavioral signals not provided; using neutral alignment.")
        return 0.5

    score = 0.5

    # Intent alignment
    intent = (signals.primary_intent or "").lower().strip()
    if intent:
        if any(v and v.lower() in intent for v in (team.values or [])):
            score += 0.15
            notes.append("Intent aligns with team values.")
        else:
            notes.append("Intent does not explicitly match team values.")

    # Leadership alignment
    if signals.leadership_score is not None:
        if team.leadership_needed and signals.leadership_score >= 0.6:
            score += 0.15
            notes.append("Leadership signal supports team needs.")
        elif team.leadership_needed and signals.leadership_score < 0.4:
            score -= 0.10
            notes.append("Leadership signal may be insufficient for this team.")

    # Compensation emphasis: high emphasis can be a risk factor (expectation mismatch).
    if signals.compensation_emphasis is not None:
        if signals.compensation_emphasis >= 0.7:
            score -= 0.10
            notes.append("High compensation emphasis; consider expectation alignment.")
        elif signals.compensation_emphasis <= 0.3:
            score += 0.05
            notes.append("Low compensation emphasis; reduced expectation risk.")

    return max(0.0, min(1.0, score))
