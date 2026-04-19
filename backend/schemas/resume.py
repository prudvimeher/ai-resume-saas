from pydantic import BaseModel


class ResumeRequest(BaseModel):
    text: str
