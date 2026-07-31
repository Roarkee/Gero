from django.conf import settings


def get_llm_service():
    provider = getattr(settings, "AI_PROVIDER", "groq").lower()

    if provider == "groq":
        from .groq_llm import GroqService
        return GroqService()
    elif provider == "gemini":
        from .gemini_llm import GeminiService
        return GeminiService()
    elif provider == "openai":
        from .openai_llm import OpenAILLM
        return OpenAILLM()
    elif provider == "anthropic":
        from .anthropic_llm import AnthropicService
        return AnthropicService()
    else:
        raise ValueError(
            f"Unknown AI provider '{provider}'. "
            "Valid options: 'groq', 'gemini', 'openai', 'anthropic'."
        )
