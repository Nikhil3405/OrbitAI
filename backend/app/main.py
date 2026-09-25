from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.datasets import router as datasets_router
from app.api.analysis import router as analysis_router
from app.api.cleaning import router as cleaning_router
from app.api.auth import router as auth_router
from app.core.config import settings

app = FastAPI(
    title="OrbitAI",
    description="Agentic AI Data Analyst",
    version="1.0.0",
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.CLERK_AUTHORIZED_PARTIES,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(datasets_router)
app.include_router(analysis_router)
app.include_router(cleaning_router)
app.include_router(auth_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "OrbitAI",
    }