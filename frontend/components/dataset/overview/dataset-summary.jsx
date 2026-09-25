import {
  Rows3,
  Columns3,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";

function SummaryCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="mt-4 text-sm text-neutral-500">{label}</p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
        {value}
      </p>
    </div>
  );
}

export default function DatasetSummary({ dataset, profile }) {
  const missingValues =
    profile?.columns?.reduce(
      (total, column) => total + (column.missing?.count || 0),
      0
    ) || 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        icon={Rows3}
        label="Rows"
        value={profile?.rows ?? dataset?.row_count ?? 0}
        accent="bg-blue-50 text-blue-600"
      />

      <SummaryCard
        icon={Columns3}
        label="Columns"
        value={profile?.column_count ?? dataset?.column_count ?? 0}
        accent="bg-teal-50 text-teal-600"
      />

      <SummaryCard
        icon={FileSpreadsheet}
        label="File type"
        value={
          dataset?.name?.toLowerCase().endsWith(".xlsx")
            ? "Excel"
            : "CSV"
        }
        accent="bg-neutral-100 text-neutral-700"
      />

      <SummaryCard
        icon={AlertTriangle}
        label="Missing values"
        value={missingValues}
        accent={
          missingValues > 0
            ? "bg-orange-50 text-orange-600"
            : "bg-teal-50 text-teal-600"
        }
      />
    </div>
  );
}