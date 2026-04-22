from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from database import init_db
from routes.auth import router as auth_router
from routes.resume import router as resume_router

# Import models so tables are registered
from models import user, resume

app = FastAPI()


@app.on_event("startup")
def on_startup():
    init_db()

# CORS (allow frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ai-resume-saas-8ky8ey4vk-gprudvimehers-projects.vercel.app",
        "https://ai-resume-saas-wheat.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth_router)
app.include_router(resume_router)

# Health check
@app.get("/health")
def health():
    return {"status": "ok"}
