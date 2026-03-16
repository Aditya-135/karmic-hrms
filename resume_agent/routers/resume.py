from __future__ import annotations

from functools import lru_cache

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from resume_agent.models.schema import ErrorResponse, ResumeAnalysisResponse
from resume_agent.services.aggregator import AggregatorService
from resume_agent.services.compensation import CompensationEmphasisService
from resume_agent.services.intent import IntentDetectionService
from resume_agent.services.leadership import LeadershipSignalService
from resume_agent.services.parser import extract_text_from_upload
from resume_agent.services.skills import SkillExtractionService
from resume_agent.utils.logger import logger

router = APIRouter(prefix="/api/v1/resume", tags=["resume-intelligence"])


@lru_cache(maxsize=1)
def _get_aggregator() -> AggregatorService:
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


@router.post(
    "/analyze",
    response_model=ResumeAnalysisResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def analyze_resume(file: UploadFile = File(...)) -> ResumeAnalysisResponse:
    try:
        text = await extract_text_from_upload(file)
        logger.info("Resume parsed successfully: filename=%s", file.filename)

        aggregator = _get_aggregator()
        return aggregator.analyze(text)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error during resume analysis")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during analysis: {exc}",
        ) from exc
