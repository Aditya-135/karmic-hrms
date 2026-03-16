from pydantic import BaseModel, Field


class SkillsResult(BaseModel):
    technical: list[str] = Field(default_factory=list)
    soft: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


class IntentProfile(BaseModel):
    primary_intent: str
    secondary_intent: str
    confidence: float = Field(ge=0.0, le=1.0)


class LeadershipAnalysis(BaseModel):
    score: float = Field(ge=0.0, le=1.0)
    evidence: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


class CompensationEmphasisIndex(BaseModel):
    score: float = Field(ge=0.0, le=1.0)
    evidence: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


class ResumeAnalysisResponse(BaseModel):
    skills: SkillsResult
    intent_profile: IntentProfile
    leadership_analysis: LeadershipAnalysis
    compensation_emphasis_index: CompensationEmphasisIndex


class ErrorResponse(BaseModel):
    detail: str
