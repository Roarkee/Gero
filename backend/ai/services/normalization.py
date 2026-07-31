import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


class NormalizationService:
    """
    Normalizes values in a parsed JSON dictionary before Pydantic validation.
    This service operates purely on values (e.g., converting 'TRUE' to True,
    stripping currency symbols, taking the upper bound of a week range),
    and performs no schema validation.
    """

    @classmethod
    def normalize(cls, data: Any) -> Any:
        """Recursively normalizes a dictionary or list of dictionaries."""
        if isinstance(data, list):
            return [cls.normalize(item) for item in data]
        if not isinstance(data, dict):
            return cls.normalize_value(data)

        normalized = {}
        for k, v in data.items():
            normalized[k] = cls.normalize(v)
        return normalized

    @classmethod
    def normalize_value(cls, value: Any) -> Any:
        if value is None:
            return None

        if isinstance(value, str):
            val_strip = value.strip()

            # Empty strings normalized to None (often preferred over "")
            if not val_strip:
                return None

            val_lower = val_strip.lower()

            # Normalize booleans
            if val_lower in ("true", "yes"):
                return True
            if val_lower in ("false", "no"):
                return False

            # Normalize week ranges (e.g., "10-12 weeks" -> 12, "8 weeks" -> 8)
            week_match = re.match(r"^(?:(\d+)\s*[-–to]\s*)?(\d+)\s*(?:weeks?|wks?)$", val_lower)
            if week_match:
                return float(week_match.group(2))

            # Normalize currency / numeric strings (e.g., "$18,000", "USD 18000")
            num_match = re.match(r"^(?:usd|eur|gbp|\$|€|£)?\s*([\d,]+(?:\.\d+)?)\s*(?:usd|eur|gbp)?$", val_lower)
            if num_match:
                clean_num = num_match.group(1).replace(",", "")
                try:
                    return float(clean_num) if "." in clean_num else int(clean_num)
                except ValueError:
                    pass

            # Remove percentage signs
            if val_strip.endswith("%"):
                clean_num = val_strip[:-1].strip()
                try:
                    return float(clean_num) if "." in clean_num else int(clean_num)
                except ValueError:
                    pass

            return val_strip

        return value
