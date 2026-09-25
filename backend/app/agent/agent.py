import json
from typing import Any

from groq import Groq

from app.agent.tool_definitions import TOOLS
from app.agent.tools import ToolRegistry
from app.core.config import settings
from app.core.constants import (
    MAX_AGENT_RETRIES,
    MAX_AGENT_STEPS,
)
from app.services.result_validation_service import (
    ResultValidationService,
)


class DataAnalysisAgent:
    def __init__(self):
        self.client = Groq(
            api_key=settings.GROQ_API_KEY
        )

        self.tool_registry = ToolRegistry()

        self.result_validator = (
            ResultValidationService()
        )

    def run(
        self,
        file_path: str,
        question: str,
        semantic_schema: dict | None = None,
    ) -> dict[str, Any]:

        messages = [
            {
                "role": "system",
                "content": self._system_prompt(),
            },
            {
                "role": "user",
                "content": self._build_user_message(
                    question,
                    semantic_schema,
                ),
            },
        ]

        actions = []
        evidence = []
        charts = []

        tool_retries = {}

        for _ in range(MAX_AGENT_STEPS):

            response = (
                self.client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=messages,
                    tools=TOOLS,
                    tool_choice="auto",
                    temperature=0,
                )
            )

            message = response.choices[0].message

            # ---------------------------------------------------------
            # Agent has finished its analysis.
            # ---------------------------------------------------------
            if not message.tool_calls:
                return {
                    "answer": message.content or "",
                    "actions": actions,
                    "evidence": evidence,
                    "charts": charts,
                }

            # ---------------------------------------------------------
            # Add assistant tool-call message back to conversation.
            # ---------------------------------------------------------
            messages.append(
                {
                    "role": "assistant",
                    "content": message.content,
                    "tool_calls": [
                        {
                            "id": tool_call.id,
                            "type": "function",
                            "function": {
                                "name": tool_call.function.name,
                                "arguments": tool_call.function.arguments,
                            },
                        }
                        for tool_call in message.tool_calls
                    ],
                }
            )

            for tool_call in message.tool_calls:

                tool_name = (
                    tool_call.function.name
                )

                arguments = {}

                try:
                    arguments = json.loads(
                        tool_call.function.arguments
                    )

                    result = (
                        self.tool_registry.execute(
                            tool_name=tool_name,
                            arguments=arguments,
                            file_path=file_path,
                        )
                    )

                    validation = (
                        self.result_validator.validate(
                            result
                        )
                    )

                    if not validation["valid"]:
                        raise ValueError(
                            validation["reason"]
                        )

                    # -------------------------------------------------
                    # Successful tool execution.
                    # -------------------------------------------------
                    actions.append(
                        {
                            "tool": tool_name,
                            "arguments": arguments,
                            "status": "completed",
                        }
                    )

                    evidence.append(
                        {
                            "tool": tool_name,
                            "result": result,
                            "validation": validation,
                        }
                    )

                    # -------------------------------------------------
                    # Store chart results separately.
                    # -------------------------------------------------
                    if tool_name == "create_chart":
                        charts.append(result)

                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": json.dumps(
                                result,
                                default=str,
                            ),
                        }
                    )

                    # -------------------------------------------------
                    # IMPORTANT:
                    #
                    # If the agent has just executed an analytical
                    # query that clearly benefits from visualization,
                    # explicitly remind it to consider create_chart
                    # before producing the final answer.
                    #
                    # This does NOT execute the chart tool itself.
                    # The agent still decides whether/how to use it.
                    # -------------------------------------------------
                    if tool_name == "execute_sql":
                        chart_instruction = self._chart_followup_instruction(
                            question=question,
                            result=result,
                        )

                        if chart_instruction:
                            messages.append(
                                {
                                    "role": "user",
                                    "content": chart_instruction,
                                }
                            )

                except Exception as error:

                    retry_key = self._retry_key(
                        tool_name,
                        arguments,
                    )

                    tool_retries[retry_key] = (
                        tool_retries.get(retry_key, 0) + 1
                    )

                    retry_count = tool_retries[
                        retry_key
                    ]

                    actions.append(
                        {
                            "tool": tool_name,
                            "arguments": arguments,
                            "status": "failed",
                            "error": str(error),
                        }
                    )

                    error_result = {
                        "error": str(error),
                        "retry_count": retry_count,
                        "max_retries": MAX_AGENT_RETRIES,
                    }

                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": json.dumps(
                                error_result,
                                default=str,
                            ),
                        }
                    )

                    # -------------------------------------------------
                    # Allow the LLM to correct the failed tool call.
                    # -------------------------------------------------
                    if retry_count >= MAX_AGENT_RETRIES:
                        return {
                            "answer": (
                                "I could not complete "
                                "the analysis because "
                                "a required analytical "
                                "tool failed."
                            ),
                            "actions": actions,
                            "evidence": evidence,
                            "charts": charts,
                        }

        return {
            "answer": (
                "I could not complete the analysis "
                "within the allowed number of steps."
            ),
            "actions": actions,
            "evidence": evidence,
            "charts": charts,
        }

    @staticmethod
    def _retry_key(
        tool_name: str,
        arguments: dict,
    ) -> str:
        """
        Create a stable retry key.

        Tool-call IDs generated by the LLM can change when
        the model retries. Tool name + arguments gives us
        a stable identifier for the same attempted operation.
        """
        return (
            f"{tool_name}:"
            f"{json.dumps(arguments, sort_keys=True, default=str)}"
        )

    @staticmethod
    def _chart_followup_instruction(
        question: str,
        result: Any,
    ) -> str | None:
        """
        Decide whether the agent should be explicitly reminded
        to consider visualization after an analytical SQL result.

        The application does not create the chart here.
        The LLM still chooses the create_chart tool.
        """

        question_lower = question.lower()

        visualization_terms = (
            "chart",
            "graph",
            "visualize",
            "visualise",
            "plot",
            "show",
            "trend",
            "over time",
            "by product",
            "by category",
            "by region",
            "by city",
            "by month",
            "by date",
            "top",
            "highest",
            "lowest",
            "compare",
            "comparison",
            "distribution",
        )

        if not any(
            term in question_lower
            for term in visualization_terms
        ):
            return None

        if not isinstance(result, dict):
            return None

        columns = result.get("columns", [])
        rows = result.get("rows", [])

        if not columns or not rows:
            return None

        return """
The analytical SQL result is now available.

Before giving the final answer, evaluate whether this result
should be visualized.

For this question, the user is asking for a comparison,
ranking, grouping, trend, or another result that can benefit
from a chart.

If the result is suitable for visualization:

1. Call create_chart.
2. Use ONLY the data returned by execute_sql.
3. Do not invent or modify values.
4. Choose:
   - bar chart for category comparisons or rankings
   - line chart for time-based trends
   - pie chart only for simple proportions
5. Then provide the concise final answer.

Do not skip create_chart when the returned analytical result
clearly benefits from visualization.
"""

    @staticmethod
    def _system_prompt() -> str:
        return """
    You are OrbitAI, an agentic data analysis assistant.

    Answer questions about the user's dataset using the available tools.

    CORE RULES:
    1. Use tools whenever dataset information is required.
    2. Never invent, estimate, or guess values.
    3. Use only columns that exist in the dataset or semantic schema.
    4. Prefer exact results returned by analytical tools.
    5. Inspect tool results before deciding whether another tool is needed.
    6. Use multiple tools when necessary.
    7. SQL must be read-only. Never modify the dataset.
    8. If the evidence is insufficient, clearly say so.
    9. Every numerical claim must be supported by actual tool results.
    10. Never expose chain-of-thought, internal reasoning, tool JSON, or internal tool references.

    VISUALIZATION:
    11. Use create_chart when the analytical result benefits from visualization.
    12. Use only actual results returned by analytical tools as chart data.
    13. Never invent, estimate, or modify chart values.
    14. Use:
        - bar charts for category comparisons and rankings
        - line charts for time-based trends
        - pie charts only for simple proportions
    15. Do not create a chart when the result is unsuitable for visualization.
    16. The application displays charts separately. Do not describe, announce, or reproduce
        the chart in the final answer.

    FINAL ANSWER:
    17. Keep the answer concise, clear, and user-friendly.
    18. Start with a short descriptive heading when appropriate.
    19. State the main finding in 1–3 sentences.
    20. Use a clean markdown table when multiple values need comparison.
    21. Use bullet points for a small number of findings.
    22. Format numerical values clearly.
    23. Do not repeat information unnecessarily.
    24. Do not include raw JSON.
    25. Do not include SQL unless the user explicitly asks for it.
    26. Do not include tool names unless they are useful to explain the evidence.
    27. Do not include internal references such as:
        【execute_sql result】
        【create_chart result】
    28. Do not mention internal agent steps or tool execution.
    29. Every numerical claim must come from the actual tool results.
    30. Do not mention or describe a visualization that the application
        already displays separately.
    31. Do not say "the chart shows", "the graph shows", "a bar chart
        visualizes", or similar phrases when a chart is already displayed.
        
    AVAILABLE TOOLS:
    - profile_dataset
    - inspect_column
    - execute_sql
    - calculate_statistics
    - detect_outliers
    - create_chart
    """

    @staticmethod
    def _build_user_message(
        question: str,
        semantic_schema: dict | None,
    ) -> str:

        if not semantic_schema:
            return question

        return f"""
Dataset semantic schema:

{json.dumps(
    semantic_schema,
    indent=2,
)}

User question:

{question}
"""

