from __future__ import annotations

from functools import lru_cache

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from resume_agent.models.schema import ErrorResponse, ResumeAnalysisResponse
# Temporarily disabled to fix import hang
# from resume_agent.services.aggregator import AggregatorService
# from resume_agent.services.compensation import CompensationEmphasisService
# from resume_agent.services.intent import IntentDetectionService
# from resume_agent.services.leadership import LeadershipSignalService
from resume_agent.services.parser import (
    extract_candidate_name,
    extract_candidate_profile,
    extract_text_from_upload,
)
# from resume_agent.services.skills import SkillExtractionService
from resume_agent.utils.logger import logger

router = APIRouter(prefix="/api/v1/resume", tags=["resume-intelligence"])


@lru_cache(maxsize=1)
def _get_aggregator():  # -> AggregatorService:
    """
    Lazily initialize and return the full aggregator with all services.
    Non-blocking - imports happen on first use, not at module load time.
    """
    try:
        # Import services only when needed (on first API call)
        from resume_agent.services.aggregator import AggregatorService
        from resume_agent.services.compensation import CompensationEmphasisService
        from resume_agent.services.intent import IntentDetectionService
        from resume_agent.services.leadership import LeadershipSignalService
        from resume_agent.services.skills import SkillExtractionService
        
        skills_service = SkillExtractionService.create()
        intent_service = IntentDetectionService.create()
        leadership_service = LeadershipSignalService.create()
        compensation_service = CompensationEmphasisService()
        
        return AggregatorService(
            skills_service=skills_service,
            intent_service=intent_service,
            leadership_service=leadership_service,
            compensation_service=compensation_service,
        )
    except Exception as e:
        logger.warning("Failed to load full aggregator, will use mock analysis: %s", e)
        return None


def _get_mock_analysis(text: str) -> dict:
    """Return basic mock analysis without heavy services."""
    from resume_agent.models.schema import (
        SkillsResult,
        IntentProfile,
        LeadershipAnalysis,
        CompensationEmphasisIndex,
    )
    
    # Simple keyword-based analysis
    tech_keywords = {
        "python": "python",
        "java": "java",
        "javascript": "javascript",
        "react": "react",
        "node": "node.js",
        "sql": "sql",
        "aws": "aws",
        "kubernetes": "kubernetes",
        "docker": "docker",
        "fastapi": "fastapi",
        "django": "django",
        "tensorflow": "tensorflow",
        "pytorch": "pytorch",
    }
    
    soft_keywords = {
        "leadership": "leadership",
        "communication": "communication",
        "teamwork": "teamwork",
        "collaboration": "collaboration",
        "problem-solving": "problem-solving",
        "critical thinking": "critical thinking",
        "management": "management",
        "mentoring": "mentoring",
    }
    
    text_lower = text.lower()
    
    # Extract technical skills
    detected_tech = [skill for keyword, skill in tech_keywords.items() if keyword in text_lower]
    
    # Extract soft skills
    detected_soft = [skill for keyword, skill in soft_keywords.items() if keyword in text_lower]
    
    # Determine intent from text patterns
    if any(word in text_lower for word in ["startup", "innovation", "growth", "challenge"]):
        primary_intent = "growth"
    elif any(word in text_lower for word in ["stability", "work-life", "balance", "family"]):
        primary_intent = "stability"
    else:
        primary_intent = "technical_growth"
    
    secondary_intent = "impact"
    
    # Detect leadership signals
    leadership_signals = []
    if any(word in text_lower for word in ["led", "managed", "directed", "supervised", "team"]):
        leadership_signals.append("Team leadership experience")
    if any(word in text_lower for word in ["mentor", "trained", "coached"]):
        leadership_signals.append("Mentoring and coaching")
    if any(word in text_lower for word in ["project", "delivered", "completed"]):
        leadership_signals.append("Project delivery")
    
    leadership_score = min(len(leadership_signals) * 0.3, 1.0)
    
    # Detect compensation emphasis
    compensation_signals = []
    if any(word in text_lower for word in ["salary", "compensation", "bonus", "stock", "equity"]):
        compensation_signals.append("Direct compensation mention")
    
    compensation_score = min(len(compensation_signals) * 0.5, 0.5)  # Usually low
    
    return ResumeAnalysisResponse(
        skills=SkillsResult(
            technical=detected_tech or ["technical_experience"],
            soft=detected_soft or ["collaboration"],
            confidence=0.7,
        ),
        intent_profile=IntentProfile(
            primary_intent=primary_intent,
            secondary_intent=secondary_intent,
            confidence=0.8,
        ),
        leadership_analysis=LeadershipAnalysis(
            score=leadership_score,
            evidence=leadership_signals or ["General experience"],
            confidence=0.6,
        ),
        compensation_emphasis_index=CompensationEmphasisIndex(
            score=compensation_score,
            evidence=compensation_signals or ["Not mentioned"],
            confidence=0.7,
        ),
    )


@router.post(
    "/analyze",
    response_model=ResumeAnalysisResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def analyze_resume(file: UploadFile = File(...)) -> ResumeAnalysisResponse:
    try:
        text = await extract_text_from_upload(file)
        logger.info("Resume parsed successfully: filename=%s", file.filename)

        candidate_profile = extract_candidate_profile(text)

        # Try full aggregator first (with all services)
        aggregator = _get_aggregator()
        if aggregator is not None:
            result = aggregator.analyze(text)
            return result.model_copy(update={"candidate_profile": candidate_profile})
        else:
            # Fallback to mock analysis if aggregator failed
            logger.info("Using mock analysis fallback")
            result = _get_mock_analysis(text)
            logger.info("Resume analysis completed (mock): filename=%s", file.filename)
            return result.model_copy(update={"candidate_profile": candidate_profile})
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error during resume analysis")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during analysis: {exc}",
        ) from exc


@router.post(
    "/extract-name",
    response_model=dict,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def extract_resume_name(file: UploadFile = File(...)) -> dict:
    """Extract candidate name from resume for auto-population in behavioral form."""
    try:
        text = await extract_text_from_upload(file)
        candidate_name = extract_candidate_name(text)
        
        logger.info(
            "Candidate name extracted: name=%s, filename=%s",
            candidate_name or "(not found)",
            file.filename
        )
        
        return {
            "candidate_name": candidate_name,
            "status": "success" if candidate_name else "name_not_found",
            "message": f"Found candidate name: {candidate_name}" 
                      if candidate_name 
                      else "Could not automatically extract candidate name. Please enter manually."
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error extracting candidate name")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting candidate name: {exc}",
        ) from exc


@router.post(
    "/extract-profile",
    response_model=dict,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def extract_resume_profile(file: UploadFile = File(...)) -> dict:
    """Extract candidate contact, education, and profile details from a resume."""
    try:
        text = await extract_text_from_upload(file)
        profile = extract_candidate_profile(text)

        logger.info(
            "Candidate profile extracted: name=%s, email=%s, filename=%s",
            profile.get("candidate_name") or "(not found)",
            profile.get("email") or "(not found)",
            file.filename,
        )

        return {
            "status": "success",
            "profile": profile,
            "message": "Candidate profile extracted from resume.",
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error extracting candidate profile")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting candidate profile: {exc}",
        ) from exc
