from __future__ import annotations

import json
import os
import sys
from html import escape
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse, Response

# Support both:
# 1) `uvicorn resume_agent.main:app` from project root
# 2) `uvicorn main:app` from inside `resume_agent/`
if __package__ in (None, ""):
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from resume_agent.routers import resume_router
from resume_agent.routers.resume import analyze_resume
from resume_agent.utils.logger import configure_logging, logger


configure_logging()

app = FastAPI(
    title="Resume Intelligence Agent",
    version="1.0.0",
    description="Production-ready Resume Intelligence Agent for HRMS.",
)

BASE_DIR = Path(__file__).resolve().parent
UI_DIR = BASE_DIR / "ui"


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


@app.on_event("startup")
async def startup_event() -> None:
    logger.info("Starting Resume Intelligence Agent")


@app.get("/health")
async def health_check() -> JSONResponse:
    return JSONResponse(content={"status": "ok"})


@app.get("/ui/app.css")
async def ui_css() -> Response:
    return Response(content=_load_text(UI_DIR / "app.css"), media_type="text/css")


@app.get("/ui/app.js")
async def ui_js() -> Response:
    return Response(content=_load_text(UI_DIR / "app.js"), media_type="application/javascript")


@app.get("/", response_class=HTMLResponse)
async def root() -> HTMLResponse:
    output = json.dumps({"message": "Upload a resume to see analysis output"}, indent=2)
    return HTMLResponse(content=_render_page(output=output, status="Ready.", is_error=False))


@app.post("/web/analyze", response_class=HTMLResponse)
async def web_analyze(file: UploadFile = File(...)) -> HTMLResponse:
    try:
        result = await analyze_resume(file)
        payload = json.dumps(result.model_dump(), indent=2)
        return HTMLResponse(content=_render_page(output=payload, status="Analysis completed successfully.", is_error=False))
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


app.include_router(resume_router)
