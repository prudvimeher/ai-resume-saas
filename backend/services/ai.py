import json
import logging
import os
import tempfile
import time
from pathlib import Path

import google.generativeai as genai


FALLBACK_RESPONSE = {
    "score": 70,
    "suggestions": ["AI parsing failed, try again"],
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


def _build_resume_prompt(resume_text: str | None = None) -> str:
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
    print("RAW AI RESPONSE:", response_text)

    parsed = json.loads(_clean_json_response(response_text))
    return _normalize_ai_result(parsed)


def _wait_for_uploaded_file(uploaded_file):
    for _ in range(12):
        state_name = getattr(uploaded_file.state, "name", "")
        if state_name != "PROCESSING":
            return uploaded_file

        time.sleep(1)
        uploaded_file = genai.get_file(uploaded_file.name)

    return uploaded_file


def analyze_resume_with_ai(text: str) -> dict:
    api_key = _get_api_key()
    if not api_key:
        return FALLBACK_RESPONSE

    safe_text = (text or "").strip()[:MAX_RESUME_CHARS]
    if not safe_text:
        return FALLBACK_RESPONSE

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            _build_resume_prompt(safe_text),
            generation_config={"response_mime_type": "application/json"},
        )
        response_text = getattr(response, "text", "") or ""
        return _parse_ai_response(response_text)
    except Exception as exc:
        logger.exception("Failed to analyze resume text with Gemini")
        print(exc)
        return FALLBACK_RESPONSE


def analyze_resume_pdf_with_ai(contents: bytes) -> dict:
    api_key = _get_api_key()
    if not api_key:
        return FALLBACK_RESPONSE

    if not contents or len(contents) > MAX_PDF_BYTES:
        return FALLBACK_RESPONSE

    try:
        genai.configure(api_key=api_key)
        uploaded_file = None
        temp_path = None

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(contents)
            temp_path = temp_file.name

        uploaded_file = genai.upload_file(temp_path, mime_type="application/pdf")
        uploaded_file = _wait_for_uploaded_file(uploaded_file)

        if getattr(uploaded_file.state, "name", "") == "FAILED":
            return FALLBACK_RESPONSE

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            [
                _build_resume_prompt(),
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
        if "uploaded_file" in locals() and uploaded_file is not None:
            try:
                genai.delete_file(uploaded_file.name)
            except Exception as exc:
                logger.warning("Failed to delete uploaded Gemini file: %s", exc)

        if "temp_path" in locals() and temp_path:
            try:
                Path(temp_path).unlink(missing_ok=True)
            except Exception as exc:
                logger.warning("Failed to delete temporary PDF file: %s", exc)
