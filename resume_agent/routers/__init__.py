from .resume import router as resume_router
from .workforce import router as workforce_router
from .behavioral import router as behavioral_router
from .stress import stress_router

__all__ = ["resume_router", "workforce_router", "behavioral_router", "stress_router"]
