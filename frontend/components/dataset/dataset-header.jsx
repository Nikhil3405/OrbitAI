"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function DatasetHeader({ dataset }) {
  return (
    <div className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/datasets"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Datasets
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-neutral-950">
              {dataset?.name || "Dataset"}
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              {dataset?.row_count ?? 0} rows ·{" "}
              {dataset?.column_count ?? 0} columns
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {dataset?.status || "Ready"}
          </div>
        </div>
      </div>
    </div>
  );
}