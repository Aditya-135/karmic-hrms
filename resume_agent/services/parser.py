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


def extract_candidate_profile(text: str) -> dict:
    """Extract common candidate profile fields from resume text."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    emails = _unique(re.findall(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", text, flags=re.I))
    phones = _extract_phone_numbers(text)
    links = _extract_links(text)
    education = _extract_resume_section(
        lines,
        {
            "education",
            "academic background",
            "academic qualifications",
            "qualification",
            "qualifications",
        },
    )
    if not education:
        education = _scan_education_lines(lines)

    certifications = _extract_resume_section(
        lines,
        {"certifications", "certification", "licenses", "licences", "achievements"},
    )
    experience = _extract_experience(text, lines)
    location = _extract_location(lines)

    return {
        "candidate_name": extract_candidate_name(text),
        "email": emails[0] if emails else "",
        "phone": phones[0] if phones else "",
        "education": education[:6],
        "location": location,
        "links": links[:6],
        "experience": experience,
        "certifications": certifications[:6],
        "other_information": {
            "emails": emails,
            "phones": phones,
            "links": links,
        },
    }


def _unique(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        normalized = item.strip().strip(".,;:|")
        key = normalized.lower()
        if normalized and key not in seen:
            seen.add(key)
            result.append(normalized)
    return result


def _extract_phone_numbers(text: str) -> list[str]:
    candidates = re.findall(
        r"(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{3,5}",
        text,
    )
    phones: list[str] = []
    for candidate in candidates:
        digits = re.sub(r"\D", "", candidate)
        if 10 <= len(digits) <= 15:
            phones.append(candidate.strip().strip(".,;:|"))
    return _unique(phones)


def _extract_links(text: str) -> list[str]:
    explicit = re.findall(r"https?://[^\s,;()<>]+|www\.[^\s,;()<>]+", text, flags=re.I)
    social = re.findall(
        r"(?:linkedin\.com/[^\s,;()<>]+|github\.com/[^\s,;()<>]+|gitlab\.com/[^\s,;()<>]+)",
        text,
        flags=re.I,
    )
    return _unique(explicit + social)


def _extract_resume_section(lines: list[str], headings: set[str]) -> list[str]:
    section: list[str] = []
    capture = False
    stop_words = {
        "experience",
        "work experience",
        "employment",
        "projects",
        "skills",
        "technical skills",
        "summary",
        "profile",
        "objective",
        "certifications",
        "certification",
        "achievements",
        "languages",
        "interests",
    }

    for line in lines:
        normalized = re.sub(r"[^a-z ]", "", line.lower()).strip()
        if normalized in headings:
            capture = True
            continue
        if capture and normalized in stop_words:
            break
        if capture and len(line) <= 140:
            section.append(line)

    return section


def _scan_education_lines(lines: list[str]) -> list[str]:
    education_keywords = re.compile(
        r"\b("
        r"bachelor|master|phd|doctorate|diploma|degree|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?|"
        r"b\.?sc|m\.?sc|bca|mca|mba|university|college|institute|school|cgpa|gpa"
        r")\b",
        flags=re.I,
    )
    return [line for line in lines if education_keywords.search(line)][:6]


def _extract_experience(text: str, lines: list[str]) -> str:
    patterns = [
        r"(?:total\s+)?experience\s*[:\-]?\s*([^\n.]{1,60})",
        r"(\d+(?:\.\d+)?\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience)",
        r"(\d+(?:\.\d+)?\+?\s*(?:years?|yrs?)\s+in\s+[^\n.]{1,40})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.I)
        if match:
            return match.group(1).strip().strip(".,;:")

    section = _extract_resume_section(lines, {"experience", "work experience", "employment"})
    return section[0] if section else ""


def _extract_location(lines: list[str]) -> str:
    contact_lines = lines[:10]
    location_keywords = re.compile(
        r"\b("
        r"india|usa|united states|uk|canada|australia|remote|mumbai|delhi|bengaluru|bangalore|"
        r"hyderabad|pune|chennai|kolkata|ahmedabad|noida|gurgaon|new york|london|san francisco"
        r")\b",
        flags=re.I,
    )
    for line in contact_lines:
        parts = re.split(r"\s*[|•,]\s*", line)
        for part in parts:
            if "@" in part or re.search(r"\d{10,}", re.sub(r"\D", "", part)):
                continue
            if location_keywords.search(part):
                return part.strip()
    return ""
