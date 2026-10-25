import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .router import router

app = FastAPI(
    title="UK Day-Ahead Wind Forecast & Procurement Analytics Engine",
    description="Analytics and Decision Support platform for UK Energy Utilities participating in the wholesale Day-Ahead electricity market (Elexon BMRS data for January 2026).",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(router)

# Locate built frontend if present
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")
ASSETS_DIR = os.path.join(FRONTEND_DIST, "assets")

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.get("/api/health")
def health_endpoint():
    return {
        "status": "healthy",
        "service": "UK Day-Ahead Wind Forecast & Procurement Analytics Engine",
        "market": "UK Wholesale Electricity / Elexon BMRS",
        "period": "January 2026"
    }

# Catch-all route to serve React SPA when deployed as a unified container
@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    if full_path.startswith("api"):
        return {"detail": "Not Found"}
    
    if os.path.exists(FRONTEND_DIST):
        target_file = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)

    return {
        "message": "UK Day-Ahead Wind Forecast API is running.",
        "documentation": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=True)
