from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from resume_agent.models.schema import (
    ErrorResponse,
    WorkforceIntelligenceRequest,
    WorkforceIntelligenceResponse,
)
from resume_agent.services.job_role_detection import JobRoleDetectionAgent
from resume_agent.services.project_skill_match import ProjectSkillMatchAgent
from resume_agent.services.team_compatibility import BehavioralSignals, TeamCompatibilityAgent, TeamProfile

router = APIRouter(prefix="/api/v1/workforce", tags=["workforce-intelligence"])


@router.post(
    "/intelligence",
    response_model=WorkforceIntelligenceResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def workforce_intelligence(payload: WorkforceIntelligenceRequest) -> WorkforceIntelligenceResponse:
    try:
        dataset_path = _resolve_job_role_dataset()

        role_agent = JobRoleDetectionAgent(dataset_path=dataset_path)
        match_agent = ProjectSkillMatchAgent()
        team_agent = TeamCompatibilityAgent()

        role_pred = role_agent.predict(payload.employee_skills)
        skill_match = match_agent.match(payload.employee_skills, payload.project_skills_required)

        team = TeamProfile(
            name=payload.team.name,
            skills=payload.team.skills,
            values=payload.team.values,
            leadership_needed=payload.team.leadership_needed,
        )
        signals = BehavioralSignals(
            primary_intent=payload.primary_intent,
            leadership_score=payload.leadership_score,
            compensation_emphasis=payload.compensation_emphasis,
        )
        compat = team_agent.assess(payload.employee_skills, team=team, signals=signals)

        return WorkforceIntelligenceResponse(
            employee_name=payload.employee_name,
            project_name=payload.project_name,
            job_role={
                "role": role_pred.role,
                "confidence": role_pred.confidence,
                "backend": role_pred.backend,
            },
            project_skill_match={
                "match_score": skill_match.match_score,
                "missing_skills": skill_match.missing_skills,
                "backend": skill_match.backend,
            },
            team_compatibility={
                "overall_score": compat.overall_score,
                "skill_overlap_score": compat.skill_overlap_score,
                "behavioral_alignment_score": compat.behavioral_alignment_score,
                "notes": compat.notes,
            },
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during workforce intelligence: {exc}",
        ) from exc


def _resolve_job_role_dataset() -> Path:
    """
    Try common dataset locations in this workspace.
    """
    here = Path(__file__).resolve()
    candidates = [
        # workspace root: `data/job_role_dataset.csv`
        here.parents[3] / "data" / "job_role_dataset.csv",
        # inside app folder (some setups)
        here.parents[2] / "data" / "job_role_dataset.csv",
        # prototype folder copy
        here.parents[3] / "agents" / "job_role_dataset.csv",
    ]
    for p in candidates:
        if p.exists():
            return p
    raise FileNotFoundError(f"Job role dataset not found: {candidates[0]}")
