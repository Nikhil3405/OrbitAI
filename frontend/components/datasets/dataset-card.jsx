import Link from "next/link";
import { Database, ArrowUpRight } from "lucide-react";

export default function DatasetCard({ dataset }) {
  return (
    <Link
      href={`/datasets/${dataset.id}`}
      className="group block rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
            <Database className="h-5 w-5 text-neutral-700" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-neutral-950">
              {dataset.name}
            </h3>

            <p className="mt-1 text-xs text-neutral-500">
              {dataset.row_count ?? 0} rows · {dataset.column_count ?? 0} columns
            </p>
          </div>
        </div>

        <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-400 transition group-hover:text-neutral-950" />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-neutral-500">
          {dataset.status || "Ready"}
        </span>

        <span className="h-2 w-2 rounded-full bg-teal-500" />
      </div>
    </Link>
  );
}