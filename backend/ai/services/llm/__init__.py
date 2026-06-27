from django.conf import settings
from .anthropic_llm import AnthropicService
from .openai_llm import OpenAILLM

def get_llm_service():
    provider = getattr(settings, "AI_PROVIDER", "anthropic").lower()
    if provider == "openai":
        return OpenAILLM()
    elif provider == "anthropic":
        return AnthropicService()
    else:
        raise ValueError(f"Unknown AI provider '{provider}' configured.")
