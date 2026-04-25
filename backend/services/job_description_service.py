from PyPDF2 import PdfReader
from docx import Document


def extract_text_from_pdf(file) -> str:
    reader = PdfReader(file.file)
    return " ".join([page.extract_text() or "" for page in reader.pages])


def extract_text_from_docx(file) -> str:
    doc = Document(file.file)
    return " ".join([para.text for para in doc.paragraphs])


async def get_job_description_text(
    text: str | None,
    file,
) -> str | None:
    if text and text.strip():
        return text.strip()

    if file:
        filename = file.filename.lower()
        if filename.endswith(".pdf"):
            return extract_text_from_pdf(file)
        elif filename.endswith(".docx"):
            return extract_text_from_docx(file)
        else:
            raise ValueError("Unsupported file type. Only PDF and DOCX allowed.")

    return None
