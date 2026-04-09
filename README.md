# Karmic HRMS – AI-Driven Team Allocation System

## Overview

**Karmic HRMS** is an AI-driven Human Resource Management System designed to assist HR teams and managers in analyzing employee capabilities, behavioral traits, and project compatibility.

The system uses a **multi-agent architecture** to evaluate resumes, behavioral responses, and project requirements in order to determine whether a candidate or employee is a suitable fit for a specific team or project.

The main goal of this system is to support **data-driven team allocation decisions** and reduce risks related to skill mismatch, behavioral conflicts, and workload imbalance.

---

# System Architecture

The system follows a **multi-agent AI architecture**, where each agent is responsible for analyzing a different aspect of a candidate or employee.

```
Resume + Behavioral Questionnaire
            │
            ▼
      Data Processing Layer
        (Resume Parser)
            │
            ▼
        AI Agent Layer
 ┌─────────────────────────────┐
 │ Resume Intelligence Agents  │
 │ Behavioral Intelligence     │
 │ Risk Analysis Agents        │
 │ Project Allocation Agents   │
 └─────────────────────────────┘
            │
            ▼
        Aggregator Agent
            │
            ▼
        Decision Engine
            │
            ▼
     Team Fit Recommendation
```

---

# AI Agents in the System

## Resume Intelligence Agents

These agents analyze information extracted from resumes.

### Skills Agent
- Detects technical and soft skills from the resume.

### Experience Agent
- Extracts years of experience.
- Identifies companies and roles worked in.

### Job Role Detection Agent
- Predicts the most suitable job role based on detected skills.

---

## Behavioral Intelligence Agents

These agents analyze responses to behavioral and situational questions.

### Behavioral Intelligence Agent
- Detects positivity or negativity in responses.
- Identifies collaboration mindset.
- Detects bias or toxic behavior.

### Leadership Agent
- Identifies leadership signals such as mentoring, leading teams, or managing projects.

### Intent Agent
- Determines the candidate’s career orientation and work environment preference.

---

## Risk Analysis Agents

### Compensation Agent
- Detects whether the candidate strongly emphasizes salary or benefits.

### Workload / Stress Risk Agent
- Predicts possible stress or workload issues based on behavior and work patterns.

---

## Project Allocation Agents

### Project Skill Match Agent
- Compares candidate skills with project requirements.

### Team Compatibility Agent
- Evaluates whether the candidate fits well within the team environment.

---

# Project Structure

```
karmic-hrms
│
├── resume_agent
│   ├── models
│   │   ├── __init__.py
│   │   └── schema.py
│   │
│   ├── routers
│   │   └── resume.py
│   │
│   ├── services
│   │   ├── skills.py
│   │   ├── intent.py
│   │   ├── leadership.py
│   │   ├── compensation.py
│   │   ├── parser.py
│   │   └── aggregator.py
│   │
│   ├── ui
│   │   ├── index.html
│   │   ├── app.js
│   │   └── app.css
│   │
│   └── utils
│       └── logger.py
│
|
├── LICENSE
└── README.md
```

---

# Technologies Used

- Python
- FastAPI
- Natural Language Processing (NLP)
- Regex-based text analysis
- HTML / CSS / JavaScript
- Git & GitHub

---

# Getting Started

## Prerequisites

- **Python 3.9+** (Recommended: 3.10 or 3.11)
- **pip** (Python package manager)
- **Git** (for cloning the repository)

---

## Installation Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/Aditya-135/karmic-hrms.git
cd karmic-hrms
```

### Step 2: Create a Virtual Environment (Recommended)

**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r resume_agent/requirements.txt
```

This installs all required packages including:
- **FastAPI** - Modern web framework
- **Uvicorn** - ASGI server
- **spaCy** - NLP processing
- **Sentence Transformers** - Semantic embeddings
- **PDFPlumber** - PDF text extraction
- **python-docx** - DOCX file handling
- **Pydantic** - Data validation

### Step 4: Download spaCy Language Model

The system requires the English language model for spaCy:

```bash
python -m spacy download en_core_web_sm
```

---

## Running the Application

### Start the Server

From the project root directory, run:

```bash
uvicorn resume_agent.main:app --reload
```

You should see output similar to:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete
```

### Access the Web Interface

Open your browser and navigate to:
```
http://localhost:8000
```

You'll see the Karmic HRMS web interface where you can upload resumes for analysis.

---

## API Endpoints

The system provides multiple REST API endpoints for programmatic access:

### Health Check
- **GET** `/health` - Check if the server is running
  - Response: `{"status": "ok"}`

### Resume Analysis
- **POST** `/api/v1/resume/analyze` - Analyze a resume file (PDF or DOCX)
  - **Required:** multipart form with `file` parameter
  - **Response:** Detailed skills, intent, leadership, and compensation analysis

### Behavioral Intelligence
- **GET** `/api/v1/behavioral/personality-questions` - Get OCEAN personality questions
  - **Response:** List of behavioral assessment questions

- **POST** `/api/v1/behavioral/analyze` - Analyze behavioral responses
  - **Request Body:**
    ```json
    {
      "candidate_name": "John Doe",
      "target_role": "Senior Engineer",
      "ocean_scores": {
        "openness": 0.75,
        "conscientiousness": 0.85,
        "extraversion": 0.60,
        "agreeableness": 0.70,
        "neuroticism": 0.40
      }
    }
    ```
  - **Response:** Personality traits and team fit analysis

### Stress & Workload Analysis
- **POST** `/api/v1/stress/analyze` - Analyze employee stress levels
  - **Request Body:**
    ```json
    {
      "tasks_assigned": 12,
      "tasks_completed": 8,
      "overdue_tasks": 3,
      "working_hours_per_day": 10,
      "meetings_per_day": 6,
      "meeting_hours": 5,
      "weekend_work": 1
    }
    ```
  - **Response:** Stress level, risk assessment, and recommendations

### Workforce Intelligence
- **POST** `/api/v1/workforce/intelligence` - Comprehensive workforce allocation analysis
  - **Request Body:**
    ```json
    {
      "employee_name": "John Doe",
      "project_name": "Project Alpha",
      "employee_skills": ["Python", "FastAPI", "Angular"],
      "project_skills_required": ["Python", "Docker", "Kubernetes"],
      "primary_intent": "Career Growth",
      "leadership_score": 0.75,
      "compensation_emphasis": 0.40,
      "team": {
        "name": "Backend Team",
        "skills": ["Python", "Docker"],
        "values": ["Collaboration", "Innovation"],
        "leadership_needed": true
      }
    }
    ```
  - **Response:** Role prediction, skill match score, and team compatibility

---

## Testing the API

### Using cURL (Command Line)

Test the health endpoint:
```bash
curl http://localhost:8000/health
```

Get behavioral questions:
```bash
curl http://localhost:8000/api/v1/behavioral/personality-questions
```

Analyze stress levels:
```bash
curl -X POST http://localhost:8000/api/v1/stress/analyze \
  -H "Content-Type: application/json" \
  -d '{"tasks_assigned":12,"tasks_completed":8,"overdue_tasks":3,"working_hours_per_day":10,"meetings_per_day":6,"meeting_hours":5,"weekend_work":1}'
```

### Using Python

```python
import requests

# Analyze stress
response = requests.post(
    "http://localhost:8000/api/v1/stress/analyze",
    json={
        "tasks_assigned": 12,
        "tasks_completed": 8,
        "overdue_tasks": 3,
        "working_hours_per_day": 10,
        "meetings_per_day": 6,
        "meeting_hours": 5,
        "weekend_work": 1
    }
)

print(response.json())
```

### Using PowerShell

```powershell
$body = @{
    tasks_assigned = 12
    tasks_completed = 8
    overdue_tasks = 3
    working_hours_per_day = 10
    meetings_per_day = 6
    meeting_hours = 5
    weekend_work = 1
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8000/api/v1/stress/analyze `
  -Method POST `
  -ContentType 'application/json' `
  -Body $body | Select-Object -ExpandProperty Content
```

---

## API Documentation (Interactive)

Once the server is running, access the auto-generated documentation at:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

These interactive interfaces allow you to test all endpoints directly from your browser.

---

## Project Structure

```
karmic-hrms/
├── resume_agent/
│   ├── main.py                 # FastAPI application and route setup
│   ├── requirements.txt         # Python dependencies
│   │
│   ├── models/
│   │   └── schema.py           # Pydantic data models
│   │
│   ├── routers/
│   │   ├── resume.py           # Resume analysis endpoints
│   │   ├── behavioral.py       # Behavioral analysis endpoints
│   │   ├── stress.py           # Stress analysis endpoints
│   │   └── workforce.py        # Workforce intelligence endpoints
│   │
│   ├── services/
│   │   ├── parser.py           # Resume text extraction
│   │   ├── skills.py           # Skill detection agent
│   │   ├── intent.py           # Career intent detection
│   │   ├── leadership.py       # Leadership signal detection
│   │   ├── compensation.py     # Compensation emphasis analysis
│   │   ├── behavioral_intelligence.py  # OCEAN personality model
│   │   ├── stress_agent.py     # Workload stress prediction
│   │   ├── job_role_detection.py       # Job role prediction
│   │   ├── team_compatibility.py       # Team fit assessment
│   │   ├── project_skill_match.py      # Project skill matching
│   │   ├── recommendation.py   # Final recommendation engine
│   │   └── aggregator.py       # Unified analysis orchestration
│   │
│   ├── ui/
│   │   ├── index.html          # Web interface
│   │   ├── app.js              # Frontend logic
│   │   └── app.css             # Styling
│   │
│   └── utils/
│       └── logger.py           # Logging configuration
│
├── resumes/                    # Sample resume datasets
├── LICENSE                     # MIT License
└── README.md                   # This file
```

---

## Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'spacy'`
**Solution:** Install dependencies with `pip install -r resume_agent/requirements.txt`

### Issue: `OSError: [E050] Can't find model 'en_core_web_sm'`
**Solution:** Download the spaCy model with:
```bash
python -m spacy download en_core_web_sm
```

### Issue: Port 8000 already in use
**Solution:** Specify a different port:
```bash
uvicorn resume_agent.main:app --port 8001 --reload
```

### Issue: Import errors or circular dependencies
**Solution:** Ensure you're running from the project root directory and the virtual environment is activated.

### Issue: Slow first request response
**Solution:** The system initializes several ML models on first use. Subsequent requests will be faster.

---

## Development Tips

### Run without auto-reload (Production)
```bash
uvicorn resume_agent.main:app
```

### Run with custom settings
```bash
uvicorn resume_agent.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Enable debug logging
Add to your environment before running:
```bash
# Windows PowerShell
$env:LOG_LEVEL="DEBUG"

# macOS/Linux
export LOG_LEVEL=DEBUG
```

---

## Common Use Cases

### 1. Resume Upload and Analysis
- Visit `http://localhost:8000`
- Upload a PDF or DOCX resume
- View comprehensive analysis results

### 2. Behavioral Assessment
1. Get personality questions from `/api/v1/behavioral/personality-questions`
2. Collect candidate responses
3. POST scores to `/api/v1/behavioral/analyze`
4. Receive personality profile and team fit metrics

### 3. Employee Stress Monitoring
- POST employee workload metrics to `/api/v1/stress/analyze`
- Receive stress level, risk assessment, and recommendations
- Use for proactive workload management

### 4. Team Allocation Decision
- Gather employee skills, behavioral scores, and project requirements
- POST to `/api/v1/workforce/intelligence`
- Get data-driven allocation recommendation

---

## Additional Resources

- **FastAPI Documentation:** https://fastapi.tiangolo.com/
- **Uvicorn Documentation:** https://www.uvicorn.org/
- **spaCy Documentation:** https://spacy.io/
- **Pydantic Documentation:** https://docs.pydantic.dev/

---

---

# Example Output

The system generates structured insights such as:

- Detected technical and soft skills
- Leadership indicators
- Behavioral insights
- Team compatibility score
- Project skill match score

Finally, the system provides a **recommendation for project assignment**.

---

# License

This project is licensed under the **MIT License**.

---

# Contributors

## Contributors

- **Aditya Patil** 
- **Saloni Bhimellu** 
- **Omkar More** 
- **Sai Dhumal** 
