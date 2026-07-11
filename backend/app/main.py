from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.sessions import router as sessions_router

app = FastAPI(title="Docscribe", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(sessions_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
