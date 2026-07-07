"""
AI Interview Platform — Python AI Service
FastAPI application for resume parsing, ATS scoring, and AI-powered analysis.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import json
import re
import logging
import httpx
import fitz  # PyMuPDF
from google import genai
from google.genai import types

load_dotenv()

logger = logging.getLogger("python-ai")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="AI Interview Platform — Python AI Service",
    description="Resume parsing, ATS scoring, and Gemini-powered analysis",
    version="1.0.0",
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("SERVER_URL", "http://localhost:5000"),
        os.getenv("CLIENT_URL", "http://localhost:5173"),
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Gemini Client ──
gemini_api_key = os.getenv("GEMINI_API_KEY", "")
gemini_client = genai.Client(api_key=gemini_api_key) if gemini_api_key else None


# ── Pydantic Models ──
class ParseResumeRequest(BaseModel):
    resumeUrl: str


class ParseResumeResponse(BaseModel):
    extractedText: str
    sections: dict


class AnalyzeResumeRequest(BaseModel):
    resumeText: str
    jobDescription: str
    requiredSkills: list[str]


class AnalyzeResumeResponse(BaseModel):
    ats_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]


class EvaluateAnswerRequest(BaseModel):
    question: str
    expectedAnswer: str
    candidateAnswer: str


class EvaluateAnswerResponse(BaseModel):
    technical_score: int
    communication_score: int
    confidence_score: int
    grammar_score: int
    overall_score: int
    feedback: str


# ── Helpers ──

def _extract_sections(text: str) -> dict:
    """
    Extract resume sections heuristically by looking for common headings.
    Returns dict with keys: skills, education, experience, projects, certifications.
    """
    sections = {
        "skills": [],
        "education": [],
        "experience": [],
        "projects": [],
        "certifications": [],
    }

    # Patterns for section headers (case-insensitive)
    section_patterns = {
        "skills": r"(?i)(?:technical\s+)?skills|core\s+competencies|technologies",
        "education": r"(?i)education|academic|qualifications|degrees",
        "experience": r"(?i)(?:work\s+)?experience|employment|professional\s+background|career\s+history",
        "projects": r"(?i)projects|portfolio|notable\s+work",
        "certifications": r"(?i)certifications?|licenses?|accreditations?",
    }

    lines = text.split("\n")
    current_section = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Check if this line is a section header
        matched_section = None
        for section_key, pattern in section_patterns.items():
            if re.match(pattern, stripped):
                matched_section = section_key
                break

        if matched_section:
            current_section = matched_section
            continue

        # If we're inside a known section, collect lines
        if current_section and current_section in sections:
            sections[current_section].append(stripped)

    return sections


def _strip_fences(raw: str) -> str:
    """Strip markdown code fences from LLM output."""
    cleaned = raw.strip()
    # Remove ```json ... ``` or ``` ... ```
    cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned)
    cleaned = re.sub(r"\n?```\s*$", "", cleaned)
    return cleaned.strip()


# ── Health Check ──

@app.get("/healthz")
async def healthz():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "python-ai",
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "AI Interview Platform — Python AI Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/healthz",
            "parse_resume": "POST /parse-resume",
            "analyze_resume": "POST /analyze-resume",
        },
    }


# ── POST /parse-resume ──

@app.post("/parse-resume", response_model=ParseResumeResponse)
async def parse_resume(body: ParseResumeRequest):
    """
    Download a PDF from the given URL, extract text with PyMuPDF,
    and pull sections for skills/education/experience/projects/certifications.
    """
    try:
        # 1. Download the PDF
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as http:
            resp = await http.get(body.resumeUrl)
            resp.raise_for_status()
            pdf_bytes = resp.content
    except httpx.HTTPError as e:
        logger.error(f"Failed to download PDF from {body.resumeUrl}: {e}")
        raise HTTPException(
            status_code=422,
            detail={"error": {"code": "PARSE_FAILED", "message": f"Failed to download PDF: {str(e)}"}},
        )

    # 2. Extract text with PyMuPDF
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n"
        doc.close()

        full_text = full_text.strip()

        if not full_text:
            raise ValueError("Extracted text is empty — possibly a scanned image PDF.")

    except Exception as e:
        logger.error(f"PyMuPDF extraction failed: {e}")
        raise HTTPException(
            status_code=422,
            detail={"error": {"code": "PARSE_FAILED", "message": f"Could not extract text from PDF: {str(e)}"}},
        )

    # 3. Extract sections
    sections = _extract_sections(full_text)

    return ParseResumeResponse(extractedText=full_text, sections=sections)


# ── POST /analyze-resume ──

@app.post("/analyze-resume", response_model=AnalyzeResumeResponse)
async def analyze_resume(body: AnalyzeResumeRequest):
    """
    Use Google Gemini to analyze a resume against a job description.
    Returns ATS score, matched/missing skills, strengths, weaknesses, recommendations.
    """
    if not gemini_client:
        raise HTTPException(
            status_code=502,
            detail={"error": {"code": "AI_UNAVAILABLE", "message": "Gemini API key is not configured."}},
        )

    skills_str = ", ".join(body.requiredSkills)

    prompt = (
        f"You are an expert ATS (Applicant Tracking System) analyzer.\n\n"
        f"## Resume Text:\n{body.resumeText}\n\n"
        f"## Job Description:\n{body.jobDescription}\n\n"
        f"## Required Skills:\n{skills_str}\n\n"
        f"Analyze how well this resume matches the job description and required skills. "
        f"Consider skills match, experience relevance, education, and overall fit."
    )

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": AnalyzeResumeResponse
            }
        )

        result_json = response.text or ""
        result = json.loads(result_json)

        return AnalyzeResumeResponse(
            ats_score=int(result["ats_score"]),
            matched_skills=result["matched_skills"],
            missing_skills=result["missing_skills"],
            strengths=result["strengths"],
            weaknesses=result["weaknesses"],
            recommendations=result["recommendations"],
        )
    except Exception as e:
        logger.error(f"Gemini API call or response parsing failed: {e}")
        raise HTTPException(
            status_code=502,
            detail={"error": {"code": "AI_ERROR", "message": f"Gemini API error: {str(e)}"}},
        )


# ── POST /evaluate-answer ──

@app.post("/evaluate-answer", response_model=EvaluateAnswerResponse)
async def evaluate_answer(body: EvaluateAnswerRequest):
    """
    Use Google Gemini to evaluate a candidate's answer against the question and expected answer.
    Returns technical, communication, confidence, grammar, and overall scores, plus feedback.
    """
    if not gemini_client:
        raise HTTPException(
            status_code=502,
            detail={"error": {"code": "AI_UNAVAILABLE", "message": "Gemini API key is not configured."}},
        )

    prompt = (
        f"You are an expert technical interviewer evaluating a candidate's response to an interview question.\n\n"
        f"## Question:\n{body.question}\n\n"
        f"## Expected/Sample Answer:\n{body.expectedAnswer}\n\n"
        f"## Candidate's Answer:\n{body.candidateAnswer}\n\n"
        f"Evaluate the candidate's answer. Provide integer scores between 0 and 10 for technical depth, "
        f"communication quality, confidence level, grammar/clarity, and overall match."
    )

    retries = 5
    delay = 3.0
    response = None

    for i in range(retries):
        try:
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": EvaluateAnswerResponse
                }
            )
            break
        except Exception as e:
            if "429" in str(e) and i < retries - 1:
                logger.warning(f"Gemini API rate limit (429) hit during evaluation. Retrying in {delay}s...")
                import time
                time.sleep(delay)
                delay *= 2.0
            else:
                logger.error(f"Gemini API call failed: {e}")
                raise HTTPException(
                    status_code=502,
                    detail={"error": {"code": "AI_ERROR", "message": f"Gemini API error: {str(e)}"}},
                )

    try:
        result_json = response.text or ""
        result = json.loads(result_json)

        return EvaluateAnswerResponse(
            technical_score=int(result["technical_score"]),
            communication_score=int(result["communication_score"]),
            confidence_score=int(result["confidence_score"]),
            grammar_score=int(result["grammar_score"]),
            overall_score=int(result["overall_score"]),
            feedback=str(result["feedback"]),
        )
    except Exception as e:
        logger.error(f"Failed to parse Gemini evaluation JSON response: {e}")
        raise HTTPException(
            status_code=502,
            detail={"error": {"code": "PARSE_ERROR", "message": f"Failed to parse Gemini response: {str(e)}"}},
        )
