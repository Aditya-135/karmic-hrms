from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from resume_agent.models.schema import (
    ErrorResponse,
    WorkforceIntelligenceRequest,
    WorkforceIntelligenceResponse,
)
from resume_agent.services.job_role_detection import JobRoleDetectionAgent
from resume_agent.services.project_skill_match import ProjectSkillMatchAgent
from resume_agent.services.team_compatibility import (
    BehavioralSignals,
    TeamCompatibilityAgent,
    TeamProfile,
)
from resume_agent.utils.logger import logger

router = APIRouter(prefix="/api/v1/workforce", tags=["workforce-intelligence"])


# ---------------------------------------------------------------------------
# Agent cache — initialised once per process, not on every request.
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_role_agent() -> JobRoleDetectionAgent:
    return JobRoleDetectionAgent(dataset_path=_resolve_job_role_dataset())


@lru_cache(maxsize=1)
def _get_match_agent() -> ProjectSkillMatchAgent:
    return ProjectSkillMatchAgent()


@lru_cache(maxsize=1)
def _get_team_agent() -> TeamCompatibilityAgent:
    return TeamCompatibilityAgent()


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/intelligence",
    response_model=WorkforceIntelligenceResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def workforce_intelligence(
    payload: WorkforceIntelligenceRequest,
) -> WorkforceIntelligenceResponse:
    try:
        role_agent  = _get_role_agent()
        match_agent = _get_match_agent()
        team_agent  = _get_team_agent()

        role_pred   = role_agent.predict(payload.employee_skills)
        skill_match = match_agent.match(
            payload.employee_skills, payload.project_skills_required
        )

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

        logger.info(
            "Workforce intelligence: employee=%s role=%s (conf=%.2f)",
            payload.employee_name or "anonymous",
            role_pred.role,
            role_pred.confidence,
        )

        return WorkforceIntelligenceResponse(
            employee_name=payload.employee_name,
            project_name=payload.project_name,
            job_role={
                "role": role_pred.role,
                "confidence": role_pred.confidence,
                "backend": role_pred.backend,
                "top_alternatives": role_pred.top_alternatives,
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

    except Exception as exc:
        logger.exception("Unexpected error during workforce intelligence")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during workforce intelligence: {exc}",
        ) from exc


# ---------------------------------------------------------------------------
# Dataset resolution
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _resolve_job_role_dataset() -> Path:
    """
    Resolve the dataset path once and cache it. Searches common locations
    relative to the project root. If no file exists, returns a placeholder
    path that will trigger the fallback dataset generation in job_role_detection.
    """
    here = Path(__file__).resolve()
    candidates = [
        here.parents[3] / "data" / "job_role_dataset.csv",
        here.parents[2] / "data" / "job_role_dataset.csv",
        here.parents[3] / "agents" / "job_role_dataset.csv",
    ]
    for p in candidates:
        if p.exists():
            logger.info("Job role dataset resolved: %s", p)
            return p
    
    # Return a placeholder path that will trigger fallback dataset generation
    fallback_path = candidates[1]  # Use the most likely location as placeholder
    logger.info("Job role dataset not found on disk. Will use generated fallback dataset.")
    return fallback_path


def warm_up() -> None:
    """
    Pre-initialise all workforce agents.  Call from the application lifespan
    so the first real request is not penalised by model loading time.
    """
    try:
        _get_role_agent()
        _get_match_agent()
        _get_team_agent()
        logger.info("Workforce agents warmed up successfully")
    except Exception as exc:
        logger.warning("Workforce warm-up failed (non-fatal): %s", exc)
