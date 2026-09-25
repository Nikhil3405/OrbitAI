"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

const severityStyles = {
  high: {
    badge: "bg-red-50 text-red-700",
    label: "High",
  },
  medium: {
    badge: "bg-orange-50 text-orange-700",
    label: "Medium",
  },
  low: {
    badge: "bg-blue-50 text-blue-700",
    label: "Low",
  },
};

const issueLabels = {
  categorical_inconsistency: "Categorical inconsistency",
  invalid_dates: "Invalid dates",
  missing_values: "Missing values",
  duplicate_rows: "Duplicate rows",
  potential_duplicate_id: "Potential duplicate ID",
};

function getIssueDescription(issue) {
  switch (issue.type) {
    case "categorical_inconsistency":
      return "Different values appear to represent the same category.";

    case "invalid_dates":
      return "Some values in this column could not be interpreted as valid dates.";

    case "missing_values":
      return "This column contains missing values that may need to be filled or handled.";

    case "duplicate_rows":
      return "Duplicate rows were detected in the dataset.";

    case "potential_duplicate_id":
      return "An identifier appears more than once and may represent duplicate records.";

    default:
      return "A data quality issue was detected.";
  }
}

export default function QualityIssues({ issues = [] }) {
  const [expanded, setExpanded] = useState(null);

  if (!issues.length) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-50">
          <span className="text-teal-600">✓</span>
        </div>

        <h3 className="mt-3 font-medium text-neutral-950">
          No quality issues found
        </h3>

        <p className="mt-1 text-sm text-neutral-500">
          Your dataset looks clean.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-5 py-4">
        <h3 className="font-semibold text-neutral-950">
          Detected Issues
        </h3>

        <p className="mt-1 text-sm text-neutral-500">
          Problems OrbitAI detected during profiling.
        </p>
      </div>

      <div className="divide-y divide-neutral-100">
        {issues.map((issue, index) => {
          const severity =
            severityStyles[issue.severity] || severityStyles.low;

          const isExpanded = expanded === index;

          return (
            <div key={`${issue.type}-${index}`} className="px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setExpanded(isExpanded ? null : index)
                }
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    <AlertTriangle className="h-4 w-4 text-neutral-600" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-neutral-950">
                        {issueLabels[issue.type] || issue.type}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${severity.badge}`}
                      >
                        {severity.label}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-neutral-500">
                      {issue.column && (
                        <span>
                          Column:{" "}
                          <span className="font-medium text-neutral-700">
                            {issue.column}
                          </span>
                        </span>
                      )}

                      {issue.count !== undefined && (
                        <span>
                          Count:{" "}
                          <span className="font-medium text-neutral-700">
                            {issue.count}
                          </span>
                        </span>
                      )}

                      {issue.percentage !== undefined && (
                        <span>
                          {issue.percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded ? (
                  <ChevronUp className="ml-3 h-4 w-4 shrink-0 text-neutral-400" />
                ) : (
                  <ChevronDown className="ml-3 h-4 w-4 shrink-0 text-neutral-400" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-11 mt-4">
                  <div className="rounded-lg bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-600">
                      {getIssueDescription(issue)}
                    </p>

                    {/* Categorical inconsistency details */}
                    {issue.type === "categorical_inconsistency" &&
                      issue.examples?.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {issue.examples.map(
                            (example, exampleIndex) => (
                              <div
                                key={exampleIndex}
                                className="rounded-lg border border-neutral-200 bg-white p-3"
                              >
                                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                  Normalized value
                                </p>

                                <p className="mt-1 text-sm font-medium text-neutral-900">
                                  {example.normalized}
                                </p>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  {example.values.map(
                                    (value, valueIndex) => (
                                      <span
                                        key={valueIndex}
                                        className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600"
                                      >
                                        {value}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {/* Invalid date details */}
                    {issue.type === "invalid_dates" && (
                      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                          Affected column
                        </p>

                        <p className="mt-1 text-sm font-medium text-neutral-900">
                          {issue.column}
                        </p>

                        <p className="mt-2 text-xs text-neutral-500">
                          Invalid values detected: {issue.count}
                        </p>
                      </div>
                    )}

                    {/* Missing value details */}
                    {issue.type === "missing_values" && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-neutral-200 bg-white p-3">
                          <p className="text-xs text-neutral-500">
                            Missing values
                          </p>

                          <p className="mt-1 text-lg font-semibold text-neutral-950">
                            {issue.count}
                          </p>
                        </div>

                        <div className="rounded-lg border border-neutral-200 bg-white p-3">
                          <p className="text-xs text-neutral-500">
                            Missing percentage
                          </p>

                          <p className="mt-1 text-lg font-semibold text-neutral-950">
                            {issue.percentage}%
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Duplicate row details */}
                    {issue.type === "duplicate_rows" && (
                      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                          Duplicate rows detected
                        </p>

                        <p className="mt-1 text-sm font-medium text-neutral-900">
                          {issue.count} duplicate row
                          {issue.count !== 1 ? "s" : ""}
                        </p>

                        <p className="mt-2 text-xs text-neutral-500">
                          These rows contain identical values across
                          the dataset.
                        </p>
                      </div>
                    )}

                    {/* Potential duplicate ID details */}
                    {issue.type === "potential_duplicate_id" && (
                      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                          Identifier column
                        </p>

                        <p className="mt-1 text-sm font-medium text-neutral-900">
                          {issue.column}
                        </p>

                        <p className="mt-2 text-xs text-neutral-500">
                          Potential duplicate records: {issue.count}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}