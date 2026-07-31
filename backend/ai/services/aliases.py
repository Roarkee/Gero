import logging
from typing import Any

logger = logging.getLogger(__name__)

# Common misnomers mapped to canonical keys
_COMMON_ALIASES = {
    "total_hours": "estimated_total_hours",
    "estimated_hours": "estimated_total_hours",
    "phaseBreakdown": "phase_breakdown",
    "phase_details": "phase_breakdown",
    "timeline": "timeline_weeks",
    "budget_amount": "budget",
    "currency_code": "currency",
    "client_company": "company",
}


class AliasMapper:
    """
    Recursively replaces common LLM key misnomers with their canonical Pydantic model keys.
    """

    @classmethod
    def apply_aliases(cls, data: Any, aliases: dict[str, str] | None = None) -> Any:
        mapping = aliases or _COMMON_ALIASES

        if isinstance(data, list):
            return [cls.apply_aliases(item, mapping) for item in data]
        if not isinstance(data, dict):
            return data

        mapped = {}
        for k, v in data.items():
            canonical_key = mapping.get(k, k)
            mapped[canonical_key] = cls.apply_aliases(v, mapping)

        return mapped
