from __future__ import annotations

import csv
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import numpy as np

from resume_agent.services.embeddings import cosine_sim_matrix, get_embedding_backend, join_skills


@dataclass(frozen=True, slots=True)
class JobRolePrediction:
    role: str
    confidence: float  # 0..1
    backend: str


@dataclass(slots=True)
class JobRoleDetectionAgent:
    dataset_path: Path
    model_name: str = "all-MiniLM-L6-v2"

    def predict(self, skills: list[str] | None) -> JobRolePrediction:
        skills_text = join_skills(skills)
        if not skills_text:
            return JobRolePrediction(role="Unknown", confidence=0.0, backend="none")

        roles, samples = _load_role_dataset(self.dataset_path)
        backend = get_embedding_backend(self.model_name)

        # Important: encode employee + samples together for shared vocab in fallback backend.
        embeddings = backend.encode([skills_text] + samples)
        emp = embeddings[0:1]
        refs = embeddings[1:]

        sims = cosine_sim_matrix(emp, refs)[0]  # (n_samples,)
        best_idx = int(np.argmax(sims))
        best_role = roles[best_idx]

        # Map cosine similarity (-1..1) -> confidence 0..1 (practical range [0..1] for our backends)
        best_sim = float(sims[best_idx])
        confidence = max(0.0, min(1.0, (best_sim + 1.0) / 2.0))
        return JobRolePrediction(role=best_role, confidence=confidence, backend=backend.name)


@lru_cache(maxsize=8)
def _load_role_dataset(dataset_path: Path) -> tuple[list[str], list[str]]:
    """
    Loads role dataset with columns: skills, role
    Returns aligned lists: roles[i], skills_text_samples[i]
    """
    if not dataset_path.exists():
        raise FileNotFoundError(f"Job role dataset not found: {dataset_path}")

    roles: list[str] = []
    samples: list[str] = []
    with dataset_path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames or "skills" not in reader.fieldnames or "role" not in reader.fieldnames:
            raise ValueError("Dataset must contain 'skills' and 'role' columns.")
        for row in reader:
            role = (row.get("role") or "").strip()
            skills = (row.get("skills") or "").strip()
            if role and skills:
                roles.append(role)
                samples.append(skills)

    if not roles:
        raise ValueError("Job role dataset is empty or invalid.")
    return roles, samples
