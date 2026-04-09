"""
Behavioral Intelligence Agent for HRMS System

Advanced team compatibility and behavioral analysis for HR recruitment.
Analyzes individual personality (OCEAN model), team dynamics, and role fit.
"""

from typing import Dict, List, Any
from dataclasses import dataclass, asdict


# ============================================================================
# OCEAN PERSONALITY QUESTIONS & OPTIONS
# ============================================================================

OCEAN_QUESTIONS = [
    # OPENNESS (5 questions)
    {
        "id": "O1",
        "trait": "openness",
        "question": "When faced with a problem, I prefer to:",
        "options": [
            ("Find proven, traditional solutions", 1),
            ("Think outside the box and try new approaches", 5),
            ("Mix tried methods with some experimentation", 3),
            ("Explore creative and unconventional ideas", 5),
            ("Follow established procedures carefully", 1),
        ]
    },
    {
        "id": "O2",
        "trait": "openness",
        "question": "In terms of art, music, and culture, I:",
        "options": [
            ("Find them interesting but not a priority", 2),
            ("Am highly interested and engage deeply", 5),
            ("Appreciate them casually", 3),
            ("See them as essential to personal growth", 5),
            ("Don't find them particularly relevant", 1),
        ]
    },
    {
        "id": "O3",
        "trait": "openness",
        "question": "My ideal learning approach is:",
        "options": [
            ("Master current skills thoroughly", 2),
            ("Continuously explore diverse new topics", 5),
            ("Learn what's directly relevant to my role", 2),
            ("Embrace intellectual curiosity in all areas", 5),
            ("Stick with familiar knowledge", 1),
        ]
    },
    
    # CONSCIENTIOUSNESS (5 questions)
    {
        "id": "C1",
        "trait": "conscientiousness",
        "question": "When organizing a project, I:",
        "options": [
            ("Create detailed plans and stick to them closely", 5),
            ("Have a rough idea and adapt as needed", 2),
            ("Follow a systematic but flexible approach", 4),
            ("Plan meticulously with contingencies", 5),
            ("Prefer spontaneous approach", 1),
        ]
    },
    {
        "id": "C2",
        "trait": "conscientiousness",
        "question": "Regarding deadlines, I:",
        "options": [
            ("Always deliver early or exactly on time", 5),
            ("Usually meet them with some buffer", 4),
            ("Sometimes miss them due to other priorities", 2),
            ("Am obsessive about being on time", 5),
            ("Miss them regularly", 1),
        ]
    },
    {
        "id": "C3",
        "trait": "conscientiousness",
        "question": "My work environment is typically:",
        "options": [
            ("Well-organized and meticulously maintained", 5),
            ("Generally tidy with occasional clutter", 3),
            ("Organized by my own system", 3),
            ("Highly structured and methodical", 5),
            ("Chaotic but I know where everything is", 1),
        ]
    },
    
    # EXTRAVERSION (5 questions)
    {
        "id": "E1",
        "trait": "extraversion",
        "question": "In team meetings, I:",
        "options": [
            ("Speak up frequently and lead discussions", 5),
            ("Contribute actively and engage", 4),
            ("Listen more than I speak", 2),
            ("Dominate conversation and enjoy attention", 5),
            ("Prefer to remain silent", 1),
        ]
    },
    {
        "id": "E2",
        "trait": "extraversion",
        "question": "After a busy workday, I prefer to:",
        "options": [
            ("Socialize with colleagues or friends", 5),
            ("Have some social time then unwind alone", 3),
            ("Spend time alone to recharge", 2),
            ("Attend networking events and group activities", 5),
            ("Be completely alone", 1),
        ]
    },
    {
        "id": "E3",
        "trait": "extraversion",
        "question": "I am energized by:",
        "options": [
            ("Collaborative and interactive work", 5),
            ("Mix of teamwork and independent tasks", 3),
            ("Focused, solitary work", 1),
            ("High-energy environments with many people", 5),
            ("Quiet, solo focused environments", 1),
        ]
    },
    
    # AGREEABLENESS (5 questions)
    {
        "id": "A1",
        "trait": "agreeableness",
        "question": "When a colleague makes a mistake, I:",
        "options": [
            ("Help them fix it without judgment", 5),
            ("Point it out constructively", 4),
            ("Let them figure it out themselves", 2),
            ("Provide support and mentoring", 5),
            ("Criticize them for the error", 1),
        ]
    },
    {
        "id": "A2",
        "trait": "agreeableness",
        "question": "My approach to workplace conflicts is:",
        "options": [
            ("Find win-win solutions for everyone", 5),
            ("Address concerns collaboratively", 4),
            ("Avoid confrontation when possible", 2),
            ("Prioritize others' needs and harmony", 5),
            ("Assert my position firmly", 1),
        ]
    },
    {
        "id": "A3",
        "trait": "agreeableness",
        "question": "I believe in giving credit to:",
        "options": [
            ("Everyone who contributed, generously", 5),
            ("Those who specifically worked on it", 4),
            ("Primarily myself if I led it", 1),
            ("All team members equally", 5),
            ("Only myself for my contributions", 1),
        ]
    },
    
    # EMOTIONAL STABILITY (5 questions)
    {
        "id": "S1",
        "trait": "emotional_stability",
        "question": "Under high pressure, I:",
        "options": [
            ("Remain calm and focused", 5),
            ("Feel stressed but manage effectively", 3),
            ("Become anxious and make mistakes", 1),
            ("Stay composed and problem-solve", 5),
            ("Tend to panic", 1),
        ]
    },
    {
        "id": "S2",
        "trait": "emotional_stability",
        "question": "Regarding constructive criticism, I:",
        "options": [
            ("Welcome it and learn from feedback", 5),
            ("Accept it but feel slightly defensive", 3),
            ("Take it personally and feel hurt", 1),
            ("Appreciate diverse perspectives gladly", 5),
            ("Become upset and defensive", 1),
        ]
    },
    {
        "id": "S3",
        "trait": "emotional_stability",
        "question": "After project setbacks, I:",
        "options": [
            ("Quickly adapt and move forward", 5),
            ("Reflect then continue", 3),
            ("Dwell on what went wrong", 1),
            ("Learn and become more resilient", 5),
            ("Feel discouraged for long periods", 1),
        ]
    },
]

# Team Compatibility Matrix - how different personalities complement each other
TEAM_COMPATIBILITY = {
    "high_openness": {
        "complements": ["conscientiousness", "agreeableness"],
        "conflicts_with": ["low_openness"],
        "role_fit": ["Innovation Lead", "Strategy", "Research", "Product Manager"]
    },
    "high_conscientiousness": {
        "complements": ["openness", "emotional_stability"],
        "conflicts_with": ["low_conscientiousness"],
        "role_fit": ["Project Manager", "Quality Assurance", "Operations", "Finance"]
    },
    "high_extraversion": {
        "complements": ["agreeableness", "openness"],
        "conflicts_with": ["low_extraversion"],
        "role_fit": ["Sales", "Client Relations", "Marketing", "Leadership"]
    },
    "high_agreeableness": {
        "complements": ["extraversion", "emotional_stability"],
        "conflicts_with": ["low_agreeableness"],
        "role_fit": ["HR", "Training", "Support", "Team Lead"]
    },
    "high_emotional_stability": {
        "complements": ["conscientiousness", "agreeableness"],
        "conflicts_with": ["low_emotional_stability"],
        "role_fit": ["Crisis Management", "Executive", "High-Pressure Roles"]
    },
}

ROLE_PERSONALITY_REQUIREMENTS = {
    "Engineer": {"conscientiousness": 70, "openness": 60, "emotional_stability": 60},
    "Manager": {"extraversion": 70, "agreeableness": 70, "emotional_stability": 75},
    "Designer": {"openness": 80, "conscientiousness": 65, "extraversion": 50},
    "Sales": {"extraversion": 80, "agreeableness": 70, "emotional_stability": 70},
    "HR": {"agreeableness": 80, "extraversion": 70, "emotional_stability": 75},
    "Data Analyst": {"conscientiousness": 75, "openness": 70, "emotional_stability": 65},
    "Product Manager": {"openness": 80, "extraversion": 70, "conscientiousness": 75},
}

TEAM_COMPOSITION_BALANCE = {
    "optimal_diversity": {
        "openness": (50, 80),
        "conscientiousness": (50, 80),
        "extraversion": (40, 75),
        "agreeableness": (60, 85),
        "emotional_stability": (60, 85),
    }
}


# NLP Word Lists for Sentiment & Keyword Detection
POSITIVE_WORDS = [
    "improve", "learn", "responsibility", "team", "collaborate", "support",
    "growth", "solution", "initiative", "proactive", "enthusiasm", "positive",
    "confident", "creative", "efficient", "professional", "dedicated"
]

NEGATIVE_WORDS = [
    "blame", "fault", "anger", "frustrated", "angry", "negative", "lazy",
    "incompetent", "useless", "hate", "failed", "mistake", "problem"
]

# Risk Thresholds
RISK_THRESHOLDS = {
    "emotional_stability": 40,
    "communication": 40,
    "teamwork": 30,
    "accountability": 35,
    "behavioral_fit": 50,
}


# ============================================================================
# DATA CLASS
# ============================================================================

@dataclass
class BehavioralAnalysisResult:
    """Data class for storing behavioral analysis results."""
    behavioral_fit_score: int
    personality_traits: Dict[str, int]
    communication: Dict[str, Any]
    team_fit: str
    role_fit_score: int
    role_recommendations: List[str]
    team_compatibility: Dict[str, Any]
    risk_flags: List[str]
    summary: str
    candidate_name: str
    job_role: str
    team_size: int
    personality_type: str = "The Balanced Professional"
    personality_profile: Dict[str, Any] = None
    role_compatibility: Dict[str, float] = None  # All role fit scores
    recommendation_data: Dict[str, Any] = None  # AI-powered recommendations


# ============================================================================
# PERSONALITY TYPE DEFINITIONS (Industry-Standard OCEAN Archetypes)
# ============================================================================

PERSONALITY_TYPES = {
    "The Visionary": {
        "description": "Highly creative, adaptable, and open to new experiences. Thrives in innovative environments.",
        "traits": {"openness": 75, "conscientiousness": 55, "extraversion": 60, "agreeableness": 60, "emotional_stability": 65},
        "strengths": ["Innovation", "Creative Problem Solving", "Adaptability", "Big Picture Thinking"],
        "challenges": ["May lack attention to detail", "Can be scattered", "Prefers change over stability"],
        "best_roles": ["Product Manager", "Designer", "Consultant", "Startup Founder"]
    },
    "The Organizer": {
        "description": "Highly reliable, detail-oriented, and systematic. Excels at project management and execution.",
        "traits": {"openness": 50, "conscientiousness": 80, "extraversion": 65, "agreeableness": 70, "emotional_stability": 75},
        "strengths": ["Reliability", "Organization", "Attention to Detail", "Goal Achievement"],
        "challenges": ["May resist change", "Can be rigid", "Over-emphasis on processes"],
        "best_roles": ["Project Manager", "Operations", "Engineer", "Analyst"]
    },
    "The Leader": {
        "description": "Charismatic, confident, and socially commanding. Natural at influencing and team motivation.",
        "traits": {"openness": 65, "conscientiousness": 70, "extraversion": 80, "agreeableness": 65, "emotional_stability": 70},
        "strengths": ["Communication", "Team Motivation", "Confidence", "Decision Making"],
        "challenges": ["Can be domineering", "May not listen well", "Risk of dismissing others"],
        "best_roles": ["Manager", "Sales", "Executive", "Team Lead"]
    },
    "The Collaborator": {
        "description": "Empathetic, cooperative, and focused on team harmony. Essential for building strong teams.",
        "traits": {"openness": 60, "conscientiousness": 70, "extraversion": 70, "agreeableness": 80, "emotional_stability": 75},
        "strengths": ["Teamwork", "Empathy", "Collaboration", "Conflict Resolution"],
        "challenges": ["May avoid conflict", "Over-accommodating", "Difficulty with tough decisions"],
        "best_roles": ["HR", "Team Lead", "Counselor", "Customer Success"]
    },
    "The Steady Performer": {
        "description": "Calm, stable, and reliable. Maintains composure under pressure with consistent performance.",
        "traits": {"openness": 55, "conscientiousness": 75, "extraversion": 55, "agreeableness": 70, "emotional_stability": 80},
        "strengths": ["Stability", "Pressure Handling", "Consistency", "Reliability"],
        "challenges": ["May lack creativity", "Slow to adapt", "Conservative approach"],
        "best_roles": ["Operations", "Support", "Analyst", "Engineer"]
    },
    "The Maverick": {
        "description": "Independent, unconventional, and confident in their own path. Challenges the status quo.",
        "traits": {"openness": 75, "conscientiousness": 60, "extraversion": 65, "agreeableness": 50, "emotional_stability": 60},
        "strengths": ["Innovation", "Independence", "Courage", "Original Thinking"],
        "challenges": ["May clash with team", "Resistance to authority", "Inconsistency"],
        "best_roles": ["Entrepreneur", "Researcher", "Designer", "Consultant"]
    },
    "The Analyst": {
        "description": "Logical, data-driven, and methodical. Excels at solving complex technical problems.",
        "traits": {"openness": 65, "conscientiousness": 75, "extraversion": 45, "agreeableness": 55, "emotional_stability": 70},
        "strengths": ["Problem Solving", "Technical Skill", "Logical Thinking", "Precision"],
        "challenges": ["Can be overly critical", "Difficulty with soft skills", "Resistance to change"],
        "best_roles": ["Data Analyst", "Engineer", "Researcher", "Architect"]
    },
    "The Connector": {
        "description": "Socially energetic, friendly, and outgoing. Excellent at building networks and relationships.",
        "traits": {"openness": 65, "conscientiousness": 60, "extraversion": 80, "agreeableness": 75, "emotional_stability": 70},
        "strengths": ["Networking", "Communication", "Relationship Building", "Social Intelligence"],
        "challenges": ["May lack depth", "Can be unfocused", "Over-reliance on people skills"],
        "best_roles": ["Sales", "Business Development", "Community Manager", "Client Success"]
    }
}

def get_personality_type(ocean_scores: Dict[str, float]) -> tuple:
    """
    Determine personality type based on OCEAN scores.
    Returns (type_name, personality_profile_dict)
    """
    scores = ocean_scores.copy()
    
    # Calculate relative dominance of each trait
    max_score = max(scores.values())
    min_score = min(scores.values())
    
    # Primary trait determination
    o = scores.get("openness", 50)
    c = scores.get("conscientiousness", 50)
    e = scores.get("extraversion", 50)
    a = scores.get("agreeableness", 50)
    s = scores.get("emotional_stability", 50)
    
    # Personality type logic (industry-standard OCEAN mapping)
    if o > 70 and c < 65 and e > 60:
        ptype = "The Visionary"
    elif c > 75 and o < 65 and a > 65:
        ptype = "The Organizer"
    elif e > 75 and c > 65 and a > 60:
        ptype = "The Leader"
    elif a > 75 and c > 65 and e > 65:
        ptype = "The Collaborator"
    elif s > 75 and c > 70 and o < 60:
        ptype = "The Steady Performer"
    elif o > 70 and a < 60 and e > 60:
        ptype = "The Maverick"
    elif o > 65 and c > 70 and e < 60 and a < 65:
        ptype = "The Analyst"
    elif e > 75 and a > 70:
        ptype = "The Connector"
    else:
        # Default: balanced profile
        ptype = "The Balanced Professional"
    
    profile = PERSONALITY_TYPES.get(ptype, {}).copy()
    
    # Generate dynamic strengths based on actual scores
    profile["dynamic_strengths"] = generate_dynamic_strengths(scores)
    profile["role_compatibility"] = calculate_role_compatibility(scores)
    
    return ptype, profile


def generate_dynamic_strengths(ocean_scores: Dict[str, float]) -> list:
    """Generate unique, score-based strengths for each candidate."""
    strengths = []
    o = ocean_scores.get("openness", 50)
    c = ocean_scores.get("conscientiousness", 50)
    e = ocean_scores.get("extraversion", 50)
    a = ocean_scores.get("agreeableness", 50)
    s = ocean_scores.get("emotional_stability", 50)
    
    # Openness-based strengths
    if o > 75:
        strengths.append("Exceptional creativity and innovation thinking")
    elif o > 60:
        strengths.append("Good adaptability to new situations")
    
    # Conscientiousness-based strengths
    if c > 75:
        strengths.append("Excellent execution and reliability")
    elif c > 60:
        strengths.append("Solid work ethic and follow-through")
    
    # Extraversion-based strengths
    if e > 75:
        strengths.append("Strong communication and crowd engagement")
    elif e > 60:
        strengths.append("Good interpersonal skills and presence")
    elif e < 40:
        strengths.append("Deep focus and independent work capability")
    
    # Agreeableness-based strengths
    if a > 75:
        strengths.append("High empathy and team collaboration")
    elif a > 60:
        strengths.append("Good team cooperation and harmony building")
    elif a < 40:
        strengths.append("Strong independent judgment and assertiveness")
    
    # Emotional Stability-based strengths
    if s > 75:
        strengths.append("Exceptional composure under pressure")
    elif s > 60:
        strengths.append("Resilience and stress management")
    elif s < 40:
        strengths.append("Strong sensitivity to environmental needs")
    
    # Cross-trait strengths
    if o > 70 and e > 70:
        strengths.append("Natural innovator with communication ability")
    if c > 70 and a > 70:
        strengths.append("Dependable team player")
    if e > 70 and s > 70:
        strengths.append("Confident and composed leader")
    
    return strengths[:5]  # Return top 5 unique strengths


def calculate_role_compatibility(ocean_scores: Dict[str, float]) -> Dict[str, float]:
    """Calculate compatibility percentage for different roles."""
    o = ocean_scores.get("openness", 50)
    c = ocean_scores.get("conscientiousness", 50)
    e = ocean_scores.get("extraversion", 50)
    a = ocean_scores.get("agreeableness", 50)
    s = ocean_scores.get("emotional_stability", 50)
    
    compatibilities = {
        "Manager": (e * 0.35 + c * 0.25 + a * 0.25 + s * 0.15) / 100,
        "Engineer": (c * 0.35 + o * 0.25 + s * 0.25 + a * 0.15) / 100,
        "Designer": (o * 0.4 + e * 0.25 + a * 0.2 + c * 0.15) / 100,
        "Sales": (e * 0.4 + a * 0.3 + s * 0.2 + o * 0.1) / 100,
        "HR/People": (a * 0.35 + e * 0.3 + s * 0.2 + o * 0.15) / 100,
        "Analyst": (c * 0.35 + o * 0.3 + s * 0.2 + a * 0.15) / 100,
        "Executive": (e * 0.3 + c * 0.25 + s * 0.25 + o * 0.2) / 100,
    }
    
    # Return as percentages
    return {role: round(score * 100) for role, score in compatibilities.items()}


# ============================================================================
# BEHAVIORAL INTELLIGENCE AGENT
# ============================================================================

class BehavioralAgent:
    """
    Advanced behavioral intelligence agent for team recruitment and compatibility.
    Analyzes OCEAN personality traits, role fit, and team dynamics.
    """

    def __init__(self):
        """Initialize the Behavioral Agent."""
        self.ocean_scores: Dict[str, float] = {}
        self.communication_score: float = 0
        self.sentiment_label: str = "neutral"
        self.risk_flags: List[str] = []
        
        # Initialize recommendation engine with lazy loading (non-blocking)
        self._recommendation_engine = None
        self._recommendation_engine_loaded = False
    
    @property
    def recommendation_engine(self):
        """Lazy-load recommendation engine on first access."""
        if self._recommendation_engine_loaded:
            return self._recommendation_engine
        
        self._recommendation_engine_loaded = True
        try:
            from resume_agent.services.recommendation import RecommendationEngine
            self._recommendation_engine = RecommendationEngine()
        except ImportError:
            self._recommendation_engine = None
        except Exception:
            self._recommendation_engine = None
        
        return self._recommendation_engine

    def process_ocean_answers(self, answers: Dict[str, int]) -> Dict[str, int]:
        """
        Process OCEAN answers and calculate personality scores.

        Args:
            answers: Dictionary mapping question IDs to selected scores (1-5)

        Returns:
            Dictionary with OCEAN trait scores (0-100)
        """
        trait_scores = {
            "openness": [],
            "conscientiousness": [],
            "extraversion": [],
            "agreeableness": [],
            "emotional_stability": [],
        }

        # Collect scores by trait
        for question in OCEAN_QUESTIONS:
            q_id = question["id"]
            trait = question["trait"]
            if q_id in answers:
                trait_scores[trait].append(answers[q_id])

        # Calculate averages and normalize to 0-100
        ocean_normalized = {}
        for trait, scores in trait_scores.items():
            if scores:
                avg = sum(scores) / len(scores)
                normalized = int(avg * 20)  # Convert 1-5 to 0-100
                ocean_normalized[trait] = max(0, min(100, normalized))
            else:
                ocean_normalized[trait] = 0

        self.ocean_scores = ocean_normalized
        return ocean_normalized

    def analyze_text(self, text_answers: List[str]) -> float:
        """
        Analyze text for sentiment and communication quality.

        Args:
            text_answers: List of open-ended responses

        Returns:
            Communication effectiveness score (0-100)
        """
        combined_text = " ".join(text_answers).lower()

        positive_count = sum(1 for word in POSITIVE_WORDS if word in combined_text)
        negative_count = sum(1 for word in NEGATIVE_WORDS if word in combined_text)

        if positive_count > negative_count + 2:
            self.sentiment_label = "positive"
        elif negative_count > positive_count + 2:
            self.sentiment_label = "negative"
        else:
            self.sentiment_label = "neutral"

        base_score = 50
        sentiment_boost = 20 if self.sentiment_label == "positive" else (
            -20 if self.sentiment_label == "negative" else 0
        )
        communication_score = int(base_score + sentiment_boost)
        self.communication_score = max(0, min(100, communication_score))
        return self.communication_score

    def calculate_final_score(self) -> int:
        """
        Calculate behavioral fit score from OCEAN traits.

        Returns:
            Final behavioral fit score (0-100)
        """
        if not self.ocean_scores:
            return 0
        avg_score = sum(self.ocean_scores.values()) / len(self.ocean_scores)
        return int(avg_score)

    def assess_team_fit(self, final_score: int) -> str:
        """Determine team fit category."""
        if final_score >= 75:
            return "Excellent Fit"
        elif final_score >= 60:
            return "Good Fit"
        elif final_score >= 45:
            return "Moderate Fit"
        else:
            return "Risky Fit"

    def analyze_role_fit(self, job_role: str) -> tuple:
        """
        Analyze fit for specific job role.

        Args:
            job_role: The desired job role

        Returns:
            Tuple of (role_fit_score, recommendations)
        """
        requirements = ROLE_PERSONALITY_REQUIREMENTS.get(job_role, {})
        if not requirements:
            return 0, []

        scores = []
        for trait, required_score in requirements.items():
            candidate_score = self.ocean_scores.get(trait, 0)
            trait_fit = 100 - abs(candidate_score - required_score)
            scores.append(trait_fit)

        role_fit_score = int(sum(scores) / len(scores)) if scores else 0

        recommendations = []
        for trait, required_score in requirements.items():
            candidate_score = self.ocean_scores.get(trait, 0)
            if candidate_score < required_score - 10:
                recommendations.append(
                    f"📍 {trait.title()}: Current {candidate_score} vs Required {required_score}. "
                    f"Needs development in this area."
                )
            elif candidate_score > required_score + 10:
                recommendations.append(
                    f"✨ {trait.title()}: Excellent {candidate_score}. Strong fit for this role."
                )

        return role_fit_score, recommendations

    def analyze_team_compatibility(self, team_members: List[Dict[str, int]]) -> Dict[str, Any]:
        """
        Analyze compatibility with existing team.

        Args:
            team_members: List of existing team member personality scores

        Returns:
            Compatibility analysis with team
        """
        if not team_members:
            return {
                "compatibility_score": 100,
                "team_balance": "New team - candidate sets baseline",
                "synergies": [],
                "potential_conflicts": [],
                "recommendations": []
            }

        compatibility_scores = []
        synergies = []
        potential_conflicts = []

        for member in team_members:
            # Calculate similarity/complementarity
            trait_diffs = []
            for trait in self.ocean_scores.keys():
                candidate_val = self.ocean_scores.get(trait, 50)
                member_val = member.get(trait, 50)
                diff = abs(candidate_val - member_val)
                trait_diffs.append(diff)

            avg_diff = sum(trait_diffs) / len(trait_diffs) if trait_diffs else 0

            # Calculate compatibility (lower difference = better compatibility for some traits)
            # Higher difference = better diversity for others
            compatibility = max(0, 100 - (avg_diff * 0.75))
            compatibility_scores.append(compatibility)

            # Analyze synergies
            for trait in self.ocean_scores.keys():
                candidate_val = self.ocean_scores.get(trait, 50)
                member_val = member.get(trait, 50)

                if trait in ["conscientiousness", "emotional_stability"]:
                    if candidate_val >= 70 and member_val >= 70:
                        synergies.append(
                            f"✓ Both have high {trait} - strong reliability and stability"
                        )
                elif trait == "extraversion":
                    if abs(candidate_val - member_val) > 30:
                        synergies.append(
                            f"✓ Different extraversion levels - good balance in team dynamics"
                        )
                elif trait == "openness":
                    if abs(candidate_val - member_val) > 20:
                        synergies.append(
                            f"✓ Different openness - brings fresh perspectives while team grounds ideas"
                        )

                # Detect potential conflicts
                if trait == "agreeableness" and candidate_val < 40 and member_val < 40:
                    potential_conflicts.append(
                        f"⚠️ Both low agreeableness - potential friction in conflicts"
                    )
                elif trait == "emotional_stability" and candidate_val < 40 and member_val < 40:
                    potential_conflicts.append(
                        f"⚠️ Both low emotional stability - team stress management needed"
                    )

        overall_compatibility = int(sum(compatibility_scores) / len(compatibility_scores)) if compatibility_scores else 75

        # Check team composition balance
        team_avg = {}
        for trait in self.ocean_scores.keys():
            values = [m.get(trait, 50) for m in team_members]
            team_avg[trait] = sum(values) / len(values) if values else 50

        balance_recommendations = []
        for trait, (min_val, max_val) in TEAM_COMPOSITION_BALANCE.get("optimal_diversity", {}).items():
            team_val = team_avg.get(trait, 50)
            if team_val < min_val:
                balance_recommendations.append(
                    f"Team needs more {trait}. Current avg: {int(team_val)}, Optimal: {int(min_val)}-{int(max_val)}"
                )
            elif team_val > max_val:
                balance_recommendations.append(
                    f"Team has too much {trait}. Current avg: {int(team_val)}, Optimal: {int(min_val)}-{int(max_val)}"
                )

        return {
            "compatibility_score": overall_compatibility,
            "team_balance": f"Team of {len(team_members)} members",
            "synergies": list(set(synergies))[:3],  # Top 3 unique synergies
            "potential_conflicts": list(set(potential_conflicts))[:2],  # Top 2 conflicts
            "recommendations": balance_recommendations[:2]  # Top 2 balance recommendations
        }

    def identify_risk_flags(self) -> List[str]:
        """Identify behavioral risk factors."""
        flags = []

        if self.ocean_scores.get("emotional_stability", 100) < 40:
            flags.append("⚠️ Low emotional stability - may struggle under pressure")

        if self.communication_score < 40:
            flags.append("⚠️ Poor communication in assessment - needs clarity in articulation")

        if self.ocean_scores.get("conscientiousness", 100) < 35:
            flags.append("⚠️ Low conscientiousness - organization and follow-through concerns")

        if self.ocean_scores.get("agreeableness", 100) < 35:
            flags.append("⚠️ Low agreeableness - potential team collaboration issues")

        return flags

    def generate_summary(self, candidate_name: str, job_role: str, final_score: int, team_fit: str) -> str:
        """Generate HR-friendly summary."""
        strengths = []
        for trait, score in self.ocean_scores.items():
            if score >= 70:
                strengths.append(trait.replace("_", " "))

        summary = (
            f"{candidate_name} demonstrates a {team_fit.lower()} profile for {job_role} "
            f"(Score: {final_score}/100). "
        )

        if strengths:
            summary += f"Key strengths: {', '.join(strengths)}. "
        else:
            summary += "Balanced personality profile. "

        if self.risk_flags:
            summary += f"{len(self.risk_flags)} area(s) for attention. "
        else:
            summary += "Well-suited for team integration. "

        return summary

    def run(
        self,
        candidate_data: Dict[str, Any],
        team_members: List[Dict[str, int]] = None
    ) -> BehavioralAnalysisResult:
        """
        Execute complete behavioral analysis pipeline.

        Args:
            candidate_data: Dict with ocean_answers, text_answers, candidate_name, job_role
            team_members: List of existing team member personality profiles

        Returns:
            BehavioralAnalysisResult object
        """
        if team_members is None:
            team_members = []

        # Process personality
        personality_traits = self.process_ocean_answers(candidate_data.get("ocean_answers", {}))
        
        # Determine personality type
        personality_type, personality_profile = get_personality_type(personality_traits)
        
        # Extract role compatibility from personality profile
        role_compatibility = personality_profile.get("role_compatibility", {})
        
        # Analyze communication
        self.analyze_text(candidate_data.get("text_answers", []))

        # Calculate scores
        final_score = self.calculate_final_score()
        team_fit = self.assess_team_fit(final_score)

        # Role analysis
        job_role = candidate_data.get("job_role", "General")
        role_fit_score, role_recommendations = self.analyze_role_fit(job_role)

        # Team compatibility
        team_compatibility = self.analyze_team_compatibility(team_members)

        # Risk identification
        risk_flags = self.identify_risk_flags()

        # Summary
        candidate_name = candidate_data.get("candidate_name", "Candidate")
        summary = self.generate_summary(candidate_name, job_role, final_score, team_fit)

        # AI-powered recommendations (if recommendation engine is available)
        recommendation_data = {}
        if self.recommendation_engine:
            try:
                recommendation_data = self.recommendation_engine.get_role_fit_recommendations(
                    personality_type=personality_type,
                    ocean_scores=personality_traits,
                    role_compatibility=role_compatibility,
                    skills=[],  # Skills will be passed from resume parsing
                    job_role=job_role
                )
            except Exception:
                pass  # Gracefully fail if recommendation engine has issues

        result = BehavioralAnalysisResult(
            behavioral_fit_score=final_score,
            personality_traits=personality_traits,
            communication={"sentiment": self.sentiment_label, "score": self.communication_score},
            team_fit=team_fit,
            role_fit_score=role_fit_score,
            role_recommendations=role_recommendations,
            team_compatibility=team_compatibility,
            risk_flags=risk_flags,
            summary=summary,
            candidate_name=candidate_name,
            job_role=job_role,
            team_size=len(team_members),
            personality_type=personality_type,
            personality_profile=personality_profile,
            role_compatibility=role_compatibility,
            recommendation_data=recommendation_data
        )

        return result


# ============================================================================
# EXAMPLE EXECUTION
# ============================================================================

if __name__ == "__main__":
    # Sample candidate data with OCEAN answers
    sample_candidate = {
        "candidate_name": "Alice Johnson",
        "job_role": "Engineer",
        "ocean_answers": {
            "O1": 4, "O2": 5, "O3": 4,  # Openness: 4.3 avg -> 86
            "C1": 5, "C2": 5, "C3": 4,  # Conscientiousness: 4.6 avg -> 92
            "E1": 3, "E2": 3, "E3": 2,  # Extraversion: 2.6 avg -> 52
            "A1": 5, "A2": 4, "A3": 5,  # Agreeableness: 4.6 avg -> 92
            "S1": 4, "S2": 4, "S3": 5,  # Emotional Stability: 4.3 avg -> 86
        },
        "text_answers": [
            "I handle conflicts by listening to all perspectives and finding collaborative solutions. "
            "I take responsibility for my actions and learn from every experience.",
            "When facing challenges, I remain calm, analyze the situation carefully, and work with the team. "
            "I'm committed to growth and continuous improvement.",
        ]
    }

    # Existing team members
    existing_team = [
        {
            "name": "Bob Smith",
            "openness": 60,
            "conscientiousness": 75,
            "extraversion": 70,
            "agreeableness": 80,
            "emotional_stability": 75,
        },
        {
            "name": "Carol White",
            "openness": 70,
            "conscientiousness": 85,
            "extraversion": 55,
            "agreeableness": 75,
            "emotional_stability": 80,
        },
    ]

    # Initialize and run the agent
    agent = BehavioralAgent()
    result = agent.run(sample_candidate, 
        team_members=existing_team
    )

    # Display results
    print("\n" + "=" * 90)
    print("BEHAVIORAL INTELLIGENCE ANALYSIS - TEAM RECRUITMENT REPORT")
    print("=" * 90)

    print(f"\n👤 CANDIDATE: {result.candidate_name}")
    print(f"💼 POSITION: {result.job_role}")
    print(f"👥 TEAM SIZE: {result.team_size} members")

    print(f"\n📊 OVERALL BEHAVIORAL FIT SCORE: {result.behavioral_fit_score}/100")
    print(f"⭐ TEAM FIT: {result.team_fit}")
    print(f"🎯 ROLE FIT SCORE: {result.role_fit_score}/100")

    print("\n" + "-" * 90)
    print("OCEAN PERSONALITY PROFILE:")
    print("-" * 90)
    traits_order = ["openness", "conscientiousness", "extraversion", "agreeableness", "emotional_stability"]
    for trait in traits_order:
        score = result.personality_traits.get(trait, 0)
        bar = "█" * (score // 5) + "░" * ((100 - score) // 5)
        print(f"  {trait.upper():20} [{bar}] {score}/100")

    print("\n" + "-" * 90)
    print("COMMUNICATION & SENTIMENT:")
    print("-" * 90)
    print(f"  Sentiment: {result.communication['sentiment'].upper()}")
    print(f"  Communication Score: {result.communication['score']}/100")

    print("\n" + "-" * 90)
    print("ROLE FIT RECOMMENDATIONS:")
    print("-" * 90)
    for rec in result.role_recommendations:
        print(f"  {rec}")

    if result.team_size > 0:
        print("\n" + "-" * 90)
        print("TEAM COMPATIBILITY ANALYSIS:")
        print("-" * 90)
        print(f"  Compatibility Score: {result.team_compatibility['compatibility_score']}/100")
        print(f"  Team Overview: {result.team_compatibility['team_balance']}")
        
        if result.team_compatibility['synergies']:
            print("\n  ✓ SYNERGIES WITH TEAM:")
            for syn in result.team_compatibility['synergies']:
                print(f"    {syn}")
        
        if result.team_compatibility['potential_conflicts']:
            print("\n  ⚠️  POTENTIAL CONFLICTS:")
            for conf in result.team_compatibility['potential_conflicts']:
                print(f"    {conf}")
        
        if result.team_compatibility['recommendations']:
            print("\n  💡 TEAM BALANCE RECOMMENDATIONS:")
            for rec in result.team_compatibility['recommendations']:
                print(f"    {rec}")

    if result.risk_flags:
        print("\n" + "-" * 90)
        print("RISK FLAGS:")
        print("-" * 90)
        for flag in result.risk_flags:
            print(f"  {flag}")
    else:
        print("\n✅ NO BEHAVIORAL RISK FLAGS DETECTED")

    print("\n" + "-" * 90)
    print("HR SUMMARY:")
    print("-" * 90)
    print(f"  {result.summary}")

    print("\n" + "=" * 90)
    print("Full JSON Output:")
    print("=" * 90)
    print(asdict(result))
    print("\n")

