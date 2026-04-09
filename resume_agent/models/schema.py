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


# ============================================================================
# BEHAVIORAL INTELLIGENCE MODELS
# ============================================================================


class TeamMemberProfile(BaseModel):
    """Existing team member personality profile."""
    name: str
    openness: int = Field(ge=0, le=100)
    conscientiousness: int = Field(ge=0, le=100)
    extraversion: int = Field(ge=0, le=100)
    agreeableness: int = Field(ge=0, le=100)
    emotional_stability: int = Field(ge=0, le=100)


class PersonalityTraitsResponse(BaseModel):
    """OCEAN personality trait scores."""
    openness: int = Field(ge=0, le=100)
    conscientiousness: int = Field(ge=0, le=100)
    extraversion: int = Field(ge=0, le=100)
    agreeableness: int = Field(ge=0, le=100)
    emotional_stability: int = Field(ge=0, le=100)


class CommunicationAnalysisResponse(BaseModel):
    """Communication and sentiment analysis results."""
    sentiment: str = Field(description="positive, neutral, or negative")
    score: int = Field(ge=0, le=100, description="Communication effectiveness score")


class TeamCompatibilityResponse(BaseModel):
    """Team compatibility analysis results."""
    compatibility_score: int = Field(ge=0, le=100)
    team_balance: str
    synergies: list[str] = Field(default_factory=list)
    potential_conflicts: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class BehavioralAnalysisRequest(BaseModel):
    """Request model for OCEAN-based behavioral analysis."""
    candidate_name: str = Field(..., description="Name of the candidate")
    job_role: str = Field(..., description="Target job role (e.g., Engineer, Manager, Designer)")
    ocean_answers: dict[str, int] = Field(
        ...,
        description="Dict mapping question IDs (O1-O3, C1-C3, E1-E3, A1-A3, S1-S3) to scores (1-5)",
    )
    text_answers: list[str] = Field(
        default_factory=list,
        description="Open-ended responses from candidate",
    )
    team_members: list[TeamMemberProfile] = Field(
        default_factory=list,
        description="Existing team member profiles for compatibility analysis",
    )


class BehavioralAnalysisResponse(BaseModel):
    """Complete behavioral intelligence analysis response."""
    behavioral_fit_score: int = Field(
        ge=0, le=100, description="Overall behavioral fit score"
    )
    personality_traits: PersonalityTraitsResponse
    communication: CommunicationAnalysisResponse
    team_fit: str = Field(
        description="Team fit category: Excellent Fit, Good Fit, Moderate Fit, or Risky Fit"
    )
    role_fit_score: int = Field(
        ge=0, le=100, description="How well candidate fits the specific role"
    )
    role_recommendations: list[str] = Field(
        default_factory=list,
        description="Specific recommendations for the requested role",
    )
    team_compatibility: TeamCompatibilityResponse = Field(
        description="Analysis of compatibility with existing team"
    )
    risk_flags: list[str] = Field(
        default_factory=list,
        description="Identified behavioral risk factors",
    )
    summary: str = Field(description="HR-friendly behavioral analysis summary")
    candidate_name: str = Field(description="Name of the analyzed candidate")
    job_role: str = Field(description="Target job role analyzed")
    team_size: int = Field(description="Size of the team analyzed for compatibility")
    personality_type: str = Field(default="The Balanced Professional", description="OCEAN-based personality archetype")
    personality_profile: dict = Field(
        default_factory=dict,
        description="Detailed personality profile with strengths, challenges, and best roles"
    )
    role_compatibility: dict = Field(
        default_factory=dict,
        description="Compatibility scores for all available roles (0-100)"
    )
    recommendation_data: dict = Field(
        default_factory=dict,
        description="AI-powered recommendations for best roles and reasoning"
    )


class CandidateProfile(BaseModel):
    """Candidate profile stored in history."""
    candidate_name: str
    job_role: str
    personality_type: str
    personality_traits: dict
    behavioral_fit_score: int
    role_fit_score: int
    timestamp: str
    analysis_id: str = Field(default_factory=lambda: str(id(object())))


class TeamMember(BaseModel):
    """Team member setup with personality profile."""
    member_name: str
    personality_type: str
    personality_traits: dict
    compatibility_score: float = 0.0


class Team(BaseModel):
    """Team configuration for comparison."""
    team_name: str
    team_members: list[TeamMember] = Field(default_factory=list)
    team_id: str = Field(default_factory=lambda: str(id(object())))
    created_at: str = ""
    average_compatibility: float = 0.0
    team_dynamics_score: int = 0


class TeamComparison(BaseModel):
    """Multiple team scenarios for comparative analysis."""
    scenarios: list[Team] = Field(max_items=5, default_factory=list)
    candidate_for_comparison: str = ""
    comparison_timestamp: str = ""
    recommendation: str = ""
