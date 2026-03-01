"""
Re-export the FastAPI ``app`` and ``settings`` for use by tests
(e.g. ``from backend.app import app, settings``).
"""

from main import app           # noqa: F401  – re-export
from config import settings    # noqa: F401  – re-export
