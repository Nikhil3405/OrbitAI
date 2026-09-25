"use client";

import { CheckCircle2 } from "lucide-react";

export default function AnalysisActions({ actions = [] }) {
  const steps = buildAnalysisSteps(actions);

  if (!steps.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div
          key={`${step.type}-${index}`}
          className="flex items-start gap-3"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50">
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
          </div>

          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-medium text-neutral-900">
              {step.title}
            </p>

            <p className="mt-1 text-xs leading-5 text-neutral-500">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function buildAnalysisSteps(actions) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return [];
  }

  const successfulActions = actions.filter(
    (action) => action.status !== "failed",
  );

  const steps = [];

  const hasTool = (tool) =>
    successfulActions.some((action) => action.tool === tool);

  /*
   * 1. Dataset review
   */
  if (hasTool("profile_dataset") || successfulActions.length > 0) {
    steps.push({
      type: "dataset",
      title: "Reviewed the dataset",
      description:
        "Identified the fields and data needed to answer your question.",
    });
  }

  /*
   * 2. SQL analysis
   *
   * Multiple execute_sql calls can happen internally.
   * Show them as ONE meaningful analysis step.
   */
  const sqlActions = successfulActions.filter(
    (action) => action.tool === "execute_sql",
  );

  if (sqlActions.length > 0) {
    const description = describeSqlAnalysis(sqlActions);

    steps.push({
      type: "analysis",
      title: getAnalysisTitle(sqlActions),
      description,
    });
  }

  /*
   * 3. Statistics
   */
  if (hasTool("calculate_statistics")) {
    steps.push({
      type: "statistics",
      title: "Calculated statistics",
      description:
        "Calculated the statistical values needed to answer your question.",
    });
  }

  /*
   * 4. Outlier detection
   */
  if (hasTool("detect_outliers")) {
    steps.push({
      type: "outliers",
      title: "Checked the data",
      description:
        "Checked the relevant values for unusual or extreme observations.",
    });
  }

  /*
   * 5. Column inspection
   */
  if (hasTool("inspect_column") && !hasTool("execute_sql")) {
    steps.push({
      type: "inspection",
      title: "Inspected the relevant data",
      description:
        "Reviewed the relevant column to find the information needed for the answer.",
    });
  }

  /*
   * 6. Visualization
   */
  const chartActions = successfulActions.filter(
    (action) => action.tool === "create_chart",
  );

  if (chartActions.length > 0) {
    steps.push({
      type: "chart",
      title: "Created visualization",
      description: describeChart(chartActions[chartActions.length - 1]),
    });
  }

  return steps;
}

function getAnalysisTitle(sqlActions) {
  const sql = sqlActions
    .map((action) => action.arguments?.sql || "")
    .join(" ")
    .toLowerCase();

  if (sql.includes("group by")) {
    if (sql.includes("sum(")) {
      return "Calculated grouped totals";
    }

    if (sql.includes("avg(")) {
      return "Calculated grouped averages";
    }

    if (sql.includes("count(")) {
      return "Counted records by group";
    }

    return "Analyzed the data by group";
  }

  if (sql.includes("sum(")) {
    return "Calculated the total";
  }

  if (sql.includes("avg(")) {
    return "Calculated the average";
  }

  if (sql.includes("count(")) {
    return "Counted the records";
  }

  if (sql.includes("order by")) {
    return "Compared and ranked the results";
  }

  return "Analyzed the dataset";
}

function describeSqlAnalysis(sqlActions) {
  const sql = sqlActions
    .map((action) => action.arguments?.sql || "")
    .join(" ")
    .toLowerCase();

  const hasGroupBy = sql.includes("group by");
  const hasSum = sql.includes("sum(");
  const hasAvg = sql.includes("avg(");
  const hasCount = sql.includes("count(");
  const hasOrderBy = sql.includes("order by");

  if (hasGroupBy && hasSum) {
    return "Grouped the data and calculated total values for the relevant categories.";
  }

  if (hasGroupBy && hasAvg) {
    return "Grouped the data and calculated average values for the relevant categories.";
  }

  if (hasGroupBy && hasCount) {
    return "Grouped the data and counted the records in each category.";
  }

  if (hasSum) {
    return "Calculated the total value needed to answer your question.";
  }

  if (hasAvg) {
    return "Calculated the average value needed to answer your question.";
  }

  if (hasCount) {
    return "Counted the records needed to answer your question.";
  }

  if (hasOrderBy) {
    return "Compared the results and ranked them to identify the requested values.";
  }

  return "Queried the dataset to obtain the information needed for the answer.";
}

function describeChart(action) {
  const args = action.arguments || {};

  const chartType = args.chart_type || args.type || "chart";

  const typeLabel =
    chartType === "bar"
      ? "bar chart"
      : chartType === "line"
        ? "line chart"
        : chartType === "pie"
          ? "pie chart"
          : "visualization";

  const xAxis = args.x_axis;
  const yAxis = args.y_axis;

  if (chartType === "pie") {
    if (xAxis || yAxis) {
      const category = formatLabel(xAxis || "category");
      const metric = formatLabel(yAxis || "value");

      return `Generated a pie chart showing each ${category.toLowerCase()}'s share of ${metric.toLowerCase()}.`;
    }

    return "Generated a pie chart showing the distribution of the results.";
  }

  if (xAxis && yAxis) {
    return `Generated a ${typeLabel} comparing ${formatLabel(
      xAxis,
    )} and ${formatLabel(yAxis)}.`;
  }

  return `Generated a ${typeLabel} from the analysis results.`;
}

function formatLabel(value) {
  if (!value) return "";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}