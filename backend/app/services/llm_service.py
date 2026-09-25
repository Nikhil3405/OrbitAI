import json

from groq import Groq

from app.core.config import settings
from app.schemas.semantic_schema import SemanticSchema
from app.schemas.cleaning import CleaningPlan


class LLMService:

    def __init__(self):
        self.client = Groq(
            api_key=settings.GROQ_API_KEY
        )

    def generate_semantic_schema(
        self,
        columns: list[dict],
    ) -> SemanticSchema:

        column_text = "\n".join(
            f"- {column['name']} ({column['type']})"
            for column in columns
        )

        system_prompt = """
You are a data schema understanding assistant.

Create a semantic schema for the supplied dataset columns.

Return ONLY valid JSON in exactly this structure:

{
  "columns": [
    {
      "name": "exact column name",
      "description": "short description",
      "aliases": ["alias1", "alias2", "alias3"]
    }
  ]
}

The top-level JSON value MUST be an object.

The object MUST contain a "columns" array.

For every column:

- Preserve the exact column name.
- Provide a concise description.
- Provide useful natural-language aliases.
- Include simple canonical terms users are likely to use.
- Avoid overly broad aliases that could describe multiple columns.

Rules:

- Do not invent columns.
- Do not rename columns.
- Do not analyze dataset rows.
- Keep aliases practical and concise.
- Do not return anything outside the JSON object.
"""

        user_prompt = f"""
Dataset columns:

{column_text}
"""

        response = self.client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            temperature=0,
            response_format={
                "type": "json_object",
            },
        )

        raw_content = (
            response.choices[0]
            .message.content
        )

        data = json.loads(raw_content)

        return SemanticSchema.model_validate(
            data
        )

    def generate_cleaning_plan(
        self,
        profile: dict,
    ) -> CleaningPlan:

        profile_text = json.dumps(
            profile,
            indent=2,
            default=str,
        )

        system_prompt = """
You are a conservative data cleaning planning assistant.

Analyze the supplied dataset profile and propose a
SAFE and MINIMAL cleaning plan.

Return ONLY valid JSON in exactly this structure:

{
  "operations": [
    {
      "operation": "fill_missing",
      "column": "column name",
      "strategy": "mean",
      "reason": "short explanation"
    }
  ]
}

The top-level JSON value MUST be an object.

The object MUST contain an "operations" array.

Every operation MUST contain:

- "operation"
- "reason"

The "column" field is required when the operation applies
to a specific column.

The "strategy" field MUST be provided for:

- fill_missing
- normalize_categories
- convert_type
- handle_outliers

The "strategy" field MUST be omitted or null for:

- remove_invalid_dates
- remove_duplicates

Allowed operations:

- fill_missing
- remove_duplicates
- normalize_categories
- convert_type
- remove_invalid_dates
- handle_outliers

GENERAL RULES:

- Only propose operations supported by the quality issues.
- Use only columns that actually exist.
- Do not invent columns.
- Do not execute any cleaning.
- Prefer conservative cleaning.
- Do not propose unnecessary operations.
- Return an empty operations list if no cleaning is needed.
- Never remove rows merely because they are statistical outliers.
- A statistical outlier may be a legitimate observation.
- Especially for financial, sales, movie, sports, scientific,
  or other real-world datasets, extreme values may be valid.

FOR NORMALIZE_CATEGORIES:

- Always use strategy "trim_lowercase".

FOR FILL_MISSING:

- Always use strategy "mean", "median", or "mode".
- Only propose this when the profile shows missing values.

FOR CONVERT_TYPE:

- Always set strategy to the target type:
  "integer", "float", "string", "date", or "datetime".
- Only propose this when the profile indicates a type problem.

FOR HANDLE_OUTLIERS:

- Always use strategy "iqr".
- IMPORTANT: This operation ONLY DETECTS and REPORTS outliers.
- It MUST NOT imply that rows will be removed.
- The reason MUST clearly state that outliers are being flagged
  rather than deleted.
- Never write "remove", "delete", "cap/remove", or similar language
  for an outlier operation.

Example:

{
  "operation": "handle_outliers",
  "column": "WorldGross",
  "strategy": "iqr",
  "reason": "IQR detected unusually high or low values; flag them for review while retaining potentially valid movie records."
}

FOR REMOVE_INVALID_DATES:

- Only propose when actual invalid date values are detected.
- These operations may remove rows containing invalid dates.
- Explain that the affected rows contain invalid date values.

FOR REMOVE_DUPLICATES:

- Only propose when duplicate rows are detected.
- Only exact duplicate rows should be removed.
- Keep the first occurrence.
- Clearly state how many duplicates were detected when that
  information is available in the profile.

IMPORTANT:

Do not confuse:
- missing values
- duplicate rows
- invalid values
- statistical outliers

Missing values are values that need filling.

Duplicates are repeated records.

Invalid values are values that violate the expected data type
or format.

Outliers are unusual but potentially legitimate observations.

Return JSON only.
"""

        user_prompt = f"""
Dataset profile:

{profile_text}
"""

        response = self.client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            temperature=0,
            response_format={
                "type": "json_object",
            },
        )

        raw_content = (
            response.choices[0]
            .message.content
        )

        data = json.loads(raw_content)

        return CleaningPlan.model_validate(
            data
        )