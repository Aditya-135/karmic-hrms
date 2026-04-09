"""
Candidate Recommendation Engine using HuggingFace Sentence Transformers.
Matches candidates to roles and teams based on embeddings and historical data.
"""
from __future__ import annotations

from typing import Any


class RecommendationEngine:
    """
    AI-powered recommendation engine using sentence transformers.
    Matches candidates to roles based on embeddings and historical patterns.
    """

    def __init__(self):
        """Initialize recommendation engine with lazy-loaded sentence transformer."""
        self._model = None
        self._model_loaded = False
        self.candidates_history = {}  # Store for pattern matching
    
    def _get_model(self):
        """Lazy load the model on first use (non-blocking)."""
        if self._model_loaded:
            return self._model
        
        self._model_loaded = True
        try:
            from sentence_transformers import SentenceTransformer
            # Using lightweight, fast model suitable for production
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            self._model = None
        return self._model
    
    @property
    def model(self):
        """Model property with lazy loading."""
        return self._get_model()
    
    def get_role_fit_recommendations(
        self, 
        personality_type: str,
        ocean_scores: dict[str, float],
        role_compatibility: dict[str, float],
        skills: list[str],
        job_role: str
    ) -> dict[str, Any]:
        """
        Generate role recommendations based on personality and compatibility.
        
        Args:
            personality_type: Detected personality archetype
            ocean_scores: OCEAN trait scores
            role_compatibility: Pre-calculated role fit percentages
            skills: Extracted skills from resume
            job_role: Current job role being evaluated
        
        Returns:
            Recommendations dictionary with best/alternate roles and reasoning
        """
        recommendations = {
            "best_role": None,
            "confidence": 0,
            "alternate_roles": [],
            "reasoning": "",
            "skill_match_reason": "",
            "personality_reason": ""
        }
        
        # Find best role from compatibility scores
        if role_compatibility:
            sorted_roles = sorted(
                role_compatibility.items(), 
                key=lambda x: x[1], 
                reverse=True
            )
            best_role, confidence = sorted_roles[0]
            
            recommendations["best_role"] = best_role
            recommendations["confidence"] = confidence
            recommendations["alternate_roles"] = [
                role for role, _ in sorted_roles[1:3]
            ]  # Top 2 alternates
            
            # Generate reason based on OCEAN
            recommendations["personality_reason"] = (
                self._generate_personality_reason(
                    personality_type, 
                    ocean_scores
                )
            )
            
            # Generate skill-based reason
            if skills:
                recommendations["skill_match_reason"] = (
                    self._generate_skill_reason(skills, best_role)
                )
            
            # Combined reasoning
            personality_reason = recommendations.get("personality_reason", "")
            skill_reason = recommendations.get("skill_match_reason", "")
            reasons = [
                p for p in [personality_reason, skill_reason] if p
            ]
            recommendations["reasoning"] = " ".join(reasons)
        
        return recommendations
    
    def _generate_personality_reason(
        self, 
        personality_type: str,
        ocean_scores: dict[str, float]
    ) -> str:
        """Generate recommendation reason based on personality."""
        o = ocean_scores.get("openness", 50)
        c = ocean_scores.get("conscientiousness", 50)
        e = ocean_scores.get("extraversion", 50)
        a = ocean_scores.get("agreeableness", 50)
        s = ocean_scores.get("emotional_stability", 50)
        
        reasons = []
        
        if personality_type == "The Visionary":
            reasons.append("Strong creative thinking evident from high openness")
        elif personality_type == "The Leader":
            reasons.append("Natural leadership qualities with high extraversion and conscientiousness")
        elif personality_type == "The Collaborator":
            reasons.append("Strong team player with excellent empathy scores")
        elif personality_type == "The Analyst":
            reasons.append("Logical approach with strong analytical capabilities")
        elif personality_type == "The Organizer":
            reasons.append("Highly reliable with exceptional execution skills")
        
        return reasons[0] if reasons else "Balanced personality profile"
    
    def _generate_skill_reason(self, skills: list[str], role: str) -> str:
        """Generate recommendation reason based on skills."""
        if not skills:
            return ""
        
        tech_skills = [s for s in skills if len(s) < 20]  # Usually technical
        if not tech_skills:
            return f"Relevant background experience detected"
        
        skill_str = ", ".join(tech_skills[:3])
        return f"Strong technical skills ({skill_str}) align well with {role}"
    
    def calculate_team_fit(
        self,
        candidate_personality: str,
        team_personalities: list[str],
        candidate_ocean: dict[str, float],
        team_oceans: list[dict[str, float]]
    ) -> dict[str, Any]:
        """
        Calculate how well candidate fits with team using embedding distance.
        
        Args:
            candidate_personality: Candidate's personality type
            team_personalities: List of team member personality types
            candidate_ocean: Candidate's OCEAN scores
            team_oceans: List of team members' OCEAN scores
        
        Returns:
            Team fit analysis with scores and dynamics
        """
        result = {
            "team_fit_score": 0,
            "fit_explanation": "",
            "team_dynamics_impact": "",
            "personality_balance": {}
        }
        
        if not team_personalities:
            result["team_fit_score"] = 75
            result["fit_explanation"] = "Candidate would start fresh team with clean slate"
            return result
        
        # Calculate personality diversity
        unique_types = len(set(team_personalities + [candidate_personality]))
        result["personality_balance"]["diversity_score"] = min(
            100, unique_types * 20
        )
        
        # Calculate OCEAN alignment
        if team_oceans:
            alignment_scores = []
            for team_ocean in team_oceans:
                alignment = self._calculate_ocean_alignment(
                    candidate_ocean, 
                    team_ocean
                )
                alignment_scores.append(alignment)
            
            avg_alignment = sum(alignment_scores) / len(alignment_scores)
            result["team_fit_score"] = int(avg_alignment)
        
        # Generate dynamics explanation
        if unique_types >= 4:
            result["team_dynamics_impact"] = "Strong diversity - complementary skills and perspectives"
        elif unique_types >= 3:
            result["team_dynamics_impact"] = "Good balance - multiple viewpoints"
        elif unique_types == 2:
            result["team_dynamics_impact"] = "Potential dynamic - similar approaches"
        else:
            result["team_dynamics_impact"] = "High similarity - aligned thinking"
        
        result["fit_explanation"] = (
            f"Candidate with {candidate_personality} personality would bring "
            + result["team_dynamics_impact"].lower()
        )
        
        return result
    
    def _calculate_ocean_alignment(
        self,
        ocean1: dict[str, float],
        ocean2: dict[str, float]
    ) -> float:
        """
        Calculate similarity between two OCEAN profiles (0-100).
        Lower difference = higher alignment.
        """
        differences = [
            abs(ocean1.get(trait, 50) - ocean2.get(trait, 50))
            for trait in ["openness", "conscientiousness", "extraversion", 
                         "agreeableness", "emotional_stability"]
        ]
        
        avg_difference = sum(differences) / len(differences)
        alignment = max(0, 100 - avg_difference)  # Convert to percentage
        return alignment
    
    def generate_candidate_embedding(self, candidate_profile: dict) -> list | None:
        """
        Generate embedding for candidate profile using sentence transformers.
        Useful for similarity matching across candidates.
        """
        if not self.model:
            return None
        
        # Create text representation of candidate
        personality = candidate_profile.get("personality_type", "")
        skills_text = " ".join(
            candidate_profile.get("skills", [])[:5]
        )
        ocean_text = ", ".join([
            f"{k}={v}"
            for k, v in candidate_profile.get("ocean_scores", {}).items()
        ])
        
        profile_text = f"{personality}. Skills: {skills_text}. Profile: {ocean_text}"
        
        try:
            embedding = self.model.encode(profile_text, convert_to_tensor=False)
            return embedding.tolist() if hasattr(embedding, 'tolist') else embedding
        except Exception:
            return None
    
    def find_similar_candidates(
        self,
        target_candidate: dict,
        candidate_pool: list[dict],
        top_n: int = 3
    ) -> list[tuple[dict, float]]:
        """
        Find similar candidates from history using embeddings.
        Useful for pattern matching and recommendations.
        """
        if not self.model or not candidate_pool:
            return []
        
        target_embedding = self.generate_candidate_embedding(target_candidate)
        if target_embedding is None:
            return []
        
        similarities = []
        for candidate in candidate_pool:
            candidate_embedding = self.generate_candidate_embedding(candidate)
            if candidate_embedding is None:
                continue
            
            # Calculate cosine similarity
            similarity = self._cosine_similarity(
                target_embedding, 
                candidate_embedding
            )
            similarities.append((candidate, similarity))
        
        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_n]
    
    @staticmethod
    def _cosine_similarity(vec1: list, vec2: list) -> float:
        """Calculate cosine similarity between two vectors."""
        try:
            import math
            
            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            magnitude1 = math.sqrt(sum(a * a for a in vec1))
            magnitude2 = math.sqrt(sum(b * b for b in vec2))
            
            if magnitude1 == 0 or magnitude2 == 0:
                return 0.0
            
            return dot_product / (magnitude1 * magnitude2)
        except Exception:
            return 0.0
