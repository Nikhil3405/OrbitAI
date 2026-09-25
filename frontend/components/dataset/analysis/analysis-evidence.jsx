"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Database,
  BarChart3,
  Table2,
} from "lucide-react";

export default function AnalysisEvidence({ evidence = [] }) {
  if (!evidence.length) {
    return (
      <p className="text-sm text-neutral-500">
        No supporting evidence was returned.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {evidence.map((item, index) => (
        <EvidenceCard
          key={`${item.tool || "evidence"}-${index}`}
          item={item}
        />
      ))}
    </div>
  );
}

function EvidenceCard({ item }) {

  const tool = item.tool || "analysis";
  const result = item.result || {};
  const valid = item.validation?.valid !== false;

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
              <EvidenceIcon tool={tool} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-neutral-900">
                  {getTitle(tool)}
                </p>

                {valid && (
                  <span className="flex items-center gap-1 text-xs text-teal-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Validated
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-neutral-500">
                {getDescription(tool, result)}
              </p>
            </div>
          </div>

          
        </div>

        {/* Human-readable result */}
        {tool === "execute_sql" && result.rows && (
          <ResultTable
            columns={result.columns || []}
            rows={result.rows || []}
            expanded={open}
          />
        )}

        {tool === "create_chart" && (
          <div className="mt-4 rounded-lg bg-neutral-50 px-3 py-2.5 text-xs text-neutral-600">
            {getChartDescription(result)}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultTable({ columns, rows, expanded }) {
  const visibleRows = expanded ? rows : rows.slice(0, 5);

  if (!visibleRows.length) {
    return null;
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full min-w-105 text-sm">
        <thead className="bg-neutral-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="border-b border-neutral-200 px-3 py-2.5 text-left text-xs font-semibold text-neutral-600"
              >
                {formatColumnName(column)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {visibleRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-neutral-100 last:border-0"
            >
              {row.map((value, columnIndex) => (
                <td
                  key={columnIndex}
                  className="px-3 py-2.5 text-neutral-700"
                >
                  {formatValue(value, columns[columnIndex])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {!expanded && rows.length > 5 && (
        <div className="border-t border-neutral-100 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
          Showing 5 of {rows.length} results
        </div>
      )}
    </div>
  );
}

function getTitle(tool) {
  if (tool === "execute_sql") {
    return "SQL Analysis";
  }

  if (tool === "create_chart") {
    return "Visualization";
  }

  if (tool === "profile_dataset") {
    return "Dataset Profile";
  }

  if (tool === "calculate_statistics") {
    return "Statistical Analysis";
  }

  if (tool === "inspect_column") {
    return "Column Analysis";
  }

  if (tool === "detect_outliers") {
    return "Outlier Analysis";
  }

  return "Analysis";
}

function getDescription(tool, result) {
  if (tool === "execute_sql") {
    const rowCount =
      result.row_count ??
      result.rows?.length ??
      0;

    return `${rowCount} result${rowCount === 1 ? "" : "s"} returned`;
  }

  if (tool === "create_chart") {
    return "Chart generated from the analytical result";
  }

  if (tool === "profile_dataset") {
    const rows = result.rows ?? result.row_count;

    if (rows !== undefined) {
      return `Dataset profile · ${rows} rows`;
    }

    return "Dataset structure and quality information";
  }

  if (tool === "calculate_statistics") {
    return "Calculated statistics from the dataset";
  }

  if (tool === "inspect_column") {
    return "Inspected a dataset column";
  }

  if (tool === "detect_outliers") {
    return "Checked for unusual values";
  }

  return "Supporting analysis";
}

function getChartDescription(result) {
  const type = result.type
    ? formatColumnName(result.type)
    : "Chart";

  if (result.x_axis && result.y_axis) {
    return `${type} chart · ${result.x_axis} by ${formatColumnName(
      result.y_axis
    )}`;
  }

  return `${type} chart created from the analysis results.`;
}

function hasDetailedData(tool, result) {
  return (
    tool === "execute_sql" &&
    Array.isArray(result.rows) &&
    result.rows.length > 0
  );
}

function formatColumnName(value) {
  if (!value) return "";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value, column) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "number") {
    const columnName = String(column || "").toLowerCase();

    if (
      columnName.includes("revenue") ||
      columnName.includes("sales") ||
      columnName.includes("price") ||
      columnName.includes("amount")
    ) {
      return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
      }).format(value);
    }

    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(value);
  }

  return String(value);
}

function EvidenceIcon({ tool }) {
  const className = "h-4 w-4 text-neutral-600";

  if (tool === "execute_sql") {
    return <Table2 className={className} />;
  }

  if (tool === "create_chart") {
    return <BarChart3 className={className} />;
  }

  return <Database className={className} />;
}