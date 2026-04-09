from __future__ import annotations

import json
import os
import sys
from contextlib import asynccontextmanager
from html import escape
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, Response

# Support both:
# 1) `uvicorn resume_agent.main:app` from project root
# 2) `uvicorn main:app` from inside `resume_agent/`
if __package__ in (None, ""):
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from resume_agent.routers import resume_router, workforce_router
from resume_agent.routers.resume import analyze_resume, _get_aggregator
from resume_agent.routers.workforce import warm_up
from resume_agent.utils.logger import configure_logging, logger


configure_logging()

BASE_DIR = Path(__file__).resolve().parent
UI_DIR   = BASE_DIR / "ui"


# ---------------------------------------------------------------------------
# Lifespan — replaces deprecated @app.on_event("startup")
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Warm up all ML models before the first request hits any endpoint."""
    logger.info("Starting Resume Intelligence Agent — warming up models…")
    try:
        _get_aggregator()       # resume pipeline (skills, intent, leadership, compensation)
        logger.info("Resume aggregator ready")
    except Exception as exc:
        logger.warning("Resume aggregator warm-up failed (non-fatal): %s", exc)
    try:
        warm_up()               # workforce pipeline (job-role classifier, team compat)
    except Exception as exc:
        logger.warning("Workforce warm-up failed (non-fatal): %s", exc)
    logger.info("All agents ready — server accepting requests")
    yield
    logger.info("Shutting down Resume Intelligence Agent")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Resume Intelligence Agent",
    version="1.1.0",
    description="Production-ready multi-agent Resume Intelligence system for HRMS.",
    lifespan=lifespan,
)

# CORS — restrict origins in production via an environment variable.
_ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global exception handler — ensures every unhandled error returns JSON.
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def _global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected internal error occurred."},
    )


# ---------------------------------------------------------------------------
# Infrastructure endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["ops"])
async def health_check() -> JSONResponse:
    return JSONResponse(content={"status": "ok", "version": app.version})


@app.get("/ui/app.css", include_in_schema=False)
async def ui_css() -> Response:
    return Response(content=_load_text(UI_DIR / "app.css"), media_type="text/css")


@app.get("/ui/app.js", include_in_schema=False)
async def ui_js() -> Response:
    return Response(
        content=_load_text(UI_DIR / "app.js"), media_type="application/javascript"
    )


# ---------------------------------------------------------------------------
# Web UI
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def root() -> HTMLResponse:
    output = json.dumps({"message": "Upload a resume to see analysis output"}, indent=2)
    return HTMLResponse(content=_render_page(output=output, status="Ready."))


@app.post("/web/analyze", response_class=HTMLResponse, include_in_schema=False)
async def web_analyze(file: UploadFile = File(...)) -> HTMLResponse:
    try:
        result  = await analyze_resume(file)
        payload = json.dumps(result.model_dump(), indent=2)
        return HTMLResponse(
            content=_render_page(output=payload, status="Analysis completed successfully.")
        )
    except HTTPException as exc:
        payload = json.dumps({"detail": exc.detail}, indent=2)
        return HTMLResponse(
            content=_render_page(output=payload, status="Analysis failed.", is_error=True),
            status_code=exc.status_code,
        )
    except Exception as exc:
        payload = json.dumps({"detail": f"Unexpected error: {exc}"}, indent=2)
        return HTMLResponse(
            content=_render_page(output=payload, status="Analysis failed.", is_error=True),
            status_code=500,
        )


# ---------------------------------------------------------------------------
# API routers
# ---------------------------------------------------------------------------

app.include_router(resume_router)
app.include_router(workforce_router)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return ""


def _render_page(output: str, status: str = "Ready.", is_error: bool = False) -> str:
    status_class = "status error" if is_error else "status ok"
    template = _load_text(UI_DIR / "index.html")
    if not template:
        return "<h1>UI template missing</h1>"
    html = template.replace("__STATUS_CLASS__", escape(status_class))
    html = html.replace("__STATUS_TEXT__", escape(status))
    html = html.replace("__OUTPUT__", escape(output))
    return html
