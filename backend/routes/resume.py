import traceback
from io import BytesIO
from typing import Any

from fastapi import APIRouter, Depends, Request
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette.datastructures import UploadFile

from database import SessionLocal, get_db
from models.resume import Resume
from schemas.resume import ResumeRequest
from services.ai import analyze_resume_pdf_with_ai, analyze_resume_with_ai

router = APIRouter()

MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
PDF_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}


def error_response(message: str) -> dict:
    return {
        "score": 0,
        "suggestions": [message],
    }


def clean_resume_text(text: str) -> str:
    return (text or "").replace("\x00", "").strip()


def normalize_score(value: Any) -> int:
    try:
        return max(0, min(100, int(value)))
    except (TypeError, ValueError):
        return 70


def normalize_suggestions(value: Any) -> list[str]:
    if not isinstance(value, list):
        return ["AI parsing failed, try again"]

    return [str(suggestion) for suggestion in value]


def extract_text_from_pdf(contents: bytes) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(BytesIO(contents))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return clean_resume_text(text)
    except Exception as exc:
        print(exc)
        traceback.print_exc()
        return ""


async def get_resume_payload_from_request(request: Request) -> tuple[str, bytes | None]:
    content_type = request.headers.get("content-type", "").lower()

    if "multipart/form-data" in content_type:
        form = await request.form()
        upload = form.get("file")

        if not isinstance(upload, UploadFile):
            return "", None

        filename = (upload.filename or "").lower()
        upload_content_type = (upload.content_type or "").lower()

        if upload_content_type not in PDF_CONTENT_TYPES and not filename.endswith(".pdf"):
            return "", None

        contents = await upload.read()
        if len(contents) > MAX_UPLOAD_SIZE_BYTES:
            return "", None

        text = extract_text_from_pdf(contents)
        print(f"PDF upload received: name={filename}, bytes={len(contents)}, extracted_chars={len(text)}")
        return text, contents

    if "application/json" in content_type:
        try:
            payload: Any = await request.json()
            data = ResumeRequest.model_validate(payload)
            return clean_resume_text(data.text), None
        except (ValidationError, ValueError) as exc:
            print(exc)
            return "", None

    return "", None


def save_resume_analysis(text: str, score: int) -> None:
    db = SessionLocal()

    try:
        new_resume = Resume(
            user_id=1,
            content=text,
            score=score,
        )
        db.add(new_resume)
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        print(exc)
        traceback.print_exc()
    finally:
        db.close()


@router.post("/analyze")
async def analyze_resume(request: Request):
    try:
        text, pdf_contents = await get_resume_payload_from_request(request)

        if text:
            ai_result = analyze_resume_with_ai(text)
            content_to_save = text
        elif pdf_contents:
            ai_result = analyze_resume_pdf_with_ai(pdf_contents)
            content_to_save = "[PDF resume analyzed by Gemini]"
        else:
            return error_response("Could not read uploaded resume")

        score = normalize_score(ai_result.get("score"))
        suggestions = normalize_suggestions(ai_result.get("suggestions"))

        save_resume_analysis(content_to_save, score)

        return {
            "score": score,
            "suggestions": suggestions,
        }
    except Exception as exc:
        print(exc)
        traceback.print_exc()
        return error_response("Internal error occurred")


@router.get("/resumes")
def get_resumes(db: Session = Depends(get_db)):
    return db.query(Resume).all()
