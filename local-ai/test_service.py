import asyncio
import pytest
from fastapi import HTTPException
from config import Settings
from service import Generation, generate_questions


def test_local_only_configuration():
    with pytest.raises(ValueError):
        Settings(ollama_url='http://0.0.0.0:11434')
    with pytest.raises(ValueError):
        Settings(worker_url='http://public.example/v1')
    with pytest.raises(ValueError):
        Settings(generation_timeout=10000)


def test_generation_constraints():
    with pytest.raises(ValueError):
        Generation(source='x'*40001, topic='', language='en', audience='', difficulty='', count=1, types=['single'], consent=True)
    with pytest.raises(ValueError):
        Generation(topic='math', language='en', audience='', difficulty='', count=1, types=['unsupported'], consent=True)


def test_unavailable_model_is_not_fake_success(monkeypatch):
    async def offline():
        return False
    monkeypatch.setattr('service.available', offline)
    request = Generation(topic='math', language='en', audience='', difficulty='', count=1, types=['single'], consent=True)
    with pytest.raises(HTTPException) as error:
        asyncio.run(generate_questions(request))
    assert error.value.status_code == 503
    assert error.value.detail == 'modelUnavailable'
