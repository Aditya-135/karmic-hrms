from __future__ import annotations

import io
import re
from typing import Final

from fastapi import HTTPException, UploadFile, status


SUPPORTED_TYPES: Final[set[str]] = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


async def extract_text_from_upload(file: UploadFile) -> str:
    content_type = (file.content_type or "").strip().lower()
    filename = (file.filename or "").lower()

    if content_type not in SUPPORTED_TYPES and not filename.endswith((".pdf", ".docx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Only PDF and DOCX are accepted.",
        )

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
        if filename.endswith(".pdf") or content_type == "application/pdf":
            text = _extract_pdf_text(raw_bytes)
        else:
            text = _extract_docx_text(raw_bytes)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse resume file: {exc}",
        ) from exc

    clean_text = _clean_text(text)
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text found in the uploaded resume.",
        )

    return clean_text


def _extract_pdf_text(raw_bytes: bytes) -> str:
    try:
        import pdfplumber
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF parser dependency missing. Install pdfplumber.",
        ) from exc

    lines: list[str] = []
    with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
        for page in pdf.pages:
            lines.append(page.extract_text() or "")
    return "\n".join(lines)


def _extract_docx_text(raw_bytes: bytes) -> str:
    try:
        import docx
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DOCX parser dependency missing. Install python-docx.",
        ) from exc

    document = docx.Document(io.BytesIO(raw_bytes))
    return "\n".join(paragraph.text for paragraph in document.paragraphs)


def _clean_text(text: str) -> str:
    normalized = text.replace("\x00", " ")
    normalized = re.sub(r"[ \t]+", " ", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def extract_candidate_name(text: str) -> str:
    """
    Extract candidate name from resume text.
    Typically the first 1-3 words on the first line or first capitalized line.
    
    Args:
        text: Cleaned resume text
    
    Returns:
        Extracted candidate name or empty string
    """
    if not text:
        return ""
    
    lines = text.split("\n")
    
    # Try first few lines that contain capitalized text
    for line in lines[:5]:
        line = line.strip()
        if not line or len(line) < 3:
            continue
        
        # Look for patterns: "FirstName LastName", "FirstName M. LastName", etc.
        # Must start with capital letter
        if line[0].isupper():
            # Remove common resume headers/titles
            if any(keyword in line.lower() for keyword in 
                   ["resume", "cv", "curriculum", "vitae", "profile", "summary", "phone", "email"]):
                continue
            
            # Split by space and take first 2-3 words as name
            words = line.split()
            if len(words) >= 1:
                # Filter out email addresses, phone numbers, etc
                name_parts = []
                for word in words[:3]:
                    if "@" in word or word.replace("-", "").isdigit():
                        continue
                    name_parts.append(word.rstrip(".,;:"))
                
                if name_parts:
                    name = " ".join(name_parts).strip()
                    # Ensure it's actually a name (not too long, not all symbols)
                    if 2 <= len(name) <= 50 and name.replace(" ", "").replace("-", "").isalpha():
                        return name
    
    return ""
