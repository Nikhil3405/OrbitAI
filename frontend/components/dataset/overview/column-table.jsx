"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ColumnTable({ columns = [] }) {
  const [expandedColumn, setExpandedColumn] = useState(null);

  if (!columns.length) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-sm text-neutral-500">
          No column information available.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-162.5 text-left">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Column
              </th>

              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Type
              </th>

              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Missing
              </th>

              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Unique
              </th>

              <th className="px-5 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {columns.map((column) => {
              const expanded = expandedColumn === column.name;

              return (
                <tr key={column.name} className="align-top">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-neutral-950">
                      {column.name}
                    </p>

                    {expanded && column.statistics && (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                        <Stat
                          label="Min"
                          value={column.statistics.min}
                        />
                        <Stat
                          label="Max"
                          value={column.statistics.max}
                        />
                        <Stat
                          label="Mean"
                          value={column.statistics.mean}
                        />
                        <Stat
                          label="Median"
                          value={column.statistics.median}
                        />
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm text-neutral-600">
                    {column.type}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={
                        column.missing?.count > 0
                          ? "text-orange-600"
                          : "text-teal-600"
                      }
                    >
                      {column.missing?.count || 0}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-neutral-600">
                    {column.unique_count ?? 0}
                  </td>

                  <td className="px-5 py-4 text-right">
                    {column.statistics && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedColumn(
                            expanded ? null : column.name
                          )
                        }
                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                      >
                        {expanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-neutral-50 p-2.5">
      <p className="text-neutral-500">{label}</p>
      <p className="mt-0.5 font-medium text-neutral-900">
        {value ?? "—"}
      </p>
    </div>
  );
}