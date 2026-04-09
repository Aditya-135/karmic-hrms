from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Iterable

import numpy as np


@dataclass(frozen=True, slots=True)
class EmbeddingBackend:
    name: str

    def encode(self, texts: list[str]) -> np.ndarray:  # (n, d)
        raise NotImplementedError


class SentenceTransformersBackend(EmbeddingBackend):
    def __init__(self, model_name: str) -> None:
        # EmbeddingBackend is a frozen=True slots=True dataclass. In Python 3.10,
        # the slots class-recreation mechanism breaks super().__init__() and any
        # self.x = ... assignment (inherited frozen __setattr__ calls a broken super()).
        # Use object.__setattr__ directly to bypass both issues.
        object.__setattr__(self, "name", f"sentence-transformers:{model_name}")
        from sentence_transformers import SentenceTransformer  # lazy import

        # Offline-safe: never download models at runtime.
        # If the model isn't already cached locally, this will raise and we fall back.
        object.__setattr__(self, "_model", SentenceTransformer(model_name, local_files_only=True))

    def encode(self, texts: list[str]) -> np.ndarray:
        emb = self._model.encode(texts, normalize_embeddings=True)
        return np.asarray(emb, dtype=np.float32)


class TokenOverlapBackend(EmbeddingBackend):
    """
    Offline-safe fallback when embedding model can't be loaded/downloaded.
    Produces unit-length vectors in token space for cosine similarity.
    """

    def __init__(self) -> None:
        object.__setattr__(self, "name", "token-overlap")

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return [t for t in "".join(ch.lower() if ch.isalnum() else " " for ch in text).split() if t]

    def encode(self, texts: list[str]) -> np.ndarray:
        token_lists = [self._tokenize(t) for t in texts]
        vocab: dict[str, int] = {}
        for toks in token_lists:
            for tok in toks:
                if tok not in vocab:
                    vocab[tok] = len(vocab)

        mat = np.zeros((len(texts), max(1, len(vocab))), dtype=np.float32)
        for i, toks in enumerate(token_lists):
            for tok in toks:
                mat[i, vocab[tok]] += 1.0
            norm = float(np.linalg.norm(mat[i]))
            if norm > 0:
                mat[i] /= norm
        return mat


@lru_cache(maxsize=1)
def get_embedding_backend(preferred_model: str = "all-MiniLM-L6-v2") -> EmbeddingBackend:
    """
    Returns a best-effort embedding backend.

    - Prefers SentenceTransformers if available and load succeeds.
    - Falls back to deterministic token-overlap vectors for offline use.
    """
    try:
        return SentenceTransformersBackend(preferred_model)
    except Exception:
        return TokenOverlapBackend()


def cosine_sim_matrix(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """
    Compute cosine similarity matrix between rows of a and rows of b.
    Assumes embeddings are already normalized; works for the token backend too.
    """
    if a.ndim != 2 or b.ndim != 2:
        raise ValueError("Expected 2D arrays for cosine similarity.")
    if a.shape[1] != b.shape[1]:
        # Token backend builds vocab per encode-call; require same vocab.
        raise ValueError("Embedding dimensions mismatch. Encode with a shared backend call.")
    return a @ b.T


def join_skills(skills: Iterable[str] | None) -> str:
    if not skills:
        return ""
    return " ".join(s.strip() for s in skills if s and s.strip())
