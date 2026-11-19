from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import initialize_database, list_scholarships, replace_all, search_scholarships
from app.models import SearchRequest, Scholarship
from app.scraper import fetch_scholarships


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="HEC Scholarship Finder",
    description="Conversational discovery for Government of Pakistan scholarships",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/")
async def root():
    return FileResponse("app/static/index.html")


@app.get("/api/scholarships")
async def get_scholarships(
    country: Optional[str] = Query(default=None),
    course_level: Optional[str] = Query(default=None),
) -> dict:
    items = list_scholarships(country=country, course_level=course_level)
    return {"count": len(items), "results": items}


@app.get("/api/search")
async def search_get(
    country: str = Query(min_length=1),
    course_level: str = Query(min_length=1),
) -> dict:
    normalized = {"bachelor": "Bachelors", "bachelors": "Bachelors",
                  "master": "Masters", "masters": "Masters", "phd": "PhD"}
    level = normalized.get(course_level.lower(), course_level.title())
    items = search_scholarships(country, level)
    return {"count": len(items), "country": country, "course_level": level, "results": items}


@app.post("/api/search")
async def search_post(payload: SearchRequest) -> dict:
    level = payload.course_level.value
    items = search_scholarships(payload.country, level)
    return {"count": len(items), "country": payload.country, "course_level": level, "results": items}


@app.post("/api/refresh")
async def refresh_cache() -> dict:
    try:
        items = await fetch_scholarships()
        replaced = replace_all(items)
        return {
            "status": "ok",
            "source": "live" if len(items) else "seed",
            "count": replaced,
            "message": f"Refreshed cache with {replaced} scholarships.",
        }
    except Exception as exc:
        items = list_scholarships()
        if not items:
            raise HTTPException(status_code=503, detail="Refresh failed and cache is empty") from exc
        return {
            "status": "stale",
            "source": "cache",
            "count": len(items),
            "message": "Refresh failed; serving the existing cache.",
        }
