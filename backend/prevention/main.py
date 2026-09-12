"""
main.py
Main entrypoint for the RakshaCover Prevention Service.
Mounts routes and sets up the FastAPI application.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from threat_feed import load_threat_feeds
from classifier import train_model
from routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    print("Loading threat feeds...")
    load_threat_feeds()
    
    print("Training ML classifier...")
    train_model()
    
    yield
    # Shutdown tasks if any

app = FastAPI(
    title="RakshaCover Prevention Service",
    description="Risk assessment service for URLs, QR codes, and UPI handles.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS enabled for http://localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
