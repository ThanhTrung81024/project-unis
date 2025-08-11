from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from dotenv import load_dotenv

# Import routers
from routers import datasets, train, models, dashboard

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Unis Forecast API",
    description="API dự báo nhu cầu sản phẩm",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(datasets.router, prefix="/datasets", tags=["Datasets"])
app.include_router(train.router, prefix="/train", tags=["Training"])
app.include_router(models.router, prefix="/models", tags=["Models"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Unis Forecast API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Mount static files for storage
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
