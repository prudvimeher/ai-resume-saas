import json
import logging
import os
import tempfile
import time
from pathlib import Path
from typing import Any, cast

import google.generativeai as genai
from google.generativeai.generative_models import GenerativeModel
from google.generativeai.files import delete_file, get_file, upload_file

genai_any = cast(Any, genai)

FALLBACK_RESPONSE = {
    "score": 70,
    "suggestions": ["AI parsing failed, try again"],
}

JSON_PARSE_ERROR_RESPONSE = {
    "score": 0,
    "suggestions": ["Unable to parse AI response. Please try again."],
}
MAX_RESUME_CHARS = 5000
MAX_PDF_BYTES = 10 * 1024 * 1024
logger = logging.getLogger(__name__)


def _get_api_key() -> str | None:
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        return api_key

    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return None

    for line in env_path.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.partition("=")
        if separator and key.strip() == "GEMINI_API_KEY":
            return value.strip().strip('"').strip("'")

    return None


def _clean_json_response(response_text: str) -> str:
    cleaned = response_text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned.removeprefix("```json").strip()
    elif cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```").strip()

    if cleaned.endswith("```"):
        cleaned = cleaned.removesuffix("```").strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        cleaned = cleaned[start : end + 1]

    return cleaned


def _normalize_ai_result(data: dict) -> dict:
    score = data.get("score", FALLBACK_RESPONSE["score"])
    suggestions = data.get("suggestions", FALLBACK_RESPONSE["suggestions"])

    if not isinstance(score, (int, float)):
        score = FALLBACK_RESPONSE["score"]
    score = max(0, min(100, int(score)))

    if not isinstance(suggestions, list):
        suggestions = FALLBACK_RESPONSE["suggestions"]

    return {
        "score": score,
        "suggestions": [str(suggestion) for suggestion in suggestions],
    }


def _build_resume_prompt(resume_text: str | None = None, jd_text: str | None = None) -> str:
    resume_section = ""
    if resume_text:
        resume_section = f"""
Resume text:
{resume_text}
"""
    else:
        resume_section = """
Resume file:
Read the attached PDF resume before scoring it.
"""

    # If JD is provided, build comparison prompt
    if jd_text:
        return f"""
Act as an ATS (Applicant Tracking System) expert and technical recruiter.
Compare the resume against the job description to assess fit and identify improvements.

Job Description:
{jd_text}

Score the resume from 0 to 100 based on:
- ATS match to the job description
- Keyword alignment with JD requirements
- Relevant skills and experience fit
- Overall resume strength for the JD

Output priority (use this order when writing the JSON fields below):
1. score: ATS match score (0-100) for how well the resume matches the job description.
2. suggestions[0]: Keyword gap. List important keywords/skills present in the JD but missing from the resume.
3. suggestions[1-3]: Rewrite suggestions. Provide specific, JD-driven rewrites for the resume (quote the original line and give a revised line).
4. suggestions[4]: Section feedback. Brief, JD-focused feedback for Summary, Skills, and Experience sections.

Return exactly 5 suggestions in the suggestions array, following the order above.
Each suggestion must be specific to the resume and the provided JD. Do not provide generic advice.

Return STRICT JSON only.
Do not include markdown, code fences, explanations, comments, or any text outside JSON.

The JSON must match this exact structure:
{{
  "score": number,
  "suggestions": ["string", "string", "string", "string", "string"]
}}

{resume_section}
"""

    # Resume-only prompt (existing behavior)
    return f"""
Act as a FAANG-level technical recruiter evaluating this resume for a specific tech role.
Infer the most relevant target role from the resume content, then assess how well the resume fits that role.

Score the resume from 0 to 100 based on:
- Skills: relevance, depth, and alignment with the inferred tech role
- Projects: technical impact, complexity, measurable outcomes, and role relevance
- Experience: scope, ownership, business impact, and progression
- Clarity: structure, readability, specificity, and use of metrics

Return exactly 5 suggestions.
Each suggestion must be specific, actionable, and tied to details from the resume.
Do not provide generic advice.

Return STRICT JSON only.
Do not include markdown, code fences, explanations, comments, or any text outside JSON.

The JSON must match this exact structure:
{{
  "score": number,
  "suggestions": ["string", "string", "string", "string", "string"]
}}

{resume_section}
"""


def _parse_ai_response(response_text: str) -> dict:
    logger.info("Raw Gemini response: %s", response_text)

    try:
        cleaned_json = _clean_json_response(response_text)
        if not cleaned_json or not cleaned_json.startswith("{"):
            logger.error("No valid JSON found in response: %s", response_text)
            return JSON_PARSE_ERROR_RESPONSE

        parsed = json.loads(cleaned_json)
        if not isinstance(parsed, dict):
            logger.error("Parsed Gemini response is not a JSON object: %s", response_text)
            return JSON_PARSE_ERROR_RESPONSE

        return _normalize_ai_result(parsed)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.exception("Failed to parse JSON from Gemini response: %s", response_text)
        return JSON_PARSE_ERROR_RESPONSE
    except Exception as exc:
        logger.exception("Unexpected error parsing AI response: %s", response_text)
        return JSON_PARSE_ERROR_RESPONSE


def _wait_for_uploaded_file(uploaded_file):
    for _ in range(12):
        state_name = getattr(uploaded_file.state, "name", "")
        if state_name != "PROCESSING":
            return uploaded_file

        time.sleep(1)
        uploaded_file = get_file(uploaded_file.name)

    return uploaded_file


def analyze_resume_with_ai(text: str, jd_text: str | None = None) -> dict:
    api_key = _get_api_key()
    if not api_key:
        return FALLBACK_RESPONSE

    safe_text = (text or "").strip()[:MAX_RESUME_CHARS]
    if not safe_text:
        return FALLBACK_RESPONSE

    try:
        genai_any.configure(api_key=api_key)
        model = GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            _build_resume_prompt(safe_text, jd_text=jd_text),
            generation_config={"response_mime_type": "application/json"},
        )
        response_text = getattr(response, "text", "") or ""
        return _parse_ai_response(response_text)
    except Exception as exc:
        logger.exception("Failed to analyze resume text with Gemini")
        print(exc)
        return FALLBACK_RESPONSE


def analyze_resume_pdf_with_ai(contents: bytes, jd_text: str | None = None) -> dict:
    api_key = _get_api_key()
    if not api_key:
        return FALLBACK_RESPONSE

    if not contents or len(contents) > MAX_PDF_BYTES:
        return FALLBACK_RESPONSE

    uploaded_file = None
    temp_path = None

    try:
        genai_any.configure(api_key=api_key)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(contents)
            temp_path = temp_file.name

        uploaded_file = upload_file(temp_path, mime_type="application/pdf")
        uploaded_file = _wait_for_uploaded_file(uploaded_file)

        if getattr(uploaded_file.state, "name", "") == "FAILED":
            return FALLBACK_RESPONSE

        model = GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            [
                _build_resume_prompt(jd_text=jd_text),
                uploaded_file,
            ],
            generation_config={"response_mime_type": "application/json"},
        )
        response_text = getattr(response, "text", "") or ""
        return _parse_ai_response(response_text)
    except Exception as exc:
        logger.exception("Failed to analyze resume PDF with Gemini")
        print(exc)
        return FALLBACK_RESPONSE
    finally:
        if uploaded_file is not None:
            try:
                delete_file(uploaded_file.name)
            except Exception as exc:
                logger.warning("Failed to delete uploaded Gemini file: %s", exc)

        if temp_path:
            try:
                Path(temp_path).unlink(missing_ok=True)
            except Exception as exc:
                logger.warning("Failed to delete temporary PDF file: %s", exc)
