from __future__ import annotations

from dataclasses import dataclass

from resume_agent.models.schema import ResumeAnalysisResponse
from resume_agent.services.compensation import CompensationEmphasisService
from resume_agent.services.intent import IntentDetectionService
from resume_agent.services.leadership import LeadershipSignalService
from resume_agent.services.skills import SkillExtractionService


@dataclass(slots=True)
class AggregatorService:
    skills_service: SkillExtractionService
    intent_service: IntentDetectionService
    leadership_service: LeadershipSignalService
    compensation_service: CompensationEmphasisService

    def analyze(self, text: str) -> ResumeAnalysisResponse:
        skills = self.skills_service.analyze(text)
        intent = self.intent_service.analyze(text)
        leadership = self.leadership_service.analyze(text)
        compensation = self.compensation_service.analyze(text)

        return ResumeAnalysisResponse(
            skills=skills,
            intent_profile=intent,
            leadership_analysis=leadership,
            compensation_emphasis_index=compensation,
        )

