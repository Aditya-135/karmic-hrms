from __future__ import annotations

import csv
import logging
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

import numpy as np

from resume_agent.services.embeddings import (
    EmbeddingBackend,
    SentenceTransformersBackend,
    TokenOverlapBackend,
    cosine_sim_matrix,
    join_skills,
)

logger = logging.getLogger("resume_agent")

# ---------------------------------------------------------------------------
# Public result type
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class JobRolePrediction:
    role: str
    confidence: float          # calibrated probability [0, 1]
    backend: str
    top_alternatives: list     # list of {"role": str, "confidence": float}


# ---------------------------------------------------------------------------
# Classifier implementations
# ---------------------------------------------------------------------------

class _PrototypeClassifier:
    """
    Prototype-network classifier.

    For each unique role computes a centroid embedding (mean over all training
    examples for that role).  Prediction uses softmax over cosine similarities
    to centroids, giving calibrated class probabilities without requiring many
    examples per class — works even with 1 example per role.
    """

    _TEMPERATURE: float = 0.5   # lower → sharper probability distribution

    def __init__(self, centroids: dict[str, np.ndarray], backend_name: str) -> None:
        self._centroids = centroids          # role → (d,) unit-norm embedding
        self._backend_name = backend_name
        self._roles = list(centroids.keys())
        self._centroid_matrix = np.stack([centroids[r] for r in self._roles])  # (R, d)

    def predict(self, query_emb: np.ndarray, top_k: int = 3) -> tuple[str, float, list[dict]]:
        """Returns (top_role, top_probability, alternatives)."""
        sims = self._centroid_matrix @ query_emb          # (R,)
        scaled = sims / self._TEMPERATURE
        exp = np.exp(scaled - scaled.max())               # numerical stability
        probs = exp / exp.sum()                           # (R,)

        order = np.argsort(probs)[::-1]
        top_role = self._roles[int(order[0])]
        top_conf = float(probs[int(order[0])])

        alternatives = [
            {"role": self._roles[int(i)], "confidence": round(float(probs[int(i)]), 3)}
            for i in order[1 : top_k + 1]
        ]
        return top_role, round(top_conf, 3), alternatives

    @property
    def backend_name(self) -> str:
        return f"prototype+{self._backend_name}"


class _SklearnClassifier:
    """
    Logistic-regression classifier trained on SBERT embeddings.

    Training uses skill-dropout augmentation to handle the typical case where
    the dataset has only 1–2 examples per role.
    """

    _N_AUGMENTS: int = 8       # synthetic examples generated per original row
    _MIN_KEEP_RATIO: float = 0.6
    _MAX_KEEP_RATIO: float = 0.9

    def __init__(self, clf, encoder, backend_name: str) -> None:  # type: ignore[type-arg]
        self._clf = clf
        self._encoder = encoder
        self._backend_name = backend_name

    def predict(self, query_emb: np.ndarray, top_k: int = 3) -> tuple[str, float, list[dict]]:
        proba = self._clf.predict_proba(query_emb.reshape(1, -1))[0]  # (n_classes,)
        order = np.argsort(proba)[::-1]
        labels = self._encoder.inverse_transform(order)

        top_role = str(labels[0])
        top_conf = round(float(proba[int(order[0])]), 3)
        alternatives = [
            {"role": str(labels[i]), "confidence": round(float(proba[int(order[i])]), 3)}
            for i in range(1, min(top_k + 1, len(labels)))
        ]
        return top_role, top_conf, alternatives

    @property
    def backend_name(self) -> str:
        return f"sklearn-lr+{self._backend_name}"

    @classmethod
    def train(
        cls,
        roles: list[str],
        samples: list[str],
        embedding_backend: EmbeddingBackend,
        rng_seed: int = 42,
    ) -> "_SklearnClassifier":
        from sklearn.linear_model import LogisticRegression
        from sklearn.preprocessing import LabelEncoder

        aug_roles, aug_samples = cls._augment(roles, samples, rng_seed)
        logger.info(
            "Training job-role classifier: %d original → %d augmented examples, %d classes",
            len(roles), len(aug_samples), len(set(aug_roles)),
        )

        embeddings = embedding_backend.encode(aug_samples)   # (N, d)
        encoder = LabelEncoder()
        y = encoder.fit_transform(aug_roles)

        clf = LogisticRegression(
            max_iter=2000,
            C=1.0,
            solver="lbfgs",
            n_jobs=-1,
        )
        clf.fit(embeddings, y)
        return cls(clf, encoder, embedding_backend.name)

    @classmethod
    def _augment(
        cls,
        roles: list[str],
        samples: list[str],
        seed: int,
    ) -> tuple[list[str], list[str]]:
        """Skill-dropout augmentation: randomly drop skills to create new training rows."""
        rng = np.random.default_rng(seed)
        aug_roles: list[str] = list(roles)
        aug_samples: list[str] = list(samples)

        for role, skills_text in zip(roles, samples):
            tokens = [t for t in skills_text.split() if t]
            if len(tokens) < 3:
                continue
            for _ in range(cls._N_AUGMENTS):
                keep_n = max(2, int(len(tokens) * rng.uniform(
                    cls._MIN_KEEP_RATIO, cls._MAX_KEEP_RATIO
                )))
                subset = rng.choice(tokens, size=keep_n, replace=False).tolist()
                aug_roles.append(role)
                aug_samples.append(" ".join(subset))

        return aug_roles, aug_samples


# ---------------------------------------------------------------------------
# Classifier loading / caching
# ---------------------------------------------------------------------------

@lru_cache(maxsize=4)
def _load_classifier(
    dataset_path: Path,
    model_name: str,
) -> tuple[_SklearnClassifier | _PrototypeClassifier, EmbeddingBackend]:
    """
    Build and cache the best available classifier for the given dataset.

    Priority:
    1. Load pre-trained sklearn model from disk (if up-to-date).
    2. Train a new sklearn LR classifier and persist it.
    3. Fall back to the prototype classifier (always works, no sklearn needed).
    """
    roles, samples = _load_role_dataset(dataset_path)
    backend = _get_embedding_backend(model_name)

    model_path = dataset_path.parent / "job_role_classifier.pkl"

    # --- sklearn path ---
    try:
        import joblib
        from sklearn.linear_model import LogisticRegression  # noqa: F401 – availability check

        if _is_model_fresh(model_path, dataset_path):
            saved = joblib.load(model_path)
            clf = _SklearnClassifier(saved["clf"], saved["encoder"], backend.name)
            logger.info("Loaded pre-trained job-role classifier from %s", model_path)
        else:
            clf = _SklearnClassifier.train(roles, samples, backend)
            joblib.dump({"clf": clf._clf, "encoder": clf._encoder}, model_path)
            logger.info("Trained and saved job-role classifier to %s", model_path)

        return clf, backend

    except Exception as exc:
        logger.warning("sklearn classifier unavailable (%s); using prototype fallback", exc)

    # --- prototype fallback ---
    centroids = _build_centroids(roles, samples, backend)
    proto = _PrototypeClassifier(centroids, backend.name)
    return proto, backend


def _is_model_fresh(model_path: Path, dataset_path: Path) -> bool:
    """True when a saved model exists and is newer than the dataset CSV."""
    return (
        model_path.exists()
        and model_path.stat().st_mtime > dataset_path.stat().st_mtime
    )


def _build_centroids(
    roles: list[str],
    samples: list[str],
    backend: EmbeddingBackend,
) -> dict[str, np.ndarray]:
    """
    Encode all samples and average embeddings per unique role.
    When a role has only one example its centroid is that embedding.
    """
    all_emb = backend.encode(samples)           # (N, d)  — already L2-normalised
    centroids: dict[str, list[np.ndarray]] = {}
    for role, emb in zip(roles, all_emb):
        centroids.setdefault(role, []).append(emb)

    result: dict[str, np.ndarray] = {}
    for role, embs in centroids.items():
        centroid = np.mean(embs, axis=0)
        norm = float(np.linalg.norm(centroid))
        result[role] = centroid / norm if norm > 0 else centroid
    return result


@lru_cache(maxsize=8)
def _load_role_dataset(dataset_path: Path) -> tuple[list[str], list[str]]:
    if not dataset_path.exists():
        logger.warning("Job role dataset not found at %s. Using default dataset.", dataset_path)
        return _generate_default_dataset()

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
    logger.info("Loaded %d rows / %d unique roles from %s", len(roles), len(set(roles)), dataset_path)
    return roles, samples


def _generate_default_dataset() -> tuple[list[str], list[str]]:
    """
    Generate a default job role dataset when no file is available.
    Returns a balanced set of common roles with representative skills.
    """
    default_dataset = {
        "Software Engineer": "Python Java JavaScript C++ SQL Docker Kubernetes Git REST APIs",
        "Senior Software Engineer": "System Design Architecture Leadership Python Java JavaScript Microservices Cloud AWS",
        "Data Scientist": "Python R Machine Learning TensorFlow PyTorch SQL Statistics Data Analysis Pandas NumPy",
        "DevOps Engineer": "Docker Kubernetes Jenkins CI/CD AWS Azure Cloud Infrastructure Linux Python Bash",
        "Product Manager": "Product Strategy Requirements Analysis User Research Data Analysis Communication Leadership",
        "Project Manager": "Planning Scheduling Risk Management Stakeholder Communication Time Management Budget",
        "QA Engineer": "Testing Automation Selenium Python JavaScript Test Strategy Bug Tracking",
        "UI/UX Designer": "Figma Adobe XD Wireframing Prototyping User Research CSS HTML Design Systems",
        "Business Analyst": "Requirements Analysis SQL Data Analysis stakeholder Communication Documentation",
        "Full Stack Developer": "Python JavaScript React Node.js SQL MongoDB Docker Git REST APIs",
        "Backend Developer": "Python Java C# SQL Microservices REST APIs Docker Cloud Databases",
        "Frontend Developer": "JavaScript React Vue Angular HTML CSS TypeScript REST APIs",
        "Mobile Developer": "Swift Kotlin Java React Native Flutter Xcode Android Studio",
        "Machine Learning Engineer": "Python TensorFlow PyTorch Statistics SQL Machine Learning Deep Learning Data Preprocessing",
        "Data Engineer": "Python SQL Spark Hadoop Data Warehousing ETL Cloud Databases",
    }
    
    roles = []
    samples = []
    for role, skills in default_dataset.items():
        roles.append(role)
        samples.append(skills)
    
    logger.info("Generated default dataset with %d roles", len(roles))
    return roles, samples


@lru_cache(maxsize=2)
def _get_embedding_backend(model_name: str) -> EmbeddingBackend:
    try:
        return SentenceTransformersBackend(model_name)
    except Exception:
        return TokenOverlapBackend()


# ---------------------------------------------------------------------------
# Public agent
# ---------------------------------------------------------------------------

@dataclass(slots=True)
class JobRoleDetectionAgent:
    dataset_path: Path
    model_name: str = "all-MiniLM-L6-v2"

    def predict(self, skills: list[str] | None) -> JobRolePrediction:
        skills_text = join_skills(skills)
        if not skills_text:
            return JobRolePrediction(
                role="Unknown", confidence=0.0, backend="none", top_alternatives=[]
            )

        classifier, backend = _load_classifier(self.dataset_path, self.model_name)

        # Encode the candidate's skills.
        query_emb = backend.encode([skills_text])[0]   # (d,)

        top_role, top_conf, alternatives = classifier.predict(query_emb, top_k=3)

        return JobRolePrediction(
            role=top_role,
            confidence=top_conf,
            backend=classifier.backend_name,
            top_alternatives=alternatives,
        )
