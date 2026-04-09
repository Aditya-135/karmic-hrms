"""
Stress/Workload Analysis Router
Integrates the stress analysis agent with the HRMS API
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, Any, Optional

from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import JSONResponse

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from resume_agent.services.stress_agent import StressAgent
from resume_agent.utils.logger import logger

stress_router = APIRouter(prefix="/api/v1/stress", tags=["stress"])

# Initialize the stress agent
_stress_agent: Optional[StressAgent] = None


def get_stress_agent() -> StressAgent:
    """Get or initialize the stress agent."""
    global _stress_agent
    if _stress_agent is None:
        _stress_agent = StressAgent()
        _stress_agent.load_data()
        _stress_agent.preprocess_data()
        _stress_agent.feature_engineering()
        _stress_agent.train_model()
        logger.info("Stress Agent initialized and trained")
    return _stress_agent


@stress_router.post("/analyze")
async def analyze_stress(payload: Dict[str, Any] = Body(...)) -> JSONResponse:
    """
    Analyze stress level for an employee based on workload metrics.
    
    Request body:
    {
        "tasks_assigned": int,
        "tasks_completed": int,
        "overdue_tasks": int,
        "working_hours_per_day": float,
        "meetings_per_day": int,
        "meeting_hours": float,
        "weekend_work": int (0 or 1)
    }
    
    Returns:
    {
        "stress_level": str,
        "risk_level": str,
        "workload_score": float,
        "meeting_load_score": float,
        "task_completion_score": float,
        "insights": [str],
        "recommendations": [str],
        "future_risk": str
    }
    """
    try:
        # Validate required fields
        required_fields = [
            "tasks_assigned",
            "tasks_completed",
            "overdue_tasks",
            "working_hours_per_day",
            "meetings_per_day",
            "meeting_hours",
            "weekend_work",
        ]
        
        for field in required_fields:
            if field not in payload:
                raise ValueError(f"Missing required field: {field}")
        
        # Get stress agent
        agent = get_stress_agent()
        
        # Prepare employee data
        employee_data = {
            "tasks_assigned": int(payload["tasks_assigned"]),
            "tasks_completed": int(payload["tasks_completed"]),
            "overdue_tasks": int(payload["overdue_tasks"]),
            "working_hours_per_day": float(payload["working_hours_per_day"]),
            "meetings_per_day": int(payload["meetings_per_day"]),
            "meeting_hours": float(payload["meeting_hours"]),
            "weekend_work": int(payload["weekend_work"]),
        }
        
        # Analyze employee
        analysis = agent.analyze_employee(employee_data)
        
        # Generate insights and recommendations
        insights = agent.generate_insights(employee_data, analysis)
        recommendations = agent.generate_recommendations(analysis)
        future_risk = agent.predict_future_risk(employee_data)
        
        # Prepare response
        response = {
            "status": "success",
            "stress_level": analysis["stress_level"],
            "risk_level": analysis["risk_level"],
            "confidence": round(analysis["confidence"], 2),
            "workload_score": round(analysis["workload_score"], 1),
            "meeting_load_score": round(analysis["meeting_load_score"], 1),
            "task_completion_score": round(analysis["task_completion_score"], 1),
            "stress_indicator": round(analysis["stress_indicator"], 2),
            "insights": insights,
            "recommendations": recommendations,
            "future_risk": future_risk,
            "employee_data": employee_data,
        }
        
        logger.info(f"Stress analysis completed: {analysis['stress_level']} risk")
        return JSONResponse(content=response, status_code=200)
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=400
        )
    except Exception as e:
        logger.error(f"Stress analysis error: {str(e)}")
        return JSONResponse(
            content={"status": "error", "message": f"Analysis failed: {str(e)}"},
            status_code=500
        )
