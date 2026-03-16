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

# How to Run the Project

## 1. Clone the Repository

```
git clone https://github.com/Aditya-135/karmic-hrms.git
```

```
cd karmic-hrms
```

---

## 2. Install Dependencies

```
pip install -r resume_agent/requirements.txt
```

---

## 3. Run the Server

```
uvicorn resume_agent.main:app --reload
```

---

## 4. Open in Browser

```
http://localhost:8000
```

Upload a resume to view the analysis results.

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
