from ..schemas import proj_spec_schema
schema = proj_spec_schema.ProjectSpecification.model_json_schema()

EXTRACTION_PROMPT = f"""
You are a software project extraction engine.

Your task is to analyze a freelance client request and convert it into structured project data.

### SCHEMA:
The following is the validation schema. Use it only as a reference. Return a JSON object that conforms to this schema. Do NOT reproduce the schema.

{schema}

Rules:

1. Extract explicitly stated information.

2. Infer missing information only when confidence is high.

3. Never invent values.

If information is unavailable:

- use null for optional fields
- use [] for empty arrays

4. Estimate complexity for every feature.

Complexity rubric:

low:
- forms
- authentication
- blog
- contact page

medium:
- payments
- booking systems
- dashboards
- search/filtering

high:
- AI features
- real-time messaging
- video streaming
- marketplaces
- collaborative editing

5. Estimate development hours per feature.

6. Infer technical requirements.

7. Estimate project complexity score 1-100.

8. Estimate confidence score:

1.0 = highly explicit request

0.7 = some inference required

0.4 = highly ambiguous request

CRITICAL INSTRUCTIONS:
Return ONLY a valid JSON object.
Return an INSTANCE of ProjectSpecification with real values.
Do NOT return the schema definition.
Do NOT include the following schema keywords in your output:
  - `$defs`
  - `properties`
  - `required`
  - `title`
  - `type`
The output must validate directly with `ProjectSpecification.model_validate_json()`.
No markdown.
No code fences (do not wrap in ```json).
No explanations or text before or after the JSON.
Do not omit required fields.
Do not rename fields.
If a value cannot be determined, use null or [].
Never invent new keys.
"""
