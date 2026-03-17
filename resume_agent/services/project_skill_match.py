from __future__ import annotations

from dataclasses import dataclass

from resume_agent.services.embeddings import get_embedding_backend, join_skills


@dataclass(frozen=True, slots=True)
class ProjectSkillMatchResult:
    match_score: float  # 0..1
    missing_skills: list[str]
    backend: str


@dataclass(slots=True)
class ProjectSkillMatchAgent:
    model_name: str = "all-MiniLM-L6-v2"

    def match(self, employee_skills: list[str] | None, project_skills_required: list[str] | None) -> ProjectSkillMatchResult:
        employee_text = join_skills(employee_skills)
        project_text = join_skills(project_skills_required)

        missing = sorted(list(set(project_skills_required or []) - set(employee_skills or [])))
        if not employee_text or not project_text:
            return ProjectSkillMatchResult(match_score=0.0, missing_skills=missing, backend="none")

        backend = get_embedding_backend(self.model_name)
        # Encode both together to keep fallback backend dimensions consistent.
        emb = backend.encode([employee_text, project_text])
        # Embeddings are normalized; cosine similarity is dot product.
        sim = float(emb[0] @ emb[1])
        score = max(0.0, min(1.0, (sim + 1.0) / 2.0))
        return ProjectSkillMatchResult(match_score=score, missing_skills=missing, backend=backend.name)
