"use client";

import {
  CalendarX2,
  CheckCircle2,
  Copy,
  Database,
  Hash,
  Wand2,
} from "lucide-react";

const operationInfo = {
  fill_missing: {
    label: "Fill missing values",
    icon: Database,
  },
  remove_duplicates: {
    label: "Remove duplicates",
    icon: Copy,
  },
  normalize_categories: {
    label: "Normalize categories",
    icon: Wand2,
  },
  convert_type: {
    label: "Convert data type",
    icon: Database,
  },
  remove_invalid_dates: {
    label: "Remove invalid dates",
    icon: CalendarX2,
  },
  handle_outliers: {
    label: "Handle outliers",
    icon: Hash,
  },
};

export default function CleaningOperation({
  operation,
  index,
}) {
  const info =
    operationInfo[operation.operation] || {
      label: operation.operation,
      icon: Database,
    };

  const Icon = info.icon;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium text-neutral-950">
              {info.label}
            </h4>

            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
              Step {index + 1}
            </span>
          </div>

          {operation.column && (
            <p className="mt-1 text-sm text-neutral-500">
              Column:{" "}
              <span className="font-medium text-neutral-700">
                {operation.column}
              </span>
            </p>
          )}

          {operation.strategy && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Strategy
              </p>

              <p className="mt-1 text-sm text-neutral-700">
                {operation.strategy}
              </p>
            </div>
          )}

          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Why OrbitAI proposed this
            </p>

            <p className="mt-1 text-sm leading-6 text-neutral-600">
              {operation.reason}
            </p>
          </div>
        </div>

        <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
      </div>
    </div>
  );
}