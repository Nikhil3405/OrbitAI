from typing import Any


class ResultValidationService:
    def validate(
        self,
        result: dict[str, Any],
    ) -> dict[str, Any]:
        if not result.get("success", True):
            return {
                "valid": False,
                "reason": "Tool execution failed.",
            }

        if "rows" in result:
            rows = result["rows"]

            if not isinstance(rows, list):
                return {
                    "valid": False,
                    "reason": "Invalid result rows.",
                }

            if len(rows) > 500:
                return {
                    "valid": False,
                    "reason": "Result exceeds allowed size.",
                }

        return {
            "valid": True,
            "reason": "Result is valid.",
        }