TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "profile_dataset",
            "description": (
                "Get basic dataset structure, row count "
                "and column information."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "inspect_column",
            "description": (
                "Inspect a specific dataset column "
                "including nulls, unique values and samples."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "column": {
                        "type": "string",
                    },
                },
                "required": ["column"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "execute_sql",
            "description": (
                "Execute a read-only SQL query against "
                "the dataset. Use for aggregation, "
                "filtering and comparisons."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                    },
                },
                "required": ["sql"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_statistics",
            "description": (
                "Calculate deterministic numerical "
                "statistics for a column."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "column": {
                        "type": "string",
                    },
                },
                "required": ["column"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "detect_outliers",
            "description": (
                "Detect numerical outliers using "
                "the IQR method."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "column": {
                        "type": "string",
                    },
                },
                "required": ["column"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_chart",
            "description": (
                "Create a chart specification from analytical "
                "results when a visualization would help answer "
                "the user's question."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "chart_type": {
                        "type": "string",
                        "enum": [
                            "bar",
                            "line",
                            "pie",
                            "area",
                        ],
                    },
                    "title": {
                        "type": "string",
                    },
                    "x_axis": {
                        "type": "string",
                    },
                    "y_axis": {
                        "type": "string",
                    },
                    "data": {
                        "type": "array",
                        "items": {
                            "type": "object",
                        },
                    },
                },
                "required": [
                    "chart_type",
                    "title",
                    "x_axis",
                    "y_axis",
                    "data",
                ],
            },
        },
    },
]