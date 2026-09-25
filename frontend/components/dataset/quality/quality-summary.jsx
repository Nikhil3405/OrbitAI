"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileWarning,
  Hash,
  Rows3,
} from "lucide-react";

const cards = [
  {
    key: "missing_values",
    label: "Missing Values",
    icon: FileWarning,
    color: "orange",
  },
  {
    key: "duplicate_rows",
    label: "Duplicate Rows",
    icon: Copy,
    color: "orange",
  },
  {
    key: "invalid_dates",
    label: "Invalid Dates",
    icon: AlertTriangle,
    color: "orange",
  },
  {
    key: "categorical_inconsistencies",
    label: "Category Issues",
    icon: Hash,
    color: "orange",
  },
  {
    key: "potential_duplicate_ids",
    label: "Duplicate IDs",
    icon: Rows3,
    color: "orange",
  },
];

const colorClasses = {
  orange: "bg-orange-50 text-orange-600",
};

export default function QualitySummary({ quality }) {
  const hasIssues = quality?.overall_status === "issues_found";

  if (!quality) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950">
            Data Quality
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Review issues detected in your dataset.
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
            hasIssues
              ? "bg-orange-50 text-orange-700"
              : "bg-teal-50 text-teal-700"
          }`}
        >
          {hasIssues ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}

          {hasIssues ? "Issues Found" : "Good Quality"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = quality.summary?.[card.key] ?? 0;

          return (
            <div
              key={card.key}
              className="rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${colorClasses[card.color]}`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <p className="text-2xl font-semibold text-neutral-950">
                {value}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Rows3 className="h-4 w-4 text-neutral-500" />

          <span className="text-sm font-medium text-neutral-700">
            Dataset size
          </span>
        </div>

        <p className="mt-2 text-2xl font-semibold text-neutral-950">
          {quality.rows?.toLocaleString()}
        </p>

        <p className="text-sm text-neutral-500">
          rows analyzed
        </p>
      </div>
    </div>
  );
}