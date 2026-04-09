"""
Behavioral Intelligence Router

Provides endpoints for OCEAN-based personality analysis and team compatibility.
"""

from __future__ import annotations

from functools import lru_cache

from fastapi import APIRouter, HTTPException, status

from resume_agent.models.schema import (
    BehavioralAnalysisRequest,
    BehavioralAnalysisResponse,
    CommunicationAnalysisResponse,
    ErrorResponse,
    PersonalityTraitsResponse,
    TeamCompatibilityResponse,
)
from resume_agent.services.behavioral_intelligence import BehavioralAgent, OCEAN_QUESTIONS
from resume_agent.utils.logger import logger

router = APIRouter(
    prefix="/api/v1/behavioral",
    tags=["behavioral-intelligence"],
)


@lru_cache(maxsize=1)
def _get_behavioral_agent() -> BehavioralAgent:
    """Get singleton instance of BehavioralAgent."""
    return BehavioralAgent()


@router.post(
    "/analyze",
    response_model=BehavioralAnalysisResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def analyze_behavioral(
    payload: BehavioralAnalysisRequest,
) -> BehavioralAnalysisResponse:
    """
    Analyze candidate behavioral profile using OCEAN personality model.
    Includes role fit analysis and team compatibility assessment.

    Args:
        payload: BehavioralAnalysisRequest containing:
            - candidate_name: Name of the candidate
            - job_role: Target role (Engineer, Manager, Designer, Sales, HR, Data Analyst, Product Manager)
            - ocean_answers: Dict mapping question IDs to scores (1-5)
            - text_answers: Open-ended responses
            - team_members: Existing team member profiles for compatibility

    Returns:
        BehavioralAnalysisResponse with complete analysis

    Raises:
        HTTPException: 400 if input validation fails, 500 for unexpected errors
    """
    try:
        # Validate input
        if not payload.candidate_name or not payload.candidate_name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate name is required",
            )

        if not payload.job_role or not payload.job_role.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job role is required",
            )

        if not payload.ocean_answers or len(payload.ocean_answers) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least 15 OCEAN answers required (O1-O3, C1-C3, E1-E3, A1-A3, S1-S3)",
            )

        if not all(1 <= score <= 5 for score in payload.ocean_answers.values()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Each answer must be between 1 and 5",
            )

        logger.info(
            "Starting behavioral analysis: candidate=%s, role=%s, ocean_count=%d, team_size=%d",
            payload.candidate_name,
            payload.job_role,
            len(payload.ocean_answers),
            len(payload.team_members),
        )

        # Convert team members to dict format
        team_profiles = [
            {
                "openness": m.openness,
                "conscientiousness": m.conscientiousness,
                "extraversion": m.extraversion,
                "agreeableness": m.agreeableness,
                "emotional_stability": m.emotional_stability,
            }
            for m in payload.team_members
        ]

        # Run behavioral analysis
        agent = _get_behavioral_agent()
        result = agent.run(
            {
                "candidate_name": payload.candidate_name,
                "job_role": payload.job_role,
                "ocean_answers": payload.ocean_answers,
                "text_answers": payload.text_answers or [],
            },
            team_members=team_profiles,
        )

        logger.info(
            "Behavioral analysis completed: candidate=%s, fit_score=%d, role_fit=%d, compatibility=%d",
            payload.candidate_name,
            result.behavioral_fit_score,
            result.role_fit_score,
            result.team_compatibility.get("compatibility_score", 0),
        )

        # Convert to response model
        return BehavioralAnalysisResponse(
            behavioral_fit_score=result.behavioral_fit_score,
            personality_traits=PersonalityTraitsResponse(**result.personality_traits),
            communication=CommunicationAnalysisResponse(
                sentiment=result.communication["sentiment"],
                score=result.communication["score"],
            ),
            team_fit=result.team_fit,
            role_fit_score=result.role_fit_score,
            role_recommendations=result.role_recommendations,
            team_compatibility=TeamCompatibilityResponse(**result.team_compatibility),
            risk_flags=result.risk_flags,
            summary=result.summary,
            candidate_name=result.candidate_name,
            job_role=result.job_role,
            team_size=result.team_size,
            personality_type=result.personality_type,
            personality_profile=result.personality_profile,
            role_compatibility=result.role_compatibility or {},
            recommendation_data=result.recommendation_data or {}
        )

    except HTTPException:
        raise
    except ValueError as exc:
        logger.warning("Validation error during behavioral analysis: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation error: {exc}",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error during behavioral analysis")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during analysis: {exc}",
        ) from exc


@router.post(
    "/health",
    responses={200: {"description": "Service is healthy"}},
)
async def behavioral_health() -> dict:
    """Health check endpoint for behavioral intelligence service."""
    return {"status": "healthy", "service": "behavioral-intelligence"}


@router.post(
    "/team-compatibility",
    response_model=dict,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def calculate_team_compatibility(
    candidate_ocean: dict,
    team_oceans: list[dict],
    candidate_personality: str = "The Balanced Professional"
) -> dict:
    """
    Calculate dynamic team compatibility when adding candidates to teams.
    
    Args:
        candidate_ocean: Candidate's OCEAN scores
        team_oceans: List of existing team members' OCEAN scores
        candidate_personality: Candidate's personality type
    
    Returns:
        Dynamic compatibility analysis
    """
    try:
        agent = _get_behavioral_agent()
        if not agent.recommendation_engine:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Recommendation engine not available"
            )
        
        team_fit = agent.recommendation_engine.calculate_team_fit(
            candidate_personality=candidate_personality,
            team_personalities=[],  # Can be empty
            candidate_ocean=candidate_ocean,
            team_oceans=team_oceans
        )
        
        return team_fit
    
    except TypeError as exc:
        logger.error("Type error in team compatibility: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid input format for OCEAN scores"
        )
    except Exception as exc:
        logger.error("Error calculating team compatibility: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate team compatibility"
        )


@router.get("/candidate-history")
async def get_candidate_history() -> dict:
    """
    Retrieve candidate history for pattern matching and recommendations.
    This endpoint supports the "similar candidates" feature.
    
    Returns:
        Dictionary with candidate history metadata
    """
    return {
        "status": "success",
        "message": "History stored in browser localStorage for privacy",
        "note": "Candidate data persists across sessions on this device"
    }


@router.get("/personality-questions")
async def get_personality_questions() -> dict:
    """
    Retrieve OCEAN personality assessment questions.
    
    Returns all 25 OCEAN questions for the personality assessment form.
    Used by the frontend to dynamically populate the personality questionnaire.
    
    Returns:
        Dictionary containing:
        - questions: List of question objects with id, trait, question, and options
        - count: Total number of questions
        - traits: List of the 5 OCEAN traits
    """
    return {
        "questions": OCEAN_QUESTIONS,
        "count": len(OCEAN_QUESTIONS),
        "traits": ["openness", "conscientiousness", "extraversion", "agreeableness", "emotional_stability"],
        "status": "success"
    }

