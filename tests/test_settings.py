import os
from backend.app import settings

def test_settings_loaded():
    # the .env file includes HOST and PORT; ensure they are read correctly
    assert settings.host in ("0.0.0.0", "127.0.0.1")
    assert isinstance(settings.port, int)
    assert isinstance(settings.debug, bool)
    assert isinstance(settings.allowed_origins, list)
