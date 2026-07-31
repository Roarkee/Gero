from __future__ import annotations

import logging
from typing import Any

from .gemini_llm import GeminiService
from .anthropic_llm import AnthropicService
from .openai_llm import OpenAILLM
from .groq_llm import GroqService

logger = logging.getLogger(__name__)

_REGISTRY: dict[str, type] = {
    "groq":      GroqService,
    "gemini":    GeminiService,
    "openai":    OpenAILLM,
    "anthropic": AnthropicService,
}


class LLMFactory:

    @classmethod
    def register(cls, name: str, provider_cls: type) -> None:
        _REGISTRY[name.lower()] = provider_cls
        logger.debug("LLMFactory: registered provider '%s' → %s", name, provider_cls.__name__)

    @classmethod
    def get_provider(cls, name: str) -> Any:
        key = name.lower()
        provider_cls = _REGISTRY.get(key)
        if provider_cls is None:
            available = ", ".join(sorted(_REGISTRY.keys()))
            raise ValueError(
                f"Unknown AI provider '{name}'. "
                f"Available providers: {available}. "
                f"Register a new provider with LLMFactory.register()."
            )
        logger.debug("LLMFactory: instantiating provider '%s'", key)
        return provider_cls()
