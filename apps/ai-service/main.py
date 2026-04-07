"""
LikasLens AI Service
Neuro-symbolic processing microservice using FastAPI and Google Generative AI
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    print("🚀 LikasLens AI Service starting...")
    yield
    # Shutdown
    print("👋 LikasLens AI Service shutting down...")


app = FastAPI(
    title="LikasLens AI Service",
    description="Neuro-symbolic civic reporting AI microservice",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js frontend
        "http://localhost:8000",  # Laravel backend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint for service monitoring."""
    return {
        "status": "ok",
        "service": "likaslens-ai-service",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "0.1.0",
    }


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "name": "LikasLens AI Service",
        "description": "Neuro-symbolic civic reporting AI microservice",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("AI_SERVICE_PORT", 8001)),
        reload=True,
    )
