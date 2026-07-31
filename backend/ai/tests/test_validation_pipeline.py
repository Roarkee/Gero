import pytest
from unittest.mock import Mock
from pydantic import BaseModel
from ai.services.pipeline import ValidationPipeline

class DummySchema(BaseModel):
    name: str
    age: int

def test_validation_pipeline_success():
    llm_mock = Mock()
    raw = '{"name": "Alice", "age": 30}'
    
    result = ValidationPipeline.run(
        llm_service=llm_mock,
        schema_cls=DummySchema,
        prompt="prompt",
        raw_response=raw
    )
    
    assert result.success is True
    assert result.data.name == "Alice"
    assert result.data.age == 30
    assert llm_mock.generate.call_count == 0

def test_validation_pipeline_self_correction_success(settings):
    settings.AI_ENABLE_SELF_CORRECTION = True
    llm_mock = Mock()
    llm_mock.generate.return_value = '{"name": "Alice", "age": 30}'
    
    raw = '{"name": "Alice"}' # Missing age
    
    result = ValidationPipeline.run(
        llm_service=llm_mock,
        schema_cls=DummySchema,
        prompt="prompt",
        raw_response=raw
    )
    
    assert result.success is True
    assert result.data.name == "Alice"
    assert result.data.age == 30
    assert llm_mock.generate.call_count == 1
    
def test_validation_pipeline_self_correction_fails(settings):
    settings.AI_ENABLE_SELF_CORRECTION = True
    llm_mock = Mock()
    llm_mock.generate.return_value = '{"name": "Alice"}' # Still missing age
    
    raw = '{"name": "Alice"}'
    
    result = ValidationPipeline.run(
        llm_service=llm_mock,
        schema_cls=DummySchema,
        prompt="prompt",
        raw_response=raw
    )
    
    assert result.success is False
    assert result.data is None
    assert llm_mock.generate.call_count == 1
