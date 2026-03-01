"""
Pytest configuration for the Adaptive LLM Firewall test suite.

This conftest.py file ensures that the backend module can be imported
from anywhere tests are run, by adding the backend directory to sys.path.
"""

import sys
from pathlib import Path
import pytest

# Add the backend directory to Python path so classifiers and other
# backend modules can be imported from tests
backend_path = Path(__file__).parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))


# Import after path setup
from models import UserInfo
from auth import get_current_user, require_admin


async def mock_get_current_user() -> UserInfo:
    """Mock user for testing - bypasses auth."""
    return UserInfo(user_id="test-user", email="test@firewall.ai", role="admin")


async def mock_require_admin() -> UserInfo:
    """Mock admin user for testing."""
    return UserInfo(user_id="test-admin", email="admin@firewall.ai", role="admin")


@pytest.fixture(autouse=True)
def override_auth_dependencies():
    """Override auth dependencies for all tests."""
    from backend.app import app
    
    # Store original overrides
    original_overrides = app.dependency_overrides.copy()
    
    # Add mock auth dependencies
    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.dependency_overrides[require_admin] = mock_require_admin
    
    yield
    
    # Restore original state
    app.dependency_overrides = original_overrides
