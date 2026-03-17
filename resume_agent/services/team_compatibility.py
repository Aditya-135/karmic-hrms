from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class TeamProfile:
    name: str = "Team"
    skills: list[str] | None = None
    values: list[str] | None = None  # e.g. ["collaboration", "ownership"]
    leadership_needed: bool = False


@dataclass(frozen=True, slots=True)
class BehavioralSignals:
    primary_intent: str | None = None  # from IntentProfile.primary_intent
    leadership_score: float | None = None  # 0..1
    compensation_emphasis: float | None = None  # 0..1


@dataclass(frozen=True, slots=True)
class TeamCompatibilityResult:
    overall_score: float  # 0..1
    skill_overlap_score: float  # 0..1
    behavioral_alignment_score: float  # 0..1
    notes: list[str]


@dataclass(slots=True)
class TeamCompatibilityAgent:
    """
    Practical, explainable compatibility scorer.

    - Skill overlap uses Jaccard similarity between employee/team skills.
    - Behavioral alignment uses intent/leadership/compensation signals as a proxy.
    """

    def assess(
        self,
        employee_skills: list[str] | None,
        team: TeamProfile,
        signals: BehavioralSignals | None = None,
    ) -> TeamCompatibilityResult:
        emp = set(s.strip().lower() for s in (employee_skills or []) if s and s.strip())
        team_sk = set(s.strip().lower() for s in (team.skills or []) if s and s.strip())

        if not emp or not team_sk:
            skill_overlap = 0.0
        else:
            skill_overlap = len(emp & team_sk) / max(1, len(emp | team_sk))

        notes: list[str] = []
        if emp and team_sk:
            notes.append(f"Skill overlap: {len(emp & team_sk)}/{len(emp | team_sk)} shared skills.")

        behavioral = self._behavioral_alignment(team=team, signals=signals, notes=notes)

        # Weighted sum: skills matter slightly more, but behavior is critical for ethics/sustainability.
        overall = 0.55 * skill_overlap + 0.45 * behavioral
        overall = max(0.0, min(1.0, overall))

        return TeamCompatibilityResult(
            overall_score=overall,
            skill_overlap_score=max(0.0, min(1.0, skill_overlap)),
            behavioral_alignment_score=max(0.0, min(1.0, behavioral)),
            notes=notes,
        )

    @staticmethod
    def _behavioral_alignment(team: TeamProfile, signals: BehavioralSignals | None, notes: list[str]) -> float:
        if signals is None:
            notes.append("Behavioral signals not provided; using neutral behavioral alignment.")
            return 0.5

        score = 0.5

        # Intent alignment (light heuristic)
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

        # Compensation emphasis: high emphasis can be a risk factor (not a negative judgment).
        if signals.compensation_emphasis is not None:
            if signals.compensation_emphasis >= 0.7:
                score -= 0.10
                notes.append("High compensation emphasis; consider expectation alignment.")
            elif signals.compensation_emphasis <= 0.3:
                score += 0.05
                notes.append("Low compensation emphasis; reduced expectation risk.")

        return max(0.0, min(1.0, score))
