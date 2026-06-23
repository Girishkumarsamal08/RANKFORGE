import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, rank, topics

app = FastAPI(
    title="RANKFORGE AI Engine",
    description="AI Service for GATE Rank Prediction and Performance Analytics",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(rank.router, prefix="/api", tags=["Rank Prediction"])
app.include_router(topics.router, prefix="/api", tags=["Weak Topics Analysis"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
