# Karmic HRMS Intelligence Platform

AI-powered talent intelligence suite for resume screening, behavioral fit, workforce matching, and stress risk reporting.

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688)
![UI](https://img.shields.io/badge/frontend-Vanilla%20JS%20%2B%20Bootstrap-purple)
![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-yellow)

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [System Architecture](#system-architecture)
- [Project Workflow](#project-workflow)
- [Folder Structure](#folder-structure)
- [Installation Guide](#installation-guide)
- [Environment Variables](#environment-variables)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Database Design](#database-design)
- [Reporting / Exports](#reporting--exports)
- [Security Features](#security-features)
- [Performance / Scalability](#performance--scalability)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Author / Contact](#author--contact)

## Project Overview

Karmic HRMS is a multi-agent hiring intelligence platform built to help HR teams and engineering managers make faster, evidence-based candidate decisions.

It provides:
- Resume intelligence (skills, intent, leadership, compensation emphasis)
- Behavioral intelligence (OCEAN scoring, team fit, role fit)
- Workforce intelligence (job-role prediction, project skill matching, team compatibility)
- Stress/workload analysis with risk insights and recommendations
- Professional PDF report generation for current candidate, individual modules, or full consolidated reports

### Business Value

- Reduces manual screening effort through structured candidate analysis
- Improves hiring consistency with explainable scores and evidence
- Supports project staffing decisions using skill and compatibility data
- Surfaces potential workload and burnout risk signals for proactive HR action

## Problem Statement

Traditional hiring and workforce decisions are often fragmented:
- Resume review is manual and inconsistent
- Behavioral evaluation is subjective and difficult to compare
- Team/project allocation decisions are made without structured fit signals
- Stress and workload risk are often detected too late

This platform solves that by consolidating resume parsing, behavioral profiling, workforce matching, and risk analytics into one operational interface and API suite.

## Key Features

- **Authentication & Access**
  - User registration/login/logout
  - JWT-based session token stored in HTTP-only cookie
  - Protected root dashboard route

- **Resume Analysis**
  - PDF/DOCX upload support
  - Resume text extraction and cleanup
  - Candidate profile extraction (name, email, phone, location, education, certifications, links, experience)
  - Skill extraction with semantic matching fallback
  - Intent detection (embedding-based with keyword fallback)
  - Leadership and compensation emphasis scoring
  - Robust fallback mock analyzer if model loading fails

- **Workforce Intelligence**
  - Job role prediction with classifier + fallback strategy
  - Project skill match scoring and missing skills detection
  - Team compatibility scoring with dynamic weighting using behavioral signals

- **Behavioral Analysis**
  - OCEAN personality assessment workflow
  - Communication sentiment scoring
  - Role fit recommendations
  - Team compatibility, synergies, conflicts, and recommendations
  - Candidate/team scenario management in browser localStorage

- **Stress / Workload Analysis**
  - Input-based stress analysis endpoint
  - Stress level, risk level, workload/meeting/task metrics
  - Actionable insights, recommendations, and future risk statement
  - History + chart visualization in UI

- **Reporting**
  - Enterprise-style branded PDF exports
  - Module-specific downloads:
    - Current candidate
    - Resume only
    - Behavioral only
    - Stress/workload only
    - All reports

- **User Experience**
  - Single-page tabbed dashboard
  - Light/dark theming
  - Drag-and-drop resume upload
  - Interactive charts (Chart.js)

## Tech Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Bootstrap 5
- Bootstrap Icons
- Chart.js

### Backend
- Python 3.10+
- FastAPI
- Uvicorn
- Pydantic

### Database
- MongoDB (`users` collection for auth)

### AI / ML / NLP
- spaCy
- Sentence Transformers (`all-MiniLM-L6-v2`, local/offline-first loading in embedding backend)
- NumPy, Pandas
- Scikit-learn (job role classifier path)
- Custom fallback/heuristic agents where needed

### Document Processing
- pdfplumber
- python-docx

### Security / Utilities
- bcrypt
- PyJWT
- python-multipart

## Quick Start

```bash
git clone <your-repo-url>
cd karmic-hrms
python -m venv .venv
```

Windows PowerShell:
```bash
.venv\Scripts\Activate.ps1
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Install dependencies:
```bash
pip install -r resume_agent/requirements.txt
python -m spacy download en_core_web_sm
```

Run server:
```bash
python -m uvicorn resume_agent.main:app --host 127.0.0.1 --port 8000 --reload
```

Open:
- App: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

## System Architecture

```mermaid
flowchart LR
    U[User Browser UI] --> A[FastAPI App]
    A --> R1[/api/v1/resume/*]
    A --> R2[/api/v1/behavioral/*]
    A --> R3[/api/v1/workforce/*]
    A --> R4[/api/v1/stress/*]
    A --> AU[/auth/*]

    R1 --> S1[Resume Aggregator\nskills + intent + leadership + compensation]
    R2 --> S2[Behavioral Agent\nOCEAN + role fit + team fit]
    R3 --> S3[Workforce Agents\nrole detection + skill match + team compatibility]
    R4 --> S4[Stress Agent\nrisk analysis + recommendations]

    AU --> DB[(MongoDB users)]
    U --> PDF[Client-side PDF Builder in app.js]
```

## Project Workflow

1. User authenticates via `/auth/login`.
2. Dashboard loads and user uploads resume (PDF/DOCX).
3. Backend parses document and computes resume intelligence.
4. UI displays profile, scores, evidence, and history.
5. User optionally runs workforce intelligence using project/team inputs.
6. User runs behavioral analysis (OCEAN + team context).
7. User runs stress/workload analysis.
8. UI can export professional PDF reports by module or consolidated report.

## Folder Structure

```text
karmic-hrms/
├── LICENSE
├── README.md
├── resume_agent/
│   ├── __init__.py
│   ├── main.py
│   ├── requirements.txt
│   ├── models/
│   │   ├── __init__.py
│   │   └── schema.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── behavioral.py
│   │   ├── resume.py
│   │   ├── stress.py
│   │   └── workforce.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── aggregator.py
│   │   ├── behavioral_intelligence.py
│   │   ├── compensation.py
│   │   ├── embeddings.py
│   │   ├── intent.py
│   │   ├── job_role_detection.py
│   │   ├── leadership.py
│   │   ├── parser.py
│   │   ├── project_skill_match.py
│   │   ├── recommendation.py
│   │   ├── skills.py
│   │   ├── stress_agent.py
│   │   └── team_compatibility.py
│   ├── ui/
│   │   ├── app.css
│   │   ├── app.js
│   │   ├── index.html
│   │   ├── login.html
│   │   └── logo.png
│   └── utils/
│       ├── auth.py
│       ├── db.py
│       └── logger.py
```

## Installation Guide

### Prerequisites

- Python 3.10+
- MongoDB running locally (`mongodb://localhost:27017`)
- pip

### Clone Repository

```bash
git clone <your-repo-url>
cd karmic-hrms
```

### Backend Setup

```bash
python -m venv .venv
# activate env
pip install -r resume_agent/requirements.txt
python -m spacy download en_core_web_sm
```

### Database Setup

Create/start local MongoDB and ensure default URI is accessible:
`mongodb://localhost:27017`

Default DB/collection in code:
- DB: `hrms_karmic`
- Collection: `users`

### Run Development Server

```bash
python -m uvicorn resume_agent.main:app --reload
```

### Production Run

```bash
python -m uvicorn resume_agent.main:app --host 0.0.0.0 --port 8000
```

## Environment Variables

This codebase currently uses minimal environment configuration.

```env
# Optional: comma-separated allowed CORS origins
CORS_ORIGINS=*
```

> Note: Mongo URI and JWT secret are currently hardcoded in `resume_agent/utils/db.py` and `resume_agent/utils/auth.py`. For production, move them to secure environment variables.

## Usage Guide

1. Register/Login at `/login`.
2. Upload a resume in **Resume Analysis** tab.
3. Review extracted profile, scores, skills, and evidence.
4. Run **Workforce Intelligence** with project/team context.
5. Switch to **Behavioral Analysis**, complete OCEAN form, run analysis.
6. Switch to **Stress/Workload Analyses**, submit workload metrics.
7. Download specific or consolidated PDF reports from the header menu.

## API Documentation

Interactive docs:
- Swagger UI: `/docs`
- OpenAPI JSON: `/openapi.json`

### Core Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Service health/version |
| GET | `/` | Protected dashboard page |
| GET | `/login` | Login/register page |
| POST | `/web/analyze` | Web resume analyze flow (HTML response) |

### Auth

| Method | Endpoint |
|---|---|
| POST | `/auth/register` |
| POST | `/auth/login` |
| POST | `/auth/logout` |

### Resume Intelligence

| Method | Endpoint |
|---|---|
| POST | `/api/v1/resume/analyze` |
| POST | `/api/v1/resume/extract-name` |
| POST | `/api/v1/resume/extract-profile` |

### Workforce Intelligence

| Method | Endpoint |
|---|---|
| POST | `/api/v1/workforce/intelligence` |

### Behavioral Intelligence

| Method | Endpoint |
|---|---|
| POST | `/api/v1/behavioral/analyze` |
| POST | `/api/v1/behavioral/health` |
| POST | `/api/v1/behavioral/team-compatibility` |
| GET | `/api/v1/behavioral/candidate-history` |
| GET | `/api/v1/behavioral/personality-questions` |

### Stress / Workload

| Method | Endpoint |
|---|---|
| POST | `/api/v1/stress/analyze` |

## Database Design

### MongoDB (persistent backend storage)

#### `users` collection

| Field | Type | Description |
|---|---|---|
| `name` | string | User full name |
| `email` | string | Unique login email |
| `password` | string | bcrypt-hashed password |

### Client-side persistence (browser localStorage)

- Recent resume analyses
- Candidate behavioral history
- Team scenarios
- Stress analysis history
- UI theme state

## Reporting / Exports

- PDF generation is implemented in `resume_agent/ui/app.js` (client-side).
- Supports:
  - Current candidate report
  - Resume-only report
  - Behavioral-only report
  - Stress/workload-only report
  - All reports bundle
- Reports include dynamic values from live analysis state and module histories.

## Security Features

- Password hashing via `bcrypt`.
- JWT token generation/validation via `PyJWT`.
- Session token stored in HTTP-only cookie (`auth_token`).
- Protected root route redirects unauthenticated users to `/login`.
- Input validation using Pydantic and route-level checks.
- Global exception handler for safe JSON error fallback.

## Performance / Scalability

- Lifespan warm-up for heavy analyzers to reduce first-request latency.
- Lazy loading and `lru_cache` for agents/models.
- Fallback model strategies (semantic backend -> token overlap backend).
- Modular service architecture for independent scaling of analysis domains.

## Deployment

The app is ASGI-compatible and can be deployed to:
- Render
- Railway
- Fly.io
- VPS (systemd + Nginx reverse proxy)
- Docker (with a custom Dockerfile)

### Minimal production command

```bash
uvicorn resume_agent.main:app --host 0.0.0.0 --port 8000
```

### Deployment notes

- Set `CORS_ORIGINS` for your frontend domains.
- Replace hardcoded JWT secret and Mongo URI with env vars.
- Use managed MongoDB for production.
- Serve behind HTTPS reverse proxy.

## Screenshots

> Add screenshots to `docs/` and update paths below.

![Login](docs/login.png)
![Resume Analysis](docs/resume-analysis.png)
![Behavioral Analysis](docs/behavioral-analysis.png)
![Stress Analysis](docs/stress-analysis.png)
![PDF Report](docs/pdf-report.png)

## Roadmap

- Move security-sensitive constants to environment variables.
- Add role-based access control (RBAC).
- Add persistent storage for analysis history (server-side).
- Add CI pipeline and test suite coverage badges.
- Add Docker + compose setup.
- Add multi-tenant organization support.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Push your branch
5. Open a Pull Request

```bash
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

## License

This project is licensed under the MIT License. See `LICENSE`.

## Author / Contact

Project maintained by the **Karmic HRMS Team**.

Contributors listed in repository history and prior project credits:
- Aditya Patil
- Saloni Bhimellu
- Omkar More
- Sai Dhumal
