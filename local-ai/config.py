from urllib.parse import urlparse
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')
    ollama_url: str = 'http://127.0.0.1:11434'
    ollama_model: str = ''
    worker_url: str = 'http://127.0.0.1:8787/v1'
    agent_secret: str = ''
    generation_timeout: int = 150

    @field_validator('ollama_url')
    @classmethod
    def loopback_only(cls, value):
        parsed = urlparse(value)
        if parsed.hostname not in ('127.0.0.1', 'localhost', '::1') or parsed.scheme != 'http':
            raise ValueError('Ollama must remain on loopback HTTP')
        return value.rstrip('/')

    @field_validator('worker_url')
    @classmethod
    def secure_worker(cls, value):
        parsed = urlparse(value)
        if parsed.scheme != 'https' and parsed.hostname not in ('127.0.0.1', 'localhost', '::1'):
            raise ValueError('Remote Worker requires HTTPS')
        return value.rstrip('/')

    @field_validator('generation_timeout')
    @classmethod
    def bounded_timeout(cls, value):
        if not 10 <= value <= 600:
            raise ValueError('Generation timeout must be 10–600 seconds')
        return value
