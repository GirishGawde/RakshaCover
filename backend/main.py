import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

# Prevention startup tasks
from prevention.threat_feed import load_threat_feeds
from prevention.classifier import train_model

# Routers
from aftermath.routes import router as aftermath_router
from cluster.routes import router as cluster_router
from guardian.routes import router as guardian_router
from prevention.routes import router as prevention_router
from aftermath.log_422 import validation_exception_handler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks for Prevention
    print("Loading threat feeds...")
    load_threat_feeds()
    
    print("Training ML classifier...")
    train_model()
    
    yield
    # Shutdown tasks if any

app = FastAPI(
    title="RakshaCover Unified Backend",
    description="Unified backend server for all modules.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(aftermath_router)
app.include_router(cluster_router)
app.include_router(guardian_router)
app.include_router(prevention_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "module": "unified"}
